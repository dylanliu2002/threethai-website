---
Task Key: sys-auto-002-worker-isolation-secure-execution-boundary
Task ID: SYS-AUTO-002
Role: ORCHESTRATOR
Task: Worker Isolation & Secure Execution Boundary
Branch: codex/sys-auto-002-worker-isolation
Base Provenance: 62d99d18f858fde6eee97559b8a9edec81d2a776
Integration Base: b18e5630909e73c3fc6b4884a51d0b6daa89d20c
Date: 2026-09-06

Work Log:
- Created this dedicated branch/worktree from the exact inherited blocked
  provenance head. Did not modify, rewrite, merge, or continue SYS-AUTO-001.
- Verified installed `codex-cli 0.153.0-alpha.5` and current official OpenAI
  configuration/model documentation before implementing the pinned profile.
- Verified the pinned command layout against that CLI's local `--help`: the
  approval option is a global option placed before `exec`; strict config,
  ephemeral execution, and repository-rule suppression are mandatory.
- Implemented `WIN-OCI-CELL-01` repository policy and interfaces for the
  WorkerRunner, protected Signer, controller-owned InferenceGateway, sanitized
  WorkspaceProjector, controlled EvidenceImporter, and opaque SecretStore.
- Redirected production controller execution to the inactive OCI WorkerRunner;
  removed direct production child-process spawn and private-key PEM path use.
- Added clean environment/CODEX_HOME generation, role-specific managed Codex
  requirements, rootless non-root OCI templates, WSL interop/automount disable
  template, default-deny seccomp, resource/network/mount restrictions, and an
  exact non-executed Machine Change Plan.
- Hardened the OCI launch plan against image/runtime/proxy environment defaults,
  execution-time image pulls, and shared/host user namespaces using current
  Podman run semantics.
- Added 26 isolation-specific repository tests. All OS/runtime enforcement
  probes remain `PENDING_MACHINE_AUTHORIZATION`; no PASS was fabricated.

Stage Summary:
- Repository implementation is ready for independent review. Machine setup and
  activation remain separate gates. No live worker, gateway, host mutation,
  existing-task adoption, PR, merge, deployment, or production action occurred.
