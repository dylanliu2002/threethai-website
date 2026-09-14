import { redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { MVP_CONFIG, REVIEW_DEFAULT_REASONING_EFFORT } from "./config.mjs";
import { AgentRunner, runReadyPlans } from "./agent-runner.mjs";
import { planBatch } from "./planner.mjs";
import { validateTaskPlans } from "./schemas.mjs";
import { prepareTaskWorktrees } from "./worktrees.mjs";
import { validateTaskPlanExecution } from "./validation.mjs";
import { RuntimeStore } from "./runtime-store.mjs";
import { AppServerClient, isGenuineAppServerClient } from "./app-server-client.mjs";

const EXECUTOR_OPTIONS = new Set([
  "store",
  "planProvider",
  "client",
  "worktreeRoot",
  "difficulty",
  "maxParallel",
  "overlapPolicy",
]);

function assertOptions(options, allowed, label) {
  for (const key of Object.keys(options ?? {})) {
    if (!allowed.has(key)) throw new Error(`${label} cannot accept caller override: ${key}`);
  }
}

function durableBatch(store, batchOrId) {
  if (!(store instanceof RuntimeStore)) throw new Error("Night Worker executor requires the real Task 61 RuntimeStore.");
  const batchId = typeof batchOrId === "string" ? batchOrId : batchOrId?.batch_id;
  if (typeof batchId !== "string" || batchId.trim().length === 0) {
    throw new Error("An explicit submitted batch ID is required.");
  }
  const stored = store.getBatch(batchId.trim());
  if (!stored || stored.batch_id !== batchId.trim()) {
    throw new Error("Execution requires a durable batch created by explicit submission.");
  }
  if (batchOrId && typeof batchOrId === "object"
    && batchOrId.submission_id !== undefined
    && batchOrId.submission_id !== stored.submission_id) {
    throw new Error("Execution batch identity does not match the canonical RuntimeStore.");
  }
  if (!["QUEUED", "CLAIMED", "RUNNING"].includes(stored.state)) {
    throw new Error(`Batch is not eligible for execution: ${stored.state}`);
  }
  return stored;
}

function reportedFiles(result) {
  return Array.isArray(result?.reported_changed_files)
    ? result.reported_changed_files
    : Array.isArray(result?.changed_files) ? result.changed_files : [];
}

export class NightWorkerExecutor {
  constructor(options = {}) {
    assertOptions(options, EXECUTOR_OPTIONS, "Night Worker executor");
    const {
      store,
      planProvider,
      client,
      worktreeRoot,
      difficulty = REVIEW_DEFAULT_REASONING_EFFORT,
      maxParallel = MVP_CONFIG.max_parallel_implementation_workers,
      overlapPolicy = "serialize",
    } = options;
    if (!(store instanceof RuntimeStore)) throw new Error("Night Worker executor requires the real Task 61 RuntimeStore.");
    if (planProvider !== undefined && typeof planProvider !== "function") {
      throw new Error("Night Worker executor planProvider must be the persistent Orchestrator provider.");
    }
    if (!(client instanceof AppServerClient) || !isGenuineAppServerClient(client)) {
      throw new Error("Night Worker executor requires a genuine constructed Task 61 App Server client.");
    }
    if (!Number.isInteger(maxParallel) || maxParallel < 1
      || maxParallel > MVP_CONFIG.max_parallel_implementation_workers) {
      throw new Error("Task plan parallelism exceeds the fixed Night Worker limit.");
    }
    if (!["serialize", "reject"].includes(overlapPolicy)) throw new Error("Unsupported task plan overlap policy.");
    this.store = store;
    this.plan_provider = planProvider;
    this.client = client;
    this.worktree_root = worktreeRoot;
    this.difficulty = difficulty;
    this.max_parallel = maxParallel;
    this.overlap_policy = overlapPolicy;
  }

  async plan(batchId) {
    return planBatch({
      store: this.store,
      batchId,
      planProvider: this.plan_provider,
      difficulty: this.difficulty,
      worktreeRoot: this.worktree_root,
    });
  }

  async executeBatch(batchOrId, options = {}) {
    assertOptions(options, new Set(["signal", "heartbeat"]), "Night Worker execution");
    const { signal, heartbeat } = options;
    const selectedBatch = durableBatch(this.store, batchOrId);
    heartbeat?.();
    const planning = await this.plan(selectedBatch.batch_id);
    let normalizedPlans = validateTaskPlans(planning.plans, { batch: selectedBatch, requireReady: true });
    const prepared = prepareTaskWorktrees({
      repositoryRoot: selectedBatch.repository_root,
      plans: normalizedPlans,
      worktreeRoot: this.worktree_root,
    });
    normalizedPlans = validateTaskPlans(prepared.map((entry) => ({
      ...entry.plan,
      worktree: entry.worktree.worktree,
      branch: entry.worktree.branch,
      base_ref: entry.worktree.base_ref,
      base_sha: entry.worktree.base_sha,
      state: "READY",
    })), { batch: selectedBatch, requireReady: true });
    heartbeat?.();

    const runner = new AgentRunner({
      store: this.store,
      batchId: selectedBatch.batch_id,
      client: this.client,
    });
    const workerResults = await runReadyPlans(
      normalizedPlans,
      (plan) => runner.run(plan, selectedBatch.batch_id, { signal }),
      {
        maxParallel: this.max_parallel,
        overlapPolicy: this.overlap_policy,
      },
    );
    heartbeat?.();
    const validations = workerResults.map((workerResult) => {
      if (workerResult.status !== "COMPLETED") {
        return {
          plan_task_id: workerResult.plan.task_id,
          status: "REJECTED",
          passed: false,
          publishable: false,
          error: redactSecrets(workerResult.error ?? "implementation worker failed"),
        };
      }
      return validateTaskPlanExecution({
        plan: workerResult.plan,
        repositoryRoot: selectedBatch.repository_root,
        reportedChangedFiles: reportedFiles(workerResult.result),
      });
    });
    const publishable = validations.length === normalizedPlans.length
      && validations.every((evidence) => evidence.publishable === true && evidence.passed === true);
    const status = publishable ? "PUBLISHABLE" : "FAILED";
    heartbeat?.();
    return sanitizeForLog({
      status,
      batch_id: selectedBatch.batch_id,
      submission_id: selectedBatch.submission_id,
      planning,
      plans: normalizedPlans,
      workers: workerResults,
      validations,
      publishable,
      publishing_performed: false,
    });
  }

  run(batchOrId, options) {
    return this.executeBatch(batchOrId, options);
  }
}

export function createExecutor(options) {
  return new NightWorkerExecutor(options);
}

export const createNightWorkerExecutor = createExecutor;
export const executeBatch = async (options = {}) => {
  assertOptions(options, new Set(["executor", "batch", "batchId", "signal", "heartbeat"]), "executeBatch");
  const { executor, batch, batchId, ...rest } = options;
  if (!(executor instanceof NightWorkerExecutor)) throw new Error("executeBatch requires a NightWorkerExecutor.");
  if (batch !== undefined && batchId !== undefined) throw new Error("Provide batch or batchId, not both.");
  return executor.executeBatch(batchId ?? batch, rest);
};

export function createExecutionHandler(executor, options = {}) {
  if (!(executor instanceof NightWorkerExecutor)) {
    throw new Error("Execution handler requires a NightWorkerExecutor.");
  }
  assertOptions(options, new Set(), "Execution handler");
  return (batch, context = {}) => {
    assertOptions(context, new Set(["signal", "heartbeat"]), "Execution context");
    return executor.executeBatch(batch, {
      signal: context.signal,
      heartbeat: context.heartbeat,
    });
  };
}

export const createNightWorkerHandler = createExecutionHandler;
