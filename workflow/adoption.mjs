export function assessExistingTaskAdoption(grant, {
  worktreeStatusLines = [],
  ambiguousWorktree = false,
  separatelyAuthorized = false,
} = {}) {
  if (!separatelyAuthorized || !grant.permissions.task_adoption) {
    return { adoptable: false, reason: "separate-adoption-authorization-required" };
  }
  if (ambiguousWorktree) return { adoptable: false, reason: "ambiguous-worktree" };
  if (worktreeStatusLines.some((line) => line.trim().length > 0)) {
    return { adoptable: false, reason: "dirty-worktree" };
  }
  return { adoptable: true, reason: null };
}
