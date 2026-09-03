import fs from "node:fs";
import path from "node:path";

const secretAssignment = /\b(?:OPENAI_API_KEY|CODEX_API_KEY|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY)\s*[=:]\s*["']?[^\s"'<>{}]{12,}/i;
const privateKey = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

export function assertNoSecretValues(text, label = "artifact") {
  if (secretAssignment.test(text) || privateKey.test(text)) {
    throw new Error(`Possible secret value in ${label}`);
  }
  return true;
}

export function scanArtifactFiles(repoRoot, files) {
  for (const file of files) {
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
    const bytes = fs.readFileSync(absolute);
    if (bytes.includes(0) || bytes.length > 2_000_000) continue;
    assertNoSecretValues(bytes.toString("utf8"), file);
  }
  return { scanned: files.length };
}
