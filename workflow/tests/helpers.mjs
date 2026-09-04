import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createAuthorizationGrantRecord, grantPath } from "../authority.mjs";
import { setControllerActivation } from "../controller-state.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rawContract = JSON.parse(fs.readFileSync(
  path.join(sourceRoot, "tasks/machine/sys-auto-001-codex-autonomous-workflow-bootstrap.json"),
  "utf8",
));

export function git(repoRoot, args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
}

export function makeContract({
  taskKey = "task-alpha",
  file = "allowed.txt",
  status = "READY",
  phase = "QUEUED",
  baseSha = "a".repeat(40),
  cardBlobSha = "b".repeat(40),
  worktree = `worktrees/${taskKey}`,
  branch = `codex/${taskKey}`,
  dispatch = true,
  automation = true,
  pr = false,
} = {}) {
  const contract = structuredClone(rawContract);
  Object.assign(contract, {
    task_key: taskKey,
    task_id: taskKey,
    card_path: `tasks/${taskKey}.md`,
    card_blob_sha: cardBlobSha,
    status,
    phase,
    mode: "IMPLEMENT",
    owner_role: "ORCHESTRATOR",
    reviewer_role: "QA_PERFORMANCE",
    dependencies: [],
    branch,
    worktree,
    write_files: [file, `tasks/${taskKey}.md`],
    write_prefixes: [],
    administrative_files: [`tasks/${taskKey}.md`],
    shared_file_grants: [],
  });
  contract.request_provenance.base_sha = baseSha;
  contract.requested_permissions.worker_dispatch = dispatch;
  contract.requested_permissions.automation_activation = automation;
  contract.requested_permissions.pr_create = pr;
  contract.requested_permissions.github_write = pr;
  return contract;
}

export function makeGrant(contract, {
  worktreeRealpath = path.resolve(os.tmpdir(), contract.task_key),
  authorizationRevision = 1,
  activation = { autonomous: true, worker_dispatch: true },
  publishing,
} = {}) {
  return createAuthorizationGrantRecord(contract, {
    authorizationRevision,
    worktreeRealpath,
    activation,
    publishing: publishing ?? {
      commit: contract.requested_permissions.git_commit,
      push: contract.requested_permissions.branch_push,
      pr: contract.requested_permissions.pr_create,
      merge: false,
      force: false,
      allowed_branch: contract.branch,
      approval_required_actions: [],
    },
    provenance: {
      authorized_by: "test-controller",
      source: "adversarial test fixture",
      issued_at: "2026-09-04T00:00:00.000Z",
      expires_at: null,
      non_expiring_policy: "UNTIL_REVOKED_BY_USER",
    },
  });
}

export function makeStateDirectory({ active = true } = {}) {
  const stateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-controller-state-"));
  setControllerActivation(stateDirectory, active, { source: "test-controller" });
  return stateDirectory;
}

export function persistGrant(stateDirectory, grant) {
  const file = grantPath(stateDirectory, grant.task_key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(grant, null, 2)}\n`);
  return file;
}

export function makeGitFixture({ file = "allowed.txt", taskKey = "task-alpha" } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-test-repo-"));
  git(repoRoot, ["init", "-b", "main"]);
  git(repoRoot, ["config", "user.name", "dylanliu2002"]);
  git(repoRoot, ["config", "user.email", "dylanliu2002@gmail.com"]);
  fs.mkdirSync(path.join(repoRoot, "tasks"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "tasks", `${taskKey}.md`), "# Test task\n");
  fs.writeFileSync(path.join(repoRoot, file), "base\n");
  git(repoRoot, ["add", "."]);
  git(repoRoot, ["commit", "-m", "test: base"]);
  git(repoRoot, ["switch", "-c", `codex/${taskKey}`]);
  const baseSha = git(repoRoot, ["rev-parse", "HEAD"]);
  const cardBlobSha = git(repoRoot, ["hash-object", `tasks/${taskKey}.md`]);
  const contract = makeContract({ taskKey, file, baseSha, cardBlobSha });
  const stateDirectory = makeStateDirectory({ active: true });
  const grant = makeGrant(contract, { worktreeRealpath: repoRoot });
  persistGrant(stateDirectory, grant);
  return { repoRoot, stateDirectory, contract, grant, baseSha };
}

export function cleanupFixture(...directories) {
  for (const directory of directories) {
    if (directory && fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
  }
}
