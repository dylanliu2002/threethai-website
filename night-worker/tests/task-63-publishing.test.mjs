import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  IMPLEMENTATION_MODEL_NAME,
  IMPLEMENTATION_REASONING_EFFORT,
  MVP_CONFIG,
  REVIEW_MODEL_NAME,
  reviewEffortForDifficulty,
} from "../config.mjs";
import { IMPLEMENTATION_WORKER_POLICY, assertNoWorkerAuthority } from "../model-policy.mjs";
import { dispatchImplementation } from "../agent-runner.mjs";
import { runServe } from "../cli.mjs";
import { createGitHubClient } from "../github.mjs";
import { planBatch } from "../planner.mjs";
import {
  createDraftPullRequest,
  updateDraftPullRequest,
  mergeApprovedPullRequest,
  requiredChecksFromProtection,
  requiredChecksPassed,
} from "../publishing-policy.mjs";
import { runBoundedCorrection, runIndependentReview, verifyIndependentReview } from "../review-runner.mjs";
import { validateTaskPlanExecution } from "../validation.mjs";
import { prepareTaskWorktrees } from "../worktrees.mjs";
import {
  createAppServerClient as createTask62AppServerClient,
  createFixture,
  createPersistentSOLPlannerFixture as createTask62PlannerFixture,
  git,
  rawPlans,
} from "./task-62-fixtures.mjs";

function installGPT6Catalog(fixture) {
  const respond = fixture.transport.respond.bind(fixture.transport);
  fixture.transport.respond = (request) => {
    if (request.method === "model/list") {
      fixture.transport.sendResponse(request, {
        data: [
          { id: "gpt-6-luna", model: "gpt-6-luna", supportedReasoningEfforts: ["max"] },
          { id: "gpt-6-sol", model: "gpt-6-sol", supportedReasoningEfforts: ["medium", "high", "max"] },
        ],
        nextCursor: null,
      });
      return;
    }
    respond(request);
  };
  return fixture;
}

function commitWorktree(worktree, message) {
  git(worktree, ["add", "--all"]);
  try {
    git(worktree, ["diff", "--cached", "--quiet"]);
  } catch {
    git(worktree, ["commit", "--quiet", "-m", message]);
  }
}

function createBareRemoteFixture(name) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `task63-${name}-`));
  const repository = path.join(directory, "repository");
  const remote = path.join(directory, "remote.git");
  fs.mkdirSync(repository, { recursive: true });
  fs.mkdirSync(remote, { recursive: true });
  git(repository, ["init", "--quiet"]);
  git(remote, ["init", "--bare", "--quiet"]);
  git(repository, ["config", "user.name", "dylanliu2002"]);
  git(repository, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(repository, "src"), { recursive: true });
  fs.writeFileSync(path.join(repository, "src", "base.txt"), "base\n", "utf8");
  git(repository, ["add", "--all"]);
  git(repository, ["commit", "--quiet", "-m", "fixture base"]);
  git(repository, ["branch", "-M", "main"]);
  const baseSha = git(repository, ["rev-parse", "HEAD"]);
  const branch = "codex/63-night-worker-publishing";
  git(repository, ["remote", "add", "origin", remote]);
  git(repository, ["push", "--quiet", "origin", "main:refs/heads/main"]);
  git(repository, ["checkout", "--quiet", "-b", branch]);
  git(repository, ["push", "--quiet", "origin", `HEAD:refs/heads/${branch}`]);
  return {
    directory,
    repository,
    remote,
    branch,
    baseSha,
    remoteHead() {
      return git(repository, ["--git-dir", remote, "rev-parse", "--verify", `refs/heads/${branch}`]);
    },
    cleanup() {
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

async function createGPT6Client(options = {}) {
  const fixture = installGPT6Catalog(await createTask62AppServerClient(options));
  const respond = fixture.transport.respond.bind(fixture.transport);
  fixture.transport.respond = (request) => {
    respond(request);
    if (request.method === "turn/start" && request.params?.model === IMPLEMENTATION_MODEL_NAME
      && fixture.transport.write_changes) {
      commitWorktree(request.params.cwd, "fixture bounded implementation turn");
    }
  };
  return fixture;
}

async function readyTaskFixture(name) {
  const fixture = createFixture(1, name);
  let prepared = [];
  let client;
  let fixtureTransport;
  try {
    const planning = await createTask62PlannerFixture({
      store: fixture.store,
      planningOutput: rawPlans(fixture.batch).map((plan) => ({ ...plan, difficulty: "hard" })),
    }).then((value) => installGPT6Catalog(value));
    let result;
    try {
      result = await planBatch({ store: fixture.store, batchId: fixture.batch.batch_id, solPlanner: planning.planner });
    } finally {
      await planning.client.close();
    }
    prepared = prepareTaskWorktrees({ repositoryRoot: fixture.root, plans: result.plans });
    const plan = prepared[0].plan;
    ({ client, transport: fixtureTransport } = await createGPT6Client({ writeChanges: true }));
    await dispatchImplementation({ store: fixture.store, batchId: fixture.batch.batch_id, plan, client });
    fs.writeFileSync(path.join(plan.worktree, "src", "task-1.txt"), "review baseline\n", "utf8");
    commitWorktree(plan.worktree, "fixture reviewed baseline");
    fixtureTransport.write_changes = false;
    const evidence = await validateTaskPlanExecution({
      plan,
      repositoryRoot: fixture.root,
      store: fixture.store,
      client,
    });
    assert.equal(evidence.publishable, true);
    return {
      ...fixture,
      plan,
      evidence,
      client,
      transport: fixtureTransport,
      cleanup: async () => {
        await client?.close();
        fixture.cleanup(prepared.map((entry) => entry.worktree.worktree));
      },
    };
  } catch (error) {
    await client?.close();
    fixture.cleanup(prepared.map((entry) => entry.worktree.worktree));
    throw error;
  }
}

function protectionPolicy() {
  return {
    required_status_checks: {
      strict: true,
      contexts: ["Task 63 / unit"],
      checks: [{ context: "Task 63 / security", app_id: 42 }],
    },
    required_pull_request_reviews: { required_approving_review_count: 1 },
    enforce_admins: { enabled: true },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
  };
}

function passingChecks() {
  return {
    statuses: [
      { context: "Task 63 / unit", state: "success" },
      { context: "Task 63 / security", state: "success" },
    ],
    check_runs: [{
      name: "Task 63 / unit",
      status: "completed",
      conclusion: "success",
      app: { id: 42 },
    }, {
      name: "Task 63 / security",
      status: "completed",
      conclusion: "success",
      app: { id: 42 },
    }],
  };
}

function fakeGitHub(worktree, baseSha) {
  const calls = [];
  let remoteHead = null;
  let pullRequest = null;
  let protection = protectionPolicy();
  let checkEvidence = passingChecks();
  return {
    repository_root: worktree,
    calls,
    set checks(value) { checkEvidence = value; },
    get checks() { return checkEvidence; },
    set protection(value) { protection = value; },
    get protection() { return protection; },
    set pr(value) { pullRequest = value; },
    get pr() { return pullRequest; },
    async pushTaskBranch({ branch, headSha }) {
      calls.push({ method: "pushTaskBranch", branch, headSha });
      assert.equal(git(worktree, ["branch", "--show-current"]), branch);
      assert.equal(git(worktree, ["rev-parse", "HEAD"]), headSha);
      if (remoteHead && remoteHead !== headSha) git(worktree, ["merge-base", "--is-ancestor", remoteHead, headSha]);
      remoteHead = headSha;
      return remoteHead;
    },
    async listOpenPullRequests(branch) {
      calls.push({ method: "listOpenPullRequests", branch });
      return pullRequest?.state === "OPEN" && pullRequest.headRefName === branch ? [{ ...pullRequest }] : [];
    },
    async createDraftPullRequest({ branch, title, body }) {
      calls.push({ method: "createDraftPullRequest", branch, title, body });
      assert.equal(remoteHead, git(worktree, ["rev-parse", "HEAD"]));
      pullRequest = {
        number: 63,
        url: "https://github.com/example/site/pull/63",
        state: "OPEN",
        headRefName: branch,
        headRefOid: remoteHead,
        baseRefName: "main",
        baseRefOid: baseSha,
        isDraft: true,
        reviewDecision: "APPROVED",
        mergeable: "MERGEABLE",
        mergeStateStatus: "DRAFT",
        autoMergeRequest: null,
      };
      return { number: pullRequest.number };
    },
    async getPullRequest(number) {
      calls.push({ method: "getPullRequest", number });
      assert.equal(number, 63);
      return pullRequest && { ...pullRequest, headRefOid: remoteHead };
    },
    async getBranchProtection(branch) {
      calls.push({ method: "getBranchProtection", branch });
      assert.equal(branch, "main");
      if (!protection) throw new Error("protection unavailable");
      return protection;
    },
    async getCheckEvidence(headSha) {
      calls.push({ method: "getCheckEvidence", headSha });
      return checkEvidence;
    },
    async markPullRequestReady(number) {
      calls.push({ method: "markPullRequestReady", number });
      assert.equal(number, 63);
      pullRequest.isDraft = false;
      pullRequest.mergeStateStatus = "CLEAN";
    },
    async mergePullRequest(number, headSha) {
      calls.push({ method: "mergePullRequest", number, headSha });
      assert.equal(number, 63);
      assert.equal(pullRequest.headRefOid, headSha);
      pullRequest.state = "MERGED";
      pullRequest.mergedAt = "2026-09-25T00:00:00.000Z";
    },
  };
}

function reviewResponse(transport, verdict, issue = "") {
  transport.planning_output = {
    verdict,
    summary: verdict === "APPROVED" ? "The exact diff meets the task criteria." : "A bounded correction is needed.",
    findings: verdict === "CHANGES_REQUESTED"
      ? [{ path: "src/task-1.txt", line: 1, issue, suggestion: "Correct the finding in this file only." }]
      : [],
  };
}

test("GitHub client fast-forwards an existing task branch and blocks branch drift", () => {
  const fixture = createBareRemoteFixture("safe-task-push");
  try {
    const client = createGitHubClient({ repositoryRoot: fixture.repository });
    fs.writeFileSync(path.join(fixture.repository, "src", "task.txt"), "reviewed\n", "utf8");
    commitWorktree(fixture.repository, "reviewed head");
    fs.writeFileSync(path.join(fixture.repository, "src", "task.txt"), "corrected\n", "utf8");
    commitWorktree(fixture.repository, "corrected descendant");
    const correctedHead = git(fixture.repository, ["rev-parse", "HEAD"]);

    assert.equal(fixture.remoteHead(), fixture.baseSha);
    assert.equal(client.pushTaskBranch({ branch: fixture.branch, headSha: correctedHead }), correctedHead);
    assert.equal(fixture.remoteHead(), correctedHead);

    git(fixture.repository, ["checkout", "--quiet", "-b", "divergent", fixture.baseSha]);
    fs.writeFileSync(path.join(fixture.repository, "src", "divergent.txt"), "remote drift\n", "utf8");
    commitWorktree(fixture.repository, "divergent remote change");
    const divergentHead = git(fixture.repository, ["rev-parse", "HEAD"]);
    git(fixture.repository, ["checkout", "--quiet", fixture.branch]);
    git(fixture.repository, ["push", "--quiet", "origin", "divergent:refs/heads/fixture-divergent"]);
    git(fixture.repository, ["--git-dir", fixture.remote, "update-ref", `refs/heads/${fixture.branch}`, divergentHead]);

    assert.throws(
      () => client.pushTaskBranch({ branch: fixture.branch, headSha: correctedHead }),
      /not an ancestor|replacement push is forbidden/i,
    );
    assert.equal(fixture.remoteHead(), divergentHead);
  } finally {
    fixture.cleanup();
  }
});

test("GitHub client pushes the validated object ID if the task branch advances during remote lookup", () => {
  const fixture = createBareRemoteFixture("immutable-push-head");
  try {
    fs.writeFileSync(path.join(fixture.repository, "src", "task.txt"), "validated\n", "utf8");
    commitWorktree(fixture.repository, "validated task head");
    const validatedHead = git(fixture.repository, ["rev-parse", "HEAD"]);
    const marker = path.join(fixture.directory, "branch-advanced");
    const wrapper = path.join(fixture.directory, "upload-pack.sh");
    const script = [
        "#!/bin/sh",
        `if [ ! -e "${marker}" ]; then`,
        `  touch "${marker}"`,
        `  git -C "${fixture.repository}" commit --quiet --allow-empty -m "branch advanced after validation"`,
        "fi",
        "exec git upload-pack \"$@\"",
        "",
      ].join("\n");
    fs.writeFileSync(wrapper, script, "utf8");
    if (process.platform !== "win32") fs.chmodSync(wrapper, 0o755);
    const wrapperCommand = process.platform === "win32"
      ? `sh ${wrapper.replaceAll("\\", "/")}`
      : wrapper;
    git(fixture.repository, ["config", "remote.origin.uploadpack", wrapperCommand]);

    const client = createGitHubClient({ repositoryRoot: fixture.repository });
    assert.equal(client.pushTaskBranch({ branch: fixture.branch, headSha: validatedHead }), validatedHead);
    const advancedHead = git(fixture.repository, ["rev-parse", "HEAD"]);
    assert.notEqual(advancedHead, validatedHead);
    git(fixture.repository, ["merge-base", "--is-ancestor", validatedHead, advancedHead]);
    assert.equal(fixture.remoteHead(), validatedHead);
  } finally {
    fixture.cleanup();
  }
});

test("GitHub client requires the exact latest commit author before pushing", () => {
  const fixture = createBareRemoteFixture("commit-author");
  try {
    const client = createGitHubClient({ repositoryRoot: fixture.repository });
    const remoteBefore = fixture.remoteHead();
    git(fixture.repository, ["config", "user.name", "Unapproved Author"]);
    git(fixture.repository, ["config", "user.email", "other@example.test"]);
    fs.writeFileSync(path.join(fixture.repository, "src", "task.txt"), "wrong author\n", "utf8");
    commitWorktree(fixture.repository, "wrong author commit");
    const wrongAuthorHead = git(fixture.repository, ["rev-parse", "HEAD"]);

    assert.throws(
      () => client.pushTaskBranch({ branch: fixture.branch, headSha: wrongAuthorHead }),
      /latest commit author must be exactly dylanliu2002 <dylanliu2002@gmail.com>/i,
    );
    assert.equal(fixture.remoteHead(), remoteBefore);
  } finally {
    fixture.cleanup();
  }
});

test("required checks reject an older success when the latest result failed", () => {
  const policy = requiredChecksFromProtection(protectionPolicy());
  const older = "2026-09-24T00:00:00.000Z";
  const newer = "2026-09-25T00:00:00.000Z";

  const staleStatusSuccess = passingChecks();
  staleStatusSuccess.statuses = [
    { context: "Task 63 / unit", state: "success", id: 10, created_at: older },
    { context: "Task 63 / unit", state: "failure", id: 11, created_at: newer },
    { context: "Task 63 / security", state: "success" },
  ];
  assert.equal(requiredChecksPassed(policy, staleStatusSuccess), false);

  const staleCheckSuccess = passingChecks();
  staleCheckSuccess.check_runs = [
    { name: "Task 63 / security", status: "completed", conclusion: "success", app: { id: 42 }, id: 20, started_at: older },
    { name: "Task 63 / security", status: "completed", conclusion: "failure", app: { id: 42 }, id: 21, started_at: newer },
    { name: "Task 63 / unit", status: "completed", conclusion: "success", app: { id: 42 } },
  ];
  assert.equal(requiredChecksPassed(policy, staleCheckSuccess), false);

  const ambiguousLatest = passingChecks();
  ambiguousLatest.statuses = [
    { context: "Task 63 / unit", state: "success", id: 10, created_at: newer },
    { context: "Task 63 / unit", state: "failure", id: 10, created_at: newer },
    { context: "Task 63 / security", state: "success" },
  ];
  assert.equal(requiredChecksPassed(policy, ambiguousLatest), false);
});

test("required names present in status and check-run channels require both latest results to pass", () => {
  const policy = requiredChecksFromProtection(protectionPolicy());
  const older = "2026-09-24T00:00:00.000Z";
  const newer = "2026-09-25T00:00:00.000Z";
  const failedCheckRun = passingChecks();
  failedCheckRun.statuses = [
    { context: "Task 63 / unit", state: "success", id: 40, created_at: newer },
    { context: "Task 63 / security", state: "success" },
  ];
  failedCheckRun.check_runs = failedCheckRun.check_runs.filter((run) => run.name !== "Task 63 / unit");
  failedCheckRun.check_runs.push({
    name: "Task 63 / unit",
    status: "completed",
    conclusion: "failure",
    app: { id: 42 },
    id: 41,
    started_at: older,
  });
  assert.equal(requiredChecksPassed(policy, failedCheckRun), false);

  const failedStatus = passingChecks();
  failedStatus.statuses = [
    { context: "Task 63 / unit", state: "failure", id: 42, created_at: older },
    { context: "Task 63 / security", state: "success" },
  ];
  failedStatus.check_runs = failedStatus.check_runs.filter((run) => run.name !== "Task 63 / unit");
  failedStatus.check_runs.push({
    name: "Task 63 / unit",
    status: "completed",
    conclusion: "success",
    app: { id: 42 },
    id: 43,
    started_at: newer,
  });
  assert.equal(requiredChecksPassed(policy, failedStatus), false);

  const pendingCheckRun = passingChecks();
  pendingCheckRun.statuses = [
    { context: "Task 63 / unit", state: "success", id: 44, created_at: newer },
    { context: "Task 63 / security", state: "success" },
  ];
  pendingCheckRun.check_runs = pendingCheckRun.check_runs.filter((run) => run.name !== "Task 63 / unit");
  pendingCheckRun.check_runs.push({
    name: "Task 63 / unit",
    status: "in_progress",
    conclusion: null,
    app: { id: 42 },
    id: 45,
    started_at: older,
  });
  assert.equal(requiredChecksPassed(policy, pendingCheckRun), false);

  const bothPassed = passingChecks();
  assert.equal(requiredChecksPassed(policy, bothPassed), true);
});

test("required checks[] entries require their latest commit status to pass too", () => {
  const protection = protectionPolicy();
  protection.required_status_checks.contexts = [];
  const policy = requiredChecksFromProtection(protection);
  const failedStatus = passingChecks();
  failedStatus.statuses = [{ context: "Task 63 / security", state: "failure", id: 50 }];
  assert.equal(requiredChecksPassed(policy, failedStatus), false);

  failedStatus.statuses = [{ context: "Task 63 / security", state: "success", id: 51 }];
  assert.equal(requiredChecksPassed(policy, failedStatus), true);
});

test("draft PR needs a fresh Task 62-publishable exact head and validated scope", async () => {
  const task = await readyTaskFixture("task63-draft");
  try {
    const baseSha = git(task.root, ["rev-parse", "refs/remotes/origin/main"]);
    const github = fakeGitHub(task.plan.worktree, baseSha);
    const draft = await createDraftPullRequest({ evidence: task.evidence, store: task.store, github });
    assert.equal(draft.state, "DRAFT");
    assert.equal(draft.head_sha, git(task.plan.worktree, ["rev-parse", "HEAD"]));
    assert.deepEqual(github.calls.map((entry) => entry.method), [
      "pushTaskBranch", "listOpenPullRequests", "createDraftPullRequest", "getPullRequest",
    ]);
    assert.equal(github.pr.isDraft, true);
    assert.equal(github.pr.baseRefName, "main");

    const untouched = fakeGitHub(task.plan.worktree, baseSha);
    await assert.rejects(createDraftPullRequest({ evidence: {}, store: task.store, github: untouched }), /not publishable/i);
    assert.equal(untouched.calls.length, 0);
    assert.throws(() => assertNoWorkerAuthority({ review: true, merge: true }), /review|merge/i);
  } finally {
    await task.cleanup();
  }
});

test("draft correction updates through a real fast-forward push without a fake PR-head mutation", async () => {
  const task = await readyTaskFixture("task63-real-draft-push");
  const remoteDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "task63-draft-remote-"));
  const remote = path.join(remoteDirectory, "remote.git");
  try {
    fs.mkdirSync(remote, { recursive: true });
    git(remote, ["init", "--bare", "--quiet"]);
    git(task.root, ["push", "--quiet", remote, "main:refs/heads/main"]);
    const { plan, root, store, client } = task;
    const branch = plan.branch;
    const taskWorktree = plan.worktree;
    git(taskWorktree, ["push", "--quiet", remote, `HEAD:refs/heads/${branch}`]);
    git(root, ["remote", "set-url", "origin", remote]);
    const remoteHead = () => git(taskWorktree, ["ls-remote", "--refs", remote, `refs/heads/${branch}`]).split(/\s+/)[0];
    const preCorrectionHead = remoteHead();
    const baseSha = git(root, ["rev-parse", "refs/remotes/origin/main"]);

    fs.writeFileSync(path.join(taskWorktree, "src", "task-1.txt"), "draft correction\n", "utf8");
    commitWorktree(taskWorktree, "draft correction descendant");
    const correctedHead = git(taskWorktree, ["rev-parse", "HEAD"]);
    const correctedEvidence = await validateTaskPlanExecution({ plan, repositoryRoot: root, store, client });
    assert.equal(correctedEvidence.publishable, true);

    const realGit = createGitHubClient({ repositoryRoot: taskWorktree });
    const observedPRHeads = [];
    const pr = {
      number: 63,
      url: "https://github.com/example/site/pull/63",
      state: "OPEN",
      headRefName: branch,
      baseRefName: "main",
      baseRefOid: baseSha,
      isDraft: true,
      reviewDecision: "APPROVED",
      mergeable: "MERGEABLE",
      mergeStateStatus: "DRAFT",
      autoMergeRequest: null,
    };
    const github = {
      repository_root: taskWorktree,
      pushTaskBranch: realGit.pushTaskBranch,
      async listOpenPullRequests() { return [{ ...pr, headRefOid: remoteHead() }]; },
      async createDraftPullRequest() { throw new Error("An existing draft must be updated in place."); },
      async getPullRequest(number) {
        assert.equal(number, 63);
        const headRefOid = remoteHead();
        observedPRHeads.push(headRefOid);
        return { ...pr, headRefOid };
      },
      async getBranchProtection() { return protectionPolicy(); },
      async getCheckEvidence() { return passingChecks(); },
      async markPullRequestReady() {},
      async mergePullRequest() {},
    };

    const updated = await updateDraftPullRequest({
      evidence: correctedEvidence,
      store,
      github,
      pullRequestNumber: 63,
    });
    assert.equal(updated.head_sha, correctedHead);
    assert.equal(remoteHead(), correctedHead);
    assert.deepEqual(observedPRHeads, [preCorrectionHead, correctedHead]);
  } finally {
    await task.cleanup();
    fs.rmSync(remoteDirectory, { recursive: true, force: true });
  }
});

test("fresh SOL review, bounded same-task correction, re-review, and exact protected merge", async () => {
  const task = await readyTaskFixture("task63-review-correction");
  try {
    const { root, store, plan, client, transport } = task;
    const baseSha = git(root, ["rev-parse", "refs/remotes/origin/main"]);
    const github = fakeGitHub(plan.worktree, baseSha);
    const draft = await createDraftPullRequest({ evidence: task.evidence, store, github });

    reviewResponse(transport, "CHANGES_REQUESTED", "The reviewed baseline needs a small correction.");
    const firstReview = await runIndependentReview({ evidence: task.evidence, store, client });
    const firstMapping = store.getWorkerMapping(firstReview.review_batch_id, plan.task_id, "REVIEW");
    const initialImplementation = store.getWorkerMapping(task.batch.batch_id, plan.task_id, "IMPLEMENTATION");
    assert.equal(firstReview.verdict, "CHANGES_REQUESTED");
    assert.equal(firstMapping.model, REVIEW_MODEL_NAME);
    assert.equal(firstMapping.effort, reviewEffortForDifficulty(plan.difficulty));
    assert.notEqual(firstMapping.thread_id, initialImplementation.thread_id);
    assert.equal(store.getBatch(firstReview.review_batch_id).state, "COMPLETED");
    const reviewStart = transport.requests.find((request) => request.method === "thread/start"
      && request.params.model === REVIEW_MODEL_NAME);
    const reviewTurn = transport.requests.find((request) => request.method === "turn/start"
      && request.params.model === REVIEW_MODEL_NAME);
    assert.equal(reviewStart.params.sandbox, "read-only");
    assert.equal(reviewStart.params.ephemeral, false);
    assert.equal(reviewStart.params.allowProviderModelFallback, false);
    assert.deepEqual(reviewTurn.params.sandboxPolicy, { type: "readOnly" });
    assert.match(JSON.stringify(reviewTurn.params), new RegExp(firstReview.target.head_sha));
    assert.match(JSON.stringify(reviewTurn.params), new RegExp(firstReview.target.diff_sha256));
    assert.equal(firstReview.target.base_sha, baseSha);
    assert.equal(firstReview.target.merge_base, baseSha);

    transport.write_changes = true;
    const correction = await runBoundedCorrection({ evidence: task.evidence, review: firstReview, store, client });
    transport.write_changes = false;
    assert.equal(correction.status, "CORRECTED");
    assert.equal(correction.cycle, 1);
    assert.equal(correction.task_id, plan.task_id);
    assert.equal(correction.branch, plan.branch);
    assert.equal(correction.worktree, plan.worktree);
    assert.notEqual(correction.corrected_head_sha, correction.reviewed_head_sha);
    assert.equal(store.getBatch(task.batch.batch_id).correction_cycles, 1);
    const correctionMapping = store.getWorkerMapping(correction.batch_id, plan.task_id, "IMPLEMENTATION");
    assert.equal(correctionMapping.model, IMPLEMENTATION_MODEL_NAME);
    assert.equal(correctionMapping.effort, IMPLEMENTATION_REASONING_EFFORT);
    assert.equal(correctionMapping.cwd, plan.worktree);
    assert.equal(correctionMapping.role, "IMPLEMENTATION");
    assert.equal(IMPLEMENTATION_WORKER_POLICY.capabilities.review, false);
    assert.equal(IMPLEMENTATION_WORKER_POLICY.capabilities.merge, false);

    const correctedEvidence = await validateTaskPlanExecution({ plan, repositoryRoot: root, store, client });
    assert.equal(correctedEvidence.publishable, true);
    const updatedDraft = await updateDraftPullRequest({
      evidence: correctedEvidence,
      store,
      github,
      pullRequestNumber: draft.number,
    });
    assert.equal(updatedDraft.head_sha, correction.corrected_head_sha);
    assert.equal(github.pr.isDraft, true);

    reviewResponse(transport, "APPROVED");
    const correctedReview = await runIndependentReview({ evidence: correctedEvidence, store, client });
    const correctedMapping = store.getWorkerMapping(correctedReview.review_batch_id, plan.task_id, "REVIEW");
    assert.equal(correctedReview.verdict, "APPROVED");
    assert.notEqual(correctedMapping.thread_id, firstMapping.thread_id);
    assert.equal(correctedMapping.model, REVIEW_MODEL_NAME);
    assert.equal(correctedMapping.effort, "high");
    const verified = await verifyIndependentReview({ review: correctedReview, evidence: correctedEvidence, store, client });
    assert.equal(verified.result.verdict, "APPROVED");
    assert.equal(verified.target.head_sha, correction.corrected_head_sha);

    const forgedCorrectionAsReview = {
      review_batch_id: correction.batch_id,
      review_submission_id: correction.submission_id,
      task_id: correction.task_id,
      thread_id: correction.correction_thread_id,
      turn_id: correction.correction_turn_id,
      verdict: "APPROVED",
      target: correctedReview.target,
    };
    await assert.rejects(
      verifyIndependentReview({ review: forgedCorrectionAsReview, evidence: correctedEvidence, store, client }),
      /persisted SOL review/i,
    );

    const commitForHeadDrift = path.join(plan.worktree, "src", "task-1.txt");
    fs.writeFileSync(commitForHeadDrift, "post approval drift\n", "utf8");
    commitWorktree(plan.worktree, "fixture approval drift");
    const driftEvidence = await validateTaskPlanExecution({ plan, repositoryRoot: root, store, client });
    assert.equal(driftEvidence.publishable, true);
    const callsBeforeStale = github.calls.length;
    await assert.rejects(
      mergeApprovedPullRequest({
        evidence: driftEvidence,
        review: correctedReview,
        store,
        client,
        github,
        pullRequestNumber: draft.number,
      }),
      /stale|different base|different.*head/i,
    );
    assert.equal(github.calls.length, callsBeforeStale);

    github.pr.headRefOid = git(plan.worktree, ["rev-parse", "HEAD"]);
    github.pr.baseRefOid = baseSha;
    const driftDraft = await updateDraftPullRequest({
      evidence: driftEvidence,
      store,
      github,
      pullRequestNumber: draft.number,
    });
    reviewResponse(transport, "APPROVED");
    const finalReview = await runIndependentReview({ evidence: driftEvidence, store, client });
    assert.notEqual(finalReview.thread_id, correctedReview.thread_id);
    assert.equal(finalReview.target.head_sha, driftDraft.head_sha);

    github.protection = null;
    await assert.rejects(
      mergeApprovedPullRequest({ evidence: driftEvidence, review: finalReview, store, client, github, pullRequestNumber: draft.number }),
      /protection|policy/i,
    );
    github.protection = protectionPolicy();
    github.checks = { statuses: [], check_runs: [] };
    await assert.rejects(
      mergeApprovedPullRequest({ evidence: driftEvidence, review: finalReview, store, client, github, pullRequestNumber: draft.number }),
      /required repository checks/i,
    );
    github.checks = {
      statuses: [{ context: "Task 63 / unit", state: "failure" }],
      check_runs: [{ name: "Task 63 / security", status: "completed", conclusion: "failure", app: { id: 42 } }],
    };
    await assert.rejects(
      mergeApprovedPullRequest({ evidence: driftEvidence, review: finalReview, store, client, github, pullRequestNumber: draft.number }),
      /required repository checks/i,
    );
    github.checks = passingChecks();
    github.pr.mergeable = "CONFLICTING";
    await assert.rejects(
      mergeApprovedPullRequest({ evidence: driftEvidence, review: finalReview, store, client, github, pullRequestNumber: draft.number }),
      /not mergeable/i,
    );

    github.pr.mergeable = "MERGEABLE";
    github.pr.reviewDecision = "APPROVED";
    const merged = await mergeApprovedPullRequest({
      evidence: driftEvidence,
      review: finalReview,
      store,
      client,
      github,
      pullRequestNumber: draft.number,
    });
    assert.equal(merged.status, "MERGED");
    assert.equal(merged.head_sha, driftDraft.head_sha);
    assert.equal(github.pr.state, "MERGED");
    assert.equal(github.calls.filter((entry) => entry.method === "markPullRequestReady").length, 1);
    assert.equal(github.calls.at(-2).method, "mergePullRequest");
    assert.equal(github.calls.at(-2).headSha, driftDraft.head_sha);
    assert.equal(github.calls.some((entry) => entry.method === "autoMerge" || entry.admin === true), false);
  } finally {
    await task.cleanup();
  }
});

test("normal service remains idle when no explicit submission exists", async () => {
  const fixture = createFixture(0, "task63-idle");
  try {
    assert.deepEqual(await runServe({ store: fixture.store }), {
      status: "IDLE",
      active_batch_id: null,
      queued_batches: 0,
    });
    assert.equal(fixture.store.snapshot().workers.length, 0);
    assert.equal(MVP_CONFIG.capabilities.approved_safe_pr_merge, true);
  } finally {
    fixture.cleanup();
  }
});
