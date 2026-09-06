---
Task ID: SYS-AUTO-004
Role: ORCHESTRATOR
Task: Pilot Activation Bootstrap
Branch: codex/sys-auto-004-pilot-activation-bootstrap
Commit: 21035fa03162a93b7be932df5131b6f8a618160c

Work Log:
- Fetched origin and created the isolated worktree from exact authorized main
  commit `2ca8c8f7b5d521bbcf1b14b5e02c546bd14b4680`.
- Confirmed the canonical controller store and matching historical private key
  were absent. Generated a fresh Ed25519 keypair with the controller-owned
  bootstrap path, stored the private key only outside the repository, restricted
  Windows ACL access to the current controller account, and pinned only the
  public key/fingerprint in reviewed source.
- Added the exact synthetic pilot Task Card and machine contract. Its only write
  target is `workflow/fixtures/pilot/output/synthetic-result.json`; write
  prefixes, network, secrets, publishing, Git operations, production, DNS,
  deployment, merge, and Task adoption are disabled. `MAX_WORKERS` is one and
  timeout is finite.
- Added controller-only signed Grant issuance/installation and the explicit
  `enableSyntheticPilotOnce` administration action. No Grant was installed and
  the action was not invoked during this Task.
- Added atomic one-shot consumption at dispatch reservation. The consumed run
  remains authorized only to finish its already reserved attempt; a second
  reservation and reused human authorization ID fail closed even after failure.
- Removed the internal production-capable generic activation path while
  retaining activation helpers only for disposable test state.
- Added 21 focused activation/bootstrap regressions and preserved all prior
  controller regressions. Full suite passed 125/125.
- Re-fetched origin, confirmed main remained at the exact authorized base,
  rebased with no change, and reran every required validation gate successfully.
- Real pilot worker, Automation, heartbeat, publishing, GitHub write,
  production, deployment, DNS, merge, and existing-Task adoption were not run.

Stage Summary:
- Implementation is recorded at
  `21035fa03162a93b7be932df5131b6f8a618160c`; the final administrative handoff
  head is reported after push. Status is `REVIEW / INDEPENDENT_REVIEW`. A fresh
  `QA_PERFORMANCE` reviewer must independently inspect that exact final head,
  including the trust-anchor change and one-time activation boundary, before
  merge.
