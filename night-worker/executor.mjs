import { redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { MVP_CONFIG, REVIEW_DEFAULT_REASONING_EFFORT } from "./config.mjs";
import { AgentRunner, runReadyPlans } from "./agent-runner.mjs";
import { planBatch } from "./planner.mjs";
import { validateTaskPlans } from "./schemas.mjs";
import { prepareTaskWorktrees } from "./worktrees.mjs";
import { validateTaskPlanExecution } from "./validation.mjs";
import { RuntimeStore } from "./runtime-store.mjs";

function durableBatch(store, batch) {
  if (!(store instanceof RuntimeStore)) throw new Error("Night Worker executor requires the real Task 61 RuntimeStore.");
  if (!batch || typeof batch !== "object" || Array.isArray(batch)) throw new Error("An explicit submitted batch is required.");
  const stored = store.getBatch(batch.batch_id);
  if (!stored || stored.submission_id !== batch.submission_id) {
    throw new Error("Execution requires a durable batch created by explicit submission.");
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
  constructor({
    store,
    planProvider,
    planner,
    broker,
    brokerFactory,
    client,
    worktreeRoot,
    baseRef = "origin/main",
    difficulty = REVIEW_DEFAULT_REASONING_EFFORT,
    maxParallel = MVP_CONFIG.max_parallel_implementation_workers,
    overlapPolicy = "serialize",
    commandRunner,
    exec,
    prepareWorktrees = prepareTaskWorktrees,
  } = {}) {
    if (!(store instanceof RuntimeStore)) throw new Error("Night Worker executor requires the real Task 61 RuntimeStore.");
    if (planner !== undefined && (!planner || typeof planner.planBatch !== "function")) {
      throw new Error("executor planner must expose planBatch.");
    }
    if (typeof prepareWorktrees !== "function") throw new Error("Task worktree preparation must be a function.");
    this.store = store;
    this.plan_provider = planProvider;
    this.planner = planner;
    this.broker = broker;
    this.broker_factory = brokerFactory;
    this.client = client;
    this.worktree_root = worktreeRoot;
    this.base_ref = baseRef;
    this.difficulty = difficulty;
    this.max_parallel = maxParallel;
    this.overlap_policy = overlapPolicy;
    this.command_runner = commandRunner;
    this.exec = exec;
    this.prepare_worktrees = prepareWorktrees;
  }

  async plan(batch, options = {}) {
    if (this.planner) {
      return this.planner.planBatch({
        ...options,
        store: this.store,
        batch,
      });
    }
    if (typeof (options.planProvider ?? this.plan_provider) !== "function" && options.plans === undefined) {
      throw new Error("Night Worker executor requires persistent Orchestrator planning output.");
    }
    return planBatch({
      ...options,
      store: this.store,
      batch,
      planProvider: options.planProvider ?? this.plan_provider,
      difficulty: options.difficulty ?? this.difficulty,
      worktreeRoot: options.worktreeRoot ?? this.worktree_root,
      baseRef: options.baseRef ?? this.base_ref,
    });
  }

  async executeBatch(batch, {
    plans,
    planProvider,
    broker,
    brokerFactory,
    client,
    worktreeRoot,
    baseRef,
    difficulty,
    signal,
    heartbeat,
    commandRunner,
    exec,
    prepareWorktrees,
  } = {}) {
    const selectedBatch = durableBatch(this.store, batch);
    heartbeat?.();
    const planning = await this.plan(selectedBatch, {
      plans,
      planProvider: planProvider ?? this.plan_provider,
      difficulty: difficulty ?? this.difficulty,
      worktreeRoot: worktreeRoot ?? this.worktree_root,
      baseRef: baseRef ?? this.base_ref,
    });
    let normalizedPlans = validateTaskPlans(planning.plans, { batch: selectedBatch, requireReady: true });
    const prepared = (prepareWorktrees ?? this.prepare_worktrees)({
      repositoryRoot: selectedBatch.repository_root,
      plans: normalizedPlans,
      worktreeRoot: worktreeRoot ?? this.worktree_root,
      baseRef: baseRef ?? this.base_ref,
      exec: exec ?? this.exec,
    });
    normalizedPlans = validateTaskPlans(prepared.map((entry) => ({
      ...entry.plan,
      worktree: entry.worktree.worktree,
      branch: entry.worktree.branch,
      state: "READY",
    })), { batch: selectedBatch, requireReady: true });
    heartbeat?.();

    const runner = new AgentRunner({
      store: this.store,
      batch: selectedBatch,
      broker: broker ?? this.broker,
      brokerFactory: brokerFactory ?? this.broker_factory,
      client: client ?? this.client,
    });
    const workerResults = await runReadyPlans(
      normalizedPlans,
      (plan) => runner.run(plan, selectedBatch, { signal }),
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
        baseRef: workerResult.plan.base_ref ?? baseRef ?? this.base_ref,
        reportedChangedFiles: reportedFiles(workerResult.result),
        commandRunner: commandRunner ?? this.command_runner,
        exec: exec ?? this.exec,
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

  run(batch, options) {
    return this.executeBatch(batch, options);
  }
}

export function createExecutor(options) {
  return new NightWorkerExecutor(options);
}

export const createNightWorkerExecutor = createExecutor;
export const executeBatch = async (options = {}) => {
  const { executor, batch, ...rest } = options;
  if (!(executor instanceof NightWorkerExecutor)) throw new Error("executeBatch requires a NightWorkerExecutor.");
  return executor.executeBatch(batch, rest);
};

export function createExecutionHandler(executor, options = {}) {
  if (!(executor instanceof NightWorkerExecutor) && (!executor || typeof executor.executeBatch !== "function")) {
    throw new Error("Execution handler requires a NightWorkerExecutor.");
  }
  return (batch, context = {}) => executor.executeBatch(batch, {
    ...options,
    signal: context.signal,
    heartbeat: context.heartbeat,
  });
}

export const createNightWorkerHandler = createExecutionHandler;
