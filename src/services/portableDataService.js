const EXPORT_TYPE = 'rewrite-assistant-portable-data';
const EXPORT_VERSION = 1;
const ROUTING_KEYS = new Set([
  'connMode', 'connectionId', 'ollamaUrl', 'ollamaModel', 'extenderUrl',
]);

function safeConfig(config) {
  const out = {};
  for (const [key, value] of Object.entries(config || {})) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    if (!ROUTING_KEYS.has(key)) out[key] = value;
  }
  return out;
}

export function createPortableExport(state, options = {}) {
  const chosen = {
    profiles: options.profiles !== false,
    settings: options.settings !== false,
    customs: options.customs !== false,
    autoProfiles: options.autoProfiles !== false,
  };
  const data = { type: EXPORT_TYPE, version: EXPORT_VERSION };
  if (chosen.profiles) data.profiles = state.profiles || [];
  if (chosen.settings) data.config = safeConfig(state.config || {});
  if (chosen.customs) data.customs = state.customs || [];
  if (chosen.autoProfiles) data.autoProfiles = state.autoProfiles || {};
  return data;
}

export function parsePortableImport(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  if (!data || data.type !== EXPORT_TYPE || data.version !== EXPORT_VERSION) {
    throw new Error('Not a supported Rewrite Assistant export file.');
  }
  const patch = {};
  if (Array.isArray(data.profiles)) patch.profiles = data.profiles;
  if (Array.isArray(data.customs)) patch.customs = data.customs;
  if (data.autoProfiles && typeof data.autoProfiles === 'object' && !Array.isArray(data.autoProfiles)) patch.autoProfiles = data.autoProfiles;
  if (data.config && typeof data.config === 'object' && !Array.isArray(data.config)) patch.config = safeConfig(data.config);
  return patch;
}

export { EXPORT_TYPE, EXPORT_VERSION, ROUTING_KEYS };
