import fs from "node:fs";
import { reserveTaskDispatchInternal } from "../internal/lease-engine.mjs";
import { createTestEngineWithAuthority } from "../testing/controller-harness.mjs";

const [fixturePath, stateDirectory, wakeupId] = process.argv.slice(2);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
try {
  const engine = createTestEngineWithAuthority({
    repoRoot: undefined,
    stateDirectory,
    taskKey: fixture.contract.task_key,
    grant: fixture.grant,
    authority: fixture.authority,
  });
  const result = reserveTaskDispatchInternal({
    engine,
    contract: fixture.contract,
    grant: fixture.grant,
    wakeupId,
    baseSha: fixture.baseSha,
    roleId: fixture.contract.owner_role,
    verifyCard: false,
    now: new Date("2026-09-04T01:00:00.000Z"),
  });
  process.stdout.write(`${JSON.stringify({ ...result, observed_at_ms: Date.now() })}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ acquired: false, error: error.message })}\n`);
}
