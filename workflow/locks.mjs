import { pathsOverlap, windowsPathKey } from "./paths.mjs";

export const LOCK_CLASSES = Object.freeze([
  "controller",
  "task-worktree",
  "path",
  "shared-governance",
  "resource-build",
  "git-operation",
]);

export function normalizeLockRequest(request) {
  if (!request || typeof request !== "object" || !LOCK_CLASSES.includes(request.class)) {
    throw new Error("Invalid lock request.");
  }
  if (request.class === "path") {
    return { class: "path", key: windowsPathKey(request.key, { prefix: request.key.endsWith("/") }) };
  }
  return { class: request.class, key: String(request.key).toLocaleLowerCase("en-US") };
}

export function lockRequestsConflict(leftInput, rightInput) {
  const left = normalizeLockRequest(leftInput);
  const right = normalizeLockRequest(rightInput);
  if (left.class !== right.class) return false;
  if (left.class === "path") return pathsOverlap(left.key, right.key);
  return left.key === right.key;
}

export function contractLockRequests(contract) {
  return [
    { class: "controller", key: contract.task_key },
    { class: "task-worktree", key: contract.worktree },
    ...contract.write_files.map((key) => ({ class: "path", key })),
    ...contract.write_prefixes.map((key) => ({ class: "path", key })),
    ...(contract.shared_file_grants.length
      ? [{ class: "shared-governance", key: "repository-governance" }]
      : []),
    { class: "resource-build", key: contract.worktree },
    { class: "git-operation", key: contract.branch },
  ].map(normalizeLockRequest);
}
