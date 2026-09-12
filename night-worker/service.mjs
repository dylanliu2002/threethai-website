import { MVP_CONFIG } from "./config.mjs";
import { FifoQueue } from "./queue.mjs";

function abortError() {
  const error = new Error("Night Worker service stopped.");
  error.name = "AbortError";
  return error;
}

function wait(milliseconds, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    function onAbort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class NightWorkerService {
  constructor({
    queue,
    store,
    handler,
    pollMs = MVP_CONFIG.service_poll_ms,
    heartbeatMs = Math.max(1_000, Math.floor(MVP_CONFIG.claim_lease_ms / 3)),
  } = {}) {
    if (!(queue instanceof FifoQueue) && (!queue || typeof queue.claimNext !== "function")) {
      if (!store) throw new Error("Night Worker service requires a queue or store.");
      queue = new FifoQueue({ store });
    }
    if (typeof handler !== "function") throw new Error("Night Worker service requires an injected handler.");
    if (!Number.isInteger(pollMs) || pollMs < 0) throw new Error("pollMs must be a non-negative integer.");
    if (!Number.isInteger(heartbeatMs) || heartbeatMs <= 0) throw new Error("heartbeatMs must be positive.");
    this.queue = queue;
    this.handler = handler;
    this.poll_ms = pollMs;
    this.heartbeat_ms = heartbeatMs;
    this.running = false;
    this.stop_controller = new AbortController();
  }

  async runOnce({ signal } = {}) {
    if (signal?.aborted) throw abortError();
    const claim = this.queue.claimNext();
    if (!claim) return { status: "IDLE" };
    const { batch, owner_token: ownerToken } = claim;
    this.queue.begin(batch.batch_id, ownerToken);
    let heartbeatError = null;
    const timer = setInterval(() => {
      try {
        this.queue.heartbeat(batch.batch_id, ownerToken);
      } catch (error) {
        heartbeatError = error;
      }
    }, this.heartbeat_ms);
    try {
      const result = await this.handler(batch, {
        batch,
        batch_id: batch.batch_id,
        owner_token: ownerToken,
        signal,
        heartbeat: () => this.queue.heartbeat(batch.batch_id, ownerToken),
      });
      if (heartbeatError) throw heartbeatError;
      const completed = this.queue.complete(batch.batch_id, ownerToken);
      return { status: "COMPLETED", batch: completed, result };
    } catch (error) {
      try {
        const failed = this.queue.fail(batch.batch_id, ownerToken, error);
        return { status: "FAILED", batch: failed, error };
      } catch (claimError) {
        error.claimError = claimError;
        throw error;
      }
    } finally {
      clearInterval(timer);
    }
  }

  async serve({ signal, once = false } = {}) {
    if (this.running) throw new Error("Night Worker service is already running.");
    this.stop_controller = new AbortController();
    const effectiveSignal = this.stop_controller.signal;
    let removeExternalAbort = null;
    if (signal) {
      const abort = () => this.stop_controller.abort();
      if (signal.aborted) abort();
      else {
        signal.addEventListener("abort", abort, { once: true });
        removeExternalAbort = () => signal.removeEventListener("abort", abort);
      }
    }
    this.running = true;
    try {
      if (once) return await this.runOnce({ signal: effectiveSignal });
      while (!effectiveSignal.aborted) {
        const result = await this.runOnce({ signal: effectiveSignal });
        if (result.status === "IDLE") await wait(this.poll_ms, effectiveSignal);
      }
      return { status: "STOPPED" };
    } finally {
      removeExternalAbort?.();
      this.running = false;
    }
  }

  start(options) { return this.serve(options); }

  stop() { this.stop_controller.abort(); }

  status() { return this.queue.status(); }
}

export function createService(options) { return new NightWorkerService(options); }
export const createNightWorkerService = createService;
