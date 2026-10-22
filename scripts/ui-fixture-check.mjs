// Interface checks WITHOUT a backend: the real app, server and Chrome, with the Supabase SDK replaced by an in-page fake
// (scripts/support/fake-backend.mjs). It proves how the screens behave (focus, drafts during a save, error text, announcements,
// phone layout). It is NOT backend proof; the real-backend suites (test/*.integration.mjs, mission-browser-check.mjs) need the local stack.
// Usage: node scripts/ui-fixture-check.mjs   (OUT=<dir> for screenshots + results.json)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Browser as BaseBrowser, sleep } from "./support/browser.mjs";
import { FAKE_BACKEND_SOURCE, FAKE_COMMUNITY_ID } from "./support/fake-backend.mjs";
import { communityConfigFrom, createAppServer } from "../server.mjs";

const OUT = process.env.OUT ?? "docs/ui-review/b3-run";
mkdirSync(OUT, { recursive: true });
const checks = [];
const check = (name, ok, detail = "") => { checks.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 220) }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${String(detail).slice(0, 170)}` : ""}`); };

const server = createAppServer({ community: communityConfigFrom({ COMMUNITY_SUPABASE_URL: "http://127.0.0.1:1", COMMUNITY_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture" }) });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const BASE = `http://127.0.0.1:${server.address().port}/`;
class Browser extends BaseBrowser { constructor(name, port) { super(name, port, OUT); } }
const browser = await new Browser("fixture", 9481).start();

const active = () => browser.ev(`(() => { const a = document.activeElement; return a ? { tag: a.tagName, key: a.dataset?.focusKey ?? null, text: (a.textContent || '').slice(0, 60), id: a.id, postId: a.dataset?.postId ?? null } : null; })()`);
const setValue = (selector, value) => browser.ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const row = description => `[...document.querySelectorAll('#view-mission .task')].find(t => t.querySelector('.task-text strong')?.textContent === ${JSON.stringify(description)})`;
const rowStatus = description => browser.ev(`(${row(description)})?.querySelector('.task-status')?.textContent ?? null`);
const rowButton = (description, label) => `[...((${row(description)})?.querySelectorAll('.task-actions button') ?? [])].find(b => b.textContent === ${JSON.stringify(label)})`;
const announced = () => browser.ev(`document.getElementById('community-announce').textContent`);

try {
  await browser.send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE_BACKEND_SOURCE });
  await browser.viewport(1280, 900);
  await browser.goto(`${BASE}#/community`);
  check("the fake backend is what the page talks to (this run is interface-only)", await browser.ev(`typeof window.__fake === 'object' && window.supabase.createClient().auth !== undefined`));
  await browser.waitFor(`!document.getElementById('join-panel').hidden`, 10000);
  await browser.type("#join-name", "Ada"); await browser.press("Enter");
  check("joining shows the community", await browser.waitFor(`!document.getElementById('member-area').hidden`, 10000) !== null);
  await browser.ev(`window.__fake.join('u-ben', 'Ben')`);

  // a discussion post to start the mission from
  await browser.type("#composer-body", "Dumping keeps piling up at the corner of Naylor Rd");
  await browser.click("#composer-submit");
  check("a discussion post appears", await browser.waitFor(`document.querySelector('#feed .post-body')?.textContent.includes('Dumping keeps piling up')`, 5000) !== null);
  const sourcePostId = await browser.ev(`document.querySelector('#feed .post').dataset.postId`);

  // route changes move focus to the new screen's heading and retitle the page
  await browser.ev(`document.querySelector('.section-nav a[data-view="missions"]').click()`);
  await browser.waitFor(`location.hash.endsWith('/missions')`, 3000);
  await sleep(150);
  let at = await active();
  check("opening Missions moves focus to its heading", at?.tag === "H1" && at.text === "Missions", JSON.stringify(at));
  check("the page title names the screen", (await browser.ev(`document.title`)).startsWith("Missions"), await browser.ev(`document.title`));

  // start from the post: validation errors clear as the fields are fixed
  await browser.ev(`location.hash = '#/community/${FAKE_COMMUNITY_ID}/missions/new?post=${sourcePostId}'`);
  await browser.waitFor(`document.getElementById('create-mission')`, 3000); await sleep(150);
  at = await active();
  check("Start a mission opens with focus on its heading", at?.tag === "H1" && /Start a mission/.test(at.text), JSON.stringify(at));
  await browser.click("#create-mission"); await sleep(200);
  const errorsBefore = await browser.count("#view-new .form-error");
  check("submitting without a title and place shows both errors", errorsBefore === 2, `errors=${errorsBefore}`);
  check("the title field is marked invalid", await browser.ev(`document.getElementById('f-nm-title').getAttribute('aria-invalid') === 'true'`));
  await browser.type("#f-nm-title", "Clean the Naylor Rd corner"); await sleep(100);
  check("fixing the title removes its error and its invalid mark", (await browser.ev(`!document.getElementById('f-nm-title-err') && !document.getElementById('f-nm-title').hasAttribute('aria-invalid')`)));
  check("the place error stays until the place is fixed", await browser.ev(`!!document.getElementById('f-nm-location-err')`));
  await browser.type("#f-nm-location", "1900 block of Naylor Rd SE"); await sleep(100);
  check("fixing the place clears the last error", (await browser.count("#view-new .form-error")) === 0);
  await browser.type("#f-nm-tasks", "Bring bags\nPhotograph the site");
  await browser.click("#create-mission");
  check("the mission is created and opens", await browser.waitFor(`document.querySelector('#view-mission h1#mission-title')`, 5000) !== null);
  await sleep(200);
  at = await active();
  check("the mission screen takes focus on its heading", at?.tag === "H1" && at.id === "mission-title", JSON.stringify(at));
  check("the mission links back to the post it came from", await browser.ev(`!!document.querySelector('#view-mission .source-link a') && document.querySelector('#view-mission .source-link').textContent.includes('Dumping keeps piling up')`));
  await browser.shot("fixture-mission-desktop");
  await browser.click("#view-mission .source-link a");
  await browser.waitFor(`location.hash.includes('?post=')`, 3000); await sleep(250);
  at = await active();
  check("the link returns to the original post and focuses it", at?.postId === sourcePostId, JSON.stringify(at));
  await browser.ev(`history.back()`); await browser.waitFor(`document.querySelector('#view-mission h1#mission-title')`, 3000);

  // another member joins and claims: announced to screen readers without moving the viewer's focus
  const missionId = await browser.ev(`window.__fake.db.missions[0].id`);
  const bagsId = await browser.ev(`window.__fake.db.mission_tasks.find(t => t.description === 'Bring bags').id`);
  await browser.ev(`(async () => { await window.__fake.as('u-ben', 'join_mission', { p_mission: ${JSON.stringify(missionId)} }); await window.__fake.as('u-ben', 'claim_task', { p_task: ${JSON.stringify(bagsId)} }); })()`);
  check("a remote claim shows on the open screen", await browser.waitFor(`(${row("Bring bags")})?.querySelector('.task-status')?.textContent.includes('Claimed by Ben')`, 5000) !== null);
  const said = await browser.waitFor(`/Ben claimed/.test(document.getElementById('community-announce').textContent)`, 3000);
  check("the claim and the join are announced", said !== null, await announced());

  // the organizer marks Ben's job done: the label does not credit Ben as the reporter
  await browser.ev(`(${rowButton("Bring bags", "Mark done")}).click()`);
  await browser.waitFor(`(${row("Bring bags")})?.querySelector('.task-status')?.textContent.includes('Reported done')`, 3000);
  const status = await rowStatus("Bring bags");
  check("an organizer-marked job reads 'Reported done · claimed by Ben', not 'reported by Ben'", /Reported done/.test(status) && /claimed by Ben/.test(status) && !/reported by/i.test(status), status);
  check("the Mark not done control is offered", await browser.ev(`!!(${rowButton("Bring bags", "Mark not done")})`));

  // Add job: text typed while the save is pending survives it
  const release = await browser.ev(`(() => { window.__release = window.__fake.hold('add_task'); return true; })()`);
  await browser.type("#f-job-" + missionId + "-desc".replace(/[^a-z0-9]/gi, "-"), "First extra job").catch(() => {});
  const descSelector = await browser.ev(`document.querySelector('.mini-form textarea, .mini-form input[type=text]')?.id ?? null`);
  await browser.type(`#${descSelector}`, "First extra job");
  await browser.ev(`document.querySelector('.mini-form button[type=submit]').click()`);
  await sleep(150);
  check("the Add job button shows it is working", (await browser.ev(`document.querySelector('.mini-form button[type=submit]').textContent`)) === "Adding…");
  await browser.type(`#${descSelector}`, "Second job I started typing meanwhile");
  await browser.ev(`window.__release()`);
  await browser.waitFor(`[...document.querySelectorAll('#view-mission .task-text strong')].some(e => e.textContent === 'First extra job')`, 4000);
  await sleep(200);
  check("the first job was added", await browser.ev(`[...document.querySelectorAll('#view-mission .task-text strong')].some(e => e.textContent === 'First extra job')`));
  check("the newer text typed during the save is still in the field", (await browser.ev(`document.getElementById(${JSON.stringify(descSelector)}).value`)) === "Second job I started typing meanwhile");
  check("and still in the saved draft", await browser.ev(`Object.values(JSON.parse(localStorage.getItem('blockops.drafts.${FAKE_COMMUNITY_ID}') || '{}')).includes('Second job I started typing meanwhile')`));

  // keyboard focus stays on the second action of a job through a live update
  await browser.ev(`(${rowButton("Photograph the site", "Claim this job")}).click()`);
  await browser.waitFor(`!!(${rowButton("Photograph the site", "Release job")})`, 3000);
  await browser.ev(`(${rowButton("Photograph the site", "Release job")}).focus()`);
  const before = await active();
  await browser.ev(`window.__fake.as('u-ben', 'create_post', { p_community: ${JSON.stringify(FAKE_COMMUNITY_ID)}, p_mission: ${JSON.stringify(missionId)}, p_body: 'Ben says hi', p_operation: 'x', p_kind: 'update' })`);
  await browser.waitFor(`[...document.querySelectorAll('#mission-feed .post-body')].some(e => e.textContent === 'Ben says hi')`, 5000);
  await sleep(200);
  const after = await active();
  check("a live update keeps keyboard focus on the Release job control", before?.text === "Release job" && after?.key === before.key && after?.text === "Release job", `${before?.key} -> ${after?.key}`);
  await browser.ev(`(${rowButton("Photograph the site", "Release job")}).click()`);
  await sleep(300);
  at = await active();
  check("after releasing, focus lands on a control in the same job rather than the page top", at?.tag === "BUTTON" && /Claim this job/.test(at.text), JSON.stringify(at));

  // a participant who finished a job and then left the mission is not offered an undo the database would refuse
  const other = await browser.ev(`(async () => { const r = await window.__fake.as('u-ben', 'create_mission', { p_community: ${JSON.stringify(FAKE_COMMUNITY_ID)}, p_title: 'Ben mission', p_objective: 'Sweep the lot', p_location: 'Lot 4', p_origin: 'discussion', p_source: null, p_evidence: [], p_tasks: [{ description: 'Sweep the lot' }], p_observations: [] }); return r.data.id; })()`);
  await browser.ev(`location.hash = '#/community/${FAKE_COMMUNITY_ID}/mission/${other}'`);
  await browser.waitFor(`document.querySelector('[data-focus-key^="join:"]')`, 4000);
  await browser.ev(`document.querySelector('[data-focus-key^="join:"]').click()`);
  await browser.waitFor(`!!(${rowButton("Sweep the lot", "Claim this job")})`, 4000);
  await browser.ev(`(${rowButton("Sweep the lot", "Claim this job")}).click()`);
  await browser.waitFor(`!!(${rowButton("Sweep the lot", "Mark done")})`, 4000);
  await browser.ev(`(${rowButton("Sweep the lot", "Mark done")}).click()`);
  check("a current participant can undo their own finished job", await browser.waitFor(`!!(${rowButton("Sweep the lot", "Mark not done")})`, 4000) !== null);
  await browser.ev(`document.querySelector('[data-focus-key^="leave:"]').click()`);
  await browser.waitFor(`document.querySelector('[data-focus-key^="leave-yes:"]')`, 3000);
  await browser.ev(`document.querySelector('[data-focus-key^="leave-yes:"]').click()`);
  await browser.waitFor(`!!document.querySelector('[data-focus-key^="join:"]')`, 4000);
  await sleep(300);
  const departed = await browser.ev(`({ status: (${row("Sweep the lot")})?.querySelector('.task-status')?.textContent, buttons: [...(${row("Sweep the lot")}).querySelectorAll('.task-actions button')].map(b => b.textContent) })`);
  check("after leaving, the finished job keeps its attribution but offers no Mark not done", /Reported done/.test(departed.status) && departed.buttons.length === 0, JSON.stringify(departed));

  // phone layouts, on the organizer's mission: the tallest header (source post link, organizer leave note)
  await browser.ev(`location.hash = '#/community/${FAKE_COMMUNITY_ID}/mission/${missionId}'`);
  await browser.waitFor(`document.querySelector('#view-mission h1#mission-title')?.textContent === 'Clean the Naylor Rd corner'`, 4000);
  for (const [width, height] of [[390, 844], [320, 640]]) {
    await browser.viewport(width, height, true);
    await sleep(250);
    check(`no horizontal scrolling on the mission screen at ${width}px`, !(await browser.ev(`document.documentElement.scrollWidth > window.innerWidth + 1`)));
    const small = await browser.ev(`[...document.querySelectorAll('#view-mission button, #view-mission a.button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 36 || r.width < 36); }).map(e => e.textContent.trim()).slice(0, 5)`);
    check(`controls are tappable at ${width}px`, small.length === 0, small.join(" | "));
    await browser.ev(`window.scrollTo(0, 0)`);
    const view = await browser.ev(`(() => { const rect = id => document.getElementById(id)?.getBoundingClientRect(); const task = document.querySelector('#view-mission .task'); return { height: innerHeight, jobsHeading: Math.round(rect('jobs-h')?.top ?? -1), firstJobTitleBottom: Math.round(task?.querySelector('strong')?.getBoundingClientRect().bottom ?? -1) }; })()`);
    console.log(`measure ${width}x${height}:`, JSON.stringify(view));
    check(`the first job is readable on the first screen at ${width}x${height}`, view.jobsHeading > 0 && view.firstJobTitleBottom > 0 && view.firstJobTitleBottom <= view.height, JSON.stringify(view));
    await browser.shot(`fixture-mission-${width}`);
  }
  check("no page errors or console warnings during the run", browser.logs.length === 0, browser.logs.slice(0, 3).join(" | "));
} catch (error) {
  check("the run completed", false, error.stack ?? error);
} finally {
  const failed = checks.filter(item => !item.ok);
  writeFileSync(join(OUT, "fixture-results.json"), JSON.stringify({ kind: "interface-only, fake in-page backend, NOT backend proof", date: new Date().toISOString(), total: checks.length, failed: failed.length, checks }, null, 2));
  console.log(`\n${checks.length - failed.length}/${checks.length} interface checks passed (fake backend)`);
  browser.close(); server.close();
  process.exitCode = failed.length ? 1 : 0;
}
