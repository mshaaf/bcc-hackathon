// CDP driver: real Chrome with DevTools device emulation (not window size).
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.env.OUT ?? "docs/ui-review/r2-run";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://127.0.0.1:8000/";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`, "--disable-gpu", "--no-first-run", "about:blank"], { stdio: "ignore" });
let version;
for (let i = 0; i < 50 && !version; i++) { try { version = await (await fetch("http://127.0.0.1:9333/json/version")).json(); } catch { await sleep(200); } }
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener("message", ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result); }
  else if (msg.method === "Runtime.consoleAPICalled") logs.push(`console.${msg.params.type}: ${msg.params.args.map(a => a.value ?? a.description).join(" ")}`);
  else if (msg.method === "Runtime.exceptionThrown") logs.push(`exception: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
  else if (msg.method === "Log.entryAdded") logs.push(`log.${msg.params.entry.level}: ${msg.params.entry.text} ${msg.params.entry.url ?? ""}`);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };
const waitFor = async (expr, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(200); } throw new Error(`timeout: ${expr}`); };
const shot = async (name, full = false) => { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, "base64")); };
const key = async (k, code, vk, extra = {}) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, ...extra }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); };
const click = async (x, y) => { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
const snap = () => ev(`(() => { const q = s => document.querySelector(s); return {
  freshness: q('#freshness').textContent, title: q('#case-title').textContent, scope: q('#scope-status').textContent, tally: q('#tally').textContent,
  rows: document.querySelectorAll('#record-list .record-choice').length, selected: q('#selected-count').textContent,
  checked: document.querySelectorAll('#record-list input:checked').length, reviewCheck: !q('#review-check').hidden,
  city: q('#t-city').textContent, group: q('#t-group').textContent, error: q('#error-notice').hidden ? '' : q('#error-notice').textContent,
  notice: q('#sample-notice').hidden ? '' : 'demo', mapNote: !q('#map-note').hidden,
  markers: document.querySelectorAll('.leaflet-interactive').length, tilesLoaded: [...document.querySelectorAll('img.leaflet-tile')].filter(i => i.complete && i.naturalWidth > 0).length,
  flags: document.querySelectorAll('#record-list .flag').length, view: q('#workspace').dataset.view,
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth } })()`);
const briefInfo = () => ev(`(() => ({ heading: document.querySelector('#brief-paper h5:nth-of-type(1)')?.textContent, h4: document.querySelector('#brief-paper h4')?.textContent, items: document.querySelectorAll('#brief-paper .paper-list li').length, scopeLine: [...document.querySelectorAll('#brief-paper .paper-meta')].map(e => e.textContent).find(t => t.startsWith('Selection scope')) ?? null, exportStatus: document.getElementById('export-status').textContent, downloadEnabled: !document.getElementById('download-brief').disabled }))()`);
const markerCenter = idx => ev(`(() => { const m = [...document.querySelectorAll('.leaflet-interactive')].filter(e => { const r = e.getBoundingClientRect(); const mp = document.getElementById('map').getBoundingClientRect(); return r.width > 0 && r.left > mp.left + 20 && r.right < mp.right - 20 && r.top > mp.top + 70 && r.bottom < mp.bottom - 70; }); const e = m[${idx} % m.length]; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, n: m.length }; })()`);

const results = {};
async function emulate(name, width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 3 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  results[name] = {};
  const R = results[name];
  await send("Network.setBlockedURLs", { urls: [] });
  await send("Page.navigate", { url: BASE });
  await waitFor(`document.querySelector('#freshness').textContent.includes('retrieved')`);
  await sleep(2500);
  R.loaded = await snap();
  await shot(`${name}-1-loaded`, mobile);

  // judge action 1: click a different area on the map
  const before = R.loaded;
  const m = await markerCenter(60);
  await click(m.x, m.y);
  await sleep(800);
  R.afterMapClick = await snap();
  await shot(`${name}-2-after-map-click`, mobile);

  // judge action 2: radius
  const radiusBefore = (await snap()).rows;
  await ev(`document.querySelector('input[name=radius][value="250"]').click()`);
  await sleep(500);
  R.radius250 = await snap();
  await ev(`document.querySelector('input[name=radius][value="100"]').click()`);
  await sleep(500);
  R.radius100 = await snap();
  await ev(`document.querySelector('input[name=radius][value="150"]').click()`);
  await sleep(300);

  // judge action 3: date + status filters
  await ev(`(() => { const s = document.getElementById('days-select'); s.value = '30'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(400);
  R.days30 = await snap();
  await ev(`document.querySelector('input[name=kind][value="closed"]').click()`);
  await sleep(400);
  R.days30NoClosed = await snap();
  await shot(`${name}-3-filters`, mobile);
  await ev(`document.querySelector('input[name=kind][value="closed"]').click(); (() => { const s = document.getElementById('days-select'); s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(400);
  R.filtersReset = await snap();

  // brief inputs change with scope: confirm -> plan -> brief
  await ev(`document.getElementById('confirm-review').click()`);
  await sleep(300);
  await ev(`document.getElementById('brief-tab').click()`);
  await sleep(500);
  R.briefA = await briefInfo();
  await shot(`${name}-4-brief-A`, mobile);
  await ev(`document.getElementById('evidence-tab').click()`);
  await sleep(500);
  R.afterReturn = await snap();
  await ev(`document.querySelector('input[name=radius][value="250"]').click()`);
  await sleep(400);
  R.afterRadiusReviewCleared = await snap();
  await ev(`document.getElementById('confirm-review').click()`);
  await sleep(200);
  await ev(`document.getElementById('brief-tab').click()`);
  await sleep(400);
  R.briefB = await briefInfo();
  await ev(`document.getElementById('evidence-tab').click()`);
  await sleep(300);
  await ev(`document.querySelector('input[name=radius][value="150"]').click()`);
  await sleep(300);

  // keyboard only, no map: Tab to first record checkbox, Space toggles; select via ArrowDown
  await ev(`document.getElementById('busy-select').focus()`);
  await key(" ", "Space", 32, { text: " " }); await sleep(300);
  await key("ArrowDown", "ArrowDown", 40); await sleep(150);
  await key("ArrowDown", "ArrowDown", 40); await sleep(150);
  await key("Enter", "Enter", 13, { text: "\r" });
  await sleep(500);
  if (await ev(`document.getElementById('busy-select').value === ''`)) { await ev(`document.getElementById('busy-select').focus()`); await key("2", "Digit2", 50, { text: "2" }); await sleep(500); results[name].keyboardBusyViaTypeahead = true; }
  R.keyboardBusy = { value: await ev(`document.getElementById('busy-select').value`), ...(await snap()) };
  let tabs = 0;
  await ev(`document.getElementById('busy-select').focus()`);
  while (tabs < 40 && !(await ev(`document.activeElement.matches('#record-list input[type=checkbox]')`))) { await key("Tab", "Tab", 9); tabs++; }
  R.tabsToFirstRecord = tabs;
  const sel0 = (await snap()).checked;
  await key(" ", "Space", 32, { text: " " });
  await sleep(200);
  R.spaceToggle = { before: sel0, after: (await snap()).checked, selectedLabel: (await snap()).selected, reviewCheck: (await snap()).reviewCheck };
  await key(" ", "Space", 32, { text: " " });
  await ev(`document.querySelector('input[name=radius][value="150"]').focus()`);
  const rowsAt150 = (await snap()).rows;
  await key("ArrowRight", "ArrowRight", 39);
  await sleep(300);
  R.keyboardRadiusArrow = { checked: await ev(`document.querySelector('input[name=radius]:checked').value`), rowsAt150, rowsAfter: (await snap()).rows };
  await ev(`document.querySelector('input[name=radius][value="150"]').click()`);

  // outside-Ward-8 flag: click the dashed marker
  await ev(`window.scrollTo(0, 0)`); await sleep(300);
  for (let z = 0; z < 6; z++) {
    const inView = await ev(`(() => { const e = [...document.querySelectorAll('.leaflet-interactive')].find(e => e.getAttribute('stroke-dasharray') === '2 3'); if (!e) return false; const r = e.getBoundingClientRect(), m = document.getElementById('map').getBoundingClientRect(); return r.left > m.left + 10 && r.right < m.right - 10 && r.top > m.top + 70 && r.bottom < m.bottom - 70; })()`);
    if (inView) break;
    await ev(`document.querySelector('.leaflet-control-zoom-out').click()`); await sleep(600);
  }
  const dashed = await ev(`(() => { const e = [...document.querySelectorAll('.leaflet-interactive')].find(e => e.getAttribute('stroke-dasharray') === '2 3'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  R.outsideMarker = dashed;
  if (dashed) { await click(dashed.x, dashed.y); await sleep(600); R.outsideFlag = { ...(await snap()), flagText: await ev(`document.querySelector('#record-list .flag')?.textContent ?? null`) }; await shot(`${name}-8-outside-flag`, mobile); }

  // outage: live refresh blocked, work preserved
  await ev(`document.getElementById('observation').value = ''`);
  const preserved = await snap();
  await send("Network.setBlockedURLs", { urls: ["*api/requests*"] });
  await ev(`document.getElementById('load-live').click()`);
  await sleep(1500);
  R.outage = { before: { rows: preserved.rows, selected: preserved.selected, title: preserved.title }, after: await snap() };
  await shot(`${name}-5-outage`, mobile);
  await send("Network.setBlockedURLs", { urls: [] });

  // practice case: fictional, no points
  await ev(`document.getElementById('load-demo').click()`);
  await sleep(1200);
  R.demo = await snap();
  await ev(`document.getElementById('confirm-review').click(); document.getElementById('brief-tab').click()`);
  await sleep(300);
  R.demoBrief = { ...(await briefInfo()), officialLinks: await ev(`document.querySelectorAll('#brief-paper a').length`) };
  await shot(`${name}-6-demo`, mobile);
  await ev(`document.getElementById('evidence-tab').click()`);

  // tile outage
  await send("Network.setBlockedURLs", { urls: ["*MapServer/tile*"] });
  await send("Page.navigate", { url: BASE });
  await waitFor(`document.querySelector('#freshness').textContent.includes('retrieved')`);
  await sleep(2500);
  R.tileOutage = await snap();
  await shot(`${name}-7-tile-outage`, mobile);
  await send("Network.setBlockedURLs", { urls: [] });
  R.logs = [...logs]; logs.length = 0;
}

await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
const only = process.argv[2];
if (!only || only === "1440") await emulate("d1440", 1440, 900, false);
if (!only || only === "390") await emulate("m390", 390, 844, true);
writeFileSync(`${OUT}/cdp-results.json`, JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
chrome.kill();
process.exit(0);
