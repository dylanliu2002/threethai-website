import crypto from "node:crypto";
import { pathsOverlap, windowsPathKey } from "./paths.mjs";

const EXCLUSIVE_CLASSES = new Set([
  "controller",
  "task-worktree",
  "shared-governance",
  "resource-build",
  "git-operation",
]);

export class LockManager {
  #leases = new Map();

  acquire(taskKey, requests, { leaseId = crypto.randomUUID(), now = Date.now(), ttlMs = 900_000 } = {}) {
    this.releaseExpired(now);
    if (this.#leases.has(leaseId)) throw new Error(`Duplicate lease ID: ${leaseId}`);
    const normalized = requests.map((request) => this.#normalize(request));
    for (const existing of this.#leases.values()) {
      if (existing.taskKey === taskKey) continue;
      for (const left of normalized) {
        for (const right of existing.requests) {
          if (this.#conflicts(left, right)) {
            return { acquired: false, blocked_by: existing.taskKey, lock: left };
          }
        }
      }
    }
    const lease = { leaseId, taskKey, requests: normalized, expiresAt: now + ttlMs };
    this.#leases.set(leaseId, lease);
    return { acquired: true, lease };
  }

  renew(leaseId, { now = Date.now(), ttlMs = 900_000 } = {}) {
    const lease = this.#leases.get(leaseId);
    if (!lease || lease.expiresAt <= now) throw new Error("Lease is missing or expired.");
    lease.expiresAt = now + ttlMs;
    return lease;
  }

  owns(leaseId, taskKey, now = Date.now()) {
    const lease = this.#leases.get(leaseId);
    return Boolean(lease && lease.taskKey === taskKey && lease.expiresAt > now);
  }

  assertPublishLease(leaseId, taskKey, now = Date.now()) {
    if (!this.owns(leaseId, taskKey, now)) {
      throw new Error("Stale worker cannot publish after lease loss.");
    }
    return true;
  }

  release(leaseId) {
    return this.#leases.delete(leaseId);
  }

  releaseExpired(now = Date.now()) {
    for (const [leaseId, lease] of this.#leases) {
      if (lease.expiresAt <= now) this.#leases.delete(leaseId);
    }
  }

  snapshot() {
    return [...this.#leases.values()].map((lease) => structuredClone(lease));
  }

  #normalize(request) {
    if (!request || typeof request !== "object") throw new Error("Invalid lock request.");
    if (request.class === "path") {
      return { class: "path", key: windowsPathKey(request.key, { prefix: request.key.endsWith("/") }) };
    }
    if (!EXCLUSIVE_CLASSES.has(request.class)) throw new Error(`Unknown lock class: ${request.class}`);
    return { class: request.class, key: String(request.key).toLocaleLowerCase("en-US") };
  }

  #conflicts(left, right) {
    if (left.class !== right.class) return false;
    if (left.class === "path") return pathsOverlap(left.key, right.key);
    return left.key === right.key;
  }
}

export function contractLockRequests(contract) {
  return [
    { class: "task-worktree", key: contract.worktree },
    ...contract.write_files.map((key) => ({ class: "path", key })),
    ...contract.write_prefixes.map((key) => ({ class: "path", key })),
    ...(contract.shared_file_grants.length
      ? [{ class: "shared-governance", key: "repository-governance" }]
      : []),
  ];
}
