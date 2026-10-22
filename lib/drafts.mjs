// Unsent text, saved per community. Pure functions over a storage-like object ({getItem,setItem,removeItem}) so the data-loss
// rules are testable without a browser.
export const draftStoreKey = communityId => `blockops.drafts.${communityId}`;

export function readDrafts(storage, communityId) {
  try {
    const value = JSON.parse(storage.getItem(draftStoreKey(communityId)) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([, text]) => typeof text === "string")) : {};
  } catch { return {}; }
}

// Blank drafts are not worth keeping; an empty store removes its key.
export function writeDrafts(storage, communityId, drafts) {
  const entries = Object.entries(drafts).filter(([, text]) => typeof text === "string" && text.trim());
  try {
    if (entries.length) storage.setItem(draftStoreKey(communityId), JSON.stringify(Object.fromEntries(entries)));
    else storage.removeItem(draftStoreKey(communityId));
  } catch { /* private mode / quota: the draft still lives in memory */ }
}

// A finished send clears only the text it sent. `memory` is the on-screen community's draft Map; a completion that lands after the
// user navigated to another community edits that community's saved drafts and never touches the one now on screen.
// Returns true when a draft was cleared.
export function clearIfUnchanged({ storage, activeCommunityId, memory, communityId, key, submitted }) {
  if (communityId === activeCommunityId) {
    if (memory.get(key) !== submitted) return false;
    memory.delete(key);
    writeDrafts(storage, communityId, Object.fromEntries(memory));
    return true;
  }
  const saved = readDrafts(storage, communityId);
  if (saved[key] !== submitted) return false;
  delete saved[key];
  writeDrafts(storage, communityId, saved);
  return true;
}
