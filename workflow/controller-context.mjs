import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sha256 } from "./canonical.mjs";
import {
  PINNED_CONTROLLER_KEY_FINGERPRINT,
  PINNED_CONTROLLER_PUBLIC_KEY_PEM,
} from "./trust-anchor.mjs";

const AUTHORITY_OVERRIDE_KEYS = Object.freeze([
  "stateDirectory", "authorityDirectory", "authorityRoot", "trustRoot",
  "grantStore", "grant", "signingKey", "signingKeyPath", "privateKey",
  "publicKey", "activation", "lease", "fencingToken", "approval",
  "approvalPlan", "dispatchWorker", "spawnImpl",
  "runCommand", "validationRunner",
  "model", "sandbox", "worktree", "cwd", "permission", "dangerouslyAllowAll",
  "provider", "modelProvider", "network", "networkAccess", "network_access",
  "toolAccess", "tools", "approvalPolicy", "approval_policy", "escalation",
  "environment", "env", "features", "mcp", "plugins", "browser", "computerUse",
  "github", "publishing", "production", "dns", "deployment",
  "reviewedHead", "reviewed_head_sha", "approvalRevision", "approval_revision",
  "allowedPaths", "allowed_paths", "plan",
  "now", "time", "currentTime", "current_time", "timestamp",
  "currentTimestamp", "current_timestamp", "clock", "dateNow",
]);

// The reviewed controller installation selects the repository trust domain.
// A runtime caller may target another worktree in the same Git common
// repository, but cannot redirect authority to a foreign/caller-created repo.
const CONTROLLER_SOURCE_ROOT = fs.realpathSync.native(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
);

function git(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function existingRealpath(candidate) {
  return fs.existsSync(candidate) ? fs.realpathSync.native(candidate) : path.resolve(candidate);
}

export function assertNoAuthorityOverrides(options = {}) {
  for (const key of AUTHORITY_OVERRIDE_KEYS) {
    if (Object.hasOwn(options, key)) {
      throw new Error(`Caller-selected authority input is forbidden: ${key}`);
    }
  }
  return true;
}

export function repositoryIdentity(repoRoot) {
  const worktreeRoot = fs.realpathSync.native(git(repoRoot, ["rev-parse", "--show-toplevel"]));
  const commonRaw = git(repoRoot, ["rev-parse", "--git-common-dir"]);
  const commonDirectory = fs.realpathSync.native(path.resolve(worktreeRoot, commonRaw));
  let remote = "";
  try {
    remote = git(repoRoot, ["remote", "get-url", "origin"])
      .trim().replace(/\\/g, "/").replace(/\.git$/i, "").toLocaleLowerCase("en-US");
  } catch {
    remote = `local:${commonDirectory.replace(/\\/g, "/").toLocaleLowerCase("en-US")}`;
  }
  return {
    worktree_root: worktreeRoot,
    common_git_directory: commonDirectory,
    repository_key: sha256(remote).slice(0, 24),
    remote_identity: remote,
  };
}

export function resolveCanonicalControllerContext(repoRoot) {
  const controllerIdentity = repositoryIdentity(CONTROLLER_SOURCE_ROOT);
  const identity = repositoryIdentity(repoRoot);
  if (identity.common_git_directory.toLocaleLowerCase("en-US")
      !== controllerIdentity.common_git_directory.toLocaleLowerCase("en-US")
    || identity.remote_identity !== controllerIdentity.remote_identity) {
    throw new Error("Target worktree is outside the trusted controller repository context.");
  }
  const repositoryCheckout = path.dirname(controllerIdentity.common_git_directory);
  const workspaceDirectory = path.dirname(repositoryCheckout);
  const authorityRoot = path.join(
    workspaceDirectory,
    ".threethai-controller",
    controllerIdentity.repository_key,
  );
  const resolvedAuthority = existingRealpath(authorityRoot);
  const relativeToWorktree = path.relative(identity.worktree_root, resolvedAuthority);
  if (relativeToWorktree === "" || (!relativeToWorktree.startsWith("..") && !path.isAbsolute(relativeToWorktree))) {
    throw new Error("Canonical controller authority root must be outside task worktrees.");
  }
  if (fs.existsSync(authorityRoot)) {
    const stats = fs.lstatSync(authorityRoot);
    if (stats.isSymbolicLink()) throw new Error("Canonical controller authority root cannot be a link.");
  }
  return Object.freeze({
    ...identity,
    controller_source_root: CONTROLLER_SOURCE_ROOT,
    workspace_directory: workspaceDirectory,
    authority_root: resolvedAuthority,
    state_directory: path.join(resolvedAuthority, "runtime"),
    grants_directory: path.join(resolvedAuthority, "grants"),
    private_key_path: path.join(resolvedAuthority, "admin", "controller-private-key.pem"),
    public_key_path: path.join(resolvedAuthority, "admin", "controller-public-key.pem"),
    pinned_public_key_pem: PINNED_CONTROLLER_PUBLIC_KEY_PEM,
    pinned_key_fingerprint: PINNED_CONTROLLER_KEY_FINGERPRINT,
    provisioned: fs.existsSync(path.join(resolvedAuthority, "admin", "controller-private-key.pem")),
  });
}

export function assertCanonicalAuthorityPath(repoRoot, candidate) {
  const expected = resolveCanonicalControllerContext(repoRoot).authority_root;
  if (path.resolve(candidate).toLocaleLowerCase("en-US")
    !== expected.toLocaleLowerCase("en-US")) {
    throw new Error("Authority path is not the canonical controller authority root.");
  }
  return expected;
}
