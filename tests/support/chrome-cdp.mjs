/**
 * A minimal Chrome/DevTools-Protocol client for browser checks, with no dependency
 * and no browser download.
 *
 * Why not Playwright: nothing here needs it — one page, real clicks, DOM reads —
 * and this machine's link has shown it can take 150 s for 27 MB. A browser download
 * would make the suite unmaintainable on the host that runs it, and the driver below
 * is smaller than the config file it would replace. Why not Computer Use: window
 * inspection on Windows requires a signed UIAccess worker, and the published one is
 * unsigned — that gate is not bypassed here.
 *
 * What it buys is the layer no other test in this repo reaches: React has hydrated,
 * the router and the proxy have both run, and a click was delivered by the browser,
 * not by a call into a component.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

/** The installed browser to drive, or null. Chromium-bundled runners are absent here. */
export function findBrowser() {
  if (process.env.BROWSER_PATH && existsSync(process.env.BROWSER_PATH)) return process.env.BROWSER_PATH;
  return CANDIDATES.find((p) => existsSync(p)) ?? null;
}

export function freePort() {
  return new Promise((resolve, reject) => {
    // Ephemeral by construction: two runs on one machine must not collide.
    import("node:net").then(({ createServer }) => {
      const s = createServer();
      s.on("error", reject);
      s.listen(0, "127.0.0.1", () => {
        const { port } = s.address();
        s.close(() => resolve(port));
      });
    });
  });
}

export class Browser {
  #ws; #id = 0; #pending = new Map(); #events = []; #spawnError = null;

  /**
   * Deliberately lazy: the debugging port has to be allocated before the browser is
   * launched, and that needs an await. A constructor that spawned immediately let one
   * caller forget the port and hand Chrome `--remote-debugging-port=undefined`,
   * which showed as "no CDP page target" after five visible, useless windows.
   */
  constructor({ executable, profile, args = [], headless = process.env.BROWSER_HEADFUL !== "1" }) {
    if (!executable) throw new Error("Browser needs an executable; findBrowser() returned none");
    this.executable = executable;
    this.profile = profile ?? join(tmpdir(), `qwen-browser-check-${process.pid}-${Math.random().toString(36).slice(2)}`);
    this.args = args;
    this.headless = headless;
  }

  async connect(timeoutMs = 20_000) {
    this.port = await freePort();
    rmSync(this.profile, { recursive: true, force: true });
    mkdirSync(this.profile, { recursive: true });
    this.child = spawn(this.executable, [
      ...(this.headless ? ["--headless=new"] : []),
      `--user-data-dir=${this.profile}`,
      `--remote-debugging-port=${this.port}`,
      "--no-first-run", "--no-default-browser-check", "--disable-gpu",
      // A test instance must not exhaust commit memory on a host already running
      // the developer's own browser, and the translate bubble is not under test.
      "--renderer-process-limit=2", "--disable-extensions",
      "--disable-background-networking", "--disable-component-update",
      "--disable-features=Translate", "--metrics-recording-only",
      ...this.args, "about:blank",
    ], { stdio: "ignore" });
    this.child.on("error", (e) => { this.#spawnError = e; });
    this.child.unref();

    const endpoint = `http://127.0.0.1:${this.port}/json/list`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.#spawnError) throw new Error(`browser failed to start: ${this.#spawnError.message}`);
      let page = null;
      try {
        const list = await (await fetch(endpoint, { signal: AbortSignal.timeout(2000) })).json();
        page = list.find((t) => t.type === "page");
      } catch { /* not listening yet */ }
      if (page) {
        this.#ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => {
          this.#ws.onopen = res;
          this.#ws.onerror = () => rej(new Error("CDP websocket failed"));
        });
        this.#ws.addEventListener("message", (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.id && this.#pending.has(msg.id)) {
            const { res, rej } = this.#pending.get(msg.id);
            this.#pending.delete(msg.id);
            if (msg.error) rej(new Error(JSON.stringify(msg.error)));
            else res(msg.result);
          } else if (msg.method) {
            this.#events.push(msg);
          }
        });
        return this;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    this.close();
    throw new Error(`browser exposed no CDP page target on port ${this.port}`);
  }

  cmd(method, params = {}) {
    const id = ++this.#id;
    return new Promise((res, rej) => {
      this.#pending.set(id, { res, rej });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /** CDP events seen so far, optionally filtered by method. */
  events(method) { return method ? this.#events.filter((e) => e.method === method) : this.#events; }

  async navigate(url) {
    this.#origin = new URL(url).origin;
    await this.cmd("Page.enable");
    await this.cmd("Page.navigate", { url });
    if (!await this.waitFor('document.readyState === "complete"', 20_000)) {
      throw new Error(`page never reached complete: ${url}`);
    }
  }

  async evaluate(expression) {
    const r = await this.cmd("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      throw new Error("page eval threw: " + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
    }
    return r.result.value;
  }

  async waitFor(expression, ms = 10_000) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      try { if (await this.evaluate(`!!(${expression})`)) return true; } catch { /* pre-hydration */ }
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }

  /** The origin reset() must clear storage for; set by navigate(). */
  #origin = null;

  /**
   * Drop what a previous test could have left behind: the preference cookie and
   * local/session storage. State isolation, not a fresh process, is what these
   * tests need — see the note in tests/browser-language-switching.mjs.
   */
  async reset() {
    await this.cmd("Network.enable");
    await this.cmd("Network.clearBrowserCookies");
    if (this.#origin) {
      await this.cmd("Storage.clearDataForOrigin", {
        origin: this.#origin, storageTypes: "local_storage,session_storage",
      });
    }
  }

  /** Centre of the first visible element matching selector (and containing text). */
  async centre(selector, contains) {
    return this.evaluate(`(() => {
      const all = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const el = ${contains ? `all.find(e => e.textContent.trim().includes(${JSON.stringify(contains)}))` : "all[0]"};
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: el.textContent.trim().slice(0, 70) };
    })()`);
  }

  /** Is the element itself (or one of its own children) what the browser would hit here? */
  async #hittable(selector, contains, x, y) {
    return this.evaluate(`(() => {
      const all = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const el = ${contains ? `all.find(e => e.textContent.trim().includes(${JSON.stringify(contains)}))` : "all[0]"};
      if (!el) return false;
      const hit = document.elementFromPoint(${x}, ${y});
      return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
    })()`);
  }

  /**
   * Poll for a laid-out, clickable box before the one click under test.
   *
   * "Laid out" alone is not enough. A drawer entry animation reports a real
   * rectangle while the panel is still moving, so the click can land on the
   * backdrop instead of the item, and the resulting no-op looks exactly like the
   * defect under test. This waits for the box to hold still across two reads and
   * for the browser's own hit test to agree that this point belongs to the
   * element, which is the precondition the single click is meant to be measured on.
   */
  async waitForCentre(selector, contains, ms = 5000) {
    const deadline = Date.now() + ms;
    let previous = null;
    while (Date.now() < deadline) {
      const box = await this.centre(selector, contains);
      const settled = box && previous && Math.abs(box.x - previous.x) < 0.5 && Math.abs(box.y - previous.y) < 0.5;
      previous = box;
      if (settled && await this.#hittable(selector, contains, box.x, box.y)) return box;
      await new Promise((r) => setTimeout(r, 60));
    }
    return null;
  }

  /** One browser-generated left click: pressed then released at a point. */
  async clickAt(x, y) {
    for (const type of ["mousePressed", "mouseReleased"]) {
      await this.cmd("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
    }
  }

  /**
   * One click, on a box that is actually on screen. Going through waitForCentre is
   * what keeps "did one click work?" honest: measuring too early returns null or a
   * stale position, and the resulting no-op looks exactly like the defect under test.
   */
  async click(selector, contains) {
    const c = await this.waitForCentre(selector, contains);
    if (!c) return false;
    await this.clickAt(c.x, c.y);
    return true;
  }

  get url() { return this.evaluate("location.href"); }
  get path() { return this.evaluate("location.pathname"); }

  /**
   * Kill the browser, then delete the profile without blocking.
   *
   * Two traps this avoids: throwing from cleanup surfaces as a filesystem error in a
   * test whose assertions passed (close() runs in finally), and a synchronous wait
   * for Chrome's children to release the directory can never succeed, because the
   * spin blocks the very event loop they need to exit on. So: try once, and if the
   * directory is still busy retry asynchronously and let go — a leftover folder under
   * %TEMP% is litter, not a failure.
   */
  close() {
    try { this.#ws?.close(); } catch { /* already gone */ }
    // Ask Chrome to exit on its own first: killing only the parent left renderer
    // and gpu children running, and the next test started against them.
    try { this.cmd("Browser.close").catch(() => {}); } catch { /* gone */ }
    try { this.child.kill(); } catch { /* already gone */ }
    try { rmSync(this.profile, { recursive: true, force: true }); } catch { /* still held */ }
    let tries = 0;
    const retry = () => {
      if (tries++ > 20 || !existsSync(this.profile)) return;
      try { rmSync(this.profile, { recursive: true, force: true }); } catch { /* still held */ }
      if (existsSync(this.profile)) setTimeout(retry, 500);
    };
    setTimeout(retry, 500).unref();
  }
}
