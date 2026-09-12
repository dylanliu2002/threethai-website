import crypto from "node:crypto";
import { redactSecrets } from "../workflow/secrets.mjs";
import { MVP_CONFIG, clockEpoch } from "./config.mjs";

function iso(epoch) { return new Date(epoch).toISOString(); }

function makeOwnerToken() { return `owner_${crypto.randomUUID()}`; }

function requireOwner(ownerToken) {
  if (typeof ownerToken !== "string" || ownerToken.length === 0) throw new Error("Claim owner token is required.");
  return ownerToken;
}

function isExpired(batch, now) { return now >= Date.parse(batch.expires_at); }

function clearActiveIf(state, batchId) {
  if (state.active_batch_id === batchId) state.active_batch_id = null;
}

function expireBatch(state, batch) {
  batch.state = "EXPIRED";
  batch.claim = null;
  clearActiveIf(state, batch.batch_id);
}

function sweep(state, now) {
  let requeued = 0;
  for (const batch of state.batches) {
    if (batch.state === "QUEUED" && isExpired(batch, now)) {
      expireBatch(state, batch);
      continue;
    }
    if (!["CLAIMED", "RUNNING"].includes(batch.state) || !batch.claim) continue;
    const leaseExpiry = Date.parse(batch.claim.lease_expires_at);
    if (now < leaseExpiry) continue;
    if (isExpired(batch, now)) expireBatch(state, batch);
    else {
      batch.state = "QUEUED";
      batch.claim = null;
      clearActiveIf(state, batch.batch_id);
      requeued += 1;
    }
  }
  return requeued;
}

function claimedBatch(state, batchId, ownerToken, now) {
  const batch = state.batches.find((item) => item.batch_id === batchId);
  if (!batch) throw new Error(`Unknown batch: ${batchId}`);
  if (!["CLAIMED", "RUNNING"].includes(batch.state) || !batch.claim) {
    throw new Error(`Batch is not actively claimed: ${batchId}`);
  }
  if (batch.claim.owner_token !== ownerToken) throw new Error("Claim owner token does not match.");
  if (now >= Date.parse(batch.claim.lease_expires_at)) throw new Error("Claim lease is stale.");
  if (isExpired(batch, now)) throw new Error("Batch has expired.");
  return batch;
}

export class FifoQueue {
  constructor({ store, clock = Date, leaseMs = MVP_CONFIG.claim_lease_ms, ownerTokenFactory = makeOwnerToken } = {}) {
    if (!store || typeof store.mutate !== "function") throw new Error("FIFO queue requires a RuntimeStore.");
    if (!Number.isInteger(leaseMs) || leaseMs <= 0) throw new Error("Claim lease must be a positive integer.");
    this.store = store;
    this.clock = clock;
    this.lease_ms = leaseMs;
    this.owner_token_factory = ownerTokenFactory;
  }

  enqueue(batch) { return this.store.enqueueBatch(batch); }

  requeueStale() {
    const now = clockEpoch(this.clock);
    return this.store.mutate((state) => sweep(state, now));
  }

  claimNext({ ownerToken = this.owner_token_factory(), now = clockEpoch(this.clock) } = {}) {
    const token = requireOwner(ownerToken);
    const epoch = clockEpoch(now);
    return this.store.mutate((state) => {
      sweep(state, epoch);
      if (state.active_batch_id !== null) return null;
      const candidates = state.batches
        .filter((batch) => batch.state === "QUEUED" && !isExpired(batch, epoch))
        .sort((left, right) => left.queue_sequence - right.queue_sequence);
      const batch = candidates[0];
      if (!batch) return null;
      const claimedAt = iso(epoch);
      batch.state = "CLAIMED";
      batch.claim = {
        owner_token: token,
        claimed_at: claimedAt,
        heartbeat_at: claimedAt,
        lease_expires_at: iso(epoch + this.lease_ms),
      };
      state.active_batch_id = batch.batch_id;
      return { batch, owner_token: token };
    });
  }

  heartbeat(batchId, ownerToken, { now = clockEpoch(this.clock) } = {}) {
    const token = requireOwner(ownerToken);
    const epoch = clockEpoch(now);
    return this.store.mutate((state) => {
      const batch = claimedBatch(state, batchId, token, epoch);
      const heartbeatAt = iso(epoch);
      batch.claim.heartbeat_at = heartbeatAt;
      batch.claim.lease_expires_at = iso(epoch + this.lease_ms);
      return batch;
    });
  }

  begin(batchId, ownerToken, { now = clockEpoch(this.clock) } = {}) {
    const token = requireOwner(ownerToken);
    const epoch = clockEpoch(now);
    return this.store.mutate((state) => {
      const batch = claimedBatch(state, batchId, token, epoch);
      batch.state = "RUNNING";
      return batch;
    });
  }

  complete(batchId, ownerToken, { now = clockEpoch(this.clock) } = {}) {
    const token = requireOwner(ownerToken);
    const epoch = clockEpoch(now);
    return this.store.mutate((state) => {
      const batch = claimedBatch(state, batchId, token, epoch);
      batch.state = "COMPLETED";
      batch.claim = null;
      clearActiveIf(state, batchId);
      return batch;
    });
  }

  fail(batchId, ownerToken, error, { now = clockEpoch(this.clock) } = {}) {
    const token = requireOwner(ownerToken);
    const epoch = clockEpoch(now);
    const diagnostic = redactSecrets(error instanceof Error ? error.message : String(error)).slice(0, 2_000);
    return this.store.mutate((state) => {
      const batch = claimedBatch(state, batchId, token, epoch);
      batch.state = "FAILED";
      batch.claim = null;
      batch.last_error = diagnostic;
      clearActiveIf(state, batchId);
      return batch;
    });
  }

  status() { return this.store.snapshot(); }
}

export const Queue = FifoQueue;
export const createQueue = (options) => new FifoQueue(options);
export { sweep as sweepQueueState };
