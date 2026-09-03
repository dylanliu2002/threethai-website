import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeScopeDigest,
  validateContract,
} from "../contract.mjs";
import { TaskContractSchema, WorkerOutputJsonSchema, WorkerResultSchema } from "../schemas.mjs";
import { taskGraphIdentity, validateTaskGraph } from "../dependencies.mjs";
import { routeTask } from "../routing.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contractPath = path.join(repoRoot, "tasks", "machine", "sys-auto-001-codex-autonomous-workflow-bootstrap.json");

function fixture() {
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  contract.authorization.scope_digest = computeScopeDigest(contract);
  return contract;
}

test("valid authorized task admission", () => {
  const contract = fixture();
  assert.equal(validateContract(contract, { verifyCard: false }).task_key, contract.task_key);
});

test("missing authorization is rejected", () => {
  const contract = fixture();
  delete contract.authorization;
  assert.equal(TaskContractSchema.safeParse(contract).success, false);
});

test("unknown schema version is rejected", () => {
  const contract = fixture();
  contract.schema_version = "2.0.0";
  assert.equal(TaskContractSchema.safeParse(contract).success, false);
});

test("unknown contract field is rejected", () => {
  const contract = fixture();
  contract.untrusted_permission = true;
  assert.equal(TaskContractSchema.safeParse(contract).success, false);
});

test("numeric display ID collision does not collide machine identity", () => {
  const left = fixture();
  const right = fixture();
  left.task_key = "task-alpha";
  right.task_key = "task-beta";
  left.task_id = right.task_id = "53";
  left.dependencies = right.dependencies = [];
  const graph = validateTaskGraph([left, right]);
  assert.equal(graph.size, 2);
  assert.notEqual(taskGraphIdentity(left), taskGraphIdentity(right));
});

test("automatic cross-provider fallback is rejected", () => {
  const contract = fixture();
  contract.routing.fallback = "AUTO";
  assert.throws(() => validateContract(contract, { verifyCard: false }));
});

test("model unavailable blocks instead of falling back", () => {
  assert.throws(() => routeTask(fixture(), { availableModels: ["gpt-5.6-terra"] }), /BLOCKED/);
});

test("structured worker result rejects unknown fields", () => {
  const result = {
    schema_version: "1.0.0",
    task_key: "task-alpha",
    run_id: "11111111-1111-4111-8111-111111111111",
    role_id: "ORCHESTRATOR",
    outcome: "COMPLETED",
    phase: "VALIDATE",
    base_sha: "a".repeat(40),
    head_sha: "b".repeat(40),
    summary: "done",
    changed_files: [],
    validation: [],
    findings: [],
    requested_actions: [],
    broaden_scope: true,
  };
  assert.equal(WorkerResultSchema.safeParse(result).success, false);
});

test("tracked worker output schema matches runtime adapter schema", () => {
  const tracked = JSON.parse(fs.readFileSync(path.join(repoRoot, "workflow/schemas/worker-result.schema.json"), "utf8"));
  assert.deepEqual(tracked, WorkerOutputJsonSchema);
});
