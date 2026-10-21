// R3/R4 browser check: drives real Chrome through the DevTools protocol with device emulation (not window size).
// Needs the app running at BASE (node server.mjs) and network access to DC GIS. Usage: node scripts/browser-check.mjs [1440|390]
// Output (screenshots, results.json, downloads) goes to OUT (default docs/ui-review/r3-run).
import { spawn } from "node:child_process";
import { readFileSync as readRepoFile } from "node:fs";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.env.OUT ?? "docs/ui-review/r4-run";
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
  check(`${P}the fictional practice entry box is checked by default, with a visible label`, (await ev(`document.getElementById('obs-fictional').checked`)) && /Fictional practice entry.*Uncheck only for a real observation/.test(await q(".check-fictional")), "default on");
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
  check(`${P}the box is still checked for the next entry (campaign reopened after reload)`, await ev(`document.getElementById('obs-fictional').checked`));
  await click("#obs-form button[type=submit]"); await sleep(300);
  check(`${P}it resets to checked after each entry`, await ev(`document.getElementById('obs-fictional').checked`));
  // a real (unchecked) observation is a deliberate act and carries no fictional label
  await type("#obs-text", "REALENTRY the group saw the curb clear on Friday.");
  await click("#obs-fictional");
  check(`${P}unchecking is possible`, !(await ev(`document.getElementById('obs-fictional').checked`)));
  await click("#obs-form button[type=submit]"); await sleep(300);
  check(`${P}after a real entry the box returns to checked`, await ev(`document.getElementById('obs-fictional').checked`));
  await click("#c-tasks li:first-child input[type=checkbox]"); await sleep(300);
  R.followUp = await state();
  check(`${P}follow-up added and task marked done`, R.followUp.observations === 3 && R.followUp.tasksDone === 1 && /tasks 1 of 2 done/.test(R.followUp.group), `${R.followUp.observations} obs; ${R.followUp.group}`);
  check(`${P}a follow-up does not withdraw the review`, /Reviewed ✓/.test(R.followUp.reviewBtn) && R.followUp.exportOk);
  await click('#campaign-panel [data-view="brief"]'); await sleep(500);
  const brief = await briefText();
  R.briefText = brief;
  check(`${P}the real entry has no fictional label while the others do`, /REALENTRY[^\n]*/.test(brief) && !/REALENTRY.*FICTIONAL/.test(brief) && (brief.match(/\[FICTIONAL practice entry\]/g) ?? []).length === 2, `${(brief.match(/\[FICTIONAL practice entry\]/g) ?? []).length} fictional labels`);
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
  let handledPause;
  const handled = new Promise(resolve => { handledPause = resolve; });
  handlers.set("Fetch.requestPaused", async params => {
    try {
      const original = await (await fetch(new URL("/api/requests", BASE))).json();
      const record = original.records.find(item => item.id === target);
      if (record) record.status = record.status === "Open" ? "Closed" : "Open";
      await send("Fetch.fulfillRequest", { requestId: params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(original)).toString("base64") });
    } catch (error) { logs.push(`driver: intercept failed: ${error.message}`); }
    handledPause();
  });
  await click("#load-live");
  await Promise.race([handled, sleep(20000)]);
  await waitFor(`document.querySelector('#c-evidence .flag-warn') !== null`, 15000).catch(() => {});
  await sleep(500);
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

  await insight(P, name, mobile);
  await recordedFlow(P, name, mobile);
  await failureFlow(P, name, mobile);
  if (!mobile) await keyboardPath(P, name);

  R.overflowX = (await state()).overflowX;
  check(`${P}no horizontal overflow`, !R.overflowX);
  R.logs = [...logs];
  logs.length = 0;
  check(`${P}no console errors, exceptions or CSP violations`, !R.logs.some(line => /exception|error/i.test(line) && !/Failed to load resource.*(favicon)/.test(line)), R.logs.slice(0, 3).join(" | "));
}


// ---------- R4 ----------
const lib = await import(new URL("../lib/block-ops.mjs", import.meta.url));
const rec = await import(new URL("../lib/recurrence.mjs", import.meta.url));
const camp = await import(new URL("../lib/campaign.mjs", import.meta.url));
const recordedSnapshot = lib.snapshotFromRecording(JSON.parse(readRepoFile(new URL("../data/recorded-snapshot.json", import.meta.url), "utf8")));
const shortDayNode = value => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(value));

async function resetPage() {
  await send("Page.navigate", { url: BASE });
  await ready();
  await ev(`localStorage.clear()`);
  await loadPage();
}
const optionTexts = () => ev(`[...document.querySelectorAll('#busy-select option')].map(o => o.textContent)`);
const typeKeys = async text => { for (const ch of text) await key(ch, `Key${ch.toUpperCase()}`, ch.toUpperCase().charCodeAt(0), { text: ch }); };
async function tabTo(selector, { backward = false, max = 400 } = {}) {
  for (let i = 0; i < max; i++) {
    if (await ev(`document.activeElement?.matches(${JSON.stringify(selector)})`)) return i;
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: backward ? 8 : 0 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  }
  throw new Error(`could not tab to ${selector}`);
}
const enter = () => key("Enter", "Enter", 13, { text: "\r" });
const space = () => key(" ", "Space", 32, { text: " " });

async function insight(P, name, mobile) {
  await resetPage();
  const statLine = await q("#stat-line");
  const m = /Closed isn't fixed\. (\d+) of (\d+) closed reports \((\d+)%\) had another report nearby within 30 days · (\d+) spots with 5\+ reports hold (\d+)% of reports\./.exec(statLine ?? "");
  check(`${P}header stat line shows the ward-wide number`, m && Number(m[1]) / Number(m[2]) * 100 > 40 && /Counting only closures at least 30 days old/.test(statLine) && /not necessarily the same pile/.test(statLine) && /block-level/.test(statLine), (statLine ?? "").slice(0, 160));
  const options = await optionTexts();
  check(`${P}busy spots are listed worst first with re-report counts`, /re-reported/.test(options[1]) && options.slice(1).every(text => /\d+ reports · \d+ re-reported/.test(text)) && Number(/(\d+) re-reported/.exec(options[1])[1]) >= Number(/(\d+) re-reported/.exec(options[2])[1]), options[1]);
  const title = await q("#case-title");
  check(`${P}the app starts on the worst spot`, options[1].startsWith(title), title);
  const explore = await q("#area-headline");
  check(`${P}explore shows the area headline`, /^\d+ reports since [A-Z][a-z]{2} \d+ · \d+ closed · \d+ re-reported within 30 days of a closure/.test(explore), explore);
  check(`${P}busy spots are shaded on the map and the legend explains the shading`, (await count(".leaflet-spots-pane path")) >= 3 && /Shading: closed reports followed by another nearby/.test(await q(".legend")), `${await count(".leaflet-spots-pane path")} shaded spots`);
  await shot(`${name}-r4-1-explore`, mobile);
  await click("#new-campaign"); await sleep(500);
  const headline = await q("#c-headline");
  check(`${P}campaign headline: reports, closed, re-reported within 30 days, median gap`, /^\d+ reports since [A-Z][a-z]{2} \d+ · \d+ closed · \d+ re-reported within 30 days of a closure( · median gap [\d.]+ days?)?$/.test(headline) && /another report nearby/.test(await q("#c-caveat")) && /not mean the same pile/.test(await q("#c-caveat")), headline);

  // escalation brief
  await type("#ask-recipient", "Ward 8 Councilmember office");
  await ev(`(() => { const s = document.getElementById('ask-fix'); s.value = 'cleanup'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await type("#ask-other", "weekly check for eight weeks");
  await type("#task-text", "Photograph the spot"); await type("#task-owner", "Dana");
  await click("#task-form button[type=submit]"); await sleep(200);
  await type("#obs-text", "FICTIONAL follow-up: pile gone on Thursday.");
  await click("#obs-form button[type=submit]"); await sleep(200);
  check(`${P}the ask withdraws a review until the group marks it again`, !(await state()).exportOk);
  await click("#mark-reviewed"); await sleep(300);
  check(`${P}reviewed campaign with the ask is exportable`, (await state()).exportOk);
  await click('#campaign-panel [data-view="brief"]'); await sleep(500);
  const brief = await briefText();
  const at = text => brief.indexOf(text);
  check(`${P}the brief leads with recurrence, then the ask, tasks, and follow-up history`, at("Recurrence evidence") >= 0 && at("Recurrence evidence") < at("The ask") && at("The ask") < at("Tasks") && at("Tasks") < at("Resident verification and follow-ups"), "order ok");
  check(`${P}the brief names recipient and lasting fix, and says nothing was sent`, /To: Ward 8 Councilmember office/.test(brief) && /Requested lasting fix: Scheduled cleanup \+ check-in \(weekly check for eight weeks\)/.test(brief) && /Nothing has been sent/.test(brief));
  await shot(`${name}-r4-2-brief`, mobile);
  const markdown = await download(`${name}-r4-brief`);
  const mdAt = text => markdown?.text.indexOf(text) ?? -1;
  check(`${P}downloaded brief has the same order and ask`, markdown && mdAt("## Recurrence evidence") > 0 && mdAt("## Recurrence evidence") < mdAt("## The ask") && mdAt("## The ask") < mdAt("## Tasks") && mdAt("## Tasks") < mdAt("## Resident verification") && /\*\*To:\*\* Ward 8 Councilmember office/.test(markdown.text));

  // A4 PDF of the escalation brief
  await send("Emulation.setEmulatedMedia", { media: "print" });
  const pdf = await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: true });
  await send("Emulation.setEmulatedMedia", { media: "" });
  const pdfBytes = Buffer.from(pdf.data, "base64");
  writeFileSync(join(OUT, `${name}-r4-brief-a4.pdf`), pdfBytes);
  const pages = (pdfBytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  check(`${P}A4 PDF of the brief was produced`, pdfBytes.length > 20000 && pages >= 1 && pdfBytes.subarray(0, 5).toString() === "%PDF-", `${pages} pages, ${pdfBytes.length} bytes (page size is inspected by eye in the saved file)`);
}

async function recordedFlow(P, name, mobile) {
  await resetPage();
  await waitFor(`!document.getElementById('load-recorded').disabled`, 10000);
  const label = await q("#load-recorded");
  check(`${P}the third source button names the recording date`, /^Recorded DC 311 snapshot \([A-Z][a-z]{2} \d+\)$/.test(label), label);
  await click("#load-recorded");
  await waitFor(`document.getElementById('freshness').textContent.startsWith('RECORDED (not live)')`, 15000);
  await sleep(1500);
  const notice = await q("#sample-notice");
  check(`${P}recorded data is always labeled recorded and never live`, /RECORDED SNAPSHOT/.test(notice) && /not live/.test(notice) && (await q("#load-recorded", "getAttribute('aria-pressed')")) === "true" && (await q("#load-live", "getAttribute('aria-pressed')")) === "false" && !/^DC 311 · retrieved/.test(await q("#freshness")), notice.slice(0, 80));
  const summary = rec.recurrenceSummary(recordedSnapshot.records, { asOf: Date.parse(recordedSnapshot.retrievedAt) });
  const statLine = await q("#stat-line");
  check(`${P}the stat line matches the library on the recorded data (${summary.reReported} of ${summary.closedLocated}, ${summary.pct}%)`, statLine.includes(`${summary.reReported} of ${summary.closedLocated} closed reports (${summary.pct}%)`) && statLine.includes(`${summary.spots.count} spots with 5+ reports hold ${Math.round(summary.spots.share * 100)}% of reports`) && /, recorded\./.test(statLine), statLine.slice(0, 150));
  const worst = rec.recurrenceSpots(recordedSnapshot.records)[0];
  const draft = lib.updateScope({ snapshot: recordedSnapshot, area: { center: null, radiusM: 150 }, filters: { days: null, kinds: new Set(["open", "closed", "other"]) }, selectedIds: new Set(), excludedIds: new Set() }, { center: worst.center });
  const expectedTitle = lib.areaBlockName(draft);
  const expectedHeadline = rec.recurrenceHeadline(rec.areaRecurrence(lib.candidateRecords(draft)), shortDayNode);
  check(`${P}the worst spot and its headline match the library`, (await q("#case-title")) === expectedTitle && (await q("#area-headline")) === expectedHeadline, `${expectedTitle}: ${expectedHeadline}`);
  check(`${P}recorded dots and shading are on the map`, (await count(".leaflet-interactive")) >= 390 && (await count(".leaflet-spots-pane path")) >= 3);
  await click("#new-campaign"); await sleep(500);
  await click("#mark-reviewed"); await sleep(300);
  const tag = await q("#c-tag");
  await click('#campaign-panel [data-view="brief"]'); await sleep(400);
  const brief = await briefText();
  check(`${P}a campaign from recorded data is labeled recorded and keeps official links`, /recorded snapshot/i.test(tag) && /RECORDED SNAPSHOT/.test(brief) && /not live data/.test(brief) && (await count('#brief-paper a[href*="maps2.dcgis.dc.gov"]')) > 0, tag);
  await shot(`${name}-r4-3-recorded-brief`, mobile);

  // venue without internet: live service, boundary and basemap all unreachable
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Network.setBlockedURLs", { urls: ["*api/requests*", "*api/ward8*", "*MapServer/tile*"] });
  await send("Page.navigate", { url: BASE });
  await waitFor(`!document.getElementById('error-notice').hidden`, 20000);
  const down = await state();
  check(`${P}with the live service down the page says so and shows no substitute data`, /could not be reached/.test(down.error) && /No substitute data/.test(down.error) && down.rows === 0, down.error);
  await waitFor(`!document.getElementById('load-recorded').disabled`, 10000);
  await click("#load-recorded");
  await waitFor(`document.getElementById('freshness').textContent.startsWith('RECORDED (not live)')`, 15000);
  await waitFor(`!document.getElementById('map-note').hidden`, 15000).catch(() => {});
  await sleep(500);
  const offline = await state();
  const noteShown = await ev(`!document.getElementById('map-note').hidden`);
  check(`${P}offline: the recorded snapshot loads, the list works, and the map note says tiles are down`, offline.rows > 0 && noteShown && (await count(".leaflet-interactive")) >= 390, `${offline.rows} rows, note shown: ${noteShown}`);
  await click("#new-campaign"); await sleep(400);
  const created = await state();
  check(`${P}offline: a campaign can still be created and saved`, created.detailOpen && /^Saved in this browser/.test(created.save), created.save);
  await shot(`${name}-r4-4-offline-recorded`, mobile);
  await send("Network.setBlockedURLs", { urls: [] });
  await send("Network.setCacheDisabled", { cacheDisabled: false });
}

async function failureFlow(P, name, mobile) {
  await resetPage();
  await click("#new-campaign"); await sleep(400);
  await send("Network.setBlockedURLs", { urls: ["*api/ward8*"] });
  await click("#load-live"); await sleep(2500);
  const noBoundary = await state();
  check(`${P}boundary failure is labeled and the open campaign still works`, /Ward 8 boundary check unavailable/.test(noBoundary.freshness) && noBoundary.detailOpen && noBoundary.evidence > 0, noBoundary.freshness.slice(-60));
  await send("Network.setBlockedURLs", { urls: [] });

  // slow API: the open campaign stays usable and the page says a refresh is running
  await send("Fetch.enable", { patterns: [{ urlPattern: "*api/requests*" }] });
  handlers.set("Fetch.requestPaused", async params => {
    await sleep(6000);
    try { await send("Fetch.continueRequest", { requestId: params.requestId }); } catch (error) { logs.push(`driver: continue failed: ${error.message}`); }
  });
  await click("#load-live"); await sleep(1200);
  const during = await state();
  await type("#c-objective", "Typed while the refresh was slow");
  const exploreLocked = await ev(`document.getElementById('explore-panel').inert`);
  const storedDuring = JSON.parse(await ev(`localStorage.getItem(${JSON.stringify(KEY)})`)).campaigns[0].objective;
  check(`${P}slow API: labeled as refreshing, explore locked, campaign editable and saved`, /Requesting the bounded DC 311 snapshot/.test(during.freshness) && /Saved campaigns stay editable/.test(during.freshness) && exploreLocked && storedDuring === "Typed while the refresh was slow" && during.detailOpen, during.freshness.slice(0, 90));
  await waitFor(`document.getElementById('freshness').textContent.includes('retrieved')`, 30000);
  await sleep(800);
  const after = await state();
  check(`${P}slow API: when it finishes the campaign is intact and explore unlocks`, after.objective === "Typed while the refresh was slow" && !(await ev(`document.getElementById('explore-panel').inert`)) && after.evidence > 0);
  await send("Fetch.disable");
  handlers.delete("Fetch.requestPaused");
  await shot(`${name}-r4-5-after-slow-api`, mobile);
}

async function keyboardPath(P, name) {
  await resetPage();
  await ev(`window.__mouse = 0; document.addEventListener('click', e => { if (e.detail > 0) window.__mouse += 1; }, true);`);
  const live = await ev(`['scope-status','save-status','stat-line','freshness','export-status'].map(id => document.getElementById(id).getAttribute('aria-live') ?? document.getElementById(id).getAttribute('role'))`);
  check(`${P}area, save, stat, freshness and export status are announced (aria-live)`, live.every(Boolean), live.join(","));
  const before = await q("#scope-status");
  check(`${P}map dots are not tab stops`, (await ev(`[...document.querySelectorAll('.leaflet-interactive')].every(e => e.getAttribute('tabindex') === '-1')`)), "390 dots tabindex -1");
  await ev(`document.querySelector('.skip-link').focus()`);
  await tabTo("#busy-select");
  const options = await optionTexts();
  await typeKeys(options[3].slice(0, 6));
  await sleep(500);
  check(`${P}keyboard: choosing a spot changes the area, and the live region text changes`, (await q("#scope-status")) !== before && (await ev(`document.getElementById('busy-select').selectedIndex`)) === 3, (await q("#scope-status")).slice(0, 60));
  await tabTo("#new-campaign"); await enter(); await sleep(500);
  check(`${P}keyboard: Enter on "New campaign here" opens the campaign`, (await state()).detailOpen);
  await tabTo("#obs-text");
  await send("Input.insertText", { text: "FICTIONAL keyboard-only follow-up." });
  await tabTo("#obs-form button[type=submit]"); await enter(); await sleep(300);
  check(`${P}keyboard: observation added and focus returns to the form`, (await state()).observations === 1 && (await ev(`document.activeElement.id`)) === "obs-text");
  await tabTo("#task-text");
  await send("Input.insertText", { text: "Check the corner" });
  await tabTo("#task-owner"); await send("Input.insertText", { text: "Dana" });
  await tabTo("#task-form button[type=submit]"); await enter(); await sleep(300);
  check(`${P}keyboard: task added with an owner`, (await state()).tasks === 1);
  await tabTo("#c-tasks input[type=checkbox]", { backward: true }); await space(); await sleep(300);
  check(`${P}keyboard: Space marks the task done`, (await state()).tasksDone === 1);
  await tabTo("#ask-recipient"); await send("Input.insertText", { text: "DPW" });
  await tabTo("#ask-fix"); await typeKeys("Sig"); await sleep(300);
  await tabTo("#mark-reviewed"); await enter(); await sleep(300);
  check(`${P}keyboard: ask filled and campaign marked reviewed`, (await state()).exportOk && (await ev(`document.getElementById('ask-fix').value`)) === "signage");
  await tabTo("#brief-tab"); await enter(); await sleep(500);
  const brief = await briefText();
  check(`${P}keyboard: the brief opens with the ask, the done task and the follow-up`, /To: DPW/.test(brief) && /Requested lasting fix: Signage/.test(brief) && /\[done\] Check the corner/.test(brief) && /keyboard-only follow-up/.test(brief));
  const mouseClicks = await ev(`window.__mouse`);
  check(`${P}keyboard-only run used zero mouse clicks`, mouseClicks === 0, `${mouseClicks} mouse clicks`);
}

async function stage(P, name, w, h) {
  await resetPage();
  const box = selector => ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, font: parseFloat(getComputedStyle(e).fontSize) }; })()`);
  const stat = await box("#stat-line");
  const title = await box("#case-title");
  const addr = await box("#record-list .record-address");
  const minStat = w >= 1600 ? 16 : 13;
  check(`${P}stat line is fully on screen and readable (${stat.font}px)`, stat.top >= 0 && stat.bottom <= h && stat.right <= w && stat.font >= minStat, `${Math.round(stat.bottom)}px of ${h}`);
  check(`${P}area title and first report are readable (${title.font}px / ${addr.font}px)`, title.bottom <= h && title.font >= (w >= 1600 ? 28 : 20) && addr.font >= (w >= 1600 ? 15 : 13));
  const mapBox = await box("#map");
  const newBtn0 = await box("#new-campaign");
  check(`${P}"New campaign here" is on screen without scrolling`, newBtn0.bottom <= h && newBtn0.top >= 0, `button bottom ${Math.round(newBtn0.bottom)}px of ${h}`);
  check(`${P}the map keeps at least 55% of the width`, (mapBox.right - mapBox.left) / w >= 0.55, `${Math.round((mapBox.right - mapBox.left) / w * 100)}%`);
  await shot(`${name}-r4-1-explore`);
  const newBtn = await box("#new-campaign");
  await click("#new-campaign"); await sleep(500);
  const headline = await box("#c-headline");
  const name2 = await box("#c-name");
  check(`${P}campaign headline is visible without scrolling`, headline && headline.bottom <= h && name2.bottom <= h, `headline bottom ${Math.round(headline.bottom)}px of ${h}`);
  check(`${P}no horizontal overflow`, !(await state()).overflowX);
  await shot(`${name}-r4-2-campaign`);
  results[name] = { statFont: stat.font, titleFont: title.font, addressFont: addr.font, newCampaignButtonBottomInExplore: Math.round(newBtn?.bottom ?? -1), viewportHeight: h };
}

await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
const only = process.argv[2];
try {
  const stageRun = async (name, w, h) => {
    console.log(`\n===== ${name} (${w}x${h}) =====`);
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await stage(`${name}: `, name, w, h);
  };
  if (!only || only === "1920") await stageRun("d1920", 1920, 1080);
  if (!only || only === "1280") await stageRun("d1280", 1280, 720);
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
