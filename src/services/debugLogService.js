import { isSecretLikeKey, redactSecretText } from './policies/secretRedaction';

const MAX_ENTRIES = 200;
const entries = [];
let enabled = false;

function scrub(value, depth = 0) {
  if (depth > 3) return '[depth-limit]';
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    const redacted = redactSecretText(value);
    return redacted.length > 240 ? `${redacted.slice(0, 240)}…` : redacted;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => scrub(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
      if (isSecretLikeKey(key)) out[key] = '[redacted]';
      else out[key] = scrub(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

export const debugLogService = Object.freeze({
  setEnabled(value, { clearOnDisable = true } = {}) {
    const next = value === true;
    if (!next && enabled && clearOnDisable) entries.length = 0;
    enabled = next;
  },
  isEnabled() { return enabled; },
  add(event, details = {}) {
    if (!enabled) return false;
    // Event name and timestamp are service-owned. Payload fields remain nested
    // inside details so caller-controlled data cannot forge log metadata.
    entries.unshift({
      when: new Date().toISOString(),
      event: String(event || 'event').slice(0, 120),
      details: scrub(details),
    });
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    return true;
  },
  list() { return entries.map((entry) => ({ ...entry, details: scrub(entry.details) })); },
  clear() { entries.length = 0; },
  exportText() {
    return JSON.stringify({ type: 'rewrite-assistant-debug', version: 1, enabled, entries: this.list() }, null, 2);
  },
});
