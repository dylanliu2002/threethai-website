import { assertNoSecretsDeep } from "../workflow/secrets.mjs";
import { createGitHubClient } from "./github.mjs";
import { MVP_CONFIG } from "./config.mjs";
import { capturePublishableTaskHead, assertTaskHeadCurrent, verifyIndependentReview } from "./review-runner.mjs";

function requireGitHubClient(client, worktree) {
  const methods = [
    "pushTaskBranch", "listOpenPullRequests", "createDraftPullRequest", "getPullRequest",
    "getBranchProtection", "getCheckEvidence", "markPullRequestReady", "mergePullRequest",
  ];
  if (!client || typeof client !== "object" || methods.some((method) => typeof client[method] !== "function")) {
    throw new Error("Task publishing requires the fixed GitHub publishing client.");
  }
  if (client.repository_root !== worktree) throw new Error("GitHub client repository does not match the exact task worktree.");
  return client;
}

function draftContent(evidence, snapshot) {
  const title = `[Night Worker] ${evidence.plan.title}`.slice(0, 256);
  const body = [
    "Draft pull request created from a Task 62-publishable exact task head.",
    "",
    `Task: ${snapshot.task_id}`,
    `Base: ${snapshot.base_sha}`,
    `Head: ${snapshot.head_sha}`,
    `Merge base: ${snapshot.merge_base}`,
    `Diff SHA-256: ${snapshot.diff_sha256}`,
    `Validation SHA-256: ${snapshot.validation_digest}`,
    "",
    "Changed paths:",
    ...snapshot.paths.map((path) => `- ${path}`),
  ].join("\n");
  assertNoSecretsDeep({ title, body }, "draft pull request content");
  return { title, body };
}

function assertDraftMatchesPullRequest(pr, snapshot) {
  if (!pr || !Number.isSafeInteger(pr.number) || pr.number <= 0
    || typeof pr.url !== "string" || pr.state !== "OPEN"
    || pr.headRefName !== snapshot.branch || pr.headRefOid !== snapshot.head_sha
    || pr.baseRefName !== "main" || pr.isDraft !== true) {
    throw new Error("GitHub draft pull request does not point to the exact validated task head and main base.");
  }
  return pr;
}

export async function createDraftPullRequest({ evidence, store, github } = {}) {
  const snapshot = await capturePublishableTaskHead({ evidence, store });
  const client = requireGitHubClient(
    github ?? createGitHubClient({ repositoryRoot: snapshot.worktree }),
    snapshot.worktree,
  );
  const pushedHead = await client.pushTaskBranch({ branch: snapshot.branch, headSha: snapshot.head_sha });
  if (pushedHead !== snapshot.head_sha) throw new Error("Published task branch is not the exact validated head.");
  await assertTaskHeadCurrent({ snapshot, evidence, store });
  const existing = await client.listOpenPullRequests(snapshot.branch);
  if (!Array.isArray(existing) || existing.length !== 0) {
    throw new Error("An open pull request already exists or GitHub could not confirm an empty branch slot.");
  }
  const { title, body } = draftContent(evidence, snapshot);
  const created = await client.createDraftPullRequest({ branch: snapshot.branch, title, body });
  if (!created || !Number.isSafeInteger(created.number) || created.number <= 0) {
    throw new Error("GitHub did not return a draft pull request identity.");
  }
  const current = assertDraftMatchesPullRequest(await client.getPullRequest(created.number), snapshot);
  await assertTaskHeadCurrent({ snapshot, evidence, store });
  return Object.freeze({
    number: current.number,
    url: current.url,
    branch: snapshot.branch,
    base_sha: snapshot.base_sha,
    head_sha: snapshot.head_sha,
    merge_base: snapshot.merge_base,
    diff_sha256: snapshot.diff_sha256,
    task_id: snapshot.task_id,
    state: "DRAFT",
  });
}

export async function updateDraftPullRequest({ evidence, store, github, pullRequestNumber } = {}) {
  const snapshot = await capturePublishableTaskHead({ evidence, store });
  const client = requireGitHubClient(
    github ?? createGitHubClient({ repositoryRoot: snapshot.worktree }),
    snapshot.worktree,
  );
  if (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    throw new Error("A concrete existing draft pull request number is required.");
  }
  const before = await client.getPullRequest(pullRequestNumber);
  if (!before || before.state !== "OPEN" || before.isDraft !== true
    || before.headRefName !== snapshot.branch || before.baseRefName !== "main") {
    throw new Error("Corrections can update only the existing draft pull request for the same task branch.");
  }
  const pushedHead = await client.pushTaskBranch({ branch: snapshot.branch, headSha: snapshot.head_sha });
  if (pushedHead !== snapshot.head_sha) throw new Error("Draft update did not publish the exact corrected task head.");
  await assertTaskHeadCurrent({ snapshot, evidence, store });
  const after = await client.getPullRequest(pullRequestNumber);
  if (!after || after.number !== pullRequestNumber || after.state !== "OPEN" || after.isDraft !== true
    || after.headRefName !== snapshot.branch || after.headRefOid !== snapshot.head_sha
    || after.baseRefName !== "main") {
    throw new Error("Existing draft pull request did not update to the exact corrected task head.");
  }
  await assertTaskHeadCurrent({ snapshot, evidence, store });
  return Object.freeze({
    number: after.number,
    url: after.url,
    branch: snapshot.branch,
    base_sha: snapshot.base_sha,
    head_sha: snapshot.head_sha,
    merge_base: snapshot.merge_base,
    diff_sha256: snapshot.diff_sha256,
    task_id: snapshot.task_id,
    state: "DRAFT",
  });
}

function requiredChecksFromProtection(protection) {
  if (!protection || typeof protection !== "object" || Array.isArray(protection)) {
    throw new Error("GitHub main branch protection is unavailable; merge is blocked.");
  }
  const statusPolicy = protection.required_status_checks;
  const reviewPolicy = protection.required_pull_request_reviews;
  if (!statusPolicy || typeof statusPolicy !== "object"
    || statusPolicy.strict !== true
    || !reviewPolicy || typeof reviewPolicy !== "object"
    || !Number.isInteger(reviewPolicy.required_approving_review_count)
    || reviewPolicy.required_approving_review_count < 1) {
    throw new Error("Repository policy must require strict status checks and pull request review approvals.");
  }
  const contexts = Array.isArray(statusPolicy.contexts) ? statusPolicy.contexts : [];
  const checks = Array.isArray(statusPolicy.checks) ? statusPolicy.checks : [];
  if (contexts.some((context) => typeof context !== "string" || context.length === 0)
    || checks.some((check) => !check || typeof check.context !== "string" || check.context.length === 0
      || (check.app_id !== null && check.app_id !== undefined && !Number.isInteger(check.app_id)))) {
    throw new Error("GitHub required status check policy is malformed.");
  }
  if (contexts.length === 0 && checks.length === 0) {
    throw new Error("GitHub main branch has no declared required status checks.");
  }
  return { contexts, checks, reviewPolicy };
}

function checkRunPassed(run, appId) {
  return run?.status === "completed" && run?.conclusion === "success"
    && (appId === null || appId === undefined || run?.app?.id === appId);
}

function resultTimestamp(result, kind) {
  const candidates = kind === "status"
    ? [result?.updated_at, result?.created_at]
    : [result?.started_at, result?.created_at];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const timestamp = Date.parse(candidate);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

function latestResult(results) {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  const scored = results.map((result) => ({
    ...result,
    timestamp: resultTimestamp(result.value, result.kind),
    id: Number.isSafeInteger(result.value?.id) ? result.value.id : null,
  }));
  if (scored.some((result) => result.timestamp === null)) return null;
  const newestTimestamp = Math.max(...scored.map((result) => result.timestamp));
  const newest = scored.filter((result) => result.timestamp === newestTimestamp);
  if (newest.length === 1) return newest[0];
  if (newest.some((result) => result.kind !== newest[0].kind || result.id === null)) return null;
  const descendingIds = newest.map((result) => result.id).sort((left, right) => right - left);
  if (descendingIds[0] === descendingIds[1]) return null;
  return newest.find((result) => result.id === descendingIds[0]);
}

function requiredCheckChannelsPassed(context, evidence, appId) {
  const currentStatus = latestResult(evidence.statuses
    .filter((status) => status?.context === context)
    .map((value) => ({ kind: "status", value })));
  const currentCheckRun = latestResult(evidence.check_runs
    .filter((run) => run?.name === context
      && (appId === null || appId === undefined || run?.app?.id === appId))
    .map((value) => ({ kind: "check_run", value })));
  return currentStatus?.value.state === "success"
    && Boolean(currentCheckRun && checkRunPassed(currentCheckRun.value, appId));
}

function requiredChecksPassed(policy, evidence) {
  if (!evidence || !Array.isArray(evidence.check_runs) || !Array.isArray(evidence.statuses)) return false;
  for (const context of policy.contexts) {
    if (!requiredCheckChannelsPassed(context, evidence)) return false;
  }
  for (const required of policy.checks) {
    if (!requiredCheckChannelsPassed(required.context, evidence, required.app_id)) return false;
  }
  return true;
}

function assertPullRequestMergeable(pr, snapshot, policy, checks, { allowDraft = false } = {}) {
  if (!pr || pr.state !== "OPEN" || pr.headRefName !== snapshot.branch
    || pr.headRefOid !== snapshot.head_sha || pr.baseRefName !== "main"
    || (pr.baseRefOid && pr.baseRefOid !== snapshot.base_sha)
    || !(pr.mergeable === true || pr.mergeable === "MERGEABLE")
    || pr.reviewDecision !== "APPROVED"
    || pr.autoMergeRequest !== null && pr.autoMergeRequest !== undefined
    || (!allowDraft && pr.isDraft !== false)
    || (allowDraft && pr.isDraft !== true && pr.isDraft !== false)) {
    throw new Error("Pull request is stale, unapproved, draft-ineligible, or not mergeable at the exact approved head.");
  }
  if ((!allowDraft && pr.mergeStateStatus !== "CLEAN")
    || (allowDraft && !["CLEAN", "DRAFT"].includes(pr.mergeStateStatus))) {
    throw new Error("GitHub mergeability or branch protection state is not clean.");
  }
  if (!requiredChecksPassed(policy, checks)) {
    throw new Error("One or more required repository checks are missing or failed.");
  }
}

async function verifyMergeGateInputs(client, number, snapshot) {
  const [pr, protection, checks] = await Promise.all([
    client.getPullRequest(number),
    client.getBranchProtection("main"),
    client.getCheckEvidence(snapshot.head_sha),
  ]);
  const policy = requiredChecksFromProtection(protection);
  assertPullRequestMergeable(pr, snapshot, policy, checks, { allowDraft: true });
  return { pr, policy, checks };
}

export async function mergeApprovedPullRequest({ evidence, review, store, client, github, pullRequestNumber } = {}) {
  const snapshot = await capturePublishableTaskHead({ evidence, store });
  const gitHub = requireGitHubClient(
    github ?? createGitHubClient({ repositoryRoot: snapshot.worktree }),
    snapshot.worktree,
  );
  const verifiedReview = await verifyIndependentReview({ review, evidence, store, client });
  if (verifiedReview.result.verdict !== "APPROVED") {
    throw new Error("Merge requires an independent persisted SOL APPROVED review.");
  }
  if (verifiedReview.target.scope_digest !== snapshot.scope_digest
    || verifiedReview.target.head_sha !== snapshot.head_sha) {
    throw new Error("SOL approval is stale or bound to a different task head.");
  }
  if (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    throw new Error("A concrete draft pull request number is required for merge.");
  }
  let { pr } = await verifyMergeGateInputs(gitHub, pullRequestNumber, snapshot);
  await assertTaskHeadCurrent({ snapshot, evidence, store });
  if (pr.isDraft === true) {
    await gitHub.markPullRequestReady(pullRequestNumber);
    ({ pr } = await verifyMergeGateInputs(gitHub, pullRequestNumber, snapshot));
  }
  if (pr.isDraft !== false) throw new Error("Pull request could not be made ready under repository policy.");
  await assertTaskHeadCurrent({ snapshot, evidence, store });
  const freshReview = await verifyIndependentReview({ review, evidence, store, client });
  if (freshReview.result.verdict !== "APPROVED" || freshReview.target.head_sha !== snapshot.head_sha) {
    throw new Error("SOL approval changed or became stale before merge.");
  }
  const finalGate = await verifyMergeGateInputs(gitHub, pullRequestNumber, snapshot);
  assertPullRequestMergeable(finalGate.pr, snapshot, finalGate.policy, finalGate.checks);
  await gitHub.mergePullRequest(pullRequestNumber, snapshot.head_sha);
  const merged = await gitHub.getPullRequest(pullRequestNumber);
  if (!merged || merged.state !== "MERGED" || merged.headRefOid !== snapshot.head_sha) {
    throw new Error("GitHub did not confirm a merge of the exact SOL-approved head.");
  }
  return Object.freeze({
    status: "MERGED",
    pull_request_number: pullRequestNumber,
    head_sha: snapshot.head_sha,
    base_sha: snapshot.base_sha,
    task_id: snapshot.task_id,
  });
}

export { requiredChecksFromProtection, requiredChecksPassed };
