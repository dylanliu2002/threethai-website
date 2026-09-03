export function assessExistingTaskAdoption(contract, {
  worktreeStatusLines = [],
  ambiguousWorktree = false,
  explicitlyAuthorized = false,
} = {}) {
  if (!explicitlyAuthorized || !contract.permissions.task_adoption) {
    return { adoptable: false, reason: "separate-adoption-authorization-required" };
  }
  if (ambiguousWorktree) return { adoptable: false, reason: "ambiguous-worktree" };
  if (worktreeStatusLines.some((line) => line.trim().length > 0)) {
    return { adoptable: false, reason: "dirty-worktree" };
  }
  return { adoptable: true, reason: null };
}
