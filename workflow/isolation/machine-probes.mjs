export const MACHINE_ISOLATION_PROBES = Object.freeze([
  "dedicated-windows-controller-identity",
  "dedicated-wsl2-execution-host",
  "wsl-automount-disabled",
  "wsl-interop-disabled",
  "rootless-oci-runtime",
  "read-only-root-filesystem",
  "seccomp-enforced",
  "capabilities-dropped",
  "host-namespaces-unavailable",
  "direct-worker-network-denied",
  "container-runtime-socket-absent",
  "controller-key-path-unreadable",
  "controller-state-unreadable",
  "cross-worker-filesystem-isolation",
  "protected-controller-signer",
  "controller-owned-inference-gateway",
]);

export function machineIsolationStatus() {
  return Object.freeze({
    status: "PENDING_MACHINE_AUTHORIZATION",
    passed: 0,
    failed: 0,
    pending: MACHINE_ISOLATION_PROBES.length,
    probes: MACHINE_ISOLATION_PROBES.map((name) => Object.freeze({
      name,
      outcome: "PENDING_MACHINE_AUTHORIZATION",
      evidence: "No host mutation or live WSL2/OCI enforcement was authorized for SYS-AUTO-002.",
    })),
  });
}
