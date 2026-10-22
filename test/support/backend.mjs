// Shared setup for the real-backend integration tests. Not a test file itself.
import { readFileSync } from "node:fs";
import { createCommunityClient } from "../../public/community-api.mjs";

export const enabled = process.env.RUN_COMMUNITY_INTEGRATION === "1";
export const url = process.env.COMMUNITY_SUPABASE_URL;
export const publishableKey = process.env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
export const secretKey = process.env.COMMUNITY_SUPABASE_SECRET_KEY;
export const skip = enabled ? false : "set RUN_COMMUNITY_INTEGRATION=1 (see docs/COMMUNITY-SETUP.md); a skipped run proves nothing about the backend";

if (enabled && !(url && publishableKey && secretKey)) {
  throw new Error("RUN_COMMUNITY_INTEGRATION=1 needs COMMUNITY_SUPABASE_URL, COMMUNITY_SUPABASE_PUBLISHABLE_KEY and COMMUNITY_SUPABASE_SECRET_KEY (see docs/COMMUNITY-SETUP.md).");
}

// The vendored browser bundle is the SDK under test, loaded exactly as shipped.
export const { createClient } = new Function(`${readFileSync(new URL("../../public/vendor/supabase/supabase.js", import.meta.url), "utf8")}\nreturn supabase;`)();
export const memoryStorage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; };
export const profiles = [];
export const newProfile = (storage = memoryStorage()) => {
  const profile = { storage, api: createCommunityClient({ url, publishableKey, createClient, authOptions: { storage, persistSession: true } }) };
  profiles.push(profile);
  return profile;
};
export const uuid = () => crypto.randomUUID();
export const tag = Math.random().toString(36).slice(2, 8);
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const hasWebSocket = typeof WebSocket !== "undefined";

export function makeAdmin() {
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

// A signed-in guest who has joined `communityId`. Registers the user for cleanup.
export async function member(communityId, name, userIds) {
  const profile = newProfile();
  const session = await profile.api.ensureSession();
  userIds.push(session.userId);
  await profile.api.joinCommunity(communityId, `${name} ${tag}`);
  return { ...profile, userId: session.userId, name: `${name} ${tag}` };
}

export async function cleanup(admin, communityIds, userIds) {
  for (const profile of profiles) { await profile.api.rawClient.removeAllChannels(); profile.api.rawClient.realtime.disconnect(); }
  if (communityIds.length) await admin.from("communities").delete().in("id", communityIds.filter(Boolean));
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
}

export async function waitUntil(check, ms = 5000, step = 100) {
  const started = Date.now();
  for (;;) {
    const value = await check();
    if (value) return Date.now() - started;
    if (Date.now() - started > ms) return null;
    await sleep(step);
  }
}
