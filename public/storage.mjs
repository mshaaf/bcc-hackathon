// Thin localStorage wrapper for the campaign store. Writes go to a temp key, are read back, and only then
// replace the saved value; the previous valid value is kept as a backup. Unreadable saved data is never overwritten.
import { emptyStore, validateStore } from "../lib/campaign.mjs";

export const STORE_KEY = "blockops.campaigns.v1";
const TEMP_KEY = `${STORE_KEY}.tmp`;
const BACKUP_KEY = `${STORE_KEY}.backup`;

const parseStore = raw => {
  try {
    const value = JSON.parse(raw);
    return { value, check: validateStore(value) };
  } catch {
    return { value: null, check: { ok: false, reason: "corrupt", message: "The saved data is not valid JSON." } };
  }
};
const isQuota = error => error?.name === "QuotaExceededError" || error?.code === 22 || error?.code === 1014 || error?.name === "NS_ERROR_DOM_QUOTA_REACHED";

export function createCampaignStorage(getStorage = () => globalThis.localStorage) {
  let locked = "";

  return {
    load() {
      let raw;
      try {
        raw = getStorage().getItem(STORE_KEY);
      } catch {
        locked = "Browser storage is unavailable here, so campaigns cannot be saved. Your work stays in this page until you close it.";
        return { status: "error", reason: "unavailable", message: locked, store: emptyStore() };
      }
      if (raw === null) return { status: "empty", store: emptyStore() };
      const { value, check } = parseStore(raw);
      if (!check.ok) {
        locked = `${check.message} Saving is turned off so the stored data is not overwritten.`;
        return { status: "error", reason: check.reason === "version" ? "version" : "corrupt", message: locked, store: emptyStore() };
      }
      return { status: "ok", store: value };
    },

    save(store) {
      if (locked) return { ok: false, reason: "locked", message: locked };
      const check = validateStore(store);
      if (!check.ok) return { ok: false, reason: "invalid", message: `Not saved: ${check.message}` };
      const savedAt = new Date().toISOString();
      const json = JSON.stringify({ ...store, savedAt });
      let storage;
      try {
        storage = getStorage();
        storage.setItem(TEMP_KEY, json);
        if (storage.getItem(TEMP_KEY) !== json) throw new Error("The saved copy did not read back correctly.");
        const previous = storage.getItem(STORE_KEY);
        if (previous !== null && parseStore(previous).check.ok) storage.setItem(BACKUP_KEY, previous);
        storage.setItem(STORE_KEY, json);
        storage.removeItem(TEMP_KEY);
        return { ok: true, savedAt };
      } catch (error) {
        try { storage?.removeItem(TEMP_KEY); } catch { /* nothing more to do */ }
        return isQuota(error)
          ? { ok: false, reason: "quota", message: "Not saved: this browser's storage is full. Your last saved version is unchanged; download the brief to keep this work." }
          : { ok: false, reason: "failed", message: `Not saved: ${error?.message || "storage failed"}. Your last saved version is unchanged.` };
      }
    }
  };
}
