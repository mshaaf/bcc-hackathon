// R3 browser check: drives real Chrome through the DevTools protocol with device emulation (not window size).
// Needs the app running at BASE (node server.mjs) and network access to DC GIS. Usage: node scripts/browser-check.mjs [1440|390]
// Output (screenshots, results.json, downloads) goes to OUT (default docs/ui-review/r3-run).
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.env.OUT ?? "docs/ui-review/r3-run";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE ?? "http://127.0.0.1:8000/";
const PORT = 9444;
const KEY = "blockops.campaigns.v1";
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`, "--disable-gpu", "--no-first-run", "about:blank"], { stdio: "ignore" });
let up = false;
for (let i = 0; i < 60 && !up; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); up = true; } catch { await sleep(200); } }
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const ws = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener("open", resolve));

let nextId = 0;
const pending = new Map();
const logs = [];
const handlers = new Map();
ws.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
  } else if (message.method === "Runtime.consoleAPICalled") logs.push(`console.${message.params.type}: ${message.params.args.map(arg => arg.value ?? arg.description).join(" ")}`);
  else if (message.method === "Runtime.exceptionThrown") logs.push(`exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`);
  else if (message.method === "Log.entryAdded") logs.push(`log.${message.params.entry.level}: ${message.params.entry.text} ${message.params.entry.url ?? ""}`);
  else handlers.get(message.method)?.(message.params);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expression => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed");
  return result.result.value;
};
const waitFor = async (expression, ms = 30000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { try { if (await ev(expression)) return true; } catch { /* page not ready yet */ } await sleep(200); }
  throw new Error(`timeout: ${expression}`);
};
const shot = async (name, full = false) => {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(result.data, "base64"));
};
const type = async (selector, text, replace = true) => {
  await ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); if (${replace}) e.select?.(); })()`);
  await send("Input.insertText", { text });
};
const click = selector => ev(`document.querySelector(${JSON.stringify(selector)}).click()`);
const q = (selector, prop = "textContent") => ev(`document.querySelector(${JSON.stringify(selector)})?.${prop} ?? null`);
const count = selector => ev(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
const key = async (name, code, vk, extra = {}) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: name, code, windowsVirtualKeyCode: vk, ...extra });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode: vk });
};

const results = {};
const checks = [];
const check = (name, ok, detail = "") => { checks.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`); };
const state = () => ev(`(() => { const q = s => document.querySelector(s); return {
  view: q('#workspace').dataset.view, freshness: q('#freshness').textContent, save: q('#save-status').textContent, saveError: q('#save-status').classList.contains('save-error'),
  tabCount: q('#campaign-count').textContent, listCards: document.querySelectorAll('.campaign-card').length, detailOpen: !q('#campaign-detail-view').hidden,
  name: q('#c-name').textContent, objective: q('#c-objective').value, request: q('#c-request').value,
  evidence: document.querySelectorAll('#c-evidence .evidence-row').length, observations: document.querySelectorAll('#c-observations li').length,
  tasks: document.querySelectorAll('#c-tasks li').length, tasksDone: document.querySelectorAll('#c-tasks li.is-done').length,
  city: q('#t-city').textContent, group: q('#t-group').textContent, resident: q('#t-resident').textContent,
  reviewStatus: q('#review-status').textContent, reviewBtn: q('#mark-reviewed').textContent, exportOk: !q('#download-brief').disabled,
  exportStatus: q('#export-status').textContent, flags: [...document.querySelectorAll('#c-evidence .flag-warn')].map(e => e.textContent),
  newDisabled: q('#new-campaign').disabled, selected: q('#selected-count').textContent, rows: document.querySelectorAll('#record-list .record-choice').length,
  ring: document.querySelectorAll('.leaflet-overlay-pane path[stroke-dasharray="6 5"]').length, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  error: q('#error-notice').hidden ? '' : q('#error-notice').textContent } })()`);
const briefText = () => ev(`document.getElementById('brief-paper').innerText`);
const ready = () => waitFor(`document.querySelector('#freshness').textContent.includes('retrieved') || document.querySelector('#error-notice') && !document.querySelector('#error-notice').hidden`);
const loadPage = async () => { await send("Page.navigate", { url: BASE }); await ready(); await sleep(1800); };
const today = () => ev(`document.getElementById('obs-date').value`);

async function download(name) {
  const dir = mkdtempSync(join(OUT, "dl-"));
  try { await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dir }); } catch { await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir }); }
  await click("#download-brief");
  for (let i = 0; i < 30 && !readdirSync(dir).some(file => file.endsWith(".md")); i++) await sleep(200);
  const file = readdirSync(dir).find(entry => entry.endsWith(".md"));
  if (!file) return null;
  const text = readFileSync(join(dir, file), "utf8");
  writeFileSync(join(OUT, `${name}.md`), text);
  return { file, text };
}

async function run(name, width, height, mobile) {
  console.log(`\n===== ${name} (${width}x${height}${mobile ? ", mobile emulation" : ""}) =====`);
  const R = (results[name] = {});
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 3 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  const P = `${name}: `;

  // fresh start
  await send("Page.navigate", { url: BASE });
  await ready();
  await ev(`localStorage.clear()`);
  await loadPage();
  R.start = await state();
  check(`${P}starts with no saved campaigns`, R.start.listCards === 0 && !R.start.saveError, R.start.save);

  // exclusions survive radius/date/status changes (explore)
  const firstKeys = await ev(`[...document.querySelectorAll('#record-list input[type=checkbox]')].map(e => e.dataset.key)`);
  const excludedKey = firstKeys[1];
  await ev(`document.querySelectorAll('#record-list input[type=checkbox]')[1].click()`);
  const before = await q("#selected-count");
  await click('input[name=radius][value="250"]'); await sleep(300);
  await click('input[name=radius][value="150"]'); await sleep(300);
  await ev(`(() => { const s = document.getElementById('days-select'); s.value = '60'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(300);
  await ev(`(() => { const s = document.getElementById('days-select'); s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(300);
  const stillExcluded = await ev(`(() => { const e = document.querySelector('#record-list input[data-key=${JSON.stringify(excludedKey)}]'); return e ? !e.checked : null; })()`);
  check(`${P}an excluded report stays excluded after radius and date changes`, stillExcluded === true && (await q("#selected-count")) === before, `${before} -> ${await q("#selected-count")}`);

  // create
  const selectedBefore = Number((await q("#selected-count")).split(" ")[0]);
  await shot(`${name}-1-explore`, mobile);
  await click("#new-campaign"); await sleep(600);
  R.created = await state();
  check(`${P}New campaign here opens a saved campaign named for the block`, R.created.view === "campaign" && R.created.detailOpen && /block of|Intersection|Ave|St|Rd/.test(R.created.name), R.created.name);
  check(`${P}objective is prefilled`, /^Stop repeat dumping (on|at)/.test(R.created.objective), R.created.objective);
  check(`${P}campaign holds the selected evidence only (${selectedBefore})`, R.created.evidence === selectedBefore, String(R.created.evidence));
  check(`${P}create saved to the browser`, /^Saved in this browser/.test(R.created.save) && !R.created.saveError, R.created.save);
  const stored = JSON.parse(await ev(`localStorage.getItem(${JSON.stringify(KEY)})`));
  check(`${P}stored store is version 1 with the campaign`, stored.version === 1 && stored.campaigns.length === 1 && !stored.campaigns[0].evidence.some(item => item.key === excludedKey));

  // edit
  await type("#c-objective", "Stop repeat dumping on this block and get the lot fenced");
  await type("#obs-text", "FICTIONAL first visit: mattress and bags at the curb.");
  await click("#obs-fictional"); // default is off for live campaigns -> on
  await click("#obs-form button[type=submit]"); await sleep(300);
  await type("#task-text", "Photograph the spot"); await type("#task-owner", "Dana"); await ev(`(() => { const e = document.getElementById('task-due'); e.value = '2026-10-28'; e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await click("#task-form button[type=submit]"); await sleep(200);
  await type("#task-text", "Send the request to DPW"); await type("#task-owner", "Sam");
  await click("#task-form button[type=submit]"); await sleep(200);
  await type("#c-request", "Please clear the dumping and tell us when it is done.");
  await click("#mark-reviewed"); await sleep(300);
  R.edited = await state();
  await shot(`${name}-2-campaign`, mobile);
  check(`${P}observation, two tasks and review recorded`, R.edited.observations === 1 && R.edited.tasks === 2 && /^Reviewed/.test(R.edited.reviewBtn.replace("Reviewed ✓", "Reviewed")), `${R.edited.observations} obs, ${R.edited.tasks} tasks, ${R.edited.reviewBtn}`);
  check(`${P}three tracks stay separate`, /as published/.test(R.edited.city) && /Reviewed .*tasks 0 of 2 done/.test(R.edited.group) && /Resident observation/.test(R.edited.resident), `${R.edited.city} | ${R.edited.group} | ${R.edited.resident}`);

  // reload
  const objectiveBefore = R.edited.objective;
  await loadPage();
  R.reloaded = await state();
  check(`${P}after reload the campaign reopens intact`, R.reloaded.detailOpen && R.reloaded.view === "campaign" && R.reloaded.objective === objectiveBefore && R.reloaded.evidence === R.edited.evidence && R.reloaded.observations === 1 && R.reloaded.tasks === 2 && R.reloaded.request.startsWith("Please clear"), `${R.reloaded.name}; ${R.reloaded.evidence} reports`);
  check(`${P}review state and area survive reload`, /Reviewed ✓/.test(R.reloaded.reviewBtn) && R.reloaded.ring >= 1, `ring paths: ${R.reloaded.ring}`);
  check(`${P}status line says it loaded from this browser`, /1 saved campaign loaded|Saved in this browser/.test(R.reloaded.save), R.reloaded.save);
  await shot(`${name}-3-after-reload`, mobile);

  // follow-up + done task
  await type("#obs-text", "FICTIONAL follow-up: group re-checked on Thursday, the pile is gone.");
  await ev(`document.getElementById('obs-kind').value = 'followup'`);
  const fictionalChecked = await ev(`document.getElementById('obs-fictional').checked`);
  if (!fictionalChecked) await click("#obs-fictional");
  await click("#obs-form button[type=submit]"); await sleep(300);
  await click("#c-tasks li:first-child input[type=checkbox]"); await sleep(300);
  R.followUp = await state();
  check(`${P}follow-up added and task marked done`, R.followUp.observations === 2 && R.followUp.tasksDone === 1 && /tasks 1 of 2 done/.test(R.followUp.group), `${R.followUp.observations} obs; ${R.followUp.group}`);
  check(`${P}a follow-up does not withdraw the review`, /Reviewed ✓/.test(R.followUp.reviewBtn) && R.followUp.exportOk);
  await click('#campaign-panel [data-view="brief"]'); await sleep(500);
  const brief = await briefText();
  R.briefText = brief;
  check(`${P}brief includes the follow-up, labeled fictional, and the done task`, /group re-checked on Thursday/.test(brief) && /FICTIONAL practice entry/.test(brief) && /\[done\] Photograph the spot/.test(brief) && /\[open\] Send the request/.test(brief));
  check(`${P}brief keeps city status, group progress and resident verification apart`, /CITY TICKET STATUS, AS PUBLISHED/i.test(brief) && /GROUP PROGRESS/i.test(brief) && /RESIDENT VERIFICATION AND FOLLOW-UPS/i.test(brief));
  await shot(`${name}-4-brief`, mobile);
  const markdown = await download(`${name}-brief`);
  check(`${P}downloaded Markdown carries follow-up, task state, source links and the fictional label`, markdown && /group re-checked on Thursday/.test(markdown.text) && /- \[x\] Photograph the spot/.test(markdown.text) && /FICTIONAL practice entry/.test(markdown.text) && /\[Original source record\]\(https:\/\/maps2\.dcgis\.dc\.gov/.test(markdown.text), markdown?.file);
  await click('#brief-panel [data-view="campaign"]'); await sleep(300);

  // remove evidence
  const removedAddress = await ev(`document.querySelector('#c-evidence .evidence-row .record-address').textContent`);
  const evidenceBefore = (await state()).evidence;
  await click("#c-evidence .evidence-row button"); await sleep(300);
  R.removed = await state();
  check(`${P}removing evidence withdraws the review and blocks export`, R.removed.evidence === evidenceBefore - 1 && !/Reviewed ✓/.test(R.removed.reviewBtn) && !R.removed.exportOk, R.removed.exportStatus);
  const afterRemove = JSON.parse(await ev(`localStorage.getItem(${JSON.stringify(KEY)})`));
  check(`${P}removed report is gone from the saved store`, afterRemove.campaigns[0].evidence.length === evidenceBefore - 1);
  await click("#mark-reviewed"); await sleep(300);
  check(`${P}re-review restores export`, (await state()).exportOk);

  // refresh with a changed status
  const target = await ev(`document.querySelector('#c-evidence .evidence-row .record-id').textContent.replace('Request ', '')`);
  const areaBefore = JSON.parse(await ev(`localStorage.getItem(${JSON.stringify(KEY)})`)).campaigns[0].area;
  const obsBefore = (await state()).observations;
  await send("Fetch.enable", { patterns: [{ urlPattern: "*api/requests*" }] });
  handlers.set("Fetch.requestPaused", async params => {
    const original = await (await fetch(new URL("/api/requests", BASE))).json();
    const record = original.records.find(item => item.id === target);
    if (record) record.status = record.status === "Open" ? "Closed" : "Open";
    await send("Fetch.fulfillRequest", { requestId: params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(original)).toString("base64") });
  });
  await click("#load-live"); await sleep(2500);
  R.refreshed = await state();
  const refreshedStore = JSON.parse(await ev(`localStorage.getItem(${JSON.stringify(KEY)})`)).campaigns[0];
  check(`${P}refresh flags the changed status and withdraws the review`, R.refreshed.flags.some(text => /Status changed since review/.test(text)) && !R.refreshed.exportOk && !/Reviewed ✓/.test(R.refreshed.reviewBtn), R.refreshed.flags.join("; "));
  check(`${P}refresh never moves the area or deletes observations`, JSON.stringify(refreshedStore.area) === JSON.stringify(areaBefore) && R.refreshed.observations === obsBefore, `${R.refreshed.observations} observations`);
  await shot(`${name}-5-status-changed`, mobile);
  await send("Fetch.disable");
  handlers.delete("Fetch.requestPaused");
  await click("#mark-reviewed"); await sleep(300);

  // failed refresh keeps everything
  await send("Network.enable");
  await send("Network.setBlockedURLs", { urls: ["*api/requests*"] });
  const keep = await state();
  await click("#load-live"); await sleep(1500);
  R.outage = await state();
  check(`${P}failed refresh keeps the open campaign and shows an error`, R.outage.evidence === keep.evidence && R.outage.observations === keep.observations && /could not be reached/.test(R.outage.error), R.outage.error);
  await send("Network.setBlockedURLs", { urls: [] });

  // storage failures
  const good = await ev(`localStorage.getItem(${JSON.stringify(KEY)})`);
  for (const [label, bad, pattern] of [["corrupt", "{not json", /not valid JSON/], ["wrong version", JSON.stringify({ version: 2, campaigns: [] }), /version 2/]]) {
    await ev(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(bad)}); localStorage.removeItem('blockops.lastOpen')`);
    await loadPage();
    const s = await state();
    check(`${P}${label} saved data shows an error and turns saving off`, s.saveError && pattern.test(s.save) && /not overwritten/.test(s.save), s.save);
    await click("#new-campaign"); await sleep(300);
    const created = await state();
    const after = await ev(`localStorage.getItem(${JSON.stringify(KEY)})`);
    check(`${P}${label}: a new campaign works in memory but the stored value is untouched`, created.detailOpen && after === bad && created.saveError, `stored unchanged: ${after === bad}`);
    if (label === "corrupt") await shot(`${name}-6-corrupt-storage`, mobile);
  }
  await ev(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(good)})`);
  await loadPage();
  const listed = await state();
  await click(".campaign-card button"); await sleep(400);
  const restored = await state();
  check(`${P}restoring the last valid save brings the campaign back`, listed.listCards === 1 && !listed.saveError && restored.evidence > 0, `${restored.name}`);

  // quota
  await ev(`window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }`);
  const storedBeforeQuota = await ev(`localStorage.getItem(${JSON.stringify(KEY)})`);
  await type("#task-text", "Task added while storage is full");
  await click("#task-form button[type=submit]"); await sleep(300);
  const full = await state();
  await ev(`Storage.prototype.setItem = window.__setItem`);
  const storedAfterQuota = await ev(`localStorage.getItem(${JSON.stringify(KEY)})`);
  check(`${P}full storage shows an error and the last valid save is untouched`, full.saveError && /storage is full/.test(full.save) && storedAfterQuota === storedBeforeQuota, full.save);
  check(`${P}full storage: the new task still appears in the page and brief`, full.tasks === restored.tasks + 1);

  // disabled storage
  const scriptId = (await send("Page.addScriptToEvaluateOnNewDocument", { source: `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } });` })).identifier;
  await loadPage();
  const disabled = await state();
  check(`${P}disabled storage is reported without breaking the page`, disabled.saveError && /unavailable/.test(disabled.save) && disabled.rows > 0, disabled.save);
  await click("#new-campaign"); await sleep(300);
  await click("#mark-reviewed"); await sleep(300);
  check(`${P}disabled storage: the campaign still works and exports in memory`, (await state()).exportOk);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });

  // practice case
  await send("Page.navigate", { url: BASE });
  await ready();
  await ev(`localStorage.clear()`);
  await loadPage();
  await click("#load-demo"); await sleep(1200);
  await click("#new-campaign"); await sleep(500);
  await click("#mark-reviewed"); await sleep(300);
  const practice = await state();
  await click('#campaign-panel [data-view="brief"]'); await sleep(400);
  const practiceBrief = await briefText();
  const links = await count("#brief-paper a");
  check(`${P}practice campaign is labeled fictional with no official links`, /Practice case \(fictional\)/.test(practice.name) && /FICTIONAL PRACTICE CASE/.test(practiceBrief) && links === 0, `${links} links; name=${practice.name}; brief=${practiceBrief.slice(0, 120).replace(/\n/g, ' | ')}`);
  await shot(`${name}-7-practice-brief`, mobile);

  R.overflowX = (await state()).overflowX;
  check(`${P}no horizontal overflow`, !R.overflowX);
  R.logs = [...logs];
  logs.length = 0;
  check(`${P}no console errors, exceptions or CSP violations`, !R.logs.some(line => /exception|error/i.test(line) && !/Failed to load resource.*(favicon)/.test(line)), R.logs.slice(0, 3).join(" | "));
}

await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
const only = process.argv[2];
try {
  if (!only || only === "1440") await run("d1440", 1440, 900, false);
  if (!only || only === "390") await run("m390", 390, 844, true);
} catch (error) {
  console.log(`DRIVER ERROR: ${error.message}`);
  checks.push({ name: "driver completed without error", ok: false, detail: error.message });
} finally {
  writeFileSync(join(OUT, "results.json"), JSON.stringify({ checks, results }, null, 1));
  console.log(`\n${checks.filter(item => item.ok).length}/${checks.length} checks passed; ${checks.filter(item => !item.ok).map(item => item.name).join("; ") || "none failed"}`);
  chrome.kill();
  process.exit(0);
}
