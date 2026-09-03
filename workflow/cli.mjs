#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { defaultRepoRoot, reconcile, tick, validateRepository } from "./controller.mjs";
import { computeScopeDigest } from "./contract.mjs";
import { TaskContractSchema } from "./schemas.mjs";

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function requireDryRun(args) {
  if (!args.includes("--dry-run")) {
    throw new Error("This bootstrap command requires --dry-run until separate activation authorization.");
  }
}

function main(argv) {
  const [command, ...args] = argv;
  const repoRoot = defaultRepoRoot();
  switch (command) {
    case "validate":
      if (!args.includes("--all")) throw new Error("validate requires --all");
      output(validateRepository(repoRoot));
      return;
    case "reconcile":
      requireDryRun(args);
      output(reconcile(repoRoot, { dryRun: true }));
      return;
    case "tick":
      requireDryRun(args);
      output(tick(repoRoot, { dryRun: true }));
      return;
    case "digest": { // Maintainer utility; does not mutate the contract.
      const file = args[0];
      if (!file) throw new Error("digest requires a contract path");
      const raw = JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8"));
      const parsed = TaskContractSchema.parse(raw);
      output({ scope_digest: computeScopeDigest(parsed) });
      return;
    }
    default:
      throw new Error("Usage: node workflow/cli.mjs <validate --all|reconcile --dry-run|tick --dry-run|digest FILE>");
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
