const MAX_SESSION_LEDGERS = 4;
export const MAX_LEDGER_SOURCE_CHARS = 2_000_000;
const MAX_SESSION_LEDGER_SOURCE_CHARS = 2_000_000;
const MIN_LEDGER_SLICE_CHARS = 1_200;
const MAX_LEDGER_SLICE_CHARS = 24_000;

const LEDGER_INFERENCE_CONFIG_KEYS = Object.freeze([
  'connMode', 'connectionId', 'ollamaUrl', 'ollamaModel', 'extenderUrl',
  'directTemp', 'requestTimeoutMs', 'maxPromptChars', 'lengthEnabled', 'lengthPct',
  'conciseSysPrompt', 'freeMode', 'contextDepth', 'injectChar', 'injectUser',
  'injectLorebook', 'localContextEnabled', 'localContextWords', 'useExtenderMemory',
  'speakerAware', 'charCardIds',
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function asText(value) {
  return String(value ?? '');
}

function ledgerCapacityError(length) {
  const error = new Error(`This selection is ${Number(length).toLocaleString()} characters. The session Ledger safety ceiling is ${MAX_LEDGER_SOURCE_CHARS.toLocaleString()} characters; nothing was truncated or sent. Split the selection into smaller ranges and retry.`);
  error.code = 'RWA_LEDGER_CAPACITY';
  return error;
}

function ledgerGraphemeError(maxChars) {
  const error = new Error(`A single Unicode grapheme cluster exceeds the safe Ledger slice budget of ${Number(maxChars).toLocaleString()} characters; nothing was truncated or sent. Shorten or normalize that cluster and retry.`);
  error.code = 'RWA_LEDGER_GRAPHEME_LIMIT';
  return error;
}

function normalizeOutputText(value) {
  return asText(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  const text = String(value ?? '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

function sanitizeToken(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 28) || 'capture';
}

function semanticConfigSnapshot(config = {}) {
  const out = {};
  for (const key of LEDGER_INFERENCE_CONFIG_KEYS) {
    const value = config?.[key];
    out[key] = Array.isArray(value) ? [...value] : value;
  }
  return out;
}

export function ledgerExecutionSignature(profile, selection, config = {}) {
  const profileIdentity = {
    id: String(profile?.id || ''),
    name: String(profile?.name || ''),
    prompt: String(profile?.prompt || ''),
  };
  const sourceIdentity = selection?.source === 'textarea'
    ? {
        source: 'textarea', cid: selection?.cid || null, mid: selection?.mid || null,
        start: selection?.start, end: selection?.end,
        selected: asText(selection?.text), original: asText(selection?.originalValue),
      }
    : {
        source: 'message', cid: selection?.cid || null, mid: selection?.mid || null,
        occ: selection?.occ || 0, fp: selection?.fp || null,
        selected: asText(selection?.text), rendered: asText(selection?.renderedAtSelection),
      };
  return fnv1a(JSON.stringify({ profileIdentity, sourceIdentity, config: semanticConfigSnapshot(config) }));
}

export function stripMessageSelectionEdgeWhitespace(selection, result) {
  const output = asText(result);
  if (selection?.source !== 'message') return output;
  const original = asText(selection?.text);
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  let start = 0;
  let end = output.length;
  if (leading && output.startsWith(leading)) start = leading.length;
  if (trailing && output.slice(start).endsWith(trailing)) end -= trailing.length;
  return output.slice(start, Math.max(start, end));
}

export function normalizeSelectionSegments(selection) {
  const cid = selection?.cid || null;
  const rawSegments = Array.isArray(selection?.segments) && selection.segments.length
    ? selection.segments
    : (selection?.mid && typeof selection?.text === 'string'
      ? [{
          mid: selection.mid,
          text: selection.text,
          occ: selection.occ || 0,
          fp: selection.fp || null,
          renderedAtSelection: selection.renderedAtSelection,
          detectedRole: selection.detectedRole || null,
        }]
      : []);

  const out = [];
  for (const segment of rawSegments) {
    const mid = typeof segment?.mid === 'string' ? segment.mid.trim() : String(segment?.mid ?? '').trim();
    const text = asText(segment?.text);
    if (!mid || text.trim().length < 2) continue;
    out.push({
      ...segment,
      mid,
      cid,
      text,
      occ: Number.isInteger(segment?.occ) && segment.occ >= 0 ? segment.occ : 0,
      fp: segment?.fp || null,
      source: 'message',
    });
  }
  return out;
}

export function buildMergedPayload(segments, captureIdentity = '') {
  if (!Array.isArray(segments) || segments.length < 2) {
    throw new Error('Merged rewrite requires at least two message segments.');
  }
  const identity = sanitizeToken(captureIdentity || `${segments[0]?.mid || 'm'}-${fnv1a(segments.map((s) => s.text).join('\u241e'))}`);
  const nonce = `${identity}-${fnv1a(segments.map((s) => `${s.mid}:${s.text}`).join('\u241f'))}`.toUpperCase();
  const markers = segments.map((_, index) => `[[RWA_SECTION_${index + 1}_${nonce}]]`);
  const text = segments.map((segment, index) => `${markers[index]}\n${asText(segment.text)}`).join('\n');
  return { text, markers, nonce };
}

export function splitMergedResult(result, markers) {
  const text = normalizeOutputText(result).trim();
  if (!text || !Array.isArray(markers) || markers.length < 2) {
    return { ok: false, pieces: [], reason: 'missing-output-or-markers' };
  }

  const markerLike = text.match(/\[\[RWA_SECTION_[^\]]+\]\]/g) || [];
  if (markerLike.length !== markers.length || markerLike.some((marker, index) => marker !== markers[index])) {
    return { ok: false, pieces: [], reason: 'marker-sequence-mismatch' };
  }
  for (const marker of markers) {
    if (text.indexOf(marker) !== text.lastIndexOf(marker)) {
      return { ok: false, pieces: [], reason: 'duplicate-marker' };
    }
  }
  if (text.slice(0, text.indexOf(markers[0])).trim()) {
    return { ok: false, pieces: [], reason: 'leading-unmarked-output' };
  }

  const pieces = [];
  for (let index = 0; index < markers.length; index += 1) {
    const start = text.indexOf(markers[index]) + markers[index].length;
    const end = index + 1 < markers.length ? text.indexOf(markers[index + 1], start) : text.length;
    if (start < markers[index].length || end < start) {
      return { ok: false, pieces: [], reason: 'marker-position-invalid' };
    }
    const piece = text.slice(start, end).replace(/^\s*\n?/, '').replace(/\s+$/, '');
    if (!piece) return { ok: false, pieces: [], reason: 'empty-section' };
    pieces.push(piece);
  }
  return { ok: pieces.length === markers.length, pieces, reason: null };
}

export function providerPromptLimit(config = {}) {
  const configured = clamp(Number(config.maxPromptChars) || 32_000, 8_000, 120_000);
  return config.connMode === 'sidecar' ? Math.min(16_000, configured) : configured;
}

export function ledgerSliceBudgetChars(config = {}, profile = {}) {
  const limit = providerPromptLimit(config);
  const taskChars = String(profile?.prompt || '').length;
  const target = Math.floor(limit * 0.56) - Math.min(taskChars, 5_000) - 900;
  return clamp(target, MIN_LEDGER_SLICE_CHARS, MAX_LEDGER_SLICE_CHARS);
}

export function shouldUseLedger(text, config = {}, profile = {}) {
  return asText(text).length > ledgerSliceBudgetChars(config, profile);
}

const GRAPHEME_SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

function isLowSurrogate(code) {
  return code >= 0xDC00 && code <= 0xDFFF;
}

function safeUnicodeCut(text, start, cut) {
  if (cut <= start || cut >= text.length) return cut;
  let candidate = cut;
  const before = text.charCodeAt(candidate - 1);
  const after = text.charCodeAt(candidate);
  if (isHighSurrogate(before) && isLowSurrogate(after)) {
    // Stay within the requested budget when possible. The Ledger minimum slice
    // size is far above one UTF-16 pair, so moving one code unit left cannot
    // starve normal progress.
    candidate = candidate - 1 > start ? candidate - 1 : Math.min(text.length, candidate + 1);
  }
  if (!GRAPHEME_SEGMENTER || candidate <= start || candidate >= text.length) return candidate;

  // `start` is already a grapheme boundary from the previous slice. Segment a
  // bounded prefix plus look-ahead and choose only a boundary at/before the
  // requested cut. If there is no boundary after `start`, a single grapheme is
  // larger than this requested budget; return null so the caller can fail
  // closed rather than corrupting that grapheme for the provider.
  const sampleEnd = Math.min(text.length, candidate + 64);
  let previousBoundary = start;
  for (const segment of GRAPHEME_SEGMENTER.segment(text.slice(start, sampleEnd))) {
    const boundary = start + segment.index;
    if (boundary === candidate) return candidate;
    if (boundary > candidate) break;
    if (boundary > start) previousBoundary = boundary;
  }
  return previousBoundary > start ? previousBoundary : null;
}

function findPreferredCut(text, start, hardEnd, minEnd) {
  const window = text.slice(minEnd, hardEnd);
  const offsets = [];
  const doubleNewline = window.lastIndexOf('\n\n');
  if (doubleNewline >= 0) offsets.push(minEnd + doubleNewline + 2);
  const newline = window.lastIndexOf('\n');
  if (newline >= 0) offsets.push(minEnd + newline + 1);

  const sentenceRe = /[.!?]["'”’)}\]]?\s+/g;
  let match;
  let sentenceCut = -1;
  while ((match = sentenceRe.exec(window))) sentenceCut = minEnd + match.index + match[0].length;
  if (sentenceCut >= 0) offsets.push(sentenceCut);

  let ws = -1;
  for (let i = window.length - 1; i >= 0; i -= 1) {
    if (/\s/.test(window[i])) { ws = minEnd + i + 1; break; }
  }
  if (ws >= 0) offsets.push(ws);

  const best = offsets.filter((value) => value > start && value <= hardEnd).sort((a, b) => b - a)[0];
  return best || hardEnd;
}

export function splitTextToLedgerSlices(input, maxChars) {
  const text = asText(input);
  const size = clamp(Math.trunc(Number(maxChars) || 0), 256, MAX_LEDGER_SLICE_CHARS);
  if (!text) return [];
  if (text.length <= size) {
    return [{ index: 0, prefix: '', text, suffix: '', original: text, result: null, status: 'pending', error: null }];
  }

  const slices = [];
  let cursor = 0;
  while (cursor < text.length) {
    const requestedEnd = Math.min(text.length, cursor + size);
    const hardEnd = safeUnicodeCut(text, cursor, requestedEnd);
    if (hardEnd == null) throw ledgerGraphemeError(size);
    const requestedMinEnd = Math.min(hardEnd, cursor + Math.max(128, Math.floor(size * 0.55)));
    const minEnd = safeUnicodeCut(text, cursor, requestedMinEnd) ?? cursor;
    const preferred = hardEnd === text.length ? hardEnd : findPreferredCut(text, cursor, hardEnd, minEnd);
    const cut = safeUnicodeCut(text, cursor, preferred) ?? hardEnd;
    let original = text.slice(cursor, cut);
    if (!original) break;

    const prefixMatch = original.match(/^\s+/);
    const prefix = prefixMatch?.[0] || '';
    let coreAndSuffix = original.slice(prefix.length);
    const suffixMatch = coreAndSuffix.match(/\s+$/);
    const suffix = suffixMatch?.[0] || '';
    let core = coreAndSuffix.slice(0, coreAndSuffix.length - suffix.length);

    if (!core) {
      // Never send a whitespace-only slice to a model. Attach it to the previous
      // separator where possible; otherwise keep it as a skipped literal slice.
      if (slices.length) {
        slices[slices.length - 1].suffix += original;
        slices[slices.length - 1].original += original;
        cursor = cut;
        continue;
      }
      core = original;
    }

    slices.push({
      index: slices.length,
      prefix,
      text: core,
      suffix,
      original,
      result: null,
      status: 'pending',
      error: null,
    });
    cursor = cut;
  }

  const reassembled = slices.map((slice) => slice.prefix + slice.text + slice.suffix).join('');
  if (reassembled !== text) throw new Error('Ledger splitter failed its lossless assembly invariant.');
  return slices;
}

export function subdivideLedgerSlice(slice, maxChars) {
  if (!slice || typeof slice.text !== 'string') return null;
  const budget = clamp(Math.trunc(Number(maxChars) || 0), 256, MAX_LEDGER_SLICE_CHARS);
  if (slice.text.length <= budget) return null;
  const parts = splitTextToLedgerSlices(slice.text, budget);
  if (parts.length < 2) return null;
  parts[0].prefix = `${slice.prefix || ''}${parts[0].prefix || ''}`;
  const last = parts[parts.length - 1];
  last.suffix = `${last.suffix || ''}${slice.suffix || ''}`;
  return parts.map((part, index) => ({ ...part, index, result: null, status: 'pending', error: null }));
}

export function assembleLedgerText(slices) {
  if (!Array.isArray(slices)) return '';
  return slices.map((slice) => {
    const core = slice?.status === 'done' && typeof slice?.result === 'string'
      ? slice.result
      : slice?.text || '';
    return `${slice?.prefix || ''}${core}${slice?.suffix || ''}`;
  }).join('');
}

export function ledgerContextNote(ledger, index) {
  const slices = ledger?.slices || [];
  const current = slices[index];
  if (!current) return '';
  const previous = index > 0 ? slices[index - 1] : null;
  const next = index + 1 < slices.length ? slices[index + 1] : null;
  const clip = (value) => {
    const text = normalizeOutputText(value).trim();
    if (text.length <= 900) return text;
    return index > 0 ? text.slice(-900) : text.slice(0, 900);
  };
  const parts = [];
  if (previous) parts.push(`Previous slice reference (do not rewrite):\n${clip(previous.result || previous.text)}`);
  if (next) parts.push(`Next slice reference (do not rewrite):\n${clip(next.text)}`);
  return parts.length ? `Ledger continuity reference only:\n${parts.join('\n\n')}` : '';
}

export function createLedger(profile, selection, config = {}, continuation = null) {
  const text = asText(selection?.text);
  if (text.length > MAX_LEDGER_SOURCE_CHARS) throw ledgerCapacityError(text.length);
  const budget = ledgerSliceBudgetChars(config, profile);
  const slices = splitTextToLedgerSlices(text, budget);
  const profileId = String(profile?.id || profile?.name || 'custom');
  const executionSignature = ledgerExecutionSignature(profile, selection, config);
  const key = `${selection?.cid || '?'}::${selection?.mid || '?'}::${fnv1a(text)}::${executionSignature}`;
  return {
    key,
    createdAt: Date.now(),
    profileId,
    executionSignature,
    profile,
    selection: { ...selection, text },
    original: text,
    sliceBudget: budget,
    slices,
    continuation,
    context: null,
  };
}

class SessionLedgerStore {
  constructor() {
    this.map = new Map();
  }

  put(ledger) {
    if (!ledger?.key) return null;
    const sourceChars = this.sourceFootprint(ledger);
    if (sourceChars > MAX_LEDGER_SOURCE_CHARS) throw ledgerCapacityError(sourceChars);
    this.map.delete(ledger.key);
    this.map.set(ledger.key, ledger);
    this.prune();
    return ledger;
  }

  get(key) {
    const value = this.map.get(key) || null;
    if (value) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  delete(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  footprint(ledger) {
    if (!ledger) return 0;
    const resultChars = Array.isArray(ledger.slices)
      ? ledger.slices.reduce((sum, slice) => sum + String(slice?.result || '').length, 0)
      : 0;
    const contextChars = ledger.context && typeof ledger.context === 'object'
      ? Object.entries(ledger.context)
          .filter(([key]) => key !== 'messageInfo')
          .reduce((sum, [, value]) => sum + (typeof value === 'string' ? value.length : 0), 0)
      : 0;
    return String(ledger.original || '').length + resultChars + contextChars + String(ledger.profile?.prompt || '').length;
  }

  sourceFootprint(ledger) {
    return String(ledger?.original || '').length;
  }

  prune() {
    while (this.map.size > MAX_SESSION_LEDGERS) this.map.delete(this.map.keys().next().value);
    let chars = [...this.map.values()].reduce((sum, ledger) => sum + this.sourceFootprint(ledger), 0);
    while (chars > MAX_SESSION_LEDGER_SOURCE_CHARS && this.map.size > 1) {
      const oldestKey = this.map.keys().next().value;
      chars -= this.sourceFootprint(this.map.get(oldestKey));
      this.map.delete(oldestKey);
    }
  }

  list() {
    return [...this.map.values()];
  }
}

export const sessionLedgerStore = new SessionLedgerStore();

export function pendingApplyIndexes(results, total) {
  const count = Math.max(0, Math.trunc(Number(total) || 0));
  const pending = [];
  for (let index = 0; index < count; index += 1) {
    if (results?.[index]?.applied !== true && results?.[index] !== true) pending.push(index);
  }
  return pending;
}

export function partialApplySummary(results, total) {
  const applied = [];
  const notApplied = [];
  for (let index = 0; index < total; index += 1) {
    const label = `Message ${index + 1}`;
    if (results?.[index]?.applied === true || results?.[index] === true) applied.push(label);
    else notApplied.push(label);
  }
  if (applied.length === total) return `Applied to all ${total} messages.`;
  return `Partial apply: ${applied.length}/${total} applied${applied.length ? ` (${applied.join(', ')})` : ''}. Not applied: ${notApplied.join(', ')}.`;
}
