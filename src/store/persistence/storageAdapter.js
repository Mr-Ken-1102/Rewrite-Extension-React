import { MarinaraHost } from '../../services/marinaraHost';

export const STORAGE_KEY = 'rwa-premium-storage';
export const LEGACY_BACKUP_KEY = 'rwa-premium-storage-legacy-backup-v3';
export const STORE_VERSION = 5;

// Legacy decoder used ONLY to migrate installs created by the old build.
// The old LZW format was ambiguous for Unicode, so the original compressed
// bytes are retained as a backup before any migration write occurs.
function legacyLzwCompress(str) {
  if (!str) return str;
  const dict = new Map();
  const out = [];
  let phrase = str[0];
  let code = 256;
  for (let i = 1; i < str.length; i += 1) {
    const curr = str[i];
    if (dict.has(phrase + curr)) phrase += curr;
    else {
      out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
      dict.set(phrase + curr, code);
      code += 1;
      phrase = curr;
      if (code > 60000) { dict.clear(); code = 256; }
    }
  }
  out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
  return out.map((value) => String.fromCharCode(value)).join('');
}

function legacyLzwDecompress(str) {
  if (!str) return str;
  const dict = new Map();
  let currChar = str[0];
  let oldPhrase = currChar;
  const out = [currChar];
  let code = 256;
  for (let i = 1; i < str.length; i += 1) {
    const currCode = str.charCodeAt(i);
    let phrase;
    if (currCode < 256) phrase = str[i];
    else phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict.set(code, oldPhrase + currChar);
    code += 1;
    oldPhrase = phrase;
    if (code > 60000) {
      dict.clear();
      code = 256;
    }
  }
  return out.join('');
}

function looksLikeJSON(value) {
  if (!value) return false;
  const trimmed = value.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed === 'null';
}

export const safeLocalStorage = {
  getItem(name) {
    let value;
    try { value = localStorage.getItem(name); } catch { return null; }
    if (!value) return null;
    if (looksLikeJSON(value)) return value;

    try {
      const migrated = legacyLzwDecompress(value);
      JSON.parse(migrated);
      if (name === STORAGE_KEY) {
        try {
          if (localStorage.getItem(LEGACY_BACKUP_KEY) === null) localStorage.setItem(LEGACY_BACKUP_KEY, value);
        } catch { /* best effort */ }
      }

      // The legacy codec confused literal Unicode code units with dictionary
      // codes. Re-encoding detects those lossy decodes. Fail closed instead of
      // hydrating silently corrupted Vietnamese/emoji/custom prompts; the exact
      // old bytes remain in LEGACY_BACKUP_KEY for manual recovery.
      if (legacyLzwCompress(migrated) !== value) return null;
      return migrated;
    } catch {
      return null;
    }
  },

  setItem(name, value) {
    try { localStorage.setItem(name, value); } catch { /* quota/private-mode: run in-memory */ }
  },

  removeItem(name) {
    try { localStorage.removeItem(name); } catch { /* best effort */ }
  },
};

// Marinara v2.4.4 full-page extensions receive private, server-backed storage
// attributed to the exact approved extension. Prefer it when present. The page
// localStorage adapter is retained only for one-time migration and older hosts.
export const extensionStorage = {
  async getItem(name) {
    const host = MarinaraHost.getHost();
    const storage = host?.storage;
    if (storage && typeof storage.get === 'function' && typeof storage.patch === 'function') {
      try {
        const bag = await storage.get();
        const privateValue = bag && typeof bag === 'object' ? bag[name] : null;
        if (typeof privateValue === 'string') {
          // Idempotent migration cleanup: if an earlier run patched private
          // storage but stopped before deleting the legacy origin copy, remove
          // that stale duplicate now. Private storage remains authoritative.
          safeLocalStorage.removeItem(name);
          return privateValue;
        }

        // One-time import from builds that stored settings in the page origin.
        const legacyValue = safeLocalStorage.getItem(name);
        if (legacyValue !== null) {
          await storage.patch({ [name]: legacyValue });
          safeLocalStorage.removeItem(name);
          return legacyValue;
        }
        return null;
      } catch {
        // On a modern host, fail closed instead of creating a second writable
        // state copy in page localStorage. The in-memory store can still run.
        return null;
      }
    }
    return safeLocalStorage.getItem(name);
  },

  async setItem(name, value) {
    const host = MarinaraHost.getHost();
    const storage = host?.storage;
    if (storage && typeof storage.patch === 'function') {
      try {
        await storage.patch({ [name]: value });
        safeLocalStorage.removeItem(name);
      } catch {
        // Modern-host storage failure: keep the current Zustand state in memory
        // rather than silently diverging into origin-wide localStorage.
      }
      return;
    }
    safeLocalStorage.setItem(name, value);
  },

  async removeItem(name) {
    const host = MarinaraHost.getHost();
    const storage = host?.storage;
    if (storage && typeof storage.clear === 'function') {
      await storage.clear();
      safeLocalStorage.removeItem(name);
      return;
    }
    safeLocalStorage.removeItem(name);
  },
};
