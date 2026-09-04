import fs from "node:fs";
import { reserveTaskDispatch } from "../durable-leases.mjs";

const [fixturePath, stateDirectory, wakeupId] = process.argv.slice(2);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
try {
  const result = reserveTaskDispatch({
    stateDirectory,
    contract: fixture.contract,
    grant: fixture.grant,
    wakeupId,
    baseSha: fixture.baseSha,
    roleId: fixture.contract.owner_role,
    verifyCard: false,
    now: new Date("2026-09-04T01:00:00.000Z"),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ acquired: false, error: error.message })}\n`);
}
