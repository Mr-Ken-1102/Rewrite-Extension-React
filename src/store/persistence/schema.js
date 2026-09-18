export const STORE_VERSION = 5;

export const DEFAULT_PROFILES = [
  { id: 'expand',      name: 'Expand',             order: 0,  prompt: 'Expand the passage with more descriptive detail, sensory imagery, and action. Add no new plot events.' },
  { id: 'compress',    name: 'Compress',           order: 1,  prompt: 'Condense the passage to be more succinct, keeping every key event and beat.' },
  { id: 'thoughts',    name: 'Add Inner Thoughts', order: 2,  prompt: "Weave in the point-of-view character's inner thoughts and emotional reactions, in close POV." },
  { id: 'dialogue',    name: 'Convert to Dialogue',order: 3,  prompt: 'Convert the passage into natural spoken dialogue between the characters, carrying the same information through what they say and do.' },
  { id: 'active',      name: 'Passive to Active',  order: 4,  prompt: 'Convert passive-voice constructions to active voice.' },
  { id: 'diffwords',   name: 'Use Different Words',order: 5,  prompt: 'Rephrase using different vocabulary and sentence structure, keeping the exact meaning and tone.' },
  { id: 'showdont',    name: "Show, Don't Tell",  order: 6,  prompt: 'Show through action, sensory detail, and dialogue instead of explaining emotions or states directly.' },
  { id: 'emotion',     name: 'Show More Emotion',  order: 7,  prompt: "Heighten the passage's emotional immediacy while preserving facts, POV, and character intent." },
  { id: 'transitions', name: 'Fix Transitions',    order: 8,  prompt: 'Improve transitions and sentence flow so the passage reads naturally without changing its meaning.' },
  { id: 'noai',        name: 'Remove LLM-isms',    order: 9,  prompt: 'Remove formulaic AI-writing patterns, hollow affirmations, repetitive cadence, and unnecessary em dashes. Keep the prose natural and specific.' },
  { id: 'expdialogue', name: 'Expand Dialogue',    order: 10, prompt: 'Expand the dialogue with more natural back-and-forth, subtext, reactions, and distinct character voice.' },
  { id: 'romance',     name: 'Increase Romance',   order: 11, prompt: 'Increase romantic tension, chemistry, and emotional intimacy while preserving consent, character intent, and established facts.' },
  { id: 'grammar',     name: 'Grammar Fix',        order: 12, prompt: 'Correct grammar, spelling, and punctuation only. Preserve wording, style, voice, and content whenever possible.' },
];

export const DEFAULT_CONFIG = {
  uiLanguage: 'en',
  cols: 4,
  rows: 4,
  typewriter: true,
  showDiff: true,
  lengthEnabled: false,
  lengthPct: 0,
  autoApply: false,
  popupPos: 'auto',
  pinnedPos: null,
  historyDepth: 1,
  compact: false,
  conciseSysPrompt: false,
  fastRewrite: true,
  localContextEnabled: false,
  localContextWords: 150,
  injectChar: false,
  injectUser: false,
  injectLorebook: false,
  freeMode: false,
  contextDepth: 1,
  onlyAltR: false,
  speakerAware: false,
  useExtenderMemory: false,
  autoProfileEnabled: false,
  debugEnabled: false,
  mergeMultiMsg: false,
  charCardIds: [],
  connMode: 'marinara',
  marinaraRouting: 'chat',
  connectionId: '',
  ollamaUrl: 'http://127.0.0.1:11434/v1',
  ollamaModel: '',
  extenderUrl: 'http://127.0.0.1:3001',
  directTemp: 0.7,
  requestTimeoutMs: 45000,
  maxPromptChars: 32000,
};

function validProfile(profile) {
  return profile && typeof profile === 'object' &&
    typeof profile.id === 'string' && typeof profile.name === 'string' && typeof profile.prompt === 'string';
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function cleanString(value, fallback, maxLength) {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
}

function cleanBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeConfig(value, legacyVersion = STORE_VERSION) {
  const input = value && typeof value === 'object' ? value : {};
  let connMode = ['marinara', 'sidecar', 'direct', 'extender'].includes(input.connMode) ? input.connMode : DEFAULT_CONFIG.connMode;
  if (Number(legacyVersion ?? 0) < 3 && input.connMode === undefined) {
    connMode = typeof input.ollamaModel === 'string' && input.ollamaModel.trim() ? 'direct' : 'marinara';
  }

  return {
    uiLanguage: ['en', 'vi'].includes(input.uiLanguage) ? input.uiLanguage : DEFAULT_CONFIG.uiLanguage,
    cols: Math.trunc(clampNumber(input.cols, 1, 6, DEFAULT_CONFIG.cols)),
    rows: Math.trunc(clampNumber(input.rows, 1, 10, DEFAULT_CONFIG.rows)),
    typewriter: cleanBoolean(input.typewriter, DEFAULT_CONFIG.typewriter),
    showDiff: cleanBoolean(input.showDiff, DEFAULT_CONFIG.showDiff),
    lengthEnabled: cleanBoolean(input.lengthEnabled, DEFAULT_CONFIG.lengthEnabled),
    lengthPct: Math.trunc(clampNumber(input.lengthPct, -99, 200, DEFAULT_CONFIG.lengthPct)),
    autoApply: cleanBoolean(input.autoApply, DEFAULT_CONFIG.autoApply),
    popupPos: ['auto', 'above', 'below'].includes(input.popupPos) ? input.popupPos : DEFAULT_CONFIG.popupPos,
    pinnedPos: (input.pinnedPos && typeof input.pinnedPos === 'object' && Number.isFinite(Number(input.pinnedPos.left)) && Number.isFinite(Number(input.pinnedPos.top)))
      ? {
          left: clampNumber(input.pinnedPos.left, 0, 100000, 0),
          top: clampNumber(input.pinnedPos.top, 0, 100000, 0),
        }
      : DEFAULT_CONFIG.pinnedPos,
    historyDepth: Math.trunc(clampNumber(input.historyDepth, 1, 20, DEFAULT_CONFIG.historyDepth)),
    compact: cleanBoolean(input.compact, DEFAULT_CONFIG.compact),
    conciseSysPrompt: cleanBoolean(input.conciseSysPrompt, DEFAULT_CONFIG.conciseSysPrompt),
    fastRewrite: cleanBoolean(input.fastRewrite, DEFAULT_CONFIG.fastRewrite),
    localContextEnabled: cleanBoolean(input.localContextEnabled, DEFAULT_CONFIG.localContextEnabled),
    localContextWords: Math.trunc(clampNumber(input.localContextWords, 50, 400, DEFAULT_CONFIG.localContextWords)),
    injectChar: cleanBoolean(input.injectChar, DEFAULT_CONFIG.injectChar),
    injectUser: cleanBoolean(input.injectUser, DEFAULT_CONFIG.injectUser),
    injectLorebook: cleanBoolean(input.injectLorebook, DEFAULT_CONFIG.injectLorebook),
    freeMode: cleanBoolean(input.freeMode, DEFAULT_CONFIG.freeMode),
    contextDepth: Math.trunc(clampNumber(input.contextDepth, 0, 20, DEFAULT_CONFIG.contextDepth)),
    onlyAltR: cleanBoolean(input.onlyAltR, DEFAULT_CONFIG.onlyAltR),
    speakerAware: cleanBoolean(input.speakerAware, DEFAULT_CONFIG.speakerAware),
    useExtenderMemory: cleanBoolean(input.useExtenderMemory, DEFAULT_CONFIG.useExtenderMemory),
    autoProfileEnabled: cleanBoolean(input.autoProfileEnabled, DEFAULT_CONFIG.autoProfileEnabled),
    debugEnabled: cleanBoolean(input.debugEnabled, DEFAULT_CONFIG.debugEnabled),
    mergeMultiMsg: cleanBoolean(input.mergeMultiMsg, DEFAULT_CONFIG.mergeMultiMsg),
    charCardIds: Array.isArray(input.charCardIds) ? [...new Set(input.charCardIds.filter((id) => typeof id === 'string').map((id) => id.trim()).filter(Boolean))].slice(0, 8) : DEFAULT_CONFIG.charCardIds,
    connMode,
    marinaraRouting: ['chat', 'fixed'].includes(input.marinaraRouting) ? input.marinaraRouting : DEFAULT_CONFIG.marinaraRouting,
    connectionId: cleanString(input.connectionId, DEFAULT_CONFIG.connectionId, 200).trim(),
    ollamaUrl: cleanString(input.ollamaUrl, DEFAULT_CONFIG.ollamaUrl, 2048).trim() || DEFAULT_CONFIG.ollamaUrl,
    ollamaModel: cleanString(input.ollamaModel, DEFAULT_CONFIG.ollamaModel, 300).trim(),
    extenderUrl: cleanString(input.extenderUrl, DEFAULT_CONFIG.extenderUrl, 2048).trim() || DEFAULT_CONFIG.extenderUrl,
    directTemp: clampNumber(input.directTemp, 0, 2, DEFAULT_CONFIG.directTemp),
    requestTimeoutMs: Math.trunc(clampNumber(input.requestTimeoutMs, 5000, 180000, DEFAULT_CONFIG.requestTimeoutMs)),
    maxPromptChars: Math.trunc(clampNumber(input.maxPromptChars, 8000, 120000, DEFAULT_CONFIG.maxPromptChars)),
  };
}


function utf8Bytes(value) {
  return new TextEncoder().encode(String(value ?? '')).length;
}

function truncateUtf8(value, maxBytes) {
  if (maxBytes <= 0) return '';
  const text = String(value || '');
  if (utf8Bytes(text) <= maxBytes) return text;
  let used = 0;
  let out = '';
  for (const char of text) {
    const size = utf8Bytes(char);
    if (used + size > maxBytes) break;
    out += char;
    used += size;
  }
  return out;
}

export function sanitizeProfiles(value) {
  if (!Array.isArray(value)) return DEFAULT_PROFILES;
  const usedIds = new Set();
  const clean = [];
  let byteBudget = 500_000;
  for (const [index, profile] of value.filter(validProfile).slice(0, 64).entries()) {
    const rawPrompt = profile.prompt.trim().slice(0, 5000);
    if (!rawPrompt) continue;
    const baseId = profile.id.trim().slice(0, 140) || `profile-${index + 1}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId.slice(0, 130)}-${suffix}`;
      suffix += 1;
    }
    const color = typeof profile.color === 'string' && /^#[0-9a-f]{6}$/i.test(profile.color) ? profile.color : null;
    const base = {
      id,
      name: profile.name.trim().slice(0, 80) || `Profile ${index + 1}`,
      prompt: '',
      order: Math.trunc(clampNumber(profile.order, 0, 10000, index)),
      hidden: profile.hidden === true,
      ...(color ? { color } : {}),
    };
    const baseBytes = utf8Bytes(JSON.stringify(base)) + 2;
    if (baseBytes >= byteBudget) break;
    const prompt = truncateUtf8(rawPrompt, byteBudget - baseBytes);
    if (!prompt) break;
    const item = { ...base, prompt };
    const itemBytes = utf8Bytes(JSON.stringify(item)) + 2;
    if (itemBytes > byteBudget) break;
    usedIds.add(id);
    clean.push(item);
    byteBudget -= itemBytes;
  }
  if (value.length > 0 && clean.length === 0) return DEFAULT_PROFILES;
  return clean;
}

export function sanitizeAutoProfiles(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  let byteBudget = 250_000;
  for (const [chatId, profile] of Object.entries(value).slice(0, 100)) {
    if (typeof chatId !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(chatId) || !validProfile(profile)) continue;
    const safeChatId = chatId.slice(0, 200);
    const rawPrompt = profile.prompt.trim().slice(0, 5000);
    if (!rawPrompt) continue;
    const base = {
      id: String(profile.id || `auto-${safeChatId}`).slice(0, 160),
      name: String(profile.name || 'Auto Voice').trim().slice(0, 80) || 'Auto Voice',
      prompt: '',
      order: -1,
      auto: true,
    };
    const baseBytes = utf8Bytes(JSON.stringify([safeChatId, base])) + 2;
    if (baseBytes >= byteBudget) break;
    const prompt = truncateUtf8(rawPrompt, byteBudget - baseBytes);
    if (!prompt) break;
    const item = { ...base, prompt };
    const itemBytes = utf8Bytes(JSON.stringify([safeChatId, item])) + 2;
    if (itemBytes > byteBudget) break;
    out[safeChatId] = item;
    byteBudget -= itemBytes;
  }
  return out;
}

export function sanitizeCustoms(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  let byteBudget = 80_000;
  for (const item of value.filter((entry) => typeof entry === 'string').slice(0, 8)) {
    const raw = item.trim().slice(0, 5000);
    if (!raw) continue;
    const clean = truncateUtf8(raw, Math.max(0, byteBudget - 2));
    if (!clean) break;
    const bytes = utf8Bytes(JSON.stringify(clean)) + 1;
    if (bytes > byteBudget) break;
    out.push(clean);
    byteBudget -= bytes;
  }
  return out;
}

export function migratePersistedState(persisted, version) {
  if (!persisted || typeof persisted !== 'object') return persisted;
  const next = { ...persisted };
  next.profiles = sanitizeProfiles(next.profiles);
  next.customs = sanitizeCustoms(next.customs);
  next.autoProfiles = sanitizeAutoProfiles(next.autoProfiles);
  next.config = sanitizeConfig(next.config, version);

  // Undo/redo contains message bodies and is intentionally session-only now.
  delete next.history;
  return next;
}
