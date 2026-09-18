import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEY, LEGACY_BACKUP_KEY, safeLocalStorage, extensionStorage } from './persistence/storageAdapter.js';
import {
  STORE_VERSION,
  DEFAULT_PROFILES,
  DEFAULT_CONFIG,
  sanitizeConfig,
  sanitizeProfiles,
  sanitizeAutoProfiles,
  sanitizeCustoms,
  migratePersistedState,
} from './persistence/schema.js';

// Compatibility re-exports keep existing callers stable while persistence
// implementation details remain isolated behind explicit domain boundaries.
export { STORAGE_KEY, LEGACY_BACKUP_KEY, safeLocalStorage, extensionStorage } from './persistence/storageAdapter.js';
export { STORE_VERSION, DEFAULT_PROFILES, DEFAULT_CONFIG } from './persistence/schema.js';

function pruneHistory(history, maxKeys = 100) {
  const entries = Object.entries(history);
  if (entries.length <= maxKeys) return history;
  entries.sort(([, a], [, b]) => {
    const aWhen = a?.undo?.[0]?.when || a?.redo?.[0]?.when || 0;
    const bWhen = b?.undo?.[0]?.when || b?.redo?.[0]?.when || 0;
    return bWhen - aWhen;
  });
  return Object.fromEntries(entries.slice(0, maxKeys));
}

export const usePersistentStore = create(
  persist(
    (set) => ({
      profiles: DEFAULT_PROFILES,
      config: DEFAULT_CONFIG,
      customs: [],
      autoProfiles: {},
      history: {},

      updateConfig: (newConfig) => set((state) => ({ config: sanitizeConfig({ ...state.config, ...(newConfig || {}) }) })),
      updateProfiles: (profiles) => set({ profiles: sanitizeProfiles(profiles) }),
      updateCustoms: (customs) => set({ customs: sanitizeCustoms(customs) }),
      updateAutoProfiles: (autoProfiles) => set({ autoProfiles: sanitizeAutoProfiles(autoProfiles) }),
      setAutoProfile: (chatId, identityKey, profile) => set((state) => {
        if (!chatId || !identityKey || !profile) return state;
        const bucket = state.autoProfiles?.[chatId] && typeof state.autoProfiles[chatId] === 'object'
          ? state.autoProfiles[chatId]
          : {};
        return {
          autoProfiles: sanitizeAutoProfiles({
            ...state.autoProfiles,
            [chatId]: { ...bucket, [identityKey]: profile },
          }),
        };
      }),
      removeAutoProfile: (chatId, identityKey = null) => set((state) => {
        if (!chatId || !state.autoProfiles?.[chatId]) return state;
        const next = { ...state.autoProfiles };
        if (!identityKey) {
          delete next[chatId];
          return { autoProfiles: next };
        }
        const bucket = { ...next[chatId] };
        delete bucket[identityKey];
        if (Object.keys(bucket).length) next[chatId] = bucket;
        else delete next[chatId];
        return { autoProfiles: next };
      }),
      importPortableData: (patch) => set((state) => ({
        profiles: patch?.profiles !== undefined ? sanitizeProfiles(patch.profiles) : state.profiles,
        config: patch?.config !== undefined ? sanitizeConfig({ ...state.config, ...patch.config }) : state.config,
        customs: patch?.customs !== undefined ? sanitizeCustoms(patch.customs) : state.customs,
        autoProfiles: patch?.autoProfiles !== undefined ? sanitizeAutoProfiles(patch.autoProfiles) : state.autoProfiles,
      })),

      pushHistory: (key, entry) => set((state) => {
        if (!key || !entry || typeof entry !== 'object') return state;
        const current = state.history[key] || { undo: [], redo: [] };
        const newUndo = [entry, ...current.undo];
        const depth = Math.max(1, Math.min(20, state.config.historyDepth || 5));
        if (newUndo.length > depth) newUndo.length = depth;
        return { history: pruneHistory({ ...state.history, [key]: { undo: newUndo, redo: [] } }) };
      }),

      setHistoryData: (key, undo, redo) => set((state) => {
        if (!key) return state;
        const depth = Math.max(1, Math.min(20, state.config.historyDepth || 5));
        const nextUndo = Array.isArray(undo) ? undo.slice(0, depth) : [];
        const nextRedo = Array.isArray(redo) ? redo.slice(0, depth) : [];
        return { history: pruneHistory({ ...state.history, [key]: { undo: nextUndo, redo: nextRedo } }) };
      }),

      clearHistory: (key) => set((state) => {
        if (!key || !state.history[key]) return state;
        const history = { ...state.history };
        delete history[key];
        return { history };
      }),

      clearAllData: () => set({
        profiles: DEFAULT_PROFILES,
        config: DEFAULT_CONFIG,
        customs: [],
        autoProfiles: {},
        history: {},
      }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => extensionStorage),
      skipHydration: true,
      migrate: migratePersistedState,
      partialize: (state) => ({ profiles: state.profiles, config: state.config, customs: state.customs, autoProfiles: state.autoProfiles }),
      merge: (persisted, current) => ({
        // Persisted JSON is data, never executable store shape. Do not spread
        // arbitrary legacy/corrupt keys over Zustand actions.
        ...current,
        profiles: sanitizeProfiles(persisted?.profiles ?? current.profiles),
        config: sanitizeConfig(persisted?.config ?? current.config),
        customs: persisted?.customs !== undefined ? sanitizeCustoms(persisted.customs) : current.customs,
        autoProfiles: persisted?.autoProfiles !== undefined ? sanitizeAutoProfiles(persisted.autoProfiles) : current.autoProfiles,
        history: {},
      }),
    },
  ),
);
