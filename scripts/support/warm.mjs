// Realtime streams nothing for roughly 15-20 s after its container (re)starts. Before a browser check measures "within 5 s",
// prove the stream is live with two throwaway guests, then clean up. Prints how long it took; fails loudly if it never starts.
import { readFileSync } from "node:fs";
import { createCommunityClient } from "../../public/community-api.mjs";
import { sleep } from "./browser.mjs";

const { createClient } = new Function(`${readFileSync(new URL("../../public/vendor/supabase/supabase.js", import.meta.url), "utf8")}\nreturn supabase;`)();
const memory = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; };

export async function warmRealtime({ base, admin, maxMs = 120000 }) {
  const config = await (await fetch(new URL("api/community-config", base))).json();
  const make = () => createCommunityClient({ url: config.url, publishableKey: config.publishableKey, createClient, authOptions: { storage: memory(), persistSession: true } });
  const [listener, poster] = [make(), make()];
  const [a, b] = [await listener.ensureSession(), await poster.ensureSession()];
  const community = (await admin.from("communities").insert({ title: "realtime warm-up", description: "Throwaway; deleted immediately." }).select().single()).data;
  const started = Date.now();
  let heard = false;
  try {
    await listener.joinCommunity(community.id, "warm listener"); await poster.joinCommunity(community.id, "warm poster");
    const ready = new Promise(resolve => listener.subscribeCommunity(community.id, () => { heard = true; }, status => { if (status === "SUBSCRIBED") resolve(); }));
    await Promise.race([ready, sleep(15000)]);
    while (!heard && Date.now() - started < maxMs) {
      await poster.createPost({ communityId: community.id, body: `warm ${Date.now()}`, operationId: crypto.randomUUID() });
      for (let i = 0; i < 30 && !heard; i += 1) await sleep(100);
    }
  } finally {
    await listener.rawClient.removeAllChannels(); listener.rawClient.realtime.disconnect(); poster.rawClient.realtime.disconnect();
    await admin.from("communities").delete().eq("id", community.id);
    for (const id of [a.userId, b.userId]) await admin.auth.admin.deleteUser(id);
  }
  if (!heard) throw new Error(`Realtime did not start streaming within ${maxMs} ms; the 5-second checks cannot be run.`);
  console.log(`# realtime was streaming after ${Date.now() - started} ms`);
  return Date.now() - started;
}
