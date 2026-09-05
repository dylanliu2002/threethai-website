import fs from "node:fs";
import path from "node:path";

export function normalizeRepoPath(value, { prefix = false } = {}) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new Error("Path must be a non-empty string without NUL bytes.");
  }
  const slashPath = value.replaceAll("\\", "/").normalize("NFC");
  if (/^(?:[A-Za-z]:|\/|\\)/.test(slashPath) || slashPath.startsWith("//")) {
    throw new Error(`Absolute, drive, or UNC path is forbidden: ${value}`);
  }
  const rawSegments = slashPath.split("/");
  if (rawSegments.some((segment, index) => segment === "" && (!prefix || index !== rawSegments.length - 1))) {
    throw new Error(`Empty path segment is forbidden: ${value}`);
  }
  if (rawSegments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Traversal is forbidden: ${value}`);
  }
  const segments = rawSegments.filter(Boolean);
  if (segments.length === 0) throw new Error("Repository root is not a write path.");
  const normalized = segments.join("/");
  return prefix ? `${normalized}/` : normalized;
}

export function windowsPathKey(value, options) {
  return normalizeRepoPath(value, options).toLocaleLowerCase("en-US");
}

export function pathsOverlap(left, right) {
  const a = windowsPathKey(left, { prefix: left.endsWith("/") });
  const b = windowsPathKey(right, { prefix: right.endsWith("/") });
  const aBase = a.endsWith("/") ? a : `${a}/`;
  const bBase = b.endsWith("/") ? b : `${b}/`;
  return a === b || aBase.startsWith(bBase) || bBase.startsWith(aBase);
}

export function pathAllowed(candidate, writeFiles, writePrefixes) {
  const key = windowsPathKey(candidate);
  const exact = new Set(writeFiles.map((item) => windowsPathKey(item)));
  if (exact.has(key)) return true;
  return writePrefixes.some((prefix) => key.startsWith(windowsPathKey(prefix, { prefix: true })));
}

export function assertChangedPathsAllowed(changedPaths, grant) {
  const writeFiles = [...grant.write_files, ...(grant.administrative_files ?? [])];
  const writePrefixes = grant.write_prefixes;
  for (const changed of changedPaths) {
    const paths = typeof changed === "string"
      ? [changed]
      : [changed.source, changed.destination].filter(Boolean);
    for (const candidate of paths) {
      const normalized = normalizeRepoPath(candidate);
      if (!pathAllowed(normalized, writeFiles, writePrefixes)) {
        throw new Error(`Changed path is outside authorization: ${candidate}`);
      }
    }
  }
  return true;
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertNoReparseAncestor(rootReal, candidate, repositoryPath) {
  const relative = path.relative(rootReal, candidate);
  let current = rootReal;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`Symlink or junction/reparse point is forbidden: ${repositoryPath}`);
    }
  }
}

export function resolveWithinRepo(repoRoot, repositoryPath, { rejectReparse = true } = {}) {
  const normalized = normalizeRepoPath(repositoryPath);
  const rootReal = fs.realpathSync.native(repoRoot);
  const candidate = path.resolve(rootReal, ...normalized.split("/"));
  if (!inside(rootReal, candidate)) throw new Error("Path escapes repository root.");
  if (rejectReparse) assertNoReparseAncestor(rootReal, candidate, repositoryPath);

  let ancestor = candidate;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error("Cannot resolve a safe path ancestor.");
    ancestor = parent;
  }
  const ancestorReal = fs.realpathSync.native(ancestor);
  if (!inside(rootReal, ancestorReal)) {
    throw new Error(`Symlink or junction escapes repository: ${repositoryPath}`);
  }
  if (fs.existsSync(candidate)) {
    const candidateReal = fs.realpathSync.native(candidate);
    if (!inside(rootReal, candidateReal)) {
      throw new Error(`Symlink or junction escapes repository: ${repositoryPath}`);
    }
  }
  return candidate;
}

export function assertScopePathsSafe(repoRoot, grant) {
  const seen = new Map();
  for (const candidate of [...grant.write_files, ...grant.write_prefixes, ...grant.administrative_files]) {
    const prefix = candidate.endsWith("/");
    const key = windowsPathKey(candidate, { prefix });
    const prior = seen.get(key);
    if (prior && prior !== candidate) {
      throw new Error(`Case-equivalent path collision: ${prior} and ${candidate}`);
    }
    seen.set(key, candidate);
    resolveWithinRepo(repoRoot, prefix ? candidate.slice(0, -1) : candidate);
  }
  return true;
}
