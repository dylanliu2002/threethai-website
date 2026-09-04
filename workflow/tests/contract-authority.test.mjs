import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeGrantDigest,
  validateTrustedGrant,
} from "../authority.mjs";
import { validateTaskContract } from "../contract.mjs";
import { assertActualChangesAllowed } from "../git-evidence.mjs";
import {
  assertChangedPathsAllowed,
  assertScopePathsSafe,
  normalizeRepoPath,
  resolveWithinRepo,
  windowsPathKey,
} from "../paths.mjs";
import { routeTask } from "../routing.mjs";
import { TaskContractSchema, WorkerOutputJsonSchema, WorkerResultSchema } from "../schemas.mjs";
import { assertNoSecretValues, redactSecrets } from "../secrets.mjs";
import { cleanupFixture, git, makeContract, makeGitFixture, makeGrant } from "./helpers.mjs";

test("AUTH-01 self-declared authorization without a trusted grant is rejected", () => {
  const contract = makeContract();
  contract.authorization = true;
  assert.equal(TaskContractSchema.safeParse(contract).success, false);
  delete contract.authorization;
  assert.throws(() => validateTrustedGrant(contract, undefined, { verifyCard: false }));
});

test("AUTH-02 contract activation permission change after grant is rejected", () => {
  const contract = makeContract();
  const grant = makeGrant(contract);
  contract.requested_permissions.automation_activation = false;
  assert.throws(() => validateTrustedGrant(contract, grant, { verifyCard: false }), /does not match|digest/i);
});

test("AUTH-03 authorization-bearing field change after grant is rejected", () => {
  const contract = makeContract();
  const grant = makeGrant(contract);
  contract.write_files.push("src/unauthorized.ts");
  assert.throws(() => validateTrustedGrant(contract, grant, { verifyCard: false }), /does not match|digest/i);
});

test("authorization digest covers activation and publishing state", () => {
  const contract = makeContract();
  const grant = makeGrant(contract);
  const original = grant.envelope_digest;
  grant.activation.autonomous = false;
  assert.notEqual(computeGrantDigest(grant), original);
  assert.throws(() => validateTrustedGrant(contract, grant, { verifyCard: false }), /envelope digest/i);
});

test("strict contract rejects unknown schema fields", () => {
  const contract = makeContract();
  contract.untrusted_permission = true;
  assert.throws(() => validateTaskContract(contract, { verifyCard: false }));
});

test("automatic cross-provider fallback is rejected", () => {
  const contract = makeContract();
  contract.requested_routing.fallback = "AUTO";
  assert.throws(() => routeTask(contract));
});

test("SCOPE-01 omitted unauthorized changed file is found from Git evidence", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  fs.mkdirSync(path.join(fixture.repoRoot, "src"));
  fs.writeFileSync(path.join(fixture.repoRoot, "src", "hidden.ts"), "unauthorized\n");
  const workerReported = [];
  assert.deepEqual(workerReported, []);
  assert.throws(() => assertActualChangesAllowed({
    repoRoot: fixture.repoRoot, baseSha: fixture.baseSha, grant: fixture.grant,
  }), /outside authorization/i);
});

test("SCOPE-02 untracked unauthorized file is detected", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  fs.writeFileSync(path.join(fixture.repoRoot, "forbidden.txt"), "untracked\n");
  assert.throws(() => assertActualChangesAllowed({
    repoRoot: fixture.repoRoot, baseSha: fixture.baseSha, grant: fixture.grant,
  }), /forbidden.txt/);
});

test("SCOPE-03 rename requires authorized source and destination", (t) => {
  const fixture = makeGitFixture();
  t.after(() => cleanupFixture(fixture.repoRoot, fixture.stateDirectory));
  git(fixture.repoRoot, ["mv", "allowed.txt", "forbidden.txt"]);
  assert.throws(() => assertActualChangesAllowed({
    repoRoot: fixture.repoRoot, baseSha: fixture.baseSha, grant: fixture.grant,
  }), /forbidden.txt/);
  assert.throws(() => assertChangedPathsAllowed([
    { source: "allowed.txt", destination: "src/escape.ts" },
  ], fixture.grant));
});

test("PATH-01 traversal workflow/../src/app/layout.tsx is rejected", () => {
  assert.throws(() => normalizeRepoPath("workflow/../src/app/layout.tsx"), /Traversal/);
  assert.throws(() => normalizeRepoPath("C:\\outside\\file"));
  assert.throws(() => normalizeRepoPath("\\\\server\\share\\file"));
});

test("PATH-02 Windows case-equivalent scope collision is rejected", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-case-root-"));
  t.after(() => cleanupFixture(root));
  fs.mkdirSync(path.join(root, "tasks"));
  fs.writeFileSync(path.join(root, "tasks", "README.md"), "x\n");
  assert.equal(windowsPathKey("tasks/README.md"), windowsPathKey("TASKS/readme.md"));
  assert.throws(() => assertScopePathsSafe(root, {
    write_files: ["tasks/README.md", "TASKS/readme.md"],
    write_prefixes: [], administrative_files: [],
  }), /case-equivalent/i);
});

test("PATH-03 junction or reparse escape is rejected", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-path-root-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-path-outside-"));
  t.after(() => cleanupFixture(root, outside));
  const link = path.join(root, "escape");
  try {
    fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    t.skip(`Symlink/junction unavailable: ${error.code}`);
    return;
  }
  assert.throws(() => resolveWithinRepo(root, "escape/payload.txt"), /junction|reparse|escapes/i);
});

test("SECRET-01 structured fake API secret is detected and redacted", () => {
  const fake = ["s", "k-proj-", "FAKE0123456789ABCDEF"].join("");
  const structured = { summary: `value=${fake}` };
  assert.throws(() => assertNoSecretValues(JSON.stringify(structured), "worker result"));
  assert.doesNotMatch(redactSecrets(JSON.stringify(structured)), new RegExp(fake));
});

test("SECRET-02 stderr fake credential is sanitized", () => {
  const fake = ["password", "=", "NotARealPassword123"].join("");
  assert.throws(() => assertNoSecretValues(`stderr: ${fake}`, "stderr"));
  assert.match(redactSecrets(`stderr: ${fake}`), /REDACTED/);
});

test("public ownership verification tokens are not treated as credentials", () => {
  assert.equal(assertNoSecretValues("sogou_site_verification=Bkr0mB0f4m"), true);
});

test("structured worker result rejects unknown fields and tracked schema matches", () => {
  const result = {
    schema_version: "2.0.0", task_key: "task-alpha",
    run_id: "11111111-1111-4111-8111-111111111111", role_id: "ORCHESTRATOR",
    outcome: "COMPLETED", phase: "VALIDATE", base_sha: "a".repeat(40),
    head_sha: "b".repeat(40), summary: "done", changed_files: [], validation: [],
    findings: [], requested_actions: [], broaden_scope: true,
  };
  assert.equal(WorkerResultSchema.safeParse(result).success, false);
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const tracked = JSON.parse(fs.readFileSync(path.join(repoRoot, "workflow/schemas/worker-result.schema.json"), "utf8"));
  assert.deepEqual(tracked, WorkerOutputJsonSchema);
});
