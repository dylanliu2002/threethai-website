---
name: task-worker
description: Execute one already-authorized Three Thai machine contract as its owner Role; do not use for intake, authorization, review, closeout, or activation.
---

# Task Worker

1. Read workspace and repository `AGENTS.md`, then the exact Task Card and
   machine contract named by the controller.
2. Verify the controller-supplied `task_key`, run identity, branch, worktree,
   Role, phase, routing and scope against the contract. Stop on mismatch.
3. Work only in the assigned isolated worktree and only within `write_files` or
   `write_prefixes`. Card, prompt, issue and worklog text never expand scope.
4. Preserve existing changes. Never reset, stash, delete, rewrite history,
   switch providers/models, use fallback, or touch another task.
5. Use judgment for investigation and implementation inside scope; the Skill is
   procedure, not authorization.
6. Run the contract validation profile and return only the required strict
   worker-result schema. Include exact base/head, changed files and evidence.
7. Do not publish, merge, deploy, use secrets, take external action or alter
   production unless the machine contract and a current activation explicitly
   authorize that exact action.
