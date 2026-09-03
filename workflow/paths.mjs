import path from "node:path";
import fs from "node:fs";

export function normalizeRepoPath(value, { prefix = false } = {}) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new Error("Path must be a non-empty string without NUL bytes.");
  }
  const slashPath = value.replaceAll("\\", "/").normalize("NFC");
  if (/^(?:[A-Za-z]:|\/|\\)/.test(slashPath)) {
    throw new Error(`Absolute path is forbidden: ${value}`);
  }
  const rawSegments = slashPath.split("/");
  if (rawSegments.some((segment, index) =>
    segment === "" && (!prefix || index !== rawSegments.length - 1))) {
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
  return writePrefixes.some((prefix) =>
    key.startsWith(windowsPathKey(prefix, { prefix: true })),
  );
}

export function assertChangedPathsAllowed(
  changedPaths,
  { write_files: writeFiles, write_prefixes: writePrefixes },
) {
  for (const changed of changedPaths) {
    const paths = typeof changed === "string"
      ? [changed]
      : [changed.source, changed.destination].filter(Boolean);
    for (const candidate of paths) {
      if (!pathAllowed(candidate, writeFiles, writePrefixes)) {
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

export function resolveWithinRepo(repoRoot, repositoryPath) {
  const normalized = normalizeRepoPath(repositoryPath);
  const rootReal = fs.realpathSync.native(repoRoot);
  const candidate = path.resolve(rootReal, ...normalized.split("/"));
  if (!inside(rootReal, candidate)) throw new Error("Path escapes repository root.");

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
