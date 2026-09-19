export const STORE_VERSION = 6;

const BUILTIN_PROFILE_NAME_MIGRATIONS = Object.freeze({
  expand: Object.freeze({ legacy: 'Expand', current: 'Elaborate' }),
  compress: Object.freeze({ legacy: 'Compress', current: 'Tighten' }),
  thoughts: Object.freeze({ legacy: 'Add Inner Thoughts', current: 'Inner Voice' }),
  dialogue: Object.freeze({ legacy: 'Convert to Dialogue', current: 'Dialogue Shift' }),
  active: Object.freeze({ legacy: 'Passive to Active', current: 'Active Voice' }),
  diffwords: Object.freeze({ legacy: 'Use Different Words', current: 'Fresh Wording' }),
  showdont: Object.freeze({ legacy: "Show, Don't Tell", current: 'Show It' }),
  emotion: Object.freeze({ legacy: 'Show More Emotion', current: 'Emotional Depth' }),
  transitions: Object.freeze({ legacy: 'Fix Transitions', current: 'Smooth Flow' }),
  noai: Object.freeze({ legacy: 'Remove LLM-isms', current: 'Naturalize' }),
  expdialogue: Object.freeze({ legacy: 'Expand Dialogue', current: 'Dialogue Depth' }),
  romance: Object.freeze({ legacy: 'Increase Romance', current: 'Romantic Tone' }),
  grammar: Object.freeze({ legacy: 'Grammar Fix', current: 'Polish' }),
});

export const DEFAULT_PROFILES = [
  { id: 'expand',      name: 'Elaborate',         order: 0,  prompt: 'Expand the passage with more descriptive detail, sensory imagery, and action. Add no new plot events.' },
  { id: 'compress',    name: 'Tighten',           order: 1,  prompt: 'Condense the passage to be more succinct, keeping every key event and beat.' },
  { id: 'thoughts',    name: 'Inner Voice',       order: 2,  prompt: "Weave in the point-of-view character's inner thoughts and emotional reactions, in close POV." },
  { id: 'dialogue',    name: 'Dialogue Shift',    order: 3,  prompt: 'Convert the passage into natural spoken dialogue between the characters, carrying the same information through what they say and do.' },
  { id: 'active',      name: 'Active Voice',      order: 4,  prompt: 'Convert passive-voice constructions to active voice.' },
  { id: 'diffwords',   name: 'Fresh Wording',     order: 5,  prompt: 'Rephrase using different vocabulary and sentence structure, keeping the exact meaning and tone.' },
  { id: 'showdont',    name: 'Show It',           order: 6,  prompt: 'Show through action, sensory detail, and dialogue instead of explaining emotions or states directly.' },
  { id: 'emotion',     name: 'Emotional Depth',   order: 7,  prompt: "Heighten the passage's emotional immediacy while preserving facts, POV, and character intent." },
  { id: 'transitions', name: 'Smooth Flow',       order: 8,  prompt: 'Improve transitions and sentence flow so the passage reads naturally without changing its meaning.' },
  { id: 'noai',        name: 'Naturalize',        order: 9,  prompt: 'Remove formulaic AI-writing patterns, hollow affirmations, repetitive cadence, and unnecessary em dashes. Keep the prose natural and specific.' },
  { id: 'expdialogue', name: 'Dialogue Depth',    order: 10, prompt: 'Expand the dialogue with more natural back-and-forth, subtext, reactions, and distinct character voice.' },
  { id: 'romance',     name: 'Romantic Tone',     order: 11, prompt: 'Increase romantic tension, chemistry, and emotional intimacy while preserving consent, character intent, and established facts.' },
  { id: 'grammar',     name: 'Polish',            order: 12, prompt: 'Correct grammar, spelling, and punctuation only. Preserve wording, style, voice, and content whenever possible.' },
];

export const DEFAULT_CONFIG = {
  uiLanguage: 'en',
  cols: 3,
  rows: 5,
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
  liveStreaming: true,
  localContextEnabled: false,
  localContextWords: 150,
  injectChar: false,
  injectUser: false,
  injectLorebook: false,
  freeMode: false,
  contextDepth: 1,
  onlyAltR: false,
  speakerAware: true,
  useExtenderMemory: false,
  autoProfileEnabled: false,
  draftReplyEnabled: true,
  draftReplyHistoryDepth: 8,
  draftReplyLauncherPlacement: 'auto',
  draftReplyLauncherPositions: {},
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

const DRAFT_REPLY_CHAT_MODES = ['roleplay', 'conversation', 'game'];

function sanitizeDraftReplyLauncherPositions(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const out = {};
  for (const mode of DRAFT_REPLY_CHAT_MODES) {
    const position = input[mode];
    if (!position || typeof position !== 'object' || Array.isArray(position)) continue;
    const left = Number(position.left);
    const top = Number(position.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) continue;
    out[mode] = {
      left: clampNumber(left, 0, 100000, 0),
      top: clampNumber(top, 0, 100000, 0),
    };
  }
  return out;
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
    liveStreaming: cleanBoolean(input.liveStreaming, DEFAULT_CONFIG.liveStreaming),
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
    draftReplyEnabled: cleanBoolean(input.draftReplyEnabled, DEFAULT_CONFIG.draftReplyEnabled),
    draftReplyHistoryDepth: Math.trunc(clampNumber(input.draftReplyHistoryDepth, 1, 30, DEFAULT_CONFIG.draftReplyHistoryDepth)),
    draftReplyLauncherPlacement: ['auto', 'remember'].includes(input.draftReplyLauncherPlacement)
      ? input.draftReplyLauncherPlacement
      : DEFAULT_CONFIG.draftReplyLauncherPlacement,
    draftReplyLauncherPositions: sanitizeDraftReplyLauncherPositions(input.draftReplyLauncherPositions),
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
    const rawName = profile.name.trim();
    const builtInName = BUILTIN_PROFILE_NAME_MIGRATIONS[id];
    const normalizedName = builtInName && rawName === builtInName.legacy
      ? builtInName.current
      : rawName;
    const base = {
      id,
      name: normalizedName.slice(0, 80) || `Profile ${index + 1}`,
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

  const sanitizeItem = (chatId, identityKey, profile, legacy = false) => {
    if (!validProfile(profile)) return null;
    const safeChatId = String(chatId || '').slice(0, 200);
    const safeIdentityKey = String(identityKey || '').slice(0, 320);
    const rawPrompt = profile.prompt.trim().slice(0, 5000);
    if (!safeChatId || !safeIdentityKey || !rawPrompt) return null;

    const identityKind = profile.identityKind === 'persona'
      ? 'persona'
      : (profile.identityKind === 'character' ? 'character' : (legacy ? 'legacy' : 'character'));
    const identitySource = profile.identitySource === 'character'
      ? 'character'
      : (profile.identitySource === 'persona' ? 'persona' : (identityKind === 'character' ? 'character' : null));
    const base = {
      id: String(profile.id || `auto-${safeChatId}`).slice(0, 180),
      name: String(profile.name || 'Auto Voice').trim().slice(0, 80) || 'Auto Voice',
      prompt: '',
      order: -1,
      auto: true,
      identityKind,
      identityId: String(profile.identityId || '').trim().slice(0, 220),
      identityName: String(profile.identityName || '').trim().slice(0, 160),
      identityKey: safeIdentityKey,
      sourceFingerprint: String(profile.sourceFingerprint || '').trim().slice(0, 120),
      ...(identitySource ? { identitySource } : {}),
      ...(legacy ? { legacy: true } : {}),
    };
    const baseBytes = utf8Bytes(JSON.stringify([safeChatId, safeIdentityKey, base])) + 2;
    if (baseBytes >= byteBudget) return null;
    const prompt = truncateUtf8(rawPrompt, byteBudget - baseBytes);
    if (!prompt) return null;
    const item = { ...base, prompt };
    const itemBytes = utf8Bytes(JSON.stringify([safeChatId, safeIdentityKey, item])) + 2;
    if (itemBytes > byteBudget) return null;
    byteBudget -= itemBytes;
    return item;
  };

  for (const [chatId, rawBucket] of Object.entries(value).slice(0, 100)) {
    if (typeof chatId !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(chatId)) continue;
    const safeChatId = chatId.slice(0, 200);
    const bucket = {};

    // v5 and earlier stored exactly one auto-profile per chat. Preserve it as
    // legacy data, but never auto-match it to a Character or Persona because
    // its original identity is unknowable.
    if (validProfile(rawBucket)) {
      const item = sanitizeItem(safeChatId, 'legacy', rawBucket, true);
      if (item) bucket.legacy = item;
    } else if (rawBucket && typeof rawBucket === 'object' && !Array.isArray(rawBucket)) {
      for (const [identityKey, profile] of Object.entries(rawBucket).slice(0, 24)) {
        if (['__proto__', 'prototype', 'constructor'].includes(identityKey)) continue;
        const item = sanitizeItem(safeChatId, identityKey, profile, identityKey === 'legacy');
        if (item) bucket[identityKey.slice(0, 320)] = item;
        if (byteBudget <= 0) break;
      }
    }

    if (Object.keys(bucket).length) out[safeChatId] = bucket;
    if (byteBudget <= 0) break;
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
