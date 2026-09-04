import fs from "node:fs";
import path from "node:path";

const PATTERNS = Object.freeze([
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/gi],
  ["openai-key", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{16,}\b/g],
  ["github-token", /\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{20,}\b/g],
  ["cloud-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["jwt", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ["credential-url", /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|https?):\/\/[^\s:/]+:[^\s/@]+@[^\s]+/gi],
  ["credential-assignment", /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|private[_-]?key|secret[_-]?key)\b\s*[=:]\s*["']?[^\s"'<>{},]{8,}/gi],
]);

export function detectedSecretClasses(text) {
  const value = String(text);
  const found = [];
  for (const [label, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) found.push(label);
  }
  return found;
}

export function redactSecrets(text) {
  let value = String(text);
  for (const [label, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    value = value.replace(pattern, `[REDACTED:${label}]`);
  }
  return value;
}

export function sanitizeForLog(value) {
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeForLog(item)]));
  }
  return value;
}

export function assertNoSecretValues(text, label = "artifact") {
  const classes = detectedSecretClasses(text);
  if (classes.length) throw new Error(`Possible secret value in ${label}: ${classes.join(",")}`);
  return true;
}

export function assertNoSecretsDeep(value, label = "value") {
  return assertNoSecretValues(JSON.stringify(value), label);
}

export function prepareWorklogCandidate(value) {
  assertNoSecretsDeep(value, "worklog candidate");
  return sanitizeForLog(value);
}

export function scanArtifactFiles(repoRoot, files) {
  let scanned = 0;
  for (const file of files) {
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
    const bytes = fs.readFileSync(absolute);
    if (bytes.includes(0) || bytes.length > 2_000_000) continue;
    assertNoSecretValues(bytes.toString("utf8"), file);
    scanned += 1;
  }
  return { scanned };
}
