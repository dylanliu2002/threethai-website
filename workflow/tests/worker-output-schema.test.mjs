import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertOpenAiStructuredOutputSchema,
  WorkerOutputJsonSchema,
  WorkerResultSchema,
} from "../schemas.mjs";
import { serializeWorkerOutputSchemaInternal } from "../internal/run-engine.mjs";

function assertEveryEmittedSchemaNodeHasType(schema, location = "root") {
  assert.ok(Object.hasOwn(schema, "type"), `${location} lacks type`);
  if (schema.properties) {
    for (const [name, propertySchema] of Object.entries(schema.properties)) {
      assertEveryEmittedSchemaNodeHasType(propertySchema, `${location}.properties.${name}`);
    }
  }
  if (schema.items) assertEveryEmittedSchemaNodeHasType(schema.items, `${location}.items`);
}

test("codex output schema gives schema_version and every nested node an explicit type", () => {
  assert.deepEqual(WorkerOutputJsonSchema.properties.schema_version, {
    type: "string",
    const: "2.0.0",
  });
  assertEveryEmittedSchemaNodeHasType(WorkerOutputJsonSchema);
});

test("generated and tracked output schemas satisfy the strict Structured Outputs guard", () => {
  assert.equal(assertOpenAiStructuredOutputSchema(WorkerOutputJsonSchema), WorkerOutputJsonSchema);
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const tracked = JSON.parse(fs.readFileSync(
    path.join(repoRoot, "workflow/schemas/worker-result.schema.json"),
    "utf8",
  ));
  assert.deepEqual(tracked, WorkerOutputJsonSchema);
  assert.equal(assertOpenAiStructuredOutputSchema(tracked), tracked);
});

test("invalid schema is rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  delete invalid.properties.schema_version.type;
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /schema_version.*valid JSON Schema type/i,
  );
});

test("allOf is rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.allOf = [];
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /unsupported JSON Schema keyword: allOf/i,
  );
});

test("an unknown nested schema keyword is rejected fail-closed", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.properties.summary.unevaluatedProperties = false;
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /summary.*unsupported JSON Schema keyword: unevaluatedProperties/i,
  );
});

test("an invalid pattern is rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.properties.base_sha.pattern = "[";
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /base_sha\.pattern must compile as a valid regular expression/i,
  );
});

test("duplicate enum values are rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.properties.outcome.enum = ["COMPLETED", "COMPLETED"];
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /outcome\.enum must not contain duplicate values/i,
  );
});

test("non-JSON enum values are rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.properties.outcome.enum = [Number.NaN];
  invalid.properties.outcome.type = "number";
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /outcome\.enum\[0\] must be a valid JSON literal/i,
  );
});

test("a valid pattern remains accepted", () => {
  const valid = structuredClone(WorkerOutputJsonSchema);
  valid.properties.summary.pattern = "^Synthetic(?: fixture)?\\.$";
  assert.equal(assertOpenAiStructuredOutputSchema(valid), valid);
});

test("a valid enum remains accepted", () => {
  const valid = structuredClone(WorkerOutputJsonSchema);
  valid.properties.outcome.enum = ["COMPLETED", "FAILED"];
  assert.equal(assertOpenAiStructuredOutputSchema(valid), valid);
});

test("a NaN const is rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.properties.summary = { type: "number", const: Number.NaN };
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /summary\.const must be a valid JSON literal/i,
  );
});

test("a nested non-JSON const value is rejected before model-request serialization", () => {
  const invalid = structuredClone(WorkerOutputJsonSchema);
  invalid.properties.summary = {
    type: "object",
    const: { value: undefined },
    properties: { value: { type: ["string", "null"] } },
    required: ["value"],
    additionalProperties: false,
  };
  assert.throws(
    () => serializeWorkerOutputSchemaInternal(invalid),
    /summary\.const\.value must be a valid JSON literal/i,
  );
});

test("valid scalar and composite const values remain accepted", () => {
  const scalar = structuredClone(WorkerOutputJsonSchema);
  scalar.properties.summary = { type: "number", const: 42 };
  assert.equal(assertOpenAiStructuredOutputSchema(scalar), scalar);

  const composite = structuredClone(WorkerOutputJsonSchema);
  composite.properties.summary = {
    type: "object",
    const: { ready: true, values: [1, "two", null] },
    properties: {
      ready: { type: "boolean" },
      values: { type: "array", items: { type: ["number", "string", "null"] } },
    },
    required: ["ready", "values"],
    additionalProperties: false,
  };
  assert.equal(assertOpenAiStructuredOutputSchema(composite), composite);
});

test("successful synthetic worker output contract remains unchanged", () => {
  const output = {
    schema_version: "2.0.0",
    task_key: "sys-auto-pilot-001-synthetic-fixture",
    run_id: "11111111-1111-4111-8111-111111111111",
    role_id: "ORCHESTRATOR",
    outcome: "COMPLETED",
    phase: "VALIDATE",
    base_sha: "a".repeat(40),
    head_sha: null,
    summary: "Synthetic fixture completed.",
    changed_files: ["workflow/fixtures/pilot/output/synthetic-result.json"],
    validation: [{ name: "synthetic contract", outcome: "PASS", evidence: "validated" }],
    findings: [],
    requested_actions: [],
  };
  assert.deepEqual(WorkerResultSchema.parse(output), output);
  assert.deepEqual(Object.keys(output), WorkerOutputJsonSchema.required);
});
