import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { canonicalJson, sha256 } from "../canonical.mjs";
import { normalizeRepoPath, windowsPathKey } from "../paths.mjs";
import { WorkspaceProjector } from "./interfaces.mjs";
import { loadWorkerSecurityPolicy } from "./policy.mjs";

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function fileDigest(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }

export function projectionPathExcluded(repositoryPath, policy = loadWorkerSecurityPolicy()) {
  const normalized = normalizeRepoPath(repositoryPath);
  const lower = normalized.toLocaleLowerCase("en-US");
  const segments = lower.split("/");
  const excludedNames = new Set(policy.projection.exclude_names.map((name) => name.toLocaleLowerCase("en-US")));
  if (segments.some((segment) => excludedNames.has(segment) || segment === ".env" || segment.startsWith(".env."))) return true;
  if (policy.projection.exclude_prefixes.some((prefix) => lower.startsWith(prefix.toLocaleLowerCase("en-US")))) return true;
  return policy.projection.exclude_suffixes.some((suffix) => lower.endsWith(suffix.toLocaleLowerCase("en-US")));
}

function listTree(repoRoot, baseSha) {
  const output = execFileSync("git", ["ls-tree", "-rz", "--full-tree", baseSha], {
    cwd: repoRoot, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024,
  });
  return output.split("\0").filter(Boolean).map((record) => {
    const match = /^(\d+)\s+(\w+)\s+([0-9a-f]{40})\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error("Malformed Git tree record.");
    return { mode: match[1], type: match[2], object: match[3], path: normalizeRepoPath(match[4]) };
  });
}

function readBlob(repoRoot, object, limit) {
  const bytes = execFileSync("git", ["cat-file", "blob", object], {
    cwd: repoRoot, encoding: null, windowsHide: true, maxBuffer: limit + 1,
  });
  if (bytes.length > limit) throw new Error(`Projected file exceeds ${limit} bytes.`);
  return bytes;
}

function assertDestination(repoRoot, destination) {
  if (!path.isAbsolute(destination)) throw new Error("Projection destination must be absolute.");
  const source = fs.realpathSync.native(repoRoot);
  const target = path.resolve(destination);
  if (inside(source, target)) throw new Error("Projection destination cannot be inside the authoritative worktree.");
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isSymbolicLink()) throw new Error("Projection destination cannot be a symlink or junction.");
    if (!fs.statSync(target).isDirectory() || fs.readdirSync(target).length !== 0) {
      throw new Error("Projection destination must be new or empty.");
    }
  }
  fs.mkdirSync(target, { recursive: true, mode: 0o700 });
  const targetReal = fs.realpathSync.native(target);
  if (inside(source, targetReal)) throw new Error("Projection destination resolves inside the authoritative worktree.");
  return targetReal;
}

function enumerateWorkspace(root, policy) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = normalizeRepoPath(path.relative(root, absolute));
      if (entry.isSymbolicLink()) throw new Error(`Projection symlink is forbidden: ${relative}`);
      if (entry.isDirectory()) {
        if (!projectionPathExcluded(`${relative}/placeholder`, policy)) visit(absolute);
      } else if (entry.isFile()) {
        if (projectionPathExcluded(relative, policy)) throw new Error(`Excluded file appeared in projection: ${relative}`);
        const bytes = fs.readFileSync(absolute);
        if (bytes.length > policy.projection.max_file_bytes) throw new Error(`Projected file exceeds size limit: ${relative}`);
        files.push({ path: relative, sha256: fileDigest(bytes), size: bytes.length });
      } else {
        throw new Error(`Unsupported projection entry: ${relative}`);
      }
    }
  }
  visit(root);
  return files.sort((left, right) => windowsPathKey(left.path).localeCompare(windowsPathKey(right.path)));
}

function manifestDigest(manifest) {
  const { projection_digest: _digest, ...payload } = manifest;
  return sha256(canonicalJson(payload));
}

function makeReadOnly(root) {
  const directories = [];
  function visit(directory) {
    directories.push(directory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else fs.chmodSync(absolute, 0o444);
    }
  }
  visit(root);
  directories.sort((a, b) => b.length - a.length).forEach((directory) => fs.chmodSync(directory, 0o555));
}

export class GitWorkspaceProjector extends WorkspaceProjector {
  constructor({ policy = loadWorkerSecurityPolicy() } = {}) {
    super();
    this.policy = policy;
  }

  project({ repoRoot, baseSha, destination, taskKey, runId, profile }) {
    if (!/^[0-9a-f]{40}$/.test(baseSha)) throw new Error("Projection base SHA is invalid.");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(taskKey) || !/^[a-z0-9][a-z0-9-]*$/.test(runId)) throw new Error("Projection identity is invalid.");
    if (!Object.hasOwn(this.policy.codex.profiles, profile)) throw new Error("Projection profile is invalid.");
    const root = assertDestination(repoRoot, destination);
    const entries = listTree(repoRoot, baseSha);
    const files = [];
    for (const entry of entries) {
      if (projectionPathExcluded(entry.path, this.policy)) continue;
      if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
        throw new Error(`Symlink, submodule, or unsupported Git mode in projection: ${entry.path}`);
      }
      const bytes = readBlob(repoRoot, entry.object, this.policy.projection.max_file_bytes);
      const absolute = path.join(root, ...entry.path.split("/"));
      fs.mkdirSync(path.dirname(absolute), { recursive: true, mode: 0o700 });
      fs.writeFileSync(absolute, bytes, { mode: entry.mode === "100755" ? 0o700 : 0o600, flag: "wx" });
      files.push({ path: entry.path, sha256: fileDigest(bytes), size: bytes.length, mode: entry.mode });
    }
    files.sort((left, right) => windowsPathKey(left.path).localeCompare(windowsPathKey(right.path)));
    const manifest = {
      schema_version: "1.0.0", task_key: taskKey, run_id: runId, base_sha: baseSha,
      profile, authoritative_worktree_mounted: false, git_metadata_included: false,
      files, projection_digest: "0".repeat(64),
    };
    manifest.projection_digest = manifestDigest(manifest);
    if (profile === "review") makeReadOnly(root);
    return Object.freeze({ ...manifest, destination: root });
  }

  verify(manifest, destination) {
    const { destination: _destination, ...stored } = manifest;
    if (manifestDigest(stored) !== stored.projection_digest) throw new Error("Projection manifest digest mismatch.");
    const actual = enumerateWorkspace(destination, this.policy);
    const expected = stored.files.map(({ path: filePath, sha256: digest, size }) => ({ path: filePath, sha256: digest, size }));
    if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error("Projection content does not match its verified manifest.");
    return true;
  }
}

export function buildUntrustedResultBundle({ manifest, workspace, leaseId, fencingToken, policy = loadWorkerSecurityPolicy() }) {
  if (!/^[0-9a-f-]{36}$/.test(leaseId) || !Number.isSafeInteger(fencingToken) || fencingToken < 1) {
    throw new Error("Bundle lease/fence identity is invalid.");
  }
  const current = enumerateWorkspace(workspace, policy);
  const original = new Map(manifest.files.map((file) => [windowsPathKey(file.path), file]));
  const present = new Set(current.map((file) => windowsPathKey(file.path)));
  const changes = [];
  let totalBytes = 0;
  for (const file of current) {
    const before = original.get(windowsPathKey(file.path));
    if (before?.sha256 === file.sha256) continue;
    const bytes = fs.readFileSync(path.join(workspace, ...file.path.split("/")));
    totalBytes += bytes.length;
    changes.push({
      operation: "upsert", path: file.path, sha256: file.sha256,
      content_base64: bytes.toString("base64"), mode: before?.mode ?? "100644",
    });
  }
  for (const before of manifest.files) {
    if (!present.has(windowsPathKey(before.path))) changes.push({ operation: "delete", path: before.path, sha256: null, content_base64: null, mode: null });
  }
  if (totalBytes > policy.projection.max_bundle_bytes) throw new Error("Result bundle exceeds size limit.");
  changes.sort((left, right) => windowsPathKey(left.path).localeCompare(windowsPathKey(right.path)));
  const bundle = {
    schema_version: "1.0.0", task_key: manifest.task_key, run_id: manifest.run_id,
    lease_id: leaseId, fencing_token: fencingToken, base_sha: manifest.base_sha,
    projection_digest: manifest.projection_digest, changes, bundle_digest: "0".repeat(64),
  };
  bundle.bundle_digest = sha256(canonicalJson({ ...bundle, bundle_digest: undefined }));
  return bundle;
}
