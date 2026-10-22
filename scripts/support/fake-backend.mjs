// An in-page stand-in for the Supabase browser SDK, used ONLY to check what the interface does (focus, drafts, error text, announcements)
// when no real backend is running. It re-implements just enough of the rpc/table behavior to drive the screens.
// It is NOT backend proof: permissions, races and persistence are tested against the real local stack (test/*.integration.mjs).
export const FAKE_COMMUNITY_ID = "b10c0000-0000-4000-8000-000000000001";

export const FAKE_BACKEND_SOURCE = `(() => {
  const CID = ${JSON.stringify(FAKE_COMMUNITY_ID)};
  let seq = 0;
  const now = () => new Date(Date.UTC(2026, 9, 21, 12, 0, 0) + (++seq) * 1000).toISOString();
  const id = () => "00000000-0000-4000-8000-" + String(++seq + 100000).padStart(12, "0");
  const db = { communities: [{ id: CID, title: "Fixture neighbors", description: "Fake in-page backend for interface checks.", is_demo: false, moderator_id: "u-ada" }], community_members: [], posts: [], missions: [], mission_members: [], mission_tasks: [] };
  const listeners = new Set();
  const notify = () => setTimeout(() => listeners.forEach(fn => fn()), 20);
  const holds = new Map(); // rpc name -> promise that resolves when released
  const fail = message => ({ data: null, error: { message } });
  const names = new Proxy({}, { get: (_, actor) => db.community_members.find(m => m.user_id === actor)?.display_name ?? actor, set: () => true });

  const handlers = {
    community_preview: (actor, a) => ({ data: [{ id: CID, title: db.communities[0].title, description: db.communities[0].description, is_demo: false, member_count: db.community_members.length }] }),
    join_community: (actor, a) => {
      let row = db.community_members.find(m => m.user_id === actor);
      if (!row) { row = { community_id: a.p_community, user_id: actor, display_name: a.p_display_name, joined_at: now() }; db.community_members.push(row); } else row.display_name = a.p_display_name;
      return { data: row };
    },
    create_post: (actor, a) => {
      const row = { id: id(), community_id: a.p_community, mission_id: a.p_mission, parent_id: a.p_parent, author_id: actor, author_name: names[actor], body: a.p_body, kind: a.p_kind || "discussion", observed_on: a.p_observed_on, fictional: !!a.p_fictional, imported: false, hidden_at: null, edited_at: null, created_at: now() };
      db.posts.push(row); return { data: row };
    },
    create_mission: (actor, a) => {
      const row = { id: id(), community_id: a.p_community, organizer_id: actor, organizer_name: names[actor], title: a.p_title, objective: a.p_objective, location_text: a.p_location, starts_at: a.p_starts_at, status: "planning", origin: a.p_origin, source_post_id: a.p_source_post, source: a.p_source, evidence: a.p_evidence, version: 1, activity_at: now(), created_at: now() };
      db.missions.push(row);
      db.mission_members.push({ mission_id: row.id, community_id: row.community_id, user_id: actor, display_name: names[actor], joined_at: now() });
      (a.p_tasks || []).forEach((t, i) => db.mission_tasks.push({ id: id(), mission_id: row.id, community_id: row.community_id, description: t.description, due_date: t.due || null, position: i + 1, claimed_by: null, claimed_name: null, claimed_at: null, done: false, done_at: null, imported: false, created_at: now() }));
      return { data: row };
    },
    join_mission: (actor, a) => {
      const mission = db.missions.find(m => m.id === a.p_mission);
      let row = db.mission_members.find(m => m.mission_id === a.p_mission && m.user_id === actor);
      if (!row) { row = { mission_id: a.p_mission, community_id: mission.community_id, user_id: actor, display_name: names[actor], joined_at: now() }; db.mission_members.push(row); }
      return { data: row };
    },
    add_task: (actor, a) => {
      const mission = db.missions.find(m => m.id === a.p_mission);
      const row = { id: id(), mission_id: a.p_mission, community_id: mission.community_id, description: a.p_description, due_date: a.p_due || null, position: db.mission_tasks.length + 1, claimed_by: null, claimed_name: null, claimed_at: null, done: false, done_at: null, imported: false, created_at: now() };
      db.mission_tasks.push(row); return { data: row };
    },
    claim_task: (actor, a) => {
      const task = db.mission_tasks.find(t => t.id === a.p_task);
      if (task.claimed_by && task.claimed_by !== actor) return fail("already_claimed");
      Object.assign(task, { claimed_by: actor, claimed_name: names[actor], claimed_at: now() }); return { data: task };
    },
    release_task: (actor, a) => { const task = db.mission_tasks.find(t => t.id === a.p_task); Object.assign(task, { claimed_by: null, claimed_name: null, claimed_at: null }); return { data: task }; },
    set_task_done: (actor, a) => { const task = db.mission_tasks.find(t => t.id === a.p_task); Object.assign(task, { done: !!a.p_done, done_at: a.p_done ? now() : null }); return { data: task }; },
    leave_mission: (actor, a) => { db.mission_members = db.mission_members.filter(m => !(m.mission_id === a.p_mission && m.user_id === actor)); return { data: null }; }
  };

  async function callRpc(actor, name, args) {
    if (holds.has(name)) await holds.get(name);
    const result = handlers[name] ? handlers[name](actor, args) : fail("unknown");
    if (!result.error && name !== "community_preview") notify();
    return result;
  }

  class Query {
    constructor(table) { this.table = table; this.filters = []; }
    select() { return this; }
    eq(col, val) { this.filters.push(r => r[col] === val); return this; }
    is(col, val) { this.filters.push(r => (r[col] ?? null) === val); return this; }
    order() { return this; }
    limit() { return this; }
    rows() { return db[this.table].filter(r => this.filters.every(f => f(r))).map(r => ({ ...r })); }
    maybeSingle() { return Promise.resolve({ data: this.rows()[0] ?? null, error: null }); }
    then(resolve, reject) { return Promise.resolve({ data: this.rows(), error: null }).then(resolve, reject); }
  }

  const session = () => ({ data: { session: window.__fakeSignedIn ? { user: { id: "u-me", is_anonymous: true } } : null }, error: null });
  const client = {
    auth: {
      getSession: async () => session(),
      signInAnonymously: async () => { window.__fakeSignedIn = true; localStorage.setItem("fake-signed-in", "1"); return session(); },
      signOut: async () => { window.__fakeSignedIn = false; localStorage.removeItem("fake-signed-in"); return { error: null }; }
    },
    rpc: (name, args) => callRpc("u-me", name, args),
    from: table => new Query(table),
    channel: () => { const cbs = []; const channel = { on(_type, _filter, cb) { cbs.push(cb); return channel; }, subscribe(cb) { listeners.add(() => cbs.forEach(fn => fn())); setTimeout(() => cb("SUBSCRIBED"), 10); return channel; } }; return channel; },
    removeChannel: () => {}
  };
  window.__fakeSignedIn = localStorage.getItem("fake-signed-in") === "1";
  // Hooks for the check script: act as another person, pause an rpc, or announce a change to the open page.
  window.__fake = {
    db, notify, listeners,
    as: (actor, name, args) => callRpc(actor, name, args),
    hold(name) { let release; holds.set(name, new Promise(resolve => { release = () => { holds.delete(name); resolve(); }; })); return release; },
    join(actor, display) { handlers.join_community(actor, { p_community: CID, p_display_name: display }); names[actor] = display; }
  };
  const fake = { createClient: () => client };
  Object.defineProperty(window, "supabase", { get: () => fake, set: () => {}, configurable: true });
})();`;
