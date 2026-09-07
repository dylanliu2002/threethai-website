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
