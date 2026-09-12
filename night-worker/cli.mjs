#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { sanitizeForLog } from "../workflow/secrets.mjs";
import { NightWorkerService } from "./service.mjs";
import { defaultRuntimeStorePath, submitBatch } from "./submission.mjs";
import { RuntimeStore } from "./runtime-store.mjs";

function output(value) {
  process.stdout.write(`${JSON.stringify(sanitizeForLog(value), null, 2)}\n`);
}

function valueAfter(args, index, name) {
  if (index + 1 >= args.length || args[index + 1].startsWith("--")) throw new Error(`${name} requires a value.`);
  return args[index + 1];
}

function parseOptions(args) {
  const options = { tasks: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--repo":
      case "--repository-root":
      case "--repositoryRoot":
        options.repositoryRoot = valueAfter(args, index, arg);
        index += 1;
        break;
      case "--store":
      case "--store-path":
        options.storePath = valueAfter(args, index, arg);
        index += 1;
        break;
      case "--task":
        options.tasks.push(valueAfter(args, index, arg));
        index += 1;
        break;
      case "--tasks-json": {
        const serialized = valueAfter(args, index, arg);
        let parsed;
        try { parsed = JSON.parse(serialized); } catch { throw new Error("--tasks-json must be valid JSON."); }
        if (!Array.isArray(parsed)) throw new Error("--tasks-json must contain an array.");
        options.tasks.push(...parsed);
        index += 1;
        break;
      }
      case "--reply-json": {
        const serialized = valueAfter(args, index, arg);
        try { options.replyMetadata = JSON.parse(serialized); } catch { throw new Error("--reply-json must be valid JSON."); }
        index += 1;
        break;
      }
      case "--once":
        options.once = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function requireRepositoryRoot(options) {
  if (typeof options.repositoryRoot !== "string" || options.repositoryRoot.length === 0) {
    throw new Error("--repo is required.");
  }
  return path.resolve(options.repositoryRoot);
}

function storeFor(options, { requireRepo = true } = {}) {
  const repositoryRoot = requireRepo ? requireRepositoryRoot(options) : options.repositoryRoot;
  const internalPath = defaultRuntimeStorePath(repositoryRoot);
  const filePath = options.storePath ? path.resolve(options.storePath) : internalPath;
  const relative = path.relative(internalPath, filePath);
  if (relative !== "") throw new Error("--store must use the repository's internal .night-worker/runtime.json path.");
  const internalDirectory = path.dirname(internalPath);
  if (fs.existsSync(internalDirectory) && path.relative(internalDirectory, fs.realpathSync(internalDirectory)) !== "") {
    throw new Error("Internal runtime directory resolves outside the repository.");
  }
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
    throw new Error("Internal runtime state cannot be a symbolic link.");
  }
  return new RuntimeStore(internalPath);
}

export function usage() {
  return [
    "Usage:",
    "  node night-worker/cli.mjs submit --repo PATH --task TEXT [--task TEXT ...] [--reply-json JSON] [--store FILE]",
    "  node night-worker/cli.mjs status --repo PATH [--store FILE]",
    "  node night-worker/cli.mjs serve --repo PATH [--store FILE] [--once]",
  ].join("\n");
}

export async function runServe({ store, handler, once = false, signal } = {}) {
  if (!store || typeof store.snapshot !== "function") throw new Error("serve requires a RuntimeStore.");
  if (typeof handler !== "function") {
    const state = store.snapshot();
    const pending = state.batches.some((batch) => ["QUEUED", "CLAIMED", "RUNNING"].includes(batch.state));
    if (pending) throw new Error("serve requires an injected internal workload handler for queued work.");
    return { status: "IDLE", active_batch_id: state.active_batch_id, queued_batches: 0 };
  }
  const service = new NightWorkerService({ store, handler });
  return service.serve({ signal, once });
}

export async function runCli(argv = process.argv.slice(2), { store, handler } = {}) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    output({ usage: usage() });
    return;
  }
  const options = parseOptions(rest);
  if (options.help) {
    output({ usage: usage() });
    return;
  }
  switch (command) {
    case "submit": {
      const repositoryRoot = requireRepositoryRoot(options);
      if (options.tasks.length === 0) throw new Error("submit requires at least one --task or --tasks-json.");
      storeFor(options);
      output(submitBatch({
        repositoryRoot,
        tasks: options.tasks,
        replyMetadata: options.replyMetadata,
      }));
      return;
    }
    case "status": {
      const runtimeStore = store ?? storeFor(options);
      output(runtimeStore.snapshot());
      return;
    }
    case "serve": {
      const runtimeStore = store ?? storeFor(options);
      output(await runServe({ store: runtimeStore, handler, once: options.once }));
      return;
    }
    default:
      throw new Error(`${usage()}\nUnknown command: ${command}`);
  }
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`
  || process.argv[1]?.endsWith("/night-worker/cli.mjs")
  || process.argv[1]?.endsWith("\\night-worker\\cli.mjs")) {
  try {
    await runCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export { parseOptions };
