# Worklog — SYS-AUTO-006 Synthetic Pilot Network Policy Correction

Task ID: SYS-AUTO-006
Role: ORCHESTRATOR
Branch: codex/sys-auto-006-pilot-network-policy
Base: 3aefe3cc0002819d5b0bf7b4cb3fcf257bbbdf72

## 2026-09-07 — Implementation and validation

- Changed only the one-shot synthetic pilot network policy from disabled to
  enabled so the pinned remote Codex model can reach its model service.
- Updated the Task Card, revision 2 machine contract, deterministic fixture,
  schemas, Grant issuance, activation validation, runtime admission, derived
  launch profile, and CLI security override to agree on `network=true`.
- The launcher now emits exactly one
  `sandbox_workspace_write.network_access=true` override and emits no false
  override.
- Preserved `windows.sandbox="elevated"`, the Role-derived `workspace-write`
  filesystem sandbox, and the existing disabled feature set. Sandbox evidence
  now selects and verifies the installed `CodexSandboxOnline` profile for the
  network-enabled pilot while still validating the complete elevated sandbox
  installation.
- Preserved one worker, one dispatch attempt, the single deterministic output
  file, absent worker credentials, disabled publishing and GitHub writes,
  disabled production/DNS/deployment, no existing-task adoption, forbidden
  `danger-full-access`, and unavailable general autonomous activation.
- Added deterministic regressions for contract/Grant/activation network
  agreement, rejection of a disabled or mismatched network permission, the
  exact launcher override, absence of the contradictory false override, and
  online Windows sandbox selection.
- Full workflow tests passed `131/131`; `validate --all`,
  `reconcile --dry-run`, `tick --dry-run`, lint, typecheck, and
  `git diff --check` passed.
- Before/after runtime fingerprints matched for the full test suite and the
  controller dry-run commands. No canonical controller state was mutated.
- No Grant was issued, pilot activation armed, worker dispatched, real model
  invoked, ACL changed, credential added, repository publication performed,
  or production action taken.
- Implementation is ready for a separate independent reviewer. The
  implementer does not approve or merge this change.

## 2026-09-08 — Correction 1 restricted network proxy

- Bound `network=true` to an exact restricted proxy policy in the synthetic
  Task Contract, copied Grant constraints, runtime profile, controller status,
  deterministic fixture, and strict schemas. The only allowed external domain
  is `chatgpt.com`; wildcard and additional-domain rules fail closed.
- Verified the supported configuration shape against installed
  `codex-cli 0.153.4` and the matching OpenAI Codex `rust-v0.153.4` source. The
  generated launch now enables `features.network_proxy`, supplies the exact
  domain map, disables local binding, upstream proxy chaining, SOCKS5/UDP, the
  credential broker, both dangerous proxy bypasses, and supplies an empty Unix
  socket policy map.
- Corrected the Windows elevated-sandbox evidence from
  `CodexSandboxOnline` to `CodexSandboxOffline`: the matching Codex source
  selects the offline identity when the proxy is enforced, even while
  sandboxed-command network transport is enabled. The read-only installed
  sandbox inspection passed for elevated/restricted-proxy with
  `CodexSandboxOffline`, marker version 5, and `allow_local_binding=false`;
  Online evidence now fails closed for this profile.
- Added deterministic negative coverage for missing or disabled proxy
  enforcement; wildcard, unexpected, localhost, loopback, and private-domain
  allow rules; local binding; upstream/arbitrary proxies; Unix sockets;
  dangerous bypasses; contract/Grant/runtime mismatches; and incorrect Windows
  identity evidence. Existing credential, publishing, autonomous activation,
  and second-dispatch tests remain green.
- Full workflow tests passed `138/138`; `validate --all`,
  `reconcile --dry-run`, `tick --dry-run`, lint, typecheck, and
  `git diff --check` passed. The generated 0.153.4 configuration was loaded in
  a clean temporary Codex home without starting a thread or worker.
- The canonical controller runtime fingerprint remained
  `e4bbfd10d0c325b27d2e5f8f049b00a28fa47be23f43f341caff9851c9c279e0`
  before and after validation. No controller state was mutated.
- No Grant was issued, activation armed, worker dispatched, model invoked,
  ACL changed, credential added, GitHub/publishing action taken, or production,
  DNS, or deployment action performed.
- Correction 1 is ready for fresh independent `QA_PERFORMANCE` review. The
  implementer does not approve or merge this change.
