import { execFileSync } from "node:child_process";
import { assertNoSecretsDeep, redactSecrets } from "../workflow/secrets.mjs";
import { assertGitWorktree, canonicalDirectory } from "./submission.mjs";
import { normalizeTaskBranch, strictCommitSha } from "./worktrees.mjs";

const MAX_OUTPUT = 2 * 1024 * 1024;
const PULL_REQUEST_FIELDS = [
  "number", "url", "state", "headRefName", "headRefOid", "baseRefName", "baseRefOid",
  "isDraft", "reviewDecision", "mergeable", "mergeStateStatus", "autoMergeRequest", "mergedAt",
].join(",");

function commandOutput(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: MAX_OUTPUT,
      timeout: 30_000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const message = redactSecrets(String(error?.stderr ?? error?.message ?? error)).slice(0, 1_000);
    throw new Error(`${command} ${args[0] ?? ""} failed: ${message}`);
  }
}

function jsonOutput(command, args, cwd, label) {
  const output = commandOutput(command, args, cwd);
  try { return JSON.parse(output); } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }
}

function parseRemoteHead(output, expectedRef) {
  const rows = output.split(/\r?\n/).filter(Boolean);
  if (rows.length > 1) throw new Error("GitHub branch lookup returned an unexpected ref set.");
  if (rows.length === 0) return null;
  const [sha, ref, ...extra] = rows[0].split(/\s+/);
  if (extra.length > 0 || ref !== expectedRef) throw new Error("GitHub branch lookup returned an unexpected ref.");
  return strictCommitSha(sha, "remote task branch head");
}

function pullRequestNumber(value) {
  if (Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return value;
  throw new Error("Pull request number must be a positive integer.");
}

export function createGitHubClient({ repositoryRoot } = {}) {
  const root = assertGitWorktree(canonicalDirectory(repositoryRoot, "GitHub repository root"), "GitHub repository root");

  function git(args) { return commandOutput("git", args, root); }
  function gh(args) { return commandOutput("gh", args, root); }
  function ghJson(args, label) { return jsonOutput("gh", args, root, label); }

  function repositorySlug() {
    const slug = gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug)) {
      throw new Error("GitHub repository identity is unavailable or invalid.");
    }
    return slug;
  }

  function getRemoteHead(branch) {
    const normalized = normalizeTaskBranch(branch);
    return parseRemoteHead(git(["ls-remote", "--refs", "origin", `refs/heads/${normalized}`]), `refs/heads/${normalized}`);
  }

  function pushTaskBranch({ branch, headSha } = {}) {
    const normalized = normalizeTaskBranch(branch);
    const expectedHead = strictCommitSha(headSha, "task head");
    const currentBranch = git(["branch", "--show-current"]);
    const currentHead = strictCommitSha(git(["rev-parse", "--verify", "--end-of-options", "HEAD^{commit}"]), "local task head");
    if (currentBranch !== normalized || currentHead !== expectedHead) {
      throw new Error("Refusing to push a task branch that is not the exact reviewed worktree head.");
    }
    const existing = getRemoteHead(normalized);
    if (existing !== null && existing !== expectedHead) {
      git(["fetch", "--no-tags", "origin", `refs/heads/${normalized}`]);
      const fetched = strictCommitSha(git(["rev-parse", "--verify", "--end-of-options", "FETCH_HEAD^{commit}"]), "fetched task branch head");
      if (fetched !== existing) throw new Error("Remote task branch changed during the safe update check.");
      try {
        git(["merge-base", "--is-ancestor", fetched, expectedHead]);
      } catch {
        throw new Error("Remote task branch is not an ancestor of the exact task head; replacement push is forbidden.");
      }
    }
    if (existing === null) git(["push", "--porcelain", "origin", `HEAD:refs/heads/${normalized}`]);
    const published = getRemoteHead(normalized);
    if (published !== expectedHead) throw new Error("Remote task branch does not match the exact validated head.");
    return published;
  }

  function listOpenPullRequests(branch) {
    const normalized = normalizeTaskBranch(branch);
    const result = ghJson([
      "pr", "list", "--state", "open", "--head", normalized,
      "--json", "number,url,headRefName,headRefOid,baseRefName,isDraft",
    ], "GitHub open pull request listing");
    if (!Array.isArray(result)) throw new Error("GitHub open pull request listing is invalid.");
    return result;
  }

  function createDraftPullRequest({ branch, title, body } = {}) {
    const normalized = normalizeTaskBranch(branch);
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 256) {
      throw new Error("Draft pull request title is invalid.");
    }
    if (typeof body !== "string" || body.length === 0 || body.length > 20_000) {
      throw new Error("Draft pull request body is invalid.");
    }
    assertNoSecretsDeep({ title, body }, "draft pull request content");
    if (listOpenPullRequests(normalized).length !== 0) {
      throw new Error("An open pull request already exists for this task branch.");
    }
    const url = gh([
      "pr", "create", "--draft", "--base", "main", "--head", normalized,
      "--title", title.trim(), "--body", body,
    ]);
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*$/.test(url)) {
      throw new Error("GitHub did not return a canonical pull request URL.");
    }
    const number = Number(url.slice(url.lastIndexOf("/") + 1));
    return getPullRequest(number);
  }

  function getPullRequest(number) {
    return ghJson(["pr", "view", pullRequestNumber(number), "--json", PULL_REQUEST_FIELDS], "GitHub pull request");
  }

  function getBranchProtection(branch = "main") {
    if (branch !== "main") throw new Error("Publishing policy is fixed to the protected main branch.");
    return ghJson(["api", `repos/${repositorySlug()}/branches/main/protection`], "GitHub main branch protection");
  }

  function getCheckEvidence(headSha) {
    const head = strictCommitSha(headSha, "pull request head");
    const repository = repositorySlug();
    const checkPages = ghJson([
      "api", "--paginate", "--slurp", `repos/${repository}/commits/${head}/check-runs`,
    ], "GitHub commit checks");
    const status = ghJson(["api", `repos/${repository}/commits/${head}/status`], "GitHub commit status");
    if (!Array.isArray(checkPages) || !checkPages.every((page) => Array.isArray(page?.check_runs))) {
      throw new Error("GitHub commit check evidence is invalid.");
    }
    return {
      check_runs: checkPages.flatMap((page) => page.check_runs),
      statuses: Array.isArray(status?.statuses) ? status.statuses : null,
    };
  }

  function markPullRequestReady(number) {
    return gh(["pr", "ready", pullRequestNumber(number)]);
  }

  function mergePullRequest(number, headSha) {
    const expectedHead = strictCommitSha(headSha, "approved pull request head");
    return gh([
      "pr", "merge", pullRequestNumber(number), "--squash", "--match-head-commit", expectedHead,
    ]);
  }

  return Object.freeze({
    repository_root: root,
    getRemoteHead,
    pushTaskBranch,
    listOpenPullRequests,
    createDraftPullRequest,
    getPullRequest,
    getBranchProtection,
    getCheckEvidence,
    markPullRequestReady,
    mergePullRequest,
  });
}
