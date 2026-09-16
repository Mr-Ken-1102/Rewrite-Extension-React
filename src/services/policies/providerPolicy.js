import { redactSecretText } from './secretRedaction.js';

const CONTEXT_LIMIT_PATTERNS = [
  /context[_\s-]?length[_\s-]?exceeded/i,
  /context\s+(?:window|length|limit)/i,
  /maximum\s+(?:context\s+)?(?:length|tokens?)/i,
  /max(?:imum)?\s+tokens?.*(?:exceed|limit|context)/i,
  /too\s+many\s+tokens/i,
  /prompt\s+(?:is\s+)?too\s+long/i,
  /input\s+(?:is\s+)?too\s+long/i,
  /(?:request|prompt|input).*exceeds?.*(?:context|token)/i,
  /token\s+limit/i,
];

function stringifyErrorLike(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Error) {
    const pieces = [value.message, value.code, value.name];
    if (value.data) pieces.push(stringifyErrorLike(value.data));
    return pieces.filter(Boolean).join(' | ');
  }
  if (typeof value === 'object') {
    const pieces = [value.message, value.error, value.type, value.code, value.detail];
    return pieces.map((item) => stringifyErrorLike(item)).filter(Boolean).join(' | ');
  }
  return String(value);
}

export function isProviderContextLimitError(value) {
  const text = stringifyErrorLike(value);
  return !!text && CONTEXT_LIMIT_PATTERNS.some((pattern) => pattern.test(text));
}

export function normalizeProviderFailure(value, fallback = 'Provider request failed.') {
  const raw = stringifyErrorLike(value).trim() || fallback;
  return {
    error: redactSecretText(raw).slice(0, 2000),
    errorCode: isProviderContextLimitError(value) ? 'RWA_PROVIDER_CONTEXT_LIMIT' : null,
  };
}

export function validateProviderHttpUrl(value, label) {
  let parsed;
  try { parsed = new URL(String(value || '').trim()); } catch { throw new Error(`${label} URL is invalid.`); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${label} URL must use http:// or https://.`);
  if (parsed.username || parsed.password) throw new Error(`Do not put credentials in the ${label} URL.`);
  if (parsed.search || parsed.hash) throw new Error(`${label} URL must not contain a query string or fragment.`);
  return parsed;
}
