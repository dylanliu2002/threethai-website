# Worker Isolation and Secure Execution Boundary

## Decision and current state

Architecture `WIN-OCI-CELL-01` is the required production boundary:

```text
dedicated non-admin Windows Controller identity
  -> dedicated WSL2 Linux execution host
  -> one ephemeral, non-root OCI container per worker run
  -> sanitized disposable workspace projection
  -> untrusted result bundle
  -> controller validation and controlled import
```

Repository implementation is present, but host enforcement and activation are
not. Every machine probe is `PENDING_MACHINE_AUTHORIZATION`. Codex sandboxing is
defense in depth; the WSL2/OCI and operating-system boundary is primary.

SYS-AUTO-001 remains blocked provenance at
`62d99d18f858fde6eee97559b8a9edec81d2a776`. SYS-AUTO-002 starts from that exact
commit and does not correct, merge, rewrite, or activate SYS-AUTO-001.

## Controller interfaces

The boundary has six explicit interfaces:

- `WorkerRunner` creates an exact WSL2/rootless-Podman plan. Its production
  implementation refuses execution while activation or machine provisioning is
  absent. The production controller no longer directly spawns `codex`.
- `Signer` exposes only a protected keystore reference, fingerprint, sign, and
  verify operations. Production code has no private-key PEM path or private key
  bytes. The worker receives neither the signer nor its backing key.
- `InferenceGateway` verifies a signed, expiring lease bound to Task key, run,
  model, provider, capability digest, operation, request count, token limits,
  and time budget. It rejects arbitrary URLs, tunneling, provider/base-URL/model
  overrides, and private/link-local destinations. The local stub never performs
  network I/O.
- `WorkspaceProjector` reads exact blobs from a verified Git commit into a new
  directory outside the authoritative worktree. It includes no `.git`, remotes,
  credentials, user/project Codex configuration, `.env*`, SSH/GPG state, or
  secret-bearing package-manager configuration. Review output is read-only.
- `EvidenceImporter` treats every bundle as untrusted. It requires canonical
  schema/digests, exact Task/run/lease/fence/base/projection binding, current
  controller authority, current Git head, case-safe paths, allowlisted scope,
  bounded file sizes, and secret/config exclusion before controlled import.
- `SecretStore` accepts only opaque Windows Credential Manager or CNG
  references. It never exposes a value to a worker, environment, log, or
  repository artifact.

## Pinned Codex profile

The worker image and clean, controller-created `CODEX_HOME` pin:

- `@openai/codex` / `codex-cli` `0.153.0-alpha.5`;
- provider `openai` / OpenAI, model `gpt-5.6-sol`, reasoning `high`, with no
  automatic provider or model fallback;
- exact cwd `/workspace`;
- `approval_policy = "never"`;
- `workspace-write` for implementation and `read-only` for review;
- shell sandbox network disabled and OCI network `none`;
- web search, Apps, plugins, MCP, Browser Use, Computer Use, remote control,
  remote plugins, multi-agent execution, and skills disabled;
- subprocess environment inheritance `none` with an explicit allowlist.

The selected Codex version is above the `0.138.0` minimum documented for
managed permission-profile enforcement. Role-specific `/etc/codex/requirements.toml`
allows exactly one sandbox and only disabled web search; an empty MCP allowlist
disables all MCP servers. The CLI launch plan repeats the exact model, sandbox,
cwd, and approval policy using the option positions supported by pinned CLI
`0.153.0-alpha.5`; it also requires `--strict-config`, `--ephemeral`, and
`--ignore-rules`, and rejects any extra, duplicate, missing, or reordered
argument.
Project `.codex/` content is excluded from the projection, and the worker never
inherits the user's Windows Codex home.

References: [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference),
[managed configuration](https://learn.chatgpt.com/docs/enterprise/managed-configuration),
and [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol).

## OCI policy

The declarative cell policy requires UID/GID `65532`, a read-only root
filesystem, all Linux capabilities dropped, `no-new-privileges`, private PID,
IPC, UTS, and cgroup namespaces, a unique `--userns=auto:size=65536` mapping per
cell, default-deny seccomp, bounded CPU/memory/PIDs, disposable volumes, `--rm`,
and network `none`. `--unsetenv-all` plus `--http-proxy=false` removes image,
runtime, and proxy defaults before the explicit worker allowlist is added;
`--pull=never` prevents an execution-time registry fetch. Mount validation rejects
Windows drive paths, controller state, the authoritative worktree, Docker/
Podman sockets, and host namespace sharing. The only inference path is the
controller-owned per-run gateway channel; it is not a general network route.

Reference: [Podman run options](https://docs.podman.io/en/latest/markdown/podman-run.1.html).

The OCI image reference intentionally remains `PENDING_MACHINE_AUTHORIZATION`.
An activation attempt must fail until an image built from a digest-pinned base
is itself recorded by immutable digest.

## Environment and credential boundary

Worker environment construction starts from `Object.create(null)`, not
`process.env`. Only fixed locale/path/runtime locations plus Task/run identity
are included. Provider credentials, GitHub tokens, the SSH/GPG agents,
deployment/DNS/cloud credentials, controller signing material, production
environment, and the controller's full environment are absent.

An expiring gateway lease is an authorization capability, not a provider
credential. It is mounted as a read-only per-run file. The gateway owns provider
authentication on the controller side and forwards only the approved Responses
operation to the fixed OpenAI endpoint.

## Machine Change Plan

The following host changes are proposed and are **not authorized or performed**:

1. Create the Windows service `ThreeThaiCodexController` under the virtual,
   non-interactive, non-admin identity `NT SERVICE\ThreeThaiCodexController`.
   Install reviewed controller files under a service-owned directory and set
   service recovery to fail closed; do not enable autonomous dispatch.
2. Create `C:\ProgramData\ThreeThai\CodexController` for controller state,
   grants, audit evidence, and gateway state. Grant full control only to
   `SYSTEM`, `Administrators`, and the controller service identity; explicitly
   verify ordinary users and worker identities cannot read it.
3. Provision a non-exportable controller signing key under the protected
   keystore reference `cng://LocalMachine/ThreeThaiCodexController`. If the
   selected Windows key provider cannot implement the currently pinned Ed25519
   verifier, select a non-exportable HSM/KSP algorithm and obtain a separate
   reviewed repository authorization to rotate the public trust anchor and
   algorithm. Never create or store a PEM file.
4. Provision provider authentication in Windows Credential Manager under
   `windows-credential-manager://ThreeThaiCodexController`, ACL-bound to the
   controller service. Do not place the provider credential in WSL, OCI,
   environment variables, command lines, logs, or repository files.
5. Enable required Windows WSL2/virtualization features if absent, then import a
   dedicated distribution named `ThreeThai-Codex-Worker` beneath a protected
   ProgramData location. Apply the reviewed `wsl.conf`, terminate/restart that
   distribution, and verify `/mnt/c` and all other Windows-drive mounts are
   absent, Windows interop is disabled, and the Windows PATH is not appended.
6. Inside only that distribution, create the unprivileged controller-side user
   `cellctl` (UID/GID `65531`) and install a reviewed rootless Podman release.
   Configure rootless storage beneath the distribution's ext4 filesystem and
   enough subordinate UID/GID ranges for concurrent unique 65,536-ID worker
   namespaces. Do not expose Docker/Podman sockets to worker containers.
7. Build the worker image from `workflow/isolation/oci/Containerfile` with an
   approved digest-pinned Node base image and exact Codex version
   `0.153.0-alpha.5`. Scan it, record the resulting immutable image digest in
   `worker-security-policy.json` through a separately reviewed repository
   change, and reject tags or mutable references at runtime.
8. Configure Windows Firewall so the controller gateway alone may reach the
   approved OpenAI provider endpoint over TLS. Deny worker/WSL/container direct
   egress and inbound access. Add no broad private, link-local, LAN, DNS,
   proxy, or CONNECT route. Validate the final effective rules before use.
9. Deploy the controller-owned gateway process and its WSL bridge. The Windows
   side owns the provider credential; the WSL side exposes only a unique,
   short-lived Unix socket for one run. Bind and enforce Task key, run ID,
   provider, model, expiry, operation, request/token/time budgets, and audit
   digest. Deny arbitrary destinations, base URLs, model/provider overrides,
   CONNECT, redirects, and private/link-local addresses.
10. Create per-run ext4 directories under `/var/lib/threethai-cells`, owned by
    `cellctl`, with separate projection, clean Codex home, managed requirements,
    gateway lease/socket, controller input, and untrusted output locations.
    Apply ACLs so one worker UID cannot access another run and always destroy
    the cell and its disposable volumes after evidence capture.
11. Execute every machine probe in `workflow/isolation/machine-probes.mjs`, plus
    positive/negative gateway and import trials. Record actual commands, exit
    codes, identities, mount tables, namespace IDs, firewall evidence, runtime
    inspection, and cleanup. A repository assertion is not OS evidence.
12. After independent repository and machine review, request a distinct
    `ACTIVATION AUTHORIZATION`. Machine setup alone must leave autonomous worker
    dispatch disabled.

## Required machine acceptance evidence

- The Windows service token is non-admin and cannot interactively log on.
- Controller state and signer/credential handles are unreadable from WSL and a
  worker cell, including by guessed paths.
- `/mnt/c` and other Windows drives, `cmd.exe` interop, inherited Windows PATH,
  controller environment, SSH/GPG agents, and runtime sockets are absent.
- The worker is UID/GID 65532 with a read-only root, drop-all capabilities,
  `no-new-privileges`, private namespaces, enforced seccomp/resource limits,
  and no host namespace handles.
- Direct DNS/TCP/HTTP from a worker fails, while a valid gateway lease can
  perform only its bound operation and all specified abuse probes fail.
- Two simultaneous cells cannot read or modify each other's projection,
  gateway lease, output, or temporary files.
- Review projection writes fail at the OCI mount layer.
- A stale fence, stale head, malformed bundle, secret file, symlink, oversized
  file, case collision, traversal, and out-of-scope change all fail import.

Until that evidence exists, machine isolation status remains
`PENDING_MACHINE_AUTHORIZATION` and autonomous activation remains `NO`.
