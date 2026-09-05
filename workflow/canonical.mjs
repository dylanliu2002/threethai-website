import crypto from "node:crypto";

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  const bytes = typeof value === "string" ? value : canonicalJson(value);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function equalCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}
