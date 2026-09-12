import { EventEmitter } from "node:events";
import { spawn as nodeSpawn } from "node:child_process";
import { assertNoSecretsDeep, redactSecrets, sanitizeForLog } from "../workflow/secrets.mjs";
import { assertExactModel, assertNoFallback } from "./config.mjs";

const DEFAULT_CLIENT_INFO = Object.freeze({
  name: "threethai-night-worker",
  title: "Three Thai Night Worker",
  version: "0.1.0",
});

const MAX_JSON_LINE_BYTES = 2 * 1024 * 1024;
const MAX_DIAGNOSTIC_BYTES = 4_000;
const LIFECYCLE_METHOD_PATTERN = /^(?:thread|turn|review)\//i;
const THREAD_SANDBOXES = new Set(["workspace-write", "read-only"]);
const TURN_SANDBOX_TYPES = new Set(["workspaceWrite", "readOnly"]);

function idKey(id) { return `${typeof id}:${String(id)}`; }

function safeText(value) {
  let text;
  try {
    const sanitized = sanitizeForLog(value);
    text = typeof sanitized === "string" ? sanitized : JSON.stringify(sanitized);
  } catch {
    text = String(value);
  }
  return redactSecrets(text).slice(0, MAX_DIAGNOSTIC_BYTES);
}

function isStream(value) { return value && typeof value.on === "function"; }

function assertThreadSandbox(value) {
  if (value !== undefined && !THREAD_SANDBOXES.has(value)) {
    throw new Error("Thread sandbox must be workspace-write or read-only.");
  }
}

function assertThreadId(value) {
  if (typeof value !== "string" || value.length === 0) throw new Error("threadId is required.");
}

function assertTurnSandboxPolicy(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).length !== 1 || !TURN_SANDBOX_TYPES.has(value.type)) {
    throw new Error("turn/start sandboxPolicy must be {type: workspaceWrite} or {type: readOnly}.");
  }
}

export class AppServerRpcError extends Error {
  constructor(message, { code, data } = {}) {
    super(redactSecrets(message));
    this.name = "AppServerRpcError";
    this.code = code;
    this.data = data === undefined ? undefined : sanitizeForLog(data);
  }
}

export class AppServerClient extends EventEmitter {
  constructor({
    child = null,
    transport = null,
    input = null,
    output = null,
    stderr = null,
    spawnProcess = nodeSpawn,
    command = "codex",
    args = ["app-server"],
    cwd,
    env,
    clientInfo = DEFAULT_CLIENT_INFO,
    capabilities = { experimentalApi: true },
    onNotification,
    onDiagnostic,
    requestTimeoutMs = 0,
  } = {}) {
    super();
    if (typeof command !== "string" || command.trim().length === 0
      || /(?:^|[\\/\s_-])exec(?:$|[\\/\s_-])/i.test(command)
      || !Array.isArray(args)
      || args.some((arg) => /(?:^|[-_\s/])exec(?:$|[-_\s/])/i.test(String(arg)))) {
      throw new Error("App Server client accepts only the app-server command.");
    }
    if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 0) {
      throw new Error("requestTimeoutMs must be a non-negative integer.");
    }
    this.child = child;
    this.transport = transport;
    this.input = input ?? child?.stdout ?? null;
    this.output = output ?? child?.stdin ?? null;
    this.stderr = stderr ?? child?.stderr ?? null;
    this.spawn_process = spawnProcess;
    this.command = command;
    this.args = [...args];
    this.cwd = cwd;
    this.env = env;
    this.client_info = { ...DEFAULT_CLIENT_INFO, ...clientInfo };
    this.capabilities = sanitizeForLog(capabilities);
    this.request_timeout_ms = requestTimeoutMs;
    this.on_notification = onNotification;
    this.on_diagnostic = onDiagnostic;
    this.pending = new Map();
    this.next_id = 1;
    this.line_buffer = "";
    this.closed = false;
    this.connected = false;
    this.initialization_started = false;
    this.initialized = false;
    this.connection_state = "NEW";
    this.connect_promise = null;
    this.close_promise = null;
    this.unsubscribe_transport = [];
  }

  get isInitialized() { return this.initialized; }
  get connectionState() { return this.connection_state; }

  async connect() {
    if (this.initialized) return this;
    if (this.closed) {
      if (this.connection_state === "FAILED") {
        throw new Error("App Server client initialization failed; create a new client to retry.");
      }
      throw new Error("App Server client is closed.");
    }
    if (this.connect_promise) return this.connect_promise;
    this.connect_promise = this.#connectAndInitialize();
    try {
      await this.connect_promise;
      return this;
    } catch (error) {
      this.connect_promise = null;
      throw error;
    }
  }

  start() { return this.connect(); }

  async #connectAndInitialize() {
    this.connection_state = "CONNECTING";
    try {
      this.#attachTransport();
      if (!this.child && !this.transport && !this.input && !this.output) {
        this.child = this.spawn_process(this.command, this.args, {
          cwd: this.cwd,
          env: this.env,
          stdio: ["pipe", "pipe", "pipe"],
          windowsHide: true,
        });
        this.input = this.child.stdout;
        this.output = this.child.stdin;
        this.stderr = this.child.stderr;
        this.#attachProcess(this.child);
        this.#attachStreamInputs();
      }
      if (!this.initialization_started) {
        this.initialization_started = true;
        await this.#sendRequest("initialize", {
          clientInfo: this.client_info,
          capabilities: this.capabilities,
        }, { beforeHandshake: true });
        this.#write({ method: "initialized", params: {} });
        this.initialized = true;
        this.connected = true;
      }
      if (!this.initialized) throw new Error("App Server connection is not initialized.");
      this.connection_state = "READY";
    } catch (error) {
      this.initialized = false;
      this.connected = false;
      this.connection_state = "FAILED";
      if (!this.closed) this.#handleExit(error);
      throw error;
    }
  }

  #attachTransport() {
    if (!this.transport) {
      this.#attachProcess(this.child);
      this.#attachStreamInputs();
      return;
    }
    if (typeof this.transport.onMessage === "function") {
      const unsubscribe = this.transport.onMessage((message) => this.#handleMessage(message));
      if (typeof unsubscribe === "function") this.unsubscribe_transport.push(unsubscribe);
    }
    if (typeof this.transport.onDiagnostic === "function") {
      const unsubscribe = this.transport.onDiagnostic((message) => this.#diagnostic(message));
      if (typeof unsubscribe === "function") this.unsubscribe_transport.push(unsubscribe);
    }
    for (const event of ["close", "exit", "error"]) {
      if (typeof this.transport.on === "function") this.transport.on(event, (value) => this.#handleExit(value));
    }
  }

  #attachProcess(child) {
    if (!child || typeof child.on !== "function") return;
    child.on("error", (error) => this.#handleExit(error));
    child.on("exit", (code, signal) => this.#handleExit({ code, signal }));
    child.on("close", (code, signal) => this.#handleExit({ code, signal }));
  }

  #attachStreamInputs() {
    if (isStream(this.input)) {
      this.input.on("data", (chunk) => this.#handleData(chunk));
      this.input.on("error", (error) => this.#handleExit(error));
      this.input.on("end", () => this.#handleExit({ code: 0 }));
    }
    if (isStream(this.stderr)) {
      this.stderr.on("data", (chunk) => this.#diagnostic(chunk));
      this.stderr.on("error", (error) => this.#diagnostic(error));
    }
  }

  #handleData(chunk) {
    this.line_buffer += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    if (Buffer.byteLength(this.line_buffer, "utf8") > MAX_JSON_LINE_BYTES) {
      this.#diagnostic("App Server JSONL message exceeded the size limit.");
      this.line_buffer = "";
      return;
    }
    let newlineIndex = this.line_buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = this.line_buffer.slice(0, newlineIndex).replace(/\r$/, "");
      this.line_buffer = this.line_buffer.slice(newlineIndex + 1);
      if (line.trim().length > 0) this.#handleMessage(line);
      newlineIndex = this.line_buffer.indexOf("\n");
    }
  }

  #handleMessage(message) {
    let parsed = message;
    if (typeof message === "string" || Buffer.isBuffer(message)) {
      try { parsed = JSON.parse(Buffer.isBuffer(message) ? message.toString("utf8") : message); } catch {
        this.#diagnostic(`Invalid App Server JSONL message: ${String(message).slice(0, 500)}`);
        return;
      }
    }
    if (!parsed || typeof parsed !== "object") {
      this.#diagnostic("App Server returned a non-object JSONL message.");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(parsed, "id")
      && (Object.prototype.hasOwnProperty.call(parsed, "result") || Object.prototype.hasOwnProperty.call(parsed, "error"))) {
      const pending = this.pending.get(idKey(parsed.id));
      if (!pending) {
        this.#diagnostic({ message: "Unmatched App Server response.", id: parsed.id });
        return;
      }
      this.pending.delete(idKey(parsed.id));
      if (pending.timer) clearTimeout(pending.timer);
      if (parsed.error) {
        pending.reject(new AppServerRpcError(
          `App Server request failed: ${parsed.error.message ?? "unknown error"}`,
          { code: parsed.error.code, data: parsed.error.data },
        ));
      } else pending.resolve(parsed.result);
      return;
    }
    if (typeof parsed.method === "string") {
      const notification = { method: parsed.method, params: parsed.params };
      this.emit("notification", notification);
      this.emit(parsed.method, parsed.params);
      try { this.on_notification?.(notification); } catch (error) { this.#diagnostic(error); }
      return;
    }
    this.#diagnostic("App Server returned an unrecognized JSONL message.");
  }

  #write(message) {
    const line = `${JSON.stringify(message)}\n`;
    if (this.transport && typeof this.transport.send === "function") {
      this.transport.send(line);
      return;
    }
    if (!this.output || typeof this.output.write !== "function") throw new Error("App Server output is unavailable.");
    this.output.write(line);
  }

  #sendRequest(method, params, { beforeHandshake = false } = {}) {
    if (this.closed) return Promise.reject(new Error("App Server client is closed."));
    if (!beforeHandshake && !this.initialized) return Promise.reject(new Error("App Server client is not initialized."));
    const id = this.next_id;
    this.next_id += 1;
    return new Promise((resolve, reject) => {
      const pending = { resolve, reject, timer: null };
      if (this.request_timeout_ms > 0) {
        pending.timer = setTimeout(() => {
          this.pending.delete(idKey(id));
          reject(new Error(`App Server request timed out: ${method}`));
        }, this.request_timeout_ms);
      }
      this.pending.set(idKey(id), pending);
      try {
        this.#write({ id, method, params });
      } catch (error) {
        this.pending.delete(idKey(id));
        if (pending.timer) clearTimeout(pending.timer);
        reject(error);
      }
    });
  }

  request(method, params = {}) {
    if (typeof method !== "string" || method.length === 0) throw new Error("App Server method is required.");
    if (LIFECYCLE_METHOD_PATTERN.test(method)) {
      throw new Error(`Use a validated typed client method for lifecycle RPC ${method}.`);
    }
    return this.#request(method, params);
  }

  #request(method, params = {}) {
    if (/(?:^|[\\/\s:_-])exec(?:$|[\\/\s:_-])/i.test(method)) {
      throw new Error("Codex exec is not an App Server worker mechanism.");
    }
    if (params && typeof params === "object" && !Array.isArray(params) && params.model !== undefined) {
      assertExactModel(params.model, `${method} model`);
    }
    assertNoSecretsDeep(params, `App Server request ${method}`);
    assertNoFallback({ method, params }, "App Server request");
    return this.#sendRequest(method, params);
  }

  modelList(params = {}) { return this.#request("model/list", params); }

  threadStart(params = {}) {
    if (!params || typeof params !== "object" || Array.isArray(params)) throw new Error("thread/start parameters must be an object.");
    if (params.ephemeral !== undefined && params.ephemeral !== false) throw new Error("Night Worker threads cannot be ephemeral.");
    if (params.allowProviderModelFallback === true) throw new Error("Provider model fallback is forbidden.");
    for (const field of ["fork", "parentThreadId", "parent_thread_id", "subagent", "subagents"]) {
      if (params[field]) throw new Error(`Night Worker thread/start forbids ${field}.`);
    }
    assertThreadSandbox(params.sandbox);
    return this.#request("thread/start", params);
  }

  turnStart(params) {
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      throw new Error("turn/start parameters must be an object.");
    }
    assertThreadId(params.threadId ?? params.thread_id);
    assertTurnSandboxPolicy(params.sandboxPolicy ?? params.sandbox_policy);
    return this.#request("turn/start", params);
  }

  threadRead(threadId, options = {}) {
    if (threadId && typeof threadId === "object") {
      assertThreadId(threadId.threadId ?? threadId.thread_id);
      return this.#request("thread/read", threadId);
    }
    assertThreadId(threadId);
    return this.#request("thread/read", { threadId, ...options });
  }

  threadResume(threadId, params = {}) {
    assertThreadId(threadId);
    if (!params || typeof params !== "object" || Array.isArray(params)) throw new Error("thread/resume parameters must be an object.");
    assertThreadSandbox(params.sandbox);
    return this.#request("thread/resume", { threadId, ...params });
  }

  #diagnostic(value) {
    const diagnostic = safeText(value);
    this.emit("diagnostic", diagnostic);
    try { this.on_diagnostic?.(diagnostic); } catch {}
  }

  #handleExit(reason) {
    if (this.closed) return;
    this.closed = true;
    this.connected = false;
    if (this.connection_state !== "FAILED") this.connection_state = "CLOSED";
    const detail = safeText(reason);
    const error = new Error(`App Server connection closed${detail ? `: ${detail}` : "."}`);
    for (const pending of this.pending.values()) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    this.emit("exit", { reason: detail });
  }

  async close({ kill = true } = {}) {
    if (this.close_promise) return this.close_promise;
    this.close_promise = (async () => {
      for (const unsubscribe of this.unsubscribe_transport.splice(0)) {
        try { unsubscribe(); } catch {}
      }
      if (this.output && typeof this.output.end === "function") {
        try { this.output.end(); } catch {}
      }
      if (kill && this.child && typeof this.child.kill === "function") {
        try { this.child.kill(); } catch {}
      }
      this.#handleExit({ code: 0, closedByClient: true });
    })();
    return this.close_promise;
  }
}

export async function connectAppServer(options) {
  const client = new AppServerClient(options);
  await client.connect();
  return client;
}

export const startAppServerClient = connectAppServer;
