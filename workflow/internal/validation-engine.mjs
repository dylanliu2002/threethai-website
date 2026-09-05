import { spawnSync } from "node:child_process";
import { sha256 } from "../canonical.mjs";
import { configurationDigest } from "../contract.mjs";
import { redactSecrets } from "../secrets.mjs";

function execute(command, repoRoot) {
  const result = spawnSync(command, {
    cwd: repoRoot,
    shell: true,
    encoding: "utf8",
    windowsHide: true,
    timeout: 3_600_000,
  });
  return {
    command,
    exit_code: result.status,
    signal: result.signal ?? null,
    output_digest: sha256(redactSecrets(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)),
  };
}

export function deriveValidationEvidenceInternal({
  repoRoot,
  contract,
  actualHeadSha,
  runCommand = execute,
  now = new Date(),
}) {
  const startedAt = now.toISOString();
  const results = contract.validation_profile.commands.map((command) => {
    try {
      const result = runCommand(command, repoRoot);
      return { command, ...result };
    } catch (error) {
      return {
        command,
        exit_code: -1,
        signal: null,
        error_digest: sha256(redactSecrets(error instanceof Error ? error.message : String(error))),
      };
    }
  });
  const completedAt = new Date().toISOString();
  const record = {
    source: "CONTROLLER",
    profile: contract.validation_profile.name,
    commands: results,
    actual_head_sha: actualHeadSha,
    configuration_digest: configurationDigest(contract),
    started_at: startedAt,
    completed_at: completedAt,
    passed: results.every((item) => item.exit_code === 0),
  };
  return { ...record, evidence_digest: sha256(record) };
}
