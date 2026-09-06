import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tick } from "../controller.mjs";
import { superviseChildProcessInternal } from "../internal/run-engine.mjs";
import { reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import {
  assertNoPilotProfileBroadening,
  assertPilotDispatchProfile,
  assertPilotWorkerRequestedActions,
  buildPilotCliSecurityArgs,
  buildWorkerProcessEnvironment,
  buildWorkerShellEnvironment,
  detectWindowsElevatedSandbox,
  PILOT_MODE,
  PILOT_SANDBOX_UNAVAILABLE,
  pilotTaskKeyAuthorized,
  preparePilotWorkerLaunch,
  validateProjectCodexConfiguration,
} from "../pilot-security.mjs";
import {
  cleanupFixture,
  engineFor,
  makeContract,
  makeGrant,
  makeStateDirectory,
} from "./helpers.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const syntheticTaskPath = path.join(sourceRoot, "workflow", "fixtures", "pilot", "synthetic-task.json");
const syntheticOutputPath = path.join(sourceRoot, "workflow", "fixtures", "pilot", "output", "synthetic-result.json");
const expectedResultPath = path.join(sourceRoot, "workflow", "fixtures", "pilot", "expected", "synthetic-result.json");
const PILOT_TASK_KEY = "sys-auto-pilot-001-synthetic-fixture";

function safeParentEnvironment(extra = {}) {
  const temporary = os.tmpdir();
  return {
    PATH: process.env.PATH ?? path.dirname(process.execPath),
    PATHEXT: process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD",
    SYSTEMROOT: process.env.SYSTEMROOT ?? "C:\\Windows",
    WINDIR: process.env.WINDIR ?? "C:\\Windows",
    COMSPEC: process.env.COMSPEC ?? "C:\\Windows\\System32\\cmd.exe",
    TEMP: process.env.TEMP ?? temporary,
    TMP: process.env.TMP ?? temporary,
    CODEX_HOME: path.join(temporary, "codex-pilot-test-home"),
    ...extra,
  };
}

function requiredProfile(overrides = {}) {
  return {
    sandbox: "workspace-write",
    model: "gpt-5.6-sol",
    provider: "openai",
    cwd: path.resolve("C:/pilot-worktree"),
    approval_policy: "never",
    network_access: false,
    max_workers: 1,
    reasoning_effort: "high",
    windows_sandbox: "elevated",
    ...overrides,
  };
}

function activePilotPolicy(taskKeys = [PILOT_TASK_KEY]) {
  return {
    ...PILOT_MODE,
    activation_enabled: true,
    authorized_task_keys: taskKeys,
  };
}

function pilotAuthority({ taskKey = PILOT_TASK_KEY, repoRoot = path.resolve("C:/pilot-worktree") } = {}) {
  const contract = makeContract({ taskKey, file: "workflow/fixtures/pilot/output/synthetic-result.json" });
  contract.limits.max_workers = 1;
  for (const permission of [
    "git_commit", "branch_push", "github_write", "pr_create", "merge", "production",
    "dns", "secret_write", "external_action", "task_adoption",
  ]) contract.requested_permissions[permission] = false;
  contract.provenance.automatic_existing_task_adoption = false;
  const grant = makeGrant(contract, {
    worktreeRealpath: repoRoot,
    publishing: {
      commit: false,
      push: false,
      pr: false,
      merge: false,
      force: false,
      allowed_branch: contract.branch,
      approval_required_actions: [],
    },
  });
  grant.limits.max_workers = 1;
  return {
    contract,
    grant,
    capability: { role: contract.owner_role, sandbox: "workspace-write" },
    repoRoot,
  };
}

test("PILOT-ENV-01 parent fake secret is absent from the spawned worker environment", () => {
  const environment = buildWorkerProcessEnvironment(safeParentEnvironment({
    PARENT_FAKE_SECRET: "fixture-secret-that-must-not-cross-the-boundary",
  }), { platform: "win32" });
  assert.equal(Object.hasOwn(environment, "PARENT_FAKE_SECRET"), false);
  const result = spawnSync(process.execPath, [
    "-e",
    "process.stdout.write(String(Object.hasOwn(process.env, 'PARENT_FAKE_SECRET')))",
  ], { env: environment, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "false");
  assert.deepEqual(
    Object.keys(environment).sort(),
    Object.keys(environment).filter((name) => [
      "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP",
      "LANG", "LC_ALL", "LC_CTYPE", "NO_COLOR", "TERM", "COLORTERM", "CODEX_HOME",
    ].includes(name)).sort(),
  );
});

test("PILOT-ENV-02 GH_TOKEN is excluded", () => {
  const environment = buildWorkerProcessEnvironment(safeParentEnvironment({ GH_TOKEN: "fake" }), {
    platform: "win32",
  });
  assert.equal(Object.hasOwn(environment, "GH_TOKEN"), false);
});

test("PILOT-ENV-03 OPENAI_API_KEY is excluded from worker process and shell environments", () => {
  const processEnvironment = buildWorkerProcessEnvironment(safeParentEnvironment({
    OPENAI_API_KEY: "fake",
  }), { platform: "win32" });
  const shellEnvironment = buildWorkerShellEnvironment(processEnvironment);
  assert.equal(Object.hasOwn(processEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(shellEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(shellEnvironment, "CODEX_HOME"), false);
});

test("PILOT-PROFILE-01 danger-full-access request is rejected", () => {
  assert.throws(() => assertNoPilotProfileBroadening({
    sandbox: "danger-full-access",
  }, requiredProfile()), /sandbox/);
  const args = buildPilotCliSecurityArgs(requiredProfile(), { PATH: "C:\\tools" });
  assert.ok(args.includes("never"));
  assert.ok(args.includes("skip_host_skill_discovery"));
  assert.equal(args.includes("untrusted"), false);
  assert.equal(args.includes("danger-full-access"), false);
  for (const feature of ["apps", "browser_use", "computer_use", "plugins", "skill_search"]) {
    assert.ok(args.includes(feature));
  }
  assert.equal(args.includes("--search"), false);
});

test("PILOT-PROFILE-02 alternate model is rejected", () => {
  assert.throws(() => assertNoPilotProfileBroadening({
    model: "gpt-5.6-terra",
  }, requiredProfile()), /model/);
});

test("PILOT-PROFILE-03 alternate cwd is rejected", () => {
  assert.throws(() => assertNoPilotProfileBroadening({
    cwd: path.resolve("C:/another-worktree"),
  }, requiredProfile()), /cwd/);
});

test("PILOT-PROFILE-04 alternate provider is rejected", () => {
  assert.throws(() => assertNoPilotProfileBroadening({
    provider: "custom-provider",
  }, requiredProfile()), /provider/);
});

test("PILOT-PROFILE-05 network broadening request is rejected", () => {
  assert.throws(() => assertNoPilotProfileBroadening({
    network_access: true,
  }, requiredProfile()), /network_access/);
});

test("PILOT-SANDBOX-01 unavailable required Windows sandbox fails closed", () => {
  assert.throws(() => detectWindowsElevatedSandbox({
    platform: "win32",
    parentEnvironment: safeParentEnvironment(),
    fileExists: () => false,
    execFile: () => "codex-cli 0.153.0-alpha.5",
  }), (error) => error.code === PILOT_SANDBOX_UNAVAILABLE
    && error.message.startsWith(PILOT_SANDBOX_UNAVAILABLE));
});

test("PILOT-CONFIG-01 project Codex configuration blocks instead of broadening", (t) => {
  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-pilot-config-"));
  t.after(() => cleanupFixture(worktree));
  fs.mkdirSync(path.join(worktree, ".codex"));
  fs.writeFileSync(path.join(worktree, ".codex", "config.toml"), "sandbox_mode = \"danger-full-access\"\n");
  assert.throws(() => validateProjectCodexConfiguration(worktree), /blocks project \.codex/);
});

test("PILOT-PROFILE-06 valid future profile assembles without inheriting controller credentials", (t) => {
  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), "threethai-pilot-profile-"));
  t.after(() => cleanupFixture(worktree));
  const authority = pilotAuthority({ repoRoot: worktree });
  const launch = preparePilotWorkerLaunch({
    ...authority,
    policy: activePilotPolicy(),
    parentEnvironment: safeParentEnvironment({
      GH_TOKEN: "fake",
      OPENAI_API_KEY: "fake",
      DEPLOYMENT_PASSWORD: "fake",
    }),
    sandboxInspector: () => ({ passed: true, backend: "elevated", network_profile: "offline" }),
  });
  assert.equal(launch.profile.max_workers, 1);
  assert.equal(launch.profile.network_access, false);
  assert.equal(launch.profile.provider, "openai");
  assert.equal(Object.hasOwn(launch.process_environment, "GH_TOKEN"), false);
  assert.equal(Object.hasOwn(launch.process_environment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(launch.process_environment, "DEPLOYMENT_PASSWORD"), false);
});

test("PILOT-ADOPTION-01 existing tasks cannot be auto-adopted", () => {
  const policy = activePilotPolicy();
  assert.equal(pilotTaskKeyAuthorized("sys-auto-001-codex-autonomous-workflow-bootstrap", policy), false);
  const authority = pilotAuthority({ taskKey: "sys-auto-001-codex-autonomous-workflow-bootstrap" });
  assert.throws(() => assertPilotDispatchProfile({
    ...authority,
    policy,
  }), /not explicitly authorized/);
});

test("PILOT-WORKERS-01 pilot MAX_WORKERS is exactly one and a second worker is deferred", (t) => {
  assert.equal(PILOT_MODE.max_workers, 1);
  const stateDirectory = makeStateDirectory({ active: true });
  t.after(() => cleanupFixture(stateDirectory));
  const left = makeContract({ taskKey: "pilot-left", file: "workflow/fixtures/pilot/left.json" });
  const right = makeContract({ taskKey: "pilot-right", file: "workflow/fixtures/pilot/right.json" });
  const leftGrant = makeGrant(left);
  const rightGrant = makeGrant(right);
  const first = reserveTaskDispatchInternal({
    engine: engineFor({ stateDirectory, contract: left, grant: leftGrant }),
    contract: left,
    grant: leftGrant,
    wakeupId: "pilot-left",
    baseSha: "a".repeat(40),
    roleId: left.owner_role,
    verifyCard: false,
    maxWorkersCeiling: 1,
  });
  const second = reserveTaskDispatchInternal({
    engine: engineFor({ stateDirectory, contract: right, grant: rightGrant }),
    contract: right,
    grant: rightGrant,
    wakeupId: "pilot-right",
    baseSha: "a".repeat(40),
    roleId: right.owner_role,
    verifyCard: false,
    maxWorkersCeiling: 1,
  });
  assert.equal(first.acquired, true);
  assert.equal(first.lease.max_workers, 1);
  assert.equal(second.acquired, false);
  assert.equal(second.reason, "max-workers");
});

test("PILOT-ACTIONS-01 worker cannot request GitHub publishing", () => {
  assert.throws(() => assertPilotWorkerRequestedActions(["git push", "create pull request"]), /publishing/);
});

test("PILOT-ACTIONS-02 worker cannot request production DNS or deployment actions", () => {
  assert.throws(() => assertPilotWorkerRequestedActions(["deploy production", "change DNS"]), /deployment|DNS/);
});

test("PILOT-TIMEOUT-01 timeout path terminates the child process", async () => {
  const result = await superviseChildProcessInternal({
    command: process.execPath,
    args: ["-e", "setInterval(() => {}, 1000)"],
    cwd: sourceRoot,
    env: buildWorkerProcessEnvironment(safeParentEnvironment(), { platform: "win32" }),
    input: "",
    spawnImpl: spawn,
    timeoutMs: 50,
    forceKillAfterMs: 250,
  });
  assert.equal(result.timedOut, true);
  assert.equal(result.terminationRequested, true);
  assert.notEqual(result.code, 0);
});

test("PILOT-ACTIVATION-01 activation remains off", async () => {
  assert.equal(PILOT_MODE.activation_enabled, false);
  const result = await tick(sourceRoot, { dryRun: false });
  assert.equal(result.workers_started, 0);
  assert.equal(result.automations_started, 0);
  assert.equal(result.pilot_mode.activation_enabled, false);
});

test("PILOT-FIXTURE-01 synthetic task is deterministic disposable and not executed", () => {
  const fixture = JSON.parse(fs.readFileSync(syntheticTaskPath, "utf8"));
  const expected = JSON.parse(fs.readFileSync(expectedResultPath, "utf8"));
  assert.equal(fixture.task_key, PILOT_TASK_KEY);
  assert.equal(fixture.execute_now, false);
  assert.equal(fixture.requires_separate_activation_authorization, true);
  assert.deepEqual(fixture.write_files, ["workflow/fixtures/pilot/output/synthetic-result.json"]);
  assert.deepEqual(fixture.expected_result, expected);
  assert.equal(JSON.stringify(expected).match(/timestamp|date|time/i), null);
  assert.equal(fs.existsSync(syntheticOutputPath), false);
  assert.equal(fixture.network, false);
  assert.equal(fixture.git_push, false);
  assert.equal(fixture.pull_request, false);
  assert.equal(fixture.production, false);
});
