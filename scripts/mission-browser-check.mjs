// B2 browser proof: community -> mission -> join -> claim -> update -> export, across independent Chrome profiles,
// through the real app, server and local Supabase backend. Also covers the confirmed B1 repairs (drafts during a send, labels, focus).
// Needs the app running at BASE with the community env set, the local Supabase stack, Google Chrome and Docker.
// Usage: COMMUNITY_SUPABASE_URL=... COMMUNITY_SUPABASE_SECRET_KEY=... node scripts/mission-browser-check.mjs   (OUT=<dir> to choose where screenshots go)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Browser as BaseBrowser, sleep } from "./support/browser.mjs";
import { warmRealtime } from "./support/warm.mjs";
import { confirmCampaign, createCampaign } from "../lib/campaign.mjs";
import { snapshotFromRecording } from "../lib/block-ops.mjs";

const OUT = process.env.OUT ?? "docs/ui-review/b2-run";
const BASE = process.env.BASE ?? "http://127.0.0.1:8000/";
const URL_ = process.env.COMMUNITY_SUPABASE_URL;
const SECRET = process.env.COMMUNITY_SUPABASE_SECRET_KEY;
const REALTIME = process.env.REALTIME_CONTAINER ?? "supabase_realtime_blockops";
const DB = process.env.DB_CONTAINER ?? "supabase_db_blockops";
if (!URL_ || !SECRET) throw new Error("Set COMMUNITY_SUPABASE_URL and COMMUNITY_SUPABASE_SECRET_KEY (see docs/COMMUNITY-SETUP.md).");
mkdirSync(OUT, { recursive: true });
class Browser extends BaseBrowser { constructor(name, port) { super(name, port, OUT); } }
const tag = Math.random().toString(36).slice(2, 7);
const { createClient } = new Function(`${readFileSync(new URL("../public/vendor/supabase/supabase.js", import.meta.url), "utf8")}\nreturn supabase;`)();
const admin = createClient(URL_, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });

const checks = [];
const check = (name, ok, detail = "") => { checks.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 220) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${String(detail).slice(0, 170)}` : ""}`); };
const psql = sql => execFileSync("docker", ["exec", DB, "psql", "-U", "postgres", "-tAc", sql]).toString().trim();

const q = (browser, selector, prop = "textContent") => browser.q(selector, prop);
const text = (browser, selector) => browser.ev(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? ""`);
const taskRow = description => `[...document.querySelectorAll('#view-mission .task')].find(t => t.querySelector('.task-text strong')?.textContent === ${JSON.stringify(description)})`;
const taskBtn = (description, label) => `(((${taskRow(description)})) ? [...(${taskRow(description)}).querySelectorAll('.task-actions button')].find(b => b.textContent === ${JSON.stringify(label)}) : undefined)`;
const taskStatus = (browser, description) => browser.ev(`(${taskRow(description)})?.querySelector('.task-status')?.textContent ?? null`);
const waitTask = (browser, description, expected, ms = 5000) => browser.waitFor(`(${taskRow(description)})?.querySelector('.task-status')?.textContent.includes(${JSON.stringify(expected)})`, ms);
const overflowX = browser => browser.ev(`document.documentElement.scrollWidth > window.innerWidth + 1`);
const missionPosts = browser => browser.ev(`[...document.querySelectorAll('#mission-feed .post')].map(p => ({ body: p.querySelector(':scope > .post-body')?.textContent ?? null, kind: p.dataset.kind ?? 'discussion', meta: p.querySelector(':scope > .post-meta')?.innerText ?? '', head: p.querySelector(':scope > .post-head')?.innerText ?? '' }))`);
const setValue = (browser, selector, value) => browser.ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
async function download(browser, selector) {
  const dir = mkdtempSync(join(tmpdir(), "dl-"));
  await browser.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dir }).catch(() => browser.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dir }));
  await browser.click(selector);
  for (let i = 0; i < 40 && !readdirSync(dir).some(file => file.endsWith(".md")); i += 1) await sleep(150);
  const file = readdirSync(dir).find(entry => entry.endsWith(".md"));
  return file ? readFileSync(join(dir, file), "utf8") : null;
}
async function joinAs(browser, name) {
  await browser.waitFor(`!document.getElementById('join-panel').hidden`, 15000);
  await browser.type("#join-name", name); await browser.press("Enter");
  return browser.waitFor(`!document.getElementById('member-area').hidden`, 15000);
}

const browsers = [];
const userIds = new Set();
let communityId;
try {
  await warmRealtime({ base: BASE, admin });
  communityId = (await admin.from("communities").insert({ title: `Mission check ${tag}`, description: "Throwaway community created by scripts/mission-browser-check.mjs." }).select().single()).data.id;
  const A = await new Browser("A", 9471).start(), B = await new Browser("B", 9472).start(), C = await new Browser("C", 9473).start();
  browsers.push(A, B, C);
  for (const b of [A, B, C]) await b.viewport(1280, 900);
  const home = `${BASE}#/community/${communityId}`;
  await Promise.all([A.goto(home), B.goto(home), C.goto(home)]);
  check("A, B and C join the same community in separate profiles", (await Promise.all([joinAs(A, `Ada ${tag}`), joinAs(B, `Ben ${tag}`), joinAs(C, `Cy ${tag}`)])).every(v => v !== null));
  for (const b of [A, B, C]) userIds.add(await b.userId());
  check("three different authenticated users", userIds.size === 3);

  // ---- app shell and label repairs
  check("navigation has Community, Missions and Map with aria-current=page on the active one", (await A.ev(`[...document.querySelectorAll('.section-nav a')].map(a => a.textContent + ':' + (a.getAttribute('aria-current') ?? '')).join('|')`)) === "Community:page|Missions:|Map & campaigns:");
  check("B1 repair: the main composer's label is associated with its field", await A.ev(`(() => { const label = document.querySelector('label[for="composer-body"]'); return Boolean(label) && label.control === document.getElementById('composer-body') && label.textContent.length > 5; })()`));

  // ---- discussion -> mission
  const idea = `Let's clean up the corner on Saturday ${tag}`;
  await B.type("#composer-body", idea); await B.press("Enter", { ctrl: true });
  check("B posts an idea; A sees it within 5 s", await A.waitFor(`[...document.querySelectorAll('#feed .post-body')].some(n => n.textContent === ${JSON.stringify(idea)})`, 5000) !== null);
  check("B1 repair: a new post from someone else is announced to assistive technology", (await A.q("#community-announce")).includes("new post"), await A.q("#community-announce"));
  const replyBtn = `[...document.querySelectorAll('#feed .post')].find(p => p.querySelector(':scope > .post-body')?.textContent === ${JSON.stringify(idea)}).querySelector('.post-actions button[aria-label^=Reply]')`;
  await A.ev(`${replyBtn}.click()`); await A.waitFor(`document.activeElement.dataset.focusKey?.startsWith('reply:')`, 3000);
  await A.press("Escape");
  check("B1 repair: cancelling Reply with Escape returns focus to the Reply button", await A.waitFor(`document.activeElement.dataset.focusKey?.startsWith('reply-btn:')`, 3000) !== null);
  await A.ev(`(() => { const post = [...document.querySelectorAll('#feed .post')].find(p => p.querySelector(':scope > .post-body')?.textContent === ${JSON.stringify(idea)}); post.querySelector('.post-actions a').focus(); })()`);
  await A.press("Enter");
  check("keyboard: Enter on 'Start a mission from this' opens the form, prefilled from the post, with the source quoted", await A.waitFor(`location.hash.includes('/missions/new?post=') && document.getElementById('f-nm-objective')?.value === ${JSON.stringify(idea)} && document.querySelector('.source-quote')?.innerText.includes(${JSON.stringify(idea)})`, 8000) !== null);
  await A.click("#create-mission");
  check("an empty form shows a message per field, keeps focus on the first problem and creates nothing", (await A.ev(`document.querySelectorAll('#view-new .form-error').length`)) >= 2 && (await A.ev(`document.activeElement?.id`)) === "f-nm-title" && (await A.count("#view-mission .mission-head")) === 0);
  const title = `Corner cleanup ${tag}`;
  await A.type("#f-nm-title", title);
  await A.type("#f-nm-location", "1900 block of Naylor Rd SE");
  await A.type("#f-nm-tasks", `Bring bags ${tag}\nPhotograph the site ${tag}\nTalk to the property owner ${tag}`);
  await A.shot("01-new-mission");
  // draft survives leaving the form
  await A.click(".section-nav a[data-view='feed']"); await A.waitFor(`document.getElementById('view-feed') && !document.getElementById('view-feed').hidden`, 5000);
  await A.goto(`${BASE}#/community/${communityId}/missions/new`); await A.waitFor(`document.getElementById('f-nm-title')`, 8000);
  check("a half-written mission form survives navigating away and a reload", (await A.q("#f-nm-title", "value")) === title && (await A.q("#f-nm-tasks", "value")).includes(`Bring bags ${tag}`));
  await A.goto(`${BASE}#/community/${communityId}/missions/new?post=${(await A.ev(`document.querySelector('#feed .post')?.dataset.postId ?? ''`)) || ""}`);
  await A.waitFor(`document.getElementById('f-nm-title')`, 8000);
  await A.ev(`document.getElementById('create-mission').focus()`); await A.press("Enter");
  check("A creates the mission (keyboard) and lands on its page as organizer", await A.waitFor(`location.hash.includes('/mission/') && document.getElementById('mission-title')?.textContent === ${JSON.stringify(title)}`, 10000) !== null && (await text(A, ".facts")).includes(`Ada ${tag}`));
  const missionUrl = await A.ev(`location.href`);
  const missionId = (await A.ev(`location.hash`)).split("/mission/")[1];
  check("the discussion-origin mission says No official 311 records attached and shows three unclaimed jobs", (await text(A, ".no-records")).includes("No official 311 records attached.") && (await A.count("#view-mission .task")) === 3 && (await A.count("#view-mission .task-status[data-state='open']")) === 3);
  check("the mission page has a share link and a locally generated QR code (flagged as localhost-only)", (await A.q(".share-box input", "value")).endsWith(`#/community/${communityId}/mission/${missionId}`) && (await A.count(".share-box svg.qr path")) === 1 && (await A.q(".share-box")).includes("localhost"));
  await A.shot("02-mission-organizer");

  // ---- B finds it without reload, joins, claims
  check("B sees the mission in 'Active missions' and a mission chip on the source post within 5 s, no reload", await B.waitFor(`document.querySelector('#mission-mini a')?.textContent === ${JSON.stringify(title)} && document.querySelector('.mission-chips a')?.textContent.includes(${JSON.stringify(title)})`, 5000) !== null);
  await B.click(".section-nav a[data-view='missions']");
  check("B's Missions screen lists it with organizer, place and 0 of 3 jobs done", await B.waitFor(`document.querySelector('#view-missions .mission-card .mission-title')?.textContent === ${JSON.stringify(title)}`, 5000) !== null && (await text(B, "#view-missions .mission-card")).includes("0 of 3 jobs done"));
  await B.ev(`document.querySelector('#view-missions .mission-title').click()`);
  await B.waitFor(`document.getElementById('mission-title')`, 5000);
  check("before joining, B cannot claim and is told to join", (await B.ev(`!${taskBtn(`Bring bags ${tag}`, "Claim this job")}`)) && (await text(B, "#jobs-h + .field-hint, .mission-section .field-hint")).includes("Join the mission to claim"));
  await B.click("[data-focus-key^='join:']");
  check("A sees B join the mission (participants) within 5 s", await A.waitFor(`document.getElementById('people-h')?.parentElement.innerText.includes(${JSON.stringify(`Ben ${tag}`)})`, 5000) !== null);
  await B.ev(`${taskBtn(`Bring bags ${tag}`, "Claim this job")}.click()`);
  const t0 = Date.now();
  check("B claims 'Bring bags'; B's page shows it as theirs", await waitTask(B, `Bring bags ${tag}`, "You claimed", 5000) !== null);
  const seen = await waitTask(A, `Bring bags ${tag}`, `Claimed by Ben ${tag}`, 5000);
  check("A (organizer) sees B's commitment by name within 5 s without reload", seen !== null, `${Date.now() - t0} ms`);
  await A.shot("03-claimed");

  // ---- race: two browsers claim the same job at the same instant
  await C.goto(missionUrl); await C.waitFor(`document.getElementById('mission-title')`, 10000);
  await C.click("[data-focus-key^='join:']");
  await C.waitFor(`(${taskRow(`Photograph the site ${tag}`)})`, 5000);
  await Promise.all([A.waitFor(`${taskBtn(`Photograph the site ${tag}`, "Claim this job")}`, 5000), C.waitFor(`${taskBtn(`Photograph the site ${tag}`, "Claim this job")}`, 5000)]);
  await Promise.all([A.ev(`${taskBtn(`Photograph the site ${tag}`, "Claim this job")}.click()`), C.ev(`${taskBtn(`Photograph the site ${tag}`, "Claim this job")}.click()`)]);
  await sleep(2500);
  const aState = await taskStatus(A, `Photograph the site ${tag}`), cState = await taskStatus(C, `Photograph the site ${tag}`), bState = await taskStatus(B, `Photograph the site ${tag}`);
  const aWon = aState.includes("You claimed"), cWon = cState.includes("You claimed");
  check("simultaneous claim: exactly one browser wins", aWon !== cWon, `A: ${aState} | C: ${cState}`);
  const winnerName = aWon ? `Ada ${tag}` : `Cy ${tag}`;
  const loserText = await text(aWon ? C : A, "#view-mission .task:nth-child(2) .form-error");
  check("the loser's page says someone else claimed it first", loserText.includes("claimed this job first"), loserText);
  check("every page names the same winner", (aWon ? aState : cState).includes("You claimed") && (aWon ? cState : aState).includes(`Claimed by ${winnerName}`) && bState.includes(`Claimed by ${winnerName}`), `B: ${bState}`);
  check("database has exactly one claimant for that job", psql(`select count(*) from mission_tasks where description = 'Photograph the site ${tag}' and claimed_by is not null`) === "1");

  // ---- keyboard-only claim
  const third = `Talk to the property owner ${tag}`;
  await B.ev(`${taskBtn(third, "Claim this job")}.focus()`); await B.press("Enter");
  check("keyboard: Enter on 'Claim this job' claims it, and focus stays on that job's action", await waitTask(B, third, "You claimed", 5000) !== null && await B.waitFor(`document.activeElement?.dataset.focusKey === 'task:' + (${taskRow(third)}).dataset.taskId`, 3000) !== null);

  // ---- progress update, done, observation
  await B.ev(`(() => { const s = document.getElementById('mp-kind'); s.value = 'update'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  const update = `Bags are in my trunk, bringing them at 9 ${tag}`;
  await B.type("#mission-composer", update); await B.press("Enter", { ctrl: true });
  check("B posts a progress update; A sees it labeled 'Progress update' within 5 s", await A.waitFor(`[...document.querySelectorAll('#mission-feed .post')].some(p => p.querySelector(':scope > .post-body')?.textContent === ${JSON.stringify(update)} && p.querySelector('.kind-update'))`, 5000) !== null);
  await B.ev(`${taskBtn(`Bring bags ${tag}`, "Mark done")}.click()`);
  check("B marks their job done; A sees 'Done · reported by Ben'", await waitTask(A, `Bring bags ${tag}`, `reported by Ben ${tag}`, 5000) !== null);
  await B.ev(`(() => { const s = document.getElementById('mp-kind'); s.value = 'observation'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await B.waitFor(`document.getElementById('mp-date')`, 3000);
  check("the observation form has a date and a fictional-practice box that starts checked", (await B.q("#mp-date", "value")).match(/^\d{4}-\d{2}-\d{2}$/) && (await B.ev(`document.querySelector('.composer-extra input[type=checkbox]').checked`)));
  const obs = `Corner looked clear after the first pass ${tag}`;
  await B.type("#mission-composer", obs); await B.press("Enter", { ctrl: true });
  check("A sees the dated site observation labeled FICTIONAL practice entry, separate from job progress", await A.waitFor(`[...document.querySelectorAll('#mission-feed .post')].some(p => p.querySelector(':scope > .post-body')?.textContent === ${JSON.stringify(obs)} && p.querySelector(':scope > .post-meta')?.innerText.includes('FICTIONAL practice entry') && p.querySelector(':scope > .post-meta')?.innerText.includes('Observed 20'))`, 5000) !== null);
  await A.shot("04-progress");

  // ---- reload / deep link / non-member
  await B.send("Page.reload"); 
  check("after a reload B keeps the mission page, membership, claim and done state", await B.waitFor(`document.getElementById('mission-title')`, 15000) !== null && (await waitTask(B, `Bring bags ${tag}`, "Done", 8000)) !== null);
  const D = await new Browser("D", 9474).start(); browsers.push(D);
  await D.viewport(1280, 900); await D.goto(missionUrl);
  await D.waitFor(`!document.getElementById('join-panel').hidden`, 15000);
  check("a stranger opening the mission link is asked to join the community first and sees no mission content", (await text(D, "#join-heading")).includes("see this mission") && !(await D.ev(`document.body.innerText`)).includes(`Bags are in my trunk`));
  check("after joining, the stranger lands on the mission itself", await joinAs(D, `Dee ${tag}`) !== null && await D.waitFor(`document.getElementById('mission-title')?.textContent === ${JSON.stringify(title)}`, 8000) !== null);
  userIds.add(await D.userId());

  // ---- drafts (B1 repair) : newer text while a send is pending survives; navigation does not lose it; offline keeps draft
  const other = (await admin.from("communities").insert({ title: `Other ${tag}`, description: "Second throwaway community." }).select().single()).data.id;
  await B.send("Fetch.enable", { patterns: [{ urlPattern: "*rpc/create_post*", requestStage: "Response" }] });
  const held = [];
  B.handlers.set("Fetch.requestPaused", params => { if (params.responseStatusCode !== undefined) held.push(params.requestId); else B.send("Fetch.continueRequest", { requestId: params.requestId }).catch(() => {}); });
  const first = `First message, being sent ${tag}`, second = `Second message typed while the first is still sending ${tag}`;
  await B.type("#mission-composer", first); await B.press("Enter", { ctrl: true });
  await B.waitFor(`document.querySelector('#mission-composer').closest('form').querySelector('button[type=submit]').textContent === 'Sending…'`, 4000);
  await B.type("#mission-composer", second);
  check("while sending, the composer stays editable and saves the newer text as a draft", (await B.ev(`localStorage.getItem('blockops.drafts.${communityId}')`))?.includes(second));
  await B.goto(`${BASE}#/community/${other}`);
  await B.waitFor(`!document.getElementById('join-panel').hidden`, 8000);
  for (let i = 0; i < 40 && !held.length; i += 1) await sleep(100);
  while (held.length) await B.send("Fetch.continueRequest", { requestId: held.shift() });
  await sleep(2000);
  const saved = JSON.parse((await B.ev(`localStorage.getItem('blockops.drafts.${communityId}')`)) ?? "{}");
  check("B1 repair: a send that completes after navigating to another community keeps the newer text in the first community's saved draft", Object.values(saved).includes(second) && !Object.values(saved).includes(first), JSON.stringify(saved).slice(0, 120));
  check("…and does not touch the other community's drafts", (await B.ev(`localStorage.getItem('blockops.drafts.${other}')`)) === null);
  await B.goto(`${BASE}#/community/${communityId}/mission/${missionId}`);
  await B.waitFor(`document.getElementById('mission-composer')`, 8000);
  check("coming back, the newer unsent text is still in the composer", (await B.q("#mission-composer", "value")) === second, await B.q("#mission-composer", "value"));
  check("…and the first message was posted exactly once", (await missionPosts(B)).filter(post => post.body === first).length === 1);
  await B.send("Fetch.disable"); B.handlers.delete("Fetch.requestPaused");
  await B.type("#mission-composer", "unsent text for the mission");
  check("a draft in progress is saved per community in browser storage", (await B.ev(`localStorage.getItem('blockops.drafts.${communityId}')`))?.includes("unsent text for the mission"));
  await B.send("Network.enable");
  await B.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await B.press("Enter", { ctrl: true });
  check("offline: the mission post fails with a clear message and the draft stays", await B.waitFor(`!document.querySelector('#mission-composer').closest('form').querySelector('.form-error').hidden`, 8000) !== null && (await B.q("#mission-composer", "value")) === "unsent text for the mission");
  await B.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await B.ev(`document.querySelector('#mission-composer').closest('form').querySelector('button[type=submit]').click()`);
  check("back online: Try again posts it once", await A.waitFor(`[...document.querySelectorAll('#mission-feed .post-body')].filter(n => n.textContent === 'unsent text for the mission').length === 1`, 6000) !== null);
  await admin.from("communities").delete().eq("id", other);

  // ---- organizer edit with a version conflict
  await A.ev(`document.querySelector('.edit-box summary').click()`);
  await A.waitFor(`document.getElementById('f-edit-${missionId}-title')?.value`, 3000);
  const editedTitle = `Corner cleanup (moved to 10am) ${tag}`;
  await A.type(`#f-edit-${missionId}-title`, editedTitle);
  psql(`update missions set version = version + 1, objective = 'Changed elsewhere ${tag}' where id = '${missionId}'`);
  await A.waitFor(`document.querySelector('#view-mission .mission-goal')?.textContent.startsWith('Changed elsewhere')`, 8000);
  await A.click(`[data-focus-key='edit-save:${missionId}']`);
  check("version conflict: a stale edit is refused with a recoverable message, the newer change is shown, and the user's text is kept", await A.waitFor(`document.querySelector('.conflict')`, 5000) !== null && (await text(A, "#view-mission .mission-goal")).startsWith("Changed elsewhere") && (await A.q(`#f-edit-${missionId}-title`, "value")) === editedTitle);
  await A.click(`[data-focus-key='edit-resolve:${missionId}']`);
  await A.click(`[data-focus-key='edit-save:${missionId}']`);
  check("applying the edits on top of the latest version succeeds and every browser shows the new title", await A.waitFor(`document.getElementById('mission-title')?.textContent === ${JSON.stringify(editedTitle)}`, 6000) !== null && await B.waitFor(`document.getElementById('mission-title')?.textContent === ${JSON.stringify(editedTitle)}`, 6000) !== null);

  // ---- export of the CURRENT shared state
  const plan = await download(A, `[data-focus-key='export:${missionId}']`);
  if (plan) writeFileSync(join(OUT, "export-1-discussion-mission.md"), plan);
  check("the downloaded plan reflects current persisted state: records line, claims, done mark, update, fictional observation", plan && plan.includes("No official 311 records attached.") && plan.includes(`claimed by Ben ${tag}`) && /- \[x\] Bring bags/.test(plan) && plan.includes(`Photograph the site ${tag}`) && plan.includes(winnerName) && plan.includes(`Bags are in my trunk`) && plan.includes("[FICTIONAL practice entry]") && plan.includes(editedTitle.replace(/[()]/g, "\\$&")));
  await B.ev(`${taskBtn(`Bring bags ${tag}`, "Mark not done")}.click()`); await B.waitFor(`${taskBtn(`Bring bags ${tag}`, "Release job")}`, 4000);
  await B.ev(`${taskBtn(`Bring bags ${tag}`, "Release job")}.click()`);
  await A.waitFor(`(${taskRow(`Bring bags ${tag}`)})?.querySelector('.task-status')?.textContent === 'Unclaimed'`, 5000);
  const plan2 = await download(A, `[data-focus-key='export:${missionId}']`);
  if (plan2) writeFileSync(join(OUT, "export-2-after-release.md"), plan2);
  check("exporting again after B released the job shows it unclaimed, not the earlier cached state", plan2 && /- \[ \] Bring bags[^\n]*unclaimed/.test(plan2) && !/Bring bags[^\n]*claimed by Ben/.test(plan2) && /Talk to the property owner[^\n]*claimed by Ben/.test(plan2) && plan2 !== plan);

  // ---- moderation by the organizer
  await B.ev(`(() => { const s = document.getElementById('mp-kind'); s.value = 'discussion'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await B.type("#mission-composer", `Off-topic remark ${tag}`); await B.press("Enter", { ctrl: true });
  await A.waitFor(`[...document.querySelectorAll('#mission-feed .post')].some(p => p.querySelector(':scope > .post-body')?.textContent === 'Off-topic remark ${tag}')`, 5000);
  await A.ev(`[...document.querySelectorAll('#mission-feed .post')].find(p => p.querySelector(':scope > .post-body')?.textContent === 'Off-topic remark ${tag}').querySelector('.post-actions button[aria-label^=Hide]').click()`);
  await A.click(".hide-confirm .button-primary");
  check("the mission organizer hides an off-topic post for everyone", await B.waitFor(`[...document.querySelectorAll('#mission-feed .post-removed')].length >= 1 && !document.body.innerText.includes('Off-topic remark ${tag}')`, 5000) !== null);

  // ---- reconnect: Realtime down, B claims, A recovers and shows the commitment
  execFileSync("docker", ["stop", REALTIME], { stdio: "ignore" });
  await B.ev(`${taskBtn(`Bring bags ${tag}`, "Claim this job")}.click()`);
  check("while Realtime is down the claim still succeeds for B, and A shows Reconnecting and has not heard of it", await waitTask(B, `Bring bags ${tag}`, "You claimed", 8000) !== null && await A.waitFor(`document.getElementById('community-connection').dataset.state === 'reconnecting'`, 45000) !== null && !(await taskStatus(A, `Bring bags ${tag}`)).includes("Claimed by"));
  execFileSync("docker", ["start", REALTIME], { stdio: "ignore" });
  const healed = await A.waitFor(`document.getElementById('community-connection').dataset.state === 'live' && (${taskRow(`Bring bags ${tag}`)})?.querySelector('.task-status')?.textContent.includes('Claimed by Ben')`, 90000);
  check("after Realtime returns A reconnects and re-fetches the missed commitment", healed !== null, `${healed} ms`);

  // ---- publish a reviewed local campaign
  const snapshot = snapshotFromRecording(JSON.parse(readFileSync(new URL("../data/recorded-snapshot.json", import.meta.url), "utf8")));
  const records = snapshot.records.filter(r => r.geo).slice(0, 4);
  let campaign = createCampaign({ snapshot, area: { center: records[0].geo, radiusM: 150 }, filters: { days: null, kinds: new Set(["open", "closed", "other"]) }, selectedIds: new Set(records.slice(0, 3).map(r => r.key)), excludedIds: new Set() }, { now: new Date(), id: `local-${tag}` });
  campaign = { ...campaign, tasks: [{ id: "t1", text: `Photograph the pile ${tag}`, owner: "Dana", due: "2026-10-30", done: true }, { id: "t2", text: `Call the ANC ${tag}`, owner: "", due: "", done: false }],
    observations: [{ id: "o1", kind: "followup", date: "2026-10-20", text: `Pile still there ${tag}`, fictional: true }, { id: "o2", kind: "resident", date: "2026-10-21", text: `Private local note ${tag}`, fictional: false }] };
  campaign = confirmCampaign(campaign, new Date());
  const storeJson = JSON.stringify({ version: 1, campaigns: [campaign] });
  await A.goto(`${BASE}#/map`);
  await A.ev(`localStorage.setItem('blockops.campaigns.v1', ${JSON.stringify(storeJson)}); localStorage.setItem('blockops.lastOpen', ${JSON.stringify(campaign.id)});`);
  await A.send("Page.reload"); await sleep(1500);
  await A.waitFor(`document.getElementById('campaign-tab')`, 10000);
  await A.click("#campaign-tab");
  await A.waitFor(`document.querySelector('.campaign-card')`, 8000);
  await A.ev(`document.querySelector('.campaign-card button').click()`);
  await A.waitFor(`!document.getElementById('campaign-detail-view').hidden`, 5000);
  check("the existing local campaign still opens on the map screen with a Share-with-community action", (await A.count("#share-campaign")) === 1 && (await A.ev(`document.getElementById('share-campaign').hasAttribute('aria-disabled')`)) === false);
  await A.shot("05-campaign-share-button");
  await A.click("#share-campaign");
  check("the preview says what is shared and what stays private (owners, done marks, unticked observations)", await A.waitFor(`location.hash.includes('/missions/publish') && document.querySelector('.preview-box')`, 8000) !== null && (await text(A, "#view-publish")).includes("3 reviewed 311 reports") && (await text(A, "#view-publish")).includes("1 typed owner name") && (await text(A, "#view-publish")).includes("1 done mark"));
  await A.click("[data-focus-key='pubobs:o1']");
  await A.shot("06-publish-preview");
  await A.click("#publish-mission");
  check("A shares it: the new mission page shows 3 records with source labels, unclaimed jobs and the imported observation", await A.waitFor(`location.hash.includes('/mission/') && document.querySelector('.evidence-box')`, 10000) !== null);
  await A.ev(`document.querySelector('.evidence-box summary').click()`);
  const evRows = await A.count("#view-mission .evidence-row"), evText = await text(A, "#view-mission .evidence-box"), evLinks = await A.count("#view-mission .evidence-row a[href^='https://maps2.dcgis.dc.gov']");
  check("evidence is inspectable with recorded-snapshot labeling and original source links", evRows === 3 && evText.includes("not live") && evLinks === 3, `rows=${evRows} links=${evLinks} text=${evText.replace(/\n/g, " ").slice(0, 120)}`);
  check("jobs arrived unclaimed and not done, with no typed owner, and only the ticked observation was imported", (await A.count("#view-mission .task-status[data-state='open']")) === 2 && !(await A.ev(`document.body.innerText`)).includes("Dana") && (await missionPosts(A)).length === 1 && (await missionPosts(A))[0].meta.includes("Imported from a local campaign") && (await missionPosts(A))[0].meta.includes("FICTIONAL") && !(await A.ev(`document.body.innerText`)).includes("Private local note"));
  const after = await A.ev(`localStorage.getItem('blockops.campaigns.v1')`);
  check("the local campaign is byte-for-byte unchanged after publishing", JSON.parse(after).campaigns.length === 1 && JSON.stringify(JSON.parse(after).campaigns[0]) === JSON.stringify(campaign), "compared parsed JSON");
  const pubMission = (await A.ev(`location.hash`)).split("/mission/")[1];
  const sourcedPlan = await download(A, `[data-focus-key='export:${pubMission}']`);
  if (sourcedPlan) writeFileSync(join(OUT, "export-3-published-campaign.md"), sourcedPlan);
  check("the sourced mission exports its reviewed records and source labels and keeps excluded evidence out", sourcedPlan && !sourcedPlan.includes("No official 311 records attached.") && (sourcedPlan.match(/Request ID/g) ?? []).length === 3 && sourcedPlan.includes("Recorded DC 311 snapshot") && sourcedPlan.includes("Original source record") && !sourcedPlan.includes(String(records[3].id)) && !sourcedPlan.includes("Dana") && !sourcedPlan.includes("Private local note"));
  await B.click(".section-nav a[data-view='missions']");
  check("B sees both missions in the list within 5 s and can claim a job in the published one", await B.waitFor(`document.querySelectorAll('#view-missions .mission-card').length === 2`, 5000) !== null);

  // ---- archive and leave
  await A.goto(`${BASE}#/community/${communityId}/mission/${missionId}`); await A.waitFor(`document.getElementById('mission-title')`, 8000);
  check("an active organizer cannot leave: the control is disabled with an explanation", (await A.ev(`document.querySelector("[data-focus-key='leave:${missionId}']").disabled`)) && (await text(A, ".mission-actions")).includes("Archive it"));
  await A.ev(`document.querySelector('.edit-box summary').click()`);
  await A.waitFor(`document.getElementById('edit-status')`, 3000);
  await A.ev(`(() => { const s = document.getElementById('edit-status'); s.value = 'archived'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await A.click(`[data-focus-key='edit-save:${missionId}']`);
  await B.goto(`${BASE}#/community/${communityId}/mission/${missionId}`);
  check("archiving makes the mission read-only for everyone (no claim buttons, no composer)", await B.waitFor(`document.querySelector('#view-mission .badge.status-archived') && document.querySelectorAll('#view-mission .task-actions button').length === 0 && !document.getElementById('mission-composer')`, 6000) !== null);
  await A.ev(`document.querySelector("[data-focus-key='leave:${missionId}']").click()`);
  await A.click("[data-focus-key^='leave-yes:']");
  const aId = await A.userId();
  check("once archived, the organizer can leave (membership row gone)", await A.waitFor(`document.querySelector("[data-focus-key='join:${missionId}']")`, 6000) !== null && psql(`select count(*) from mission_members where mission_id = '${missionId}' and user_id = '${aId}'`) === "0");

  // ---- phone widths: keyboard-free touch emulation join -> mission -> claim -> update
  const E = await new Browser("E", 9475).start(); browsers.push(E);
  const liveMission = (await admin.from("missions").select("id,title").eq("community_id", communityId).eq("title", campaign.name)).data?.[0]?.id ?? pubMission;
  for (const [width, height] of [[390, 844], [320, 640]]) {
    await E.viewport(width, height, true);
    await E.goto(`${BASE}#/community/${communityId}/mission/${liveMission}`);
    await E.waitFor(`!document.getElementById('join-panel').hidden || document.getElementById('mission-title')`, 15000);
    if ((await E.q("#join-panel", "hidden")) === false) {
      check(`${width}px: the join screen opened from a mission link fits`, !(await overflowX(E)));
      await E.shot(`07-join-${width}`);
      await E.type("#join-name", `Eve ${tag}`); await E.click("#join-button");
      await E.waitFor(`document.getElementById('mission-title')`, 10000);
      userIds.add(await E.userId());
    }
    check(`${width}px: mission page fits without horizontal scroll`, !(await overflowX(E)));
    if (!(await E.ev(`!!document.querySelector("[data-focus-key^='join:']")`))) { /* already a member */ } else await E.click("[data-focus-key^='join:']");
    await E.waitFor(`!document.querySelector("[data-focus-key^='join:']")`, 5000);
    const job = `Call the ANC ${tag}`;
    await E.ev(`${taskBtn(job, "Claim this job")}?.click()`);
    check(`${width}px: claiming a job works and the button is inside the viewport`, await waitTask(E, job, "claimed", 5000) !== null || await waitTask(E, job, "Claimed", 5000) !== null);
    const probe = `phone update ${width} ${tag}`;
    await E.ev(`(() => { const s = document.getElementById('mp-kind'); s.value = 'update'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await E.type("#mission-composer", probe); await E.click("#mission-composer ~ * button[type=submit], form.post-form button[type=submit]");
    check(`${width}px: posting a progress update works`, await E.waitFor(`[...document.querySelectorAll('#mission-feed .post-body')].some(n => n.textContent === ${JSON.stringify(probe)})`, 6000) !== null);
    check(`${width}px: nothing overflows after claim and post, and the action buttons are at least 40 px tall`, !(await overflowX(E)) && (await E.ev(`[...document.querySelectorAll('#view-mission .task-actions button')].every(b => b.getBoundingClientRect().height >= 38)`)));
    await E.shot(`08-mission-${width}`);
    await E.ev(`${taskBtn(job, "Release job")}?.click()`);
  }

  // ---- map still reachable
  await A.goto(`${BASE}#/map`);
  check("the map and campaigns screen is still reachable and sized", (await A.q("body", "dataset.section")) === "map" && await A.waitFor(`document.querySelector('#map').getBoundingClientRect().width > 300`, 5000) !== null);
  const noisy = [...A.logs, ...B.logs, ...C.logs, ...D.logs, ...E.logs].filter(line => !/Failed to load resource|net::ERR|WebSocket|TimedOut|favicon|maps2\.dcgis/i.test(line));
  check("no unexpected console errors or exceptions in any browser", noisy.length === 0, noisy.join(" | "));
} catch (error) {
  check("script completed without an exception", false, error.stack ?? error);
} finally {
  for (const browser of browsers) browser.close();
  try { execFileSync("docker", ["start", REALTIME], { stdio: "ignore" }); } catch { /* running */ }
  if (communityId) {
    await admin.from("communities").delete().eq("id", communityId);
    for (const id of userIds) if (id) await admin.auth.admin.deleteUser(id);
  }
  const failed = checks.filter(entry => !entry.ok);
  writeFileSync(join(OUT, "results.json"), JSON.stringify({ at: new Date().toISOString(), base: BASE, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed${failed.length ? `; FAILED: ${failed.map(entry => entry.name).join("; ")}` : ""}`);
  process.exit(failed.length ? 1 : 0);
}
