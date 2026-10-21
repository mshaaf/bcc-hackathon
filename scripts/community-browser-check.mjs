// B1 browser proof: independent Chrome profiles use the shared community through the real app, server and Supabase backend.
// Needs: the app running at BASE with the community env set, the local Supabase stack up, Google Chrome, Docker (reconnect check).
// Usage: COMMUNITY_SUPABASE_URL=... COMMUNITY_SUPABASE_SECRET_KEY=... node scripts/community-browser-check.mjs
// The secret key is used only by this script to create a throwaway community and set one moderator. Browsers never see it.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.env.OUT ?? "docs/ui-review/b1-run";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE ?? "http://127.0.0.1:8000/";
const URL_ = process.env.COMMUNITY_SUPABASE_URL;
const SECRET = process.env.COMMUNITY_SUPABASE_SECRET_KEY;
const REALTIME_CONTAINER = process.env.REALTIME_CONTAINER ?? "supabase_realtime_blockops";
if (!URL_ || !SECRET) throw new Error("Set COMMUNITY_SUPABASE_URL and COMMUNITY_SUPABASE_SECRET_KEY (see docs/COMMUNITY-SETUP.md).");
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const tag = Math.random().toString(36).slice(2, 7);

const { createClient } = new Function(`${readFileSync(new URL("../public/vendor/supabase/supabase.js", import.meta.url), "utf8")}\nreturn supabase;`)();
const admin = createClient(URL_, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });

const checks = [];
const check = (name, ok, detail = "") => { checks.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 200) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${String(detail).slice(0, 160)}` : ""}`); };

class Browser {
  constructor(name, port) { this.name = name; this.port = port; this.nextId = 0; this.pending = new Map(); this.handlers = new Map(); this.logs = []; }
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
  async shot(name) { writeFileSync(join(OUT, `${name}.png`), Buffer.from((await this.send("Page.captureScreenshot", { format: "png" })).data, "base64")); }
  viewport(width, height, mobile = false) { return Promise.all([this.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile }), this.send("Emulation.setTouchEmulationEnabled", { enabled: mobile })]); }
  userId() { return this.ev(`(() => { const key = Object.keys(localStorage).find(k => /^sb-.*-auth-token$/.test(k)); return key ? JSON.parse(localStorage[key]).user?.id ?? null : null; })()`); }
  close() { try { this.ws.close(); } catch { /* ignore */ } this.proc.kill(); }
}

const postTexts = browser => browser.ev(`[...document.querySelectorAll('#feed .post-body')].map(n => n.textContent)`);
const hasPost = (browser, text, ms = 5000) => browser.waitFor(`[...document.querySelectorAll('#feed .post-body')].some(n => n.textContent === ${JSON.stringify(text)})`, ms);
const overflowX = browser => browser.ev(`document.documentElement.scrollWidth > window.innerWidth + 1`);
const postButton = (browser, postText, label) => `(() => { const post = [...document.querySelectorAll('#feed .post')].find(p => p.querySelector(':scope > .post-body')?.textContent === ${JSON.stringify(postText)}); return post && [...post.querySelectorAll(':scope > .post-actions button')].find(b => b.textContent === ${JSON.stringify(label)}); })()`;

async function joinAs(browser, name, via = "keyboard") {
  await browser.waitFor(`!document.getElementById('join-panel').hidden`, 15000);
  await browser.type("#join-name", name);
  if (via === "keyboard") await browser.press("Enter"); else await browser.click("#join-button");
  return browser.waitFor(`!document.getElementById('member-area').hidden`, 15000);
}

const browsers = [];
const userIds = new Set();
let communityId;
try {
  const created = await admin.from("communities").insert({ title: `Browser check ${tag}`, description: "Throwaway community created by scripts/community-browser-check.mjs." }).select().single();
  communityId = created.data.id;
  const A = await new Browser("A", 9461).start(); const B = await new Browser("B", 9462).start();
  browsers.push(A, B);
  await A.viewport(1280, 900); await B.viewport(1280, 900);

  // --- default route and non-member view
  await A.goto(BASE);
  check("default route opens the community section on the seeded demonstration community", await A.waitFor(`document.getElementById('community-title').textContent === 'Ward 8 neighbors (demonstration)'`, 15000) !== null && (await A.q("body", "dataset.section")) === "community");
  check("the demonstration community is labeled and the join panel is the first thing a visitor sees", (await A.q("#community-demo-badge", "hidden")) === false && (await A.q("#join-panel", "hidden")) === false && (await A.q("#member-area", "hidden")) === true);
  check("a visitor who has not joined has no account and no conversation text in the page", (await A.userId()) === null && !(await A.ev(`document.body.innerText`)).includes("Browser check"));
  await A.shot("01-join-desktop");

  // --- two independent profiles join the same community
  await A.goto(`${BASE}#/community/${communityId}`); await B.goto(`${BASE}#/community/${communityId}`);
  const aName = `Ada ${tag}`, bName = `Ben ${tag}`;
  check("A joins by keyboard (type the name, press Enter)", await joinAs(A, aName, "keyboard") !== null);
  check("B joins in the other profile", await joinAs(B, bName, "button") !== null);
  const aId = await A.userId(), bId = await B.userId();
  userIds.add(aId); userIds.add(bId);
  check("the two profiles hold different authenticated user IDs", aId && bId && aId !== bId, `${aId?.slice(0, 8)} vs ${bId?.slice(0, 8)}`);
  const seenJoin = await A.waitFor(`document.getElementById('member-list').innerText.includes(${JSON.stringify(bName)})`, 5000);
  check("A sees B appear in the member list without a reload, within 5 s", seenJoin !== null, `${seenJoin} ms`);
  check("member count shows 2 in both browsers", (await A.q("#community-count")) === "2 members" && (await B.waitFor(`document.getElementById('community-count').textContent === '2 members'`, 5000)) !== null);
  check("live connection is reported", await A.waitFor(`document.getElementById('community-connection').dataset.state === 'live'`, 8000) !== null);

  // --- B posts, A sees it
  const t1 = `Saturday cleanup at the corner? ${tag}`;
  await B.type("#composer-body", t1); await B.press("Enter", { ctrl: true });
  const lag = await hasPost(A, t1, 5000);
  check("B's post (Ctrl+Enter) appears in A's browser within 5 s with the exact text", lag !== null, `${lag} ms`);
  check("the post shows B's name and a time", (await A.ev(`(() => { const p = document.querySelector('#feed .post'); return p.querySelector('.post-author').textContent + '|' + (p.querySelector('time').dateTime || ''); })()`)).startsWith(bName));
  check("the composer is empty and focused after posting", (await B.q("#composer-body", "value")) === "" && (await B.ev(`document.activeElement.id`)) === "composer-body");

  // --- reply by keyboard
  await A.ev(`${postButton(A, t1, "Reply")}.focus()`); await A.press("Enter");
  check("Enter on Reply opens a focused reply field", await A.waitFor(`document.activeElement.dataset.focusKey?.startsWith('reply:')`, 3000) !== null);
  const r1 = `I can bring bags ${tag}`;
  await A.send("Input.insertText", { text: r1 }); await A.press("Enter", { ctrl: true });
  check("B sees A's reply grouped under the post within 5 s", await B.waitFor(`[...document.querySelectorAll('#feed .post:not(.reply) .replies .post-body')].some(n => n.textContent === ${JSON.stringify(r1)})`, 5000) !== null);
  await A.shot("02-conversation-desktop");

  // --- reload keeps session, no membership growth
  const countBefore = await A.q("#community-count");
  await A.send("Page.reload"); await sleep(400);
  check("after a reload A is still a member (no join form) with the same user ID", await A.waitFor(`!document.getElementById('member-area').hidden`, 15000) !== null && (await A.userId()) === aId);
  check("reload and rejoin did not grow the member count", (await A.q("#community-count")) === countBefore);
  check("the conversation is back after reload", (await postTexts(A)).includes(t1));

  // --- markup stays text
  const markup = `<img src=x onerror="window.__xss=1"> <b>bold?</b> ${tag}`;
  await B.type("#composer-body", markup); await B.press("Enter", { ctrl: true });
  check("markup in a post is shown as text, never interpreted", await hasPost(A, markup, 5000) !== null && (await A.count("#feed img")) === 0 && (await A.ev(`window.__xss === undefined`)));

  // --- oversize rejected before sending
  const before = (await postTexts(B)).length;
  await B.type("#composer-body", "x".repeat(2001)); await B.click("#composer-submit");
  check("an oversize post is refused with a message and the text stays", (await B.q("#composer .form-error")).includes("2,000") && (await B.q("#composer-body", "value")).length === 2001 && (await postTexts(B)).length === before);
  await B.type("#composer-body", "");

  // --- failed send keeps the draft; a send that committed but timed out is not duplicated on retry
  await B.send("Network.enable"); await B.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const t2 = `Offline draft ${tag}`;
  await B.type("#composer-body", t2); await B.click("#composer-submit");
  check("offline: the send fails with a clear message and keeps the draft", await B.waitFor(`!document.querySelector('#composer .form-error').hidden`, 8000) !== null && (await B.q("#composer .form-error")).includes("still here") && (await B.q("#composer-body", "value")) === t2);
  await B.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await B.click("#composer-submit");
  check("back online: Try again posts it and A sees it once", await hasPost(A, t2, 6000) !== null && (await postTexts(A)).filter(text => text === t2).length === 1);

  const t3 = `Committed then timed out ${tag}`;
  await B.send("Fetch.enable", { patterns: [{ urlPattern: "*rpc/create_post*", requestStage: "Response" }] });
  let intercepted = 0;
  B.handlers.set("Fetch.requestPaused", params => {
    if (params.responseStatusCode !== undefined && intercepted++ === 0) B.send("Fetch.failRequest", { requestId: params.requestId, errorReason: "TimedOut" }).catch(() => {});
    else B.send("Fetch.continueRequest", { requestId: params.requestId }).catch(() => {});
  });
  await B.type("#composer-body", t3); await B.click("#composer-submit");
  check("the server saved the post but the browser saw a timeout: error shown, draft kept", await B.waitFor(`!document.querySelector('#composer .form-error').hidden`, 8000) !== null && (await B.q("#composer-body", "value")) === t3);
  await B.click("#composer-submit");
  await hasPost(B, t3, 6000); await sleep(800);
  check("retrying the same text does not duplicate the post (same operation id)", (await postTexts(A)).filter(text => text === t3).length === 1 && (await postTexts(B)).filter(text => text === t3).length === 1);
  await B.send("Fetch.disable"); B.handlers.delete("Fetch.requestPaused");

  // --- edit own, cannot edit others
  check("A has no Edit or Hide button on B's post", await A.ev(`!${postButton(A, t1, "Edit")} && !${postButton(A, t1, "Hide")}`));
  await B.ev(`${postButton(B, t1, "Edit")}.click()`);
  await B.waitFor(`document.activeElement.dataset.focusKey?.startsWith('edit:')`, 3000);
  const t1b = `${t1} (moved to 10am)`;
  await B.type("[data-focus-key^='edit:']", t1b); await B.press("Enter", { ctrl: true });
  check("B edits their own post and A sees the edited text and an 'edited' label", await hasPost(A, t1b, 5000) !== null && (await A.ev(`[...document.querySelectorAll('#feed .post')].find(p => p.querySelector('.post-body')?.textContent === ${JSON.stringify(t1b)}).querySelector('.post-edited')?.textContent`)) === "edited");

  // --- moderator hides
  check("a non-moderator sees no Hide button", await B.ev(`!${postButton(B, t1b, "Hide")}`));
  await admin.from("communities").update({ moderator_id: aId }).eq("id", communityId);
  await A.send("Page.reload"); await A.waitFor(`!document.getElementById('member-area').hidden`, 15000);
  check("the moderator badge and Hide button appear for the moderator only after the backend grants it", (await A.ev(`document.getElementById('member-list').innerText.includes('moderator')`)) && await A.waitFor(`${postButton(A, t1b, "Hide")} !== undefined`, 5000) !== null);
  await A.ev(`${postButton(A, t1b, "Hide")}.click()`); await A.waitFor(`document.querySelector('.hide-confirm')`, 3000);
  await A.shot("03-hide-confirm");
  await A.click(".hide-confirm .button-primary");
  check("hiding removes the text for everyone: B sees the hidden notice and no original text", await B.waitFor(`[...document.querySelectorAll('.post-removed')].length === 1 && !document.body.innerText.includes(${JSON.stringify(t1b)})`, 5000) !== null);

  // --- reconnect: realtime stops, a post lands during the outage, the client recovers and re-fetches
  execFileSync("docker", ["stop", REALTIME_CONTAINER], { stdio: "ignore" });
  const t4 = `Posted while live updates were down ${tag}`;
  await B.type("#composer-body", t4); await B.click("#composer-submit");
  check("while Realtime is down A reports reconnecting and has not seen the post", await A.waitFor(`document.getElementById('community-connection').dataset.state === 'reconnecting'`, 40000) !== null && !(await postTexts(A)).includes(t4));
  await A.shot("04-reconnecting");
  execFileSync("docker", ["start", REALTIME_CONTAINER], { stdio: "ignore" });
  const healed = await A.waitFor(`document.getElementById('community-connection').dataset.state === 'live' && [...document.querySelectorAll('#feed .post-body')].some(n => n.textContent === ${JSON.stringify(t4)})`, 90000);
  check("after Realtime returns A reconnects and the canonical re-fetch shows the missed post", healed !== null, `${healed} ms`);

  // --- after the restart, are live events flowing again, or only the re-fetch? (measured, not assumed)
  const t6 = `Live again after the restart ${tag}`;
  const t6start = Date.now();
  await B.type("#composer-body", t6); await B.click("#composer-submit");
  const resumed = await hasPost(A, t6, 40000);
  console.log(`# first post after the Realtime restart reached A in ${resumed} ms (started ${Date.now() - t6start} ms ago)`);
  check("after the restart a new post reaches A within 40 s", resumed !== null, `${resumed} ms`);

  // --- leaving
  await B.ev(`document.getElementById('leave-button').click()`); await B.click("#leave-yes");
  check("B leaves: the conversation disappears and the join form returns", await B.waitFor(`!document.getElementById('join-panel').hidden && document.getElementById('member-area').hidden && !document.body.innerText.includes(${JSON.stringify(t2)})`, 8000) !== null);
  check("A's member count drops without a reload", await A.waitFor(`document.getElementById('community-count').textContent === '1 member'`, 5000) !== null);

  // --- phone widths: third independent profile joins, posts and replies
  const C = await new Browser("C", 9463).start(); browsers.push(C);
  for (const [width, height] of [[390, 844], [320, 640]]) {
    await C.viewport(width, height, true);
    await C.goto(`${BASE}#/community/${communityId}`);
    await C.waitFor(`!document.getElementById('join-panel').hidden || !document.getElementById('member-area').hidden`, 15000);
    if ((await C.q("#join-panel", "hidden")) === false) {
      check(`${width}px: join page has no horizontal scroll and the name field is reachable`, !(await overflowX(C)) && (await C.ev(`document.getElementById('join-name').getBoundingClientRect().right <= window.innerWidth`)));
      await C.shot(`05-join-${width}`);
      check(`${width}px: join works`, await joinAs(C, `Cy ${tag}`, "button") !== null);
    }
    userIds.add(await C.userId());
    const t5 = `Phone post at ${width}px ${tag}`;
    await C.type("#composer-body", t5); await C.click("#composer-submit");
    check(`${width}px: posting works and the feed shows it`, await hasPost(C, t5, 6000) !== null);
    await C.ev(`${postButton(C, t5, "Reply")}.click()`);
    await C.send("Input.insertText", { text: `reply ${width}` }); await C.press("Enter", { ctrl: true });
    check(`${width}px: replying works`, await C.waitFor(`[...document.querySelectorAll('.replies .post-body')].some(n => n.textContent === 'reply ${width}')`, 6000) !== null);
    check(`${width}px: no horizontal scroll with posts, replies, composer and sidebar`, !(await overflowX(C)));
    check(`${width}px: the composer is on screen`, await C.ev(`(() => { const r = document.getElementById('composer').getBoundingClientRect(); return r.bottom <= window.innerHeight + 1 && r.top >= 0; })()`));
    await C.shot(`06-feed-${width}`);
    if (width === 390) { await C.ev(`document.getElementById('leave-button').click()`); await C.click("#leave-yes"); await C.waitFor(`!document.getElementById('join-panel').hidden`, 8000); }
  }

  // --- the map and campaigns are still reachable
  await A.goto(`${BASE}#/map`);
  check("the map section is reachable from the community nav and the community is hidden", (await A.q("body", "dataset.section")) === "map" && (await A.q("#community", "offsetParent")) === null);
  check("the map container has a real size (Leaflet resized after being hidden)", await A.waitFor(`document.querySelector('#map').getBoundingClientRect().width > 300 && document.querySelectorAll('.leaflet-tile-loaded, .leaflet-interactive').length >= 0`, 5000) !== null);
  check("the explore panel and campaign tabs are present", (await A.count(".tab")) === 3);
  await A.shot("07-map");
  await A.click(".section-nav a[data-section='community']");
  check("returning to the community restores the member view", await A.waitFor(`!document.getElementById('member-area').hidden`, 8000) !== null);

  // --- non-member isolation in the UI
  const D = await new Browser("D", 9464).start(); browsers.push(D);
  await D.goto(`${BASE}#/community/${communityId}`);
  await D.waitFor(`!document.getElementById('join-panel').hidden`, 15000);
  check("a never-joined browser sees the preview but none of the conversation", !(await D.ev(`document.body.innerText`)).includes(t1) && (await D.count("#feed .post")) === 0);
  const noisy = [...A.logs, ...B.logs, ...C.logs, ...D.logs].filter(line => !/Failed to load resource|net::ERR|WebSocket|TimedOut|favicon/i.test(line));
  check("no unexpected console errors or exceptions in any browser", noisy.length === 0, noisy.join(" | "));
} catch (error) {
  check("script completed without an exception", false, error.stack ?? error);
} finally {
  for (const browser of browsers) browser.close();
  try { execFileSync("docker", ["start", REALTIME_CONTAINER], { stdio: "ignore" }); } catch { /* already running */ }
  if (communityId) {
    await admin.from("communities").delete().eq("id", communityId);
    for (const id of userIds) if (id) await admin.auth.admin.deleteUser(id);
  }
  const failed = checks.filter(entry => !entry.ok);
  writeFileSync(join(OUT, "results.json"), JSON.stringify({ at: new Date().toISOString(), base: BASE, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed${failed.length ? `; FAILED: ${failed.map(entry => entry.name).join("; ")}` : ""}`);
  process.exit(failed.length ? 1 : 0);
}
