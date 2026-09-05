import { execFileSync } from "node:child_process";
import { sha256 } from "./canonical.mjs";
import {
  assertChangedPathsAllowed,
  normalizeRepoPath,
  resolveWithinRepo,
  windowsPathKey,
} from "./paths.mjs";

function git(repoRoot, args, exec = execFileSync) {
  return exec("git", args, { cwd: repoRoot, encoding: "utf8", windowsHide: true });
}

export function parseNameStatusZ(text, source) {
  const fields = text.split("\0");
  if (fields.at(-1) === "") fields.pop();
  const changes = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!status) continue;
    if (/^[RC]/.test(status)) {
      const from = normalizeRepoPath(fields[index++]);
      const to = normalizeRepoPath(fields[index++]);
      changes.push({ status, source: from, destination: to, evidence_source: source });
    } else {
      const file = normalizeRepoPath(fields[index++]);
      changes.push({ status, destination: file, evidence_source: source });
    }
  }
  return changes;
}

export function deriveActualChanges(repoRoot, baseSha, { exec = execFileSync } = {}) {
  const changes = [
    ...parseNameStatusZ(git(repoRoot, ["diff", "--name-status", "-z", "--find-renames", baseSha, "HEAD", "--"], exec), "committed"),
    ...parseNameStatusZ(git(repoRoot, ["diff", "--cached", "--name-status", "-z", "--find-renames", "--"], exec), "staged"),
    ...parseNameStatusZ(git(repoRoot, ["diff", "--name-status", "-z", "--find-renames", "--"], exec), "unstaged"),
  ];
  const untracked = git(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"], exec)
    .split("\0").filter(Boolean)
    .map((file) => ({ status: "?", destination: normalizeRepoPath(file), evidence_source: "untracked" }));
  const unique = new Map();
  for (const change of [...changes, ...untracked]) {
    const key = [change.status, change.source ?? "", change.destination ?? ""].join("\0").toLocaleLowerCase("en-US");
    unique.set(key, change);
  }
  const actual = [...unique.values()].sort((left, right) => {
    const a = left.destination ?? left.source;
    const b = right.destination ?? right.source;
    return windowsPathKey(a).localeCompare(windowsPathKey(b));
  });
  for (const change of actual) {
    for (const candidate of [change.source, change.destination].filter(Boolean)) {
      resolveWithinRepo(repoRoot, candidate);
    }
  }
  const paths = [...new Set(actual.flatMap((item) => [item.source, item.destination].filter(Boolean)))]
    .sort((left, right) => windowsPathKey(left).localeCompare(windowsPathKey(right)));
  return { base_sha: baseSha, changes: actual, paths, evidence_digest: sha256(actual) };
}

export function assertActualChangesAllowed({ repoRoot, baseSha, grant, exec = execFileSync }) {
  const evidence = deriveActualChanges(repoRoot, baseSha, { exec });
  assertChangedPathsAllowed(evidence.changes, grant);
  return evidence;
}

export function changedPathsSince(beforeEvidence, afterEvidence) {
  const before = new Set(beforeEvidence.paths.map(windowsPathKey));
  return afterEvidence.paths.filter((item) => !before.has(windowsPathKey(item)));
}
