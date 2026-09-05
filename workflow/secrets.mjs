import fs from "node:fs";
import path from "node:path";

const PATTERNS = Object.freeze([
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/gi],
  ["openai-key", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{16,}\b/g],
  ["github-token", /\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{20,}\b/g],
  ["cloud-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["jwt", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ["credential-url", /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|https?):\/\/[^\s:/]+:[^\s/@]+@[^\s]+/gi],
  ["credential-assignment", /["']?\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|pwd|private[_-]?key|secret[_-]?key|token[_-]?secret|credentials?)["']?\s*[=:]\s*["']?[^\s"'<>{},]{3,}/gi],
]);

const SENSITIVE_KEYS = new Set([
  "password", "passwd", "pwd", "secret", "clientsecret", "apikey",
  "accesstoken", "refreshtoken", "privatekey", "authorization",
  "credential", "credentials", "tokensecret",
]);

function normalizedKey(key) {
  return String(key).toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key) { return SENSITIVE_KEYS.has(normalizedKey(key)); }

function parseStructuredJson(text) {
  const value = String(text).trim();
  if (!(value.startsWith("{") || value.startsWith("["))) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

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

export function detectedSecretsDeep(value, pathPrefix = "$") {
  const findings = [];
  function visit(item, currentPath) {
    if (typeof item === "string") {
      for (const label of detectedSecretClasses(item)) findings.push(`${currentPath}:${label}`);
      const parsed = parseStructuredJson(item);
      if (parsed) visit(parsed, `${currentPath}:json`);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach((entry, index) => visit(entry, `${currentPath}[${index}]`));
      return;
    }
    if (item && typeof item === "object") {
      for (const [key, entry] of Object.entries(item)) {
        const childPath = `${currentPath}.${key}`;
        if (isSensitiveKey(key)) findings.push(`${childPath}:sensitive-field`);
        else visit(entry, childPath);
      }
    }
  }
  visit(value, pathPrefix);
  return [...new Set(findings)];
}

export function sanitizeForLog(value) {
  if (typeof value === "string") {
    const parsed = parseStructuredJson(value);
    return parsed ? JSON.stringify(sanitizeForLog(parsed)) : redactSecrets(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? "[REDACTED]" : sanitizeForLog(item),
    ]));
  }
  return value;
}

export function assertNoSecretValues(text, label = "artifact") {
  const findings = detectedSecretsDeep(String(text));
  if (findings.length) throw new Error(`Possible secret value in ${label}: ${findings.join(",")}`);
  return true;
}

export function assertNoSecretsDeep(value, label = "value") {
  const findings = detectedSecretsDeep(value);
  if (findings.length) throw new Error(`Possible secret field/value in ${label}: ${findings.join(",")}`);
  return true;
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
