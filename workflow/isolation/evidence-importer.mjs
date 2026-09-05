import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { canonicalJson, sha256 } from "../canonical.mjs";
import { pathAllowed, resolveWithinRepo, windowsPathKey } from "../paths.mjs";
import { assertNoSecretValues } from "../secrets.mjs";
import { EvidenceImporter } from "./interfaces.mjs";
import { loadWorkerSecurityPolicy } from "./policy.mjs";
import { projectionPathExcluded } from "./workspace-projector.mjs";

const require = createRequire(import.meta.url);
const { z } = require("zod");
const changeSchema = z.object({
  operation: z.enum(["upsert", "delete"]), path: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable(), content_base64: z.string().nullable(),
  mode: z.enum(["100644", "100755"]).nullable(),
}).strict();
const bundleSchema = z.object({
  schema_version: z.literal("1.0.0"), task_key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  run_id: z.string().uuid(), lease_id: z.string().uuid(), fencing_token: z.number().int().positive(),
  base_sha: z.string().regex(/^[0-9a-f]{40}$/), projection_digest: z.string().regex(/^[0-9a-f]{64}$/),
  changes: z.array(changeSchema), bundle_digest: z.string().regex(/^[0-9a-f]{64}$/),
}).strict();

function digestBytes(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }

function bundleDigest(bundle) {
  const { bundle_digest: _digest, ...payload } = bundle;
  return sha256(canonicalJson(payload));
}

function gitHead(repoRoot) {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8", windowsHide: true }).trim();
}

function assertAuthority(bundle, authority) {
  const exact = bundle.task_key === authority.task_key
    && bundle.run_id === authority.run_id
    && bundle.lease_id === authority.lease_id
    && bundle.fencing_token === authority.fencing_token
    && bundle.base_sha === authority.base_sha
    && bundle.projection_digest === authority.projection_digest
    && authority.lease_active === true;
  if (!exact) throw new Error("Stale lease/fence or cross-worker result bundle rejected.");
}

export class ControlledEvidenceImporter extends EvidenceImporter {
  #authorityProvider;
  #validatedPlans = new WeakMap();

  constructor({ repoRoot, grant, authorityProvider, policy = loadWorkerSecurityPolicy() }) {
    super();
    if (typeof authorityProvider !== "function") throw new Error("Evidence importer requires controller authority provider.");
    this.repoRoot = fs.realpathSync.native(repoRoot);
    this.grant = grant;
    this.policy = policy;
    this.#authorityProvider = authorityProvider;
  }

  plan(input) {
    const bundle = bundleSchema.parse(input);
    if (bundleDigest(bundle) !== bundle.bundle_digest) throw new Error("Untrusted result bundle digest mismatch.");
    const authority = this.#authorityProvider();
    assertAuthority(bundle, authority);
    if (gitHead(this.repoRoot) !== bundle.base_sha) throw new Error("Authoritative head changed before import.");
    const seen = new Set();
    let totalBytes = 0;
    const operations = bundle.changes.map((change) => {
      const key = windowsPathKey(change.path);
      if (seen.has(key)) throw new Error(`Duplicate or case-colliding bundle path: ${change.path}`);
      seen.add(key);
      if (projectionPathExcluded(change.path, this.policy)) throw new Error(`Secret/config path excluded from import: ${change.path}`);
      if (!pathAllowed(change.path, this.grant.write_files, this.grant.write_prefixes)) {
        throw new Error(`Result bundle path is outside authorization: ${change.path}`);
      }
      const target = resolveWithinRepo(this.repoRoot, change.path);
      if (change.operation === "delete") {
        if (change.sha256 !== null || change.content_base64 !== null || change.mode !== null) throw new Error("Malformed delete operation.");
        return Object.freeze({ operation: "delete", path: change.path, target });
      }
      if (change.sha256 === null || change.content_base64 === null || change.mode === null) throw new Error("Malformed upsert operation.");
      const bytes = Buffer.from(change.content_base64, "base64");
      if (bytes.toString("base64") !== change.content_base64) throw new Error("Bundle content is not canonical base64.");
      if (bytes.length > this.policy.projection.max_file_bytes || digestBytes(bytes) !== change.sha256) {
        throw new Error(`Bundle content digest/size mismatch: ${change.path}`);
      }
      totalBytes += bytes.length;
      assertNoSecretValues(bytes.toString("utf8"), `untrusted bundle ${change.path}`);
      return Object.freeze({ operation: "upsert", path: change.path, target, bytes, mode: change.mode });
    });
    if (totalBytes > this.policy.projection.max_bundle_bytes) throw new Error("Result bundle exceeds size limit.");
    const plan = Object.freeze({
      schema_version: "1.0.0", bundle_digest: bundle.bundle_digest,
      authority: Object.freeze({ ...authority }), operation_count: operations.length,
    });
    this.#validatedPlans.set(plan, Object.freeze({
      authority: Object.freeze({ ...authority }), operations: Object.freeze(operations),
    }));
    return plan;
  }

  apply(plan) {
    const validated = this.#validatedPlans.get(plan);
    if (!validated) throw new Error("Evidence import requires an unused controller-validated plan.");
    this.#validatedPlans.delete(plan);
    const current = this.#authorityProvider();
    assertAuthority(validated.authority, current);
    if (gitHead(this.repoRoot) !== current.base_sha) throw new Error("Authoritative head changed before import apply.");
    const operations = validated.operations.map((operation) => Object.freeze({
      ...operation, target: resolveWithinRepo(this.repoRoot, operation.path),
    }));
    for (const operation of operations.filter((item) => item.operation === "upsert")) {
      fs.mkdirSync(path.dirname(operation.target), { recursive: true });
      const target = resolveWithinRepo(this.repoRoot, operation.path);
      const temporary = `${target}.sys-auto-import-${crypto.randomUUID()}`;
      fs.writeFileSync(temporary, operation.bytes, { mode: operation.mode === "100755" ? 0o755 : 0o644, flag: "wx" });
      fs.renameSync(temporary, target);
    }
    for (const operation of operations.filter((item) => item.operation === "delete")) {
      const target = resolveWithinRepo(this.repoRoot, operation.path);
      if (fs.existsSync(target)) fs.rmSync(target, { force: true });
    }
    return Object.freeze({ imported: true, bundle_digest: plan.bundle_digest, changed_paths: operations.map((item) => item.path) });
  }
}
