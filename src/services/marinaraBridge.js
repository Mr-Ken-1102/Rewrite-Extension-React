import { useRuntimeStore } from '../store/useRuntimeStore';

export const MARINARA_ENGINE_BASELINE = Object.freeze({
  version: '2.4.4',
  commit: '1a299369ac7025028c3ce1b80cc59f47b7b0691b',
});

export const MARINARA_CSRF_HEADER = 'x-marinara-csrf';
export const MARINARA_CSRF_VALUE = '1';
export const SIDECAR_PROMPT_MAX_CHARS = 16_000;

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function getMarinara() {
  return useRuntimeStore.getState().marinara;
}

export function getHostFetch() {
  const marinara = getMarinara();
  if (marinara && typeof marinara.fetch === 'function') {
    return marinara.fetch.bind(marinara);
  }
  return window.fetch.bind(window);
}

export function apiPath(path) {
  if (typeof path !== 'string' || !path.trim()) {
    throw new TypeError('Marinara API path must be a non-empty string');
  }
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/api/')) return path;
  return `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function makeAbortError(reason) {
  if (reason instanceof Error) return reason;
  try {
    return new DOMException('The operation was aborted', 'AbortError');
  } catch {
    const error = new Error('The operation was aborted');
    error.name = 'AbortError';
    return error;
  }
}

function managedTimer(callback, timeoutMs) {
  const marinara = getMarinara();
  const setTimer = marinara && typeof marinara.setTimeout === 'function'
    ? marinara.setTimeout.bind(marinara)
    : window.setTimeout.bind(window);
  const clearTimer = marinara && typeof marinara.clearTimeout === 'function'
    ? marinara.clearTimeout.bind(marinara)
    : window.clearTimeout.bind(window);
  const id = setTimer(callback, timeoutMs);
  return () => clearTimer(id);
}

export async function fetchResponse(input, init = {}, timeoutMs = 25_000) {
  const controller = new AbortController();
  const sourceSignal = init.signal;
  const abortFromSource = () => controller.abort(sourceSignal?.reason ?? makeAbortError());

  if (sourceSignal?.aborted) {
    abortFromSource();
  } else if (sourceSignal) {
    sourceSignal.addEventListener('abort', abortFromSource, { once: true });
  }

  const clearTimer = managedTimer(
    () => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)),
    timeoutMs,
  );

  try {
    return await getHostFetch()(input, { ...init, signal: controller.signal });
  } finally {
    clearTimer();
    sourceSignal?.removeEventListener('abort', abortFromSource);
  }
}

async function readResponsePayload(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function responseError(response, payload) {
  const detail = payload && typeof payload === 'object'
    ? payload.message || payload.error
    : payload;
  const suffix = typeof detail === 'string' && detail.trim() ? `: ${detail.trim()}` : '';
  const error = new Error(`HTTP ${response.status} ${response.statusText || 'Request failed'}${suffix}`);
  error.status = response.status;
  error.payload = payload;
  return error;
}

export async function fetchJson(input, init = {}, timeoutMs = 25_000) {
  const response = await fetchResponse(input, init, timeoutMs);
  const payload = await readResponsePayload(response);
  if (!response.ok) throw responseError(response, payload);
  return payload;
}

export async function apiJson(path, init = {}, timeoutMs = 25_000) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  let body = init.body;

  if (UNSAFE_METHODS.has(method)) {
    headers.set(MARINARA_CSRF_HEADER, MARINARA_CSRF_VALUE);
  }

  if (body != null && typeof body !== 'string' && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }
  if (body != null && typeof body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetchJson(
    apiPath(path),
    {
      ...init,
      method,
      headers,
      body,
      cache: init.cache || 'no-store',
    },
    timeoutMs,
  );
}
