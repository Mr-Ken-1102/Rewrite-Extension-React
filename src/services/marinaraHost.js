let hostRef = null;

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isAbortError(err) {
  return err?.name === 'AbortError' || err?.message === 'cancelled';
}

function isTimeoutError(err) {
  return err?.name === 'TimeoutError';
}

function makeAbortError() {
  if (typeof DOMException !== 'undefined') return new DOMException('The operation was aborted.', 'AbortError');
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function makeTimeoutError(timeoutMs) {
  if (typeof DOMException !== 'undefined') return new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError');
  const error = new Error(`Request timed out after ${timeoutMs}ms`);
  error.name = 'TimeoutError';
  return error;
}

function throwAbortReason(err, signal) {
  if (!signal?.aborted) throw err;
  const reason = signal.reason;
  if (isTimeoutError(reason)) throw reason;
  if (reason instanceof Error) throw reason;
  if (isAbortError(err)) throw err;
  throw makeAbortError();
}

export function setMarinaraHost(host) {
  hostRef = host && typeof host === 'object' ? host : null;
}

function getHost() {
  return hostRef;
}

function timerApi() {
  const host = getHost();
  const fallbackSet = globalThis.setTimeout?.bind(globalThis);
  const fallbackClear = globalThis.clearTimeout?.bind(globalThis);
  return {
    set: host && typeof host.setTimeout === 'function' ? host.setTimeout.bind(host) : fallbackSet,
    clear: host && typeof host.clearTimeout === 'function' ? host.clearTimeout.bind(host) : fallbackClear,
  };
}

function combinedAbortSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();
  const timers = timerApi();
  let timer = null;

  const abortFromExternal = () => {
    if (!controller.signal.aborted) controller.abort(externalSignal?.reason || makeAbortError());
  };

  if (externalSignal) {
    if (externalSignal.aborted) abortFromExternal();
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  if (Number.isFinite(timeoutMs) && timeoutMs > 0 && typeof timers.set === 'function') {
    timer = timers.set(() => {
      if (!controller.signal.aborted) controller.abort(makeTimeoutError(timeoutMs));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timer !== null && typeof timers.clear === 'function') timers.clear(timer);
      externalSignal?.removeEventListener?.('abort', abortFromExternal);
    },
  };
}

async function attributedFetch(input, init = {}, timeoutMs = 25000) {
  const host = getHost();
  const fallbackFetch = globalThis.fetch?.bind(globalThis);
  const fetchFn = host && typeof host.fetch === 'function' ? host.fetch.bind(host) : fallbackFetch;
  if (typeof fetchFn !== 'function') throw new Error('No fetch implementation is available.');

  const { signal, cleanup } = combinedAbortSignal(init.signal, timeoutMs);
  try {
    return await fetchFn(input, { ...init, signal });
  } catch (err) {
    throwAbortReason(err, signal);
  } finally {
    cleanup();
  }
}

function normalizeApiOptions(options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (UNSAFE_METHODS.has(method)) headers.set('x-marinara-csrf', '1');
  if (typeof options.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return { ...options, method, headers, cache: options.cache || 'no-store' };
}

async function readPayload(response) {
  if (response?.status === 204) return null;
  if (!response || typeof response.text !== 'function') return null;
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function httpError(status, statusText, data) {
  const detail = data && typeof data === 'object' ? (data.error || data.message) : data;
  const suffix = typeof detail === 'string' && detail.trim() ? `: ${detail.trim()}` : '';
  const error = new Error(`HTTP ${status} ${statusText || 'Request failed'}${suffix}`);
  error.name = 'HTTPError';
  error.status = status;
  error.data = data;
  return error;
}

async function apiFetch(path, options = {}, timeoutMs = 25000) {
  const host = getHost();
  const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path;

  if (host && typeof host.fetch !== 'function' && typeof host.apiFetch === 'function') {
    const { signal, cleanup } = combinedAbortSignal(options.signal, timeoutMs);
    try {
      const data = await host.apiFetch(normalizedPath, { ...options, signal });
      if (data && typeof data === 'object' && data.error) throw httpError(500, 'Legacy API error', data);
      return data;
    } catch (err) {
      throwAbortReason(err, signal);
    } finally {
      cleanup();
    }
  }

  const response = await attributedFetch(`/api${normalizedPath}`, normalizeApiOptions(options), timeoutMs);
  const data = await readPayload(response);
  if (!response.ok) throw httpError(response.status, response.statusText, data);
  return data;
}

async function apiJSON(path, options = {}, timeoutMs = 25000) {
  try {
    const data = await apiFetch(path, options, timeoutMs);
    return { ok: true, status: 200, data };
  } catch (error) {
    if (isAbortError(error) || isTimeoutError(error)) throw error;
    return { ok: false, status: Number(error?.status) || 500, data: error?.data ?? { error: error?.message || String(error) }, error };
  }
}

function onCleanup(fn) {
  const host = getHost();
  if (host && typeof host.onCleanup === 'function') {
    host.onCleanup(fn);
    return true;
  }
  return false;
}

export const MarinaraHost = Object.freeze({
  getHost,
  setHost: setMarinaraHost,
  fetch: attributedFetch,
  apiFetch,
  apiJSON,
  onCleanup,
  isAbortError,
  isTimeoutError,
});
