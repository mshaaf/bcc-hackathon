// Minimal Chrome DevTools driver shared by the browser checks. Each Browser is an independent headless Chrome with its own profile.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class Browser {
  constructor(name, port, out = ".") { this.out = out; this.name = name; this.port = port; this.nextId = 0; this.pending = new Map(); this.handlers = new Map(); this.logs = []; }
  async start() {
    this.proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${this.port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), `cdp-${this.name}-`))}`, "--disable-gpu", "--no-first-run", "about:blank"], { stdio: "ignore" });
    for (let i = 0; i < 80; i++) { try { await fetch(`http://127.0.0.1:${this.port}/json/version`); break; } catch { await sleep(200); } }
    const targets = await (await fetch(`http://127.0.0.1:${this.port}/json`)).json();
    this.ws = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
    await new Promise(resolve => this.ws.addEventListener("open", resolve));
    this.ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
      } else if (message.method === "Runtime.exceptionThrown") this.logs.push(`exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`);
      else if (message.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(message.params.type)) this.logs.push(`console.${message.params.type}: ${message.params.args.map(arg => arg.value ?? arg.description).join(" ")}`);
      else this.handlers.get(message.method)?.(message.params);
    });
    await this.send("Runtime.enable"); await this.send("Page.enable");
    return this;
  }
  send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++this.nextId; this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async ev(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed");
    return result.result.value;
  }
  async waitFor(expression, ms = 8000) {
    const start = Date.now();
    while (Date.now() - start < ms) { try { if (await this.ev(expression)) return Date.now() - start; } catch { /* page not ready */ } await sleep(60); }
    return null;
  }
  async goto(url) { await this.send("Page.navigate", { url }); await sleep(300); await this.waitFor(`document.readyState === "complete"`, 15000); }
  async type(selector, text, replace = true) {
    await this.ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); ${replace ? "e.select?.();" : ""} })()`);
    await this.send("Input.insertText", { text });
  }
  async press(name, { ctrl = false } = {}) {
    const code = name === "Enter" ? 13 : name === "Escape" ? 27 : name === "Tab" ? 9 : 0;
    const base = { key: name, code: name, windowsVirtualKeyCode: code, modifiers: ctrl ? 2 : 0 };
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", ...base, ...(name === "Enter" ? { text: "\r" } : {}) });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  }
  click(selector) { return this.ev(`document.querySelector(${JSON.stringify(selector)}).click()`); }
  q(selector, prop = "textContent") { return this.ev(`document.querySelector(${JSON.stringify(selector)})?.${prop} ?? null`); }
  count(selector) { return this.ev(`document.querySelectorAll(${JSON.stringify(selector)}).length`); }
  async shot(name) { writeFileSync(join(this.out, `${name}.png`), Buffer.from((await this.send("Page.captureScreenshot", { format: "png" })).data, "base64")); }
  viewport(width, height, mobile = false) { return Promise.all([this.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile }), this.send("Emulation.setTouchEmulationEnabled", { enabled: mobile })]); }
  userId() { return this.ev(`(() => { const key = Object.keys(localStorage).find(k => /^sb-.*-auth-token$/.test(k)); return key ? JSON.parse(localStorage[key]).user?.id ?? null : null; })()`); }
  close() { try { this.ws.close(); } catch { /* ignore */ } this.proc.kill(); }
}

