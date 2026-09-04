#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { computeContractDigest } from "./contract.mjs";
import { defaultRepoRoot, reconcile, tick, validateRepository } from "./controller.mjs";
import { TaskContractSchema } from "./schemas.mjs";

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(argv) {
  const [command, ...args] = argv;
  const repoRoot = defaultRepoRoot();
  switch (command) {
    case "validate":
      if (!args.includes("--all")) throw new Error("validate requires --all");
      output(validateRepository(repoRoot, { contractsOnly: args.includes("--contracts-only") }));
      return;
    case "reconcile":
      if (!args.includes("--dry-run")) throw new Error("reconcile requires --dry-run during SYS-AUTO-001");
      output(reconcile(repoRoot, { dryRun: true }));
      return;
    case "tick":
      output(await tick(repoRoot, { dryRun: args.includes("--dry-run") }));
      return;
    case "digest": {
      const file = args[0];
      if (!file) throw new Error("digest requires a contract path");
      const parsed = TaskContractSchema.parse(JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8")));
      output({ contract_digest: computeContractDigest(parsed) });
      return;
    }
    default:
      throw new Error("Usage: node workflow/cli.mjs <validate --all [--contracts-only]|reconcile --dry-run|tick [--dry-run]|digest FILE>");
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
