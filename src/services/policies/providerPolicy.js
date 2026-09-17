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

const TIMEOUT_PATTERNS = [
  /request\s+timed\s+out/i,
  /timeout(?:error)?/i,
  /timed\s+out\s+after/i,
];

const NETWORK_PATTERNS = [
  /failed\s+to\s+fetch/i,
  /networkerror/i,
  /network\s+request\s+failed/i,
  /load\s+failed/i,
  /connection\s+(?:refused|reset|closed)/i,
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

function matchesAny(text, patterns) {
  return !!text && patterns.some((pattern) => pattern.test(text));
}

export function isProviderContextLimitError(value) {
  return matchesAny(stringifyErrorLike(value), CONTEXT_LIMIT_PATTERNS);
}

export function isLikelyLocalNetworkUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || '').trim()); } catch { return false; }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost')) return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;
  if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true;
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) return true;
  const match172 = host.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/);
  if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return true;
  if (/^(?:fc|fd)[0-9a-f]{2}:/i.test(host) || /^fe80:/i.test(host)) return true;
  return false;
}

export function normalizeProviderFailure(value, fallback = 'Provider request failed.') {
  const source = stringifyErrorLike(value).trim();
  const raw = source || fallback;
  const isContextLimit = matchesAny(raw, CONTEXT_LIMIT_PATTERNS);
  const isTimeout = matchesAny(raw, TIMEOUT_PATTERNS);
  const isNetwork = matchesAny(raw, NETWORK_PATTERNS);
  let error = redactSecretText(raw).slice(0, 2000);

  if (isNetwork && /failed\s+to\s+fetch|networkerror|network\s+request\s+failed|load\s+failed/i.test(raw)) {
    error = 'Network request failed before the provider returned an HTTP response. For a LAN Ollama server, verify the Ollama listen address, firewall, and allowed browser origins (CORS), then retry.';
  }

  return {
    error,
    errorCode: isContextLimit
      ? 'RWA_PROVIDER_CONTEXT_LIMIT'
      : isTimeout
        ? 'RWA_PROVIDER_TIMEOUT'
        : isNetwork
          ? 'RWA_PROVIDER_NETWORK'
          : null,
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
