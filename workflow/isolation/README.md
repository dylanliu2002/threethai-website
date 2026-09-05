# WIN-OCI-CELL-01 worker boundary

This directory is the repository implementation for SYS-AUTO-002. It is
deliberately inactive. `worker-security-policy.json` is the reviewed policy;
`WorkerRunner`, `Signer`, `InferenceGateway`, `WorkspaceProjector`,
`EvidenceImporter`, and `SecretStore` are explicit controller interfaces.

The production path ends at `OciCellWorkerRunner`. It plans a dedicated WSL2
rootless OCI cell but refuses to execute while activation and machine
enforcement are unprovisioned. Production controller modules no longer call the
legacy direct `codex` child-process adapter. That adapter remains internal for
the pre-existing deterministic unit-test harness only.

The intended data path is:

```text
authoritative Windows worktree
  -> controller verifies an exact Git base
  -> tracked blobs are copied to a sanitized WSL filesystem projection
  -> one non-root, network-none OCI cell edits the disposable projection
  -> worker output becomes an untrusted, digest-bound result bundle
  -> controller reloads lease/fence authority and validates scope/content
  -> controller applies a controlled import to the authoritative worktree
  -> existing Git/validation/review evidence is derived independently
```

Neither the authoritative Windows worktree nor controller state, secrets,
signer, Git metadata, user Codex home, container runtime socket, SSH/GPG
material, package-manager credential files, or `.env*` files are mounted into a
worker. Review projections are read-only at both the OCI mount and Codex
profile layers.

## Machine gate

The OCI image reference intentionally remains
`PENDING_MACHINE_AUTHORIZATION`. The `Containerfile` also requires an explicit
digest-pinned `BASE_IMAGE` build argument. Repository tests validate the policy
and adversarial contracts; they do not claim that Windows, WSL2, OCI, ACL,
firewall, keystore, or gateway controls are currently enforced.
