import { usePersistentStore } from '../../store/usePersistentStore';
import { MarinaraHost } from '../marinaraHost';
import { debugLogService } from '../debugLogService';
import {
  getProviderTargetAddressSpace,
  isLikelyLocalNetworkUrl,
  normalizeProviderFailure,
  validateProviderHttpUrl,
  withProviderNetworkHints,
} from '../policies/providerPolicy.js';

const ENDPOINTS = {
  tracker: '/sidecar/tracker',
  connections: '/connections',
  generateRaw: '/generate/raw',
  chats: '/chats',
};

function normalizeConnectionList(payload) {
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.connections) ? payload.connections : []);
  return list.filter((item) => item && typeof item.id === 'string');
}

function extenderRoot(value) {
  return String(value || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
}

function directBase(value) {
  return String(value || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
}

function extractMarinaraContent(payload) {
  if (typeof payload?.content === 'string') return payload.content;
  if (typeof payload?.result === 'string') return payload.result;
  return '';
}


function createRawRunId() {
  try {
    const id = globalThis.crypto?.randomUUID?.();
    if (id) return `rwa-${id}`;
  } catch { /* fall through */ }
  return `rwa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseSsePayload(block) {
  const data = String(block || '')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
}

async function readRawStream(response, signal, onProgress) {
  if (!response?.body?.getReader) {
    return { error: 'Marinara streaming response is not readable in this browser.' };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamed = '';
  let finalContent = '';
  let streamError = '';
  let aborted = false;
  let done = false;
  let lastReportedLength = 0;
  let lastReportedAt = 0;

  const reportProgress = (force = false) => {
    if (typeof onProgress !== 'function' || !streamed) return;
    const now = Date.now();
    if (!force && streamed.length - lastReportedLength < 48 && now - lastReportedAt < 80) return;
    lastReportedLength = streamed.length;
    lastReportedAt = now;
    try { onProgress(streamed); } catch { /* UI progress must never break inference */ }
  };

  const consume = (block) => {
    const payload = parseSsePayload(block);
    if (!payload || typeof payload.type !== 'string') return;
    if (payload.type === 'token' && typeof payload.data === 'string') {
      streamed += payload.data;
      reportProgress(false);
      return;
    }
    if (payload.type === 'result') {
      const content = typeof payload.data?.content === 'string' ? payload.data.content : '';
      if (content) {
        finalContent = content;
        streamed = content;
        reportProgress(true);
      }
      return;
    }
    if (payload.type === 'error') {
      streamError = typeof payload.data === 'string'
        ? payload.data
        : (payload.data?.message || JSON.stringify(payload.data || 'Raw generation failed'));
      return;
    }
    if (payload.type === 'aborted') {
      aborted = true;
      return;
    }
    if (payload.type === 'done') done = true;
  };

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';
      parts.forEach(consume);
      if (signal?.aborted) {
        try { await reader.cancel(signal.reason); } catch { /* noop */ }
        return { aborted: true };
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
  } catch (err) {
    if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
    return { error: err?.message || String(err), partial: streamed };
  } finally {
    try { reader.releaseLock(); } catch { /* noop */ }
  }

  if (aborted || signal?.aborted) return { aborted: true };
  if (streamError) return { error: streamError, partial: streamed };
  if (!done && !finalContent) {
    return {
      error: streamed
        ? 'Marinara streaming ended before the provider delivered a final result. The partial text was not applied.'
        : 'Marinara streaming ended before a result was returned.',
      partial: streamed,
    };
  }

  const content = finalContent || streamed;
  reportProgress(true);
  return { content, streamed: true };
}

async function queryLocalNetworkPermission(addressSpace) {
  const permissionName = addressSpace === 'loopback'
    ? 'loopback-network'
    : addressSpace === 'local'
      ? 'local-network'
      : '';
  if (!permissionName || !globalThis.navigator?.permissions?.query) return 'unsupported';
  try {
    const status = await globalThis.navigator.permissions.query({ name: permissionName });
    return status?.state || 'unknown';
  } catch {
    return 'unsupported';
  }
}

export class ProviderService {
  static async listConnections(signal) {
    const result = await MarinaraHost.apiFetch(ENDPOINTS.connections, { signal }, 15000);
    return normalizeConnectionList(result);
  }

  static async resolveMarinaraConnection(config, signal, chatId = '') {
    const list = await this.listConnections(signal);
    const requestedChatId = String(chatId || '').trim();
    const routing = config.marinaraRouting === 'fixed' ? 'fixed' : 'chat';

    if (routing === 'fixed') {
      const fixedId = String(config.connectionId || '').trim();
      if (!fixedId) {
        return {
          connectionId: '',
          connection: null,
          source: 'fixed-empty',
          chatId: requestedChatId,
          error: 'Rewrite Assistant is set to use a specific Marinara connection, but no connection is selected.',
        };
      }
      const connection = list.find((item) => item.id === fixedId) || null;
      if (!connection) {
        usePersistentStore.getState().updateConfig({ connectionId: '' });
        return {
          connectionId: '',
          connection: null,
          source: 'fixed-missing',
          chatId: requestedChatId,
          error: 'The selected Marinara connection is no longer available. Choose another connection in Rewrite Assistant settings.',
        };
      }
      return { connectionId: fixedId, connection, source: 'fixed', chatId: requestedChatId, error: '' };
    }

    if (!requestedChatId) {
      return {
        connectionId: '',
        connection: null,
        source: 'chat-empty',
        chatId: '',
        error: 'No active chat is available to resolve its Marinara connection.',
      };
    }

    let chat;
    try {
      chat = await MarinaraHost.apiFetch(`${ENDPOINTS.chats}/${encodeURIComponent(requestedChatId)}`, { signal }, 15000);
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) throw err;
      return {
        connectionId: '',
        connection: null,
        source: 'chat',
        chatId: requestedChatId,
        error: `Could not read the current chat connection from Marinara: ${err?.message || String(err)}`,
      };
    }

    const chatConnectionId = typeof chat?.connectionId === 'string' ? chat.connectionId.trim() : '';
    if (!chatConnectionId) {
      return {
        connectionId: '',
        connection: null,
        source: 'chat-empty',
        chatId: requestedChatId,
        error: 'The current chat has no Marinara connection. Choose a connection in the chat settings, or switch Rewrite Assistant to a specific connection.',
      };
    }

    const connection = list.find((item) => item.id === chatConnectionId) || null;
    if (!connection) {
      return {
        connectionId: '',
        connection: null,
        source: 'chat',
        chatId: requestedChatId,
        error: 'The current chat references a Marinara connection that is no longer available. Choose a valid connection in the chat settings first.',
      };
    }
    return { connectionId: chatConnectionId, connection, source: 'chat', chatId: requestedChatId, error: '' };
  }

  static async resolveConnectionId(config, signal, chatId = '') {
    const resolved = await this.resolveMarinaraConnection(config, signal, chatId);
    return resolved.connectionId;
  }

  static async runInference(systemPrompt, userPrompt, signal, override = {}) {
    const config = { ...usePersistentStore.getState().config, ...override };
    const mode = ['marinara', 'sidecar', 'direct', 'extender'].includes(config.connMode) ? config.connMode : 'marinara';
    const configuredTimeout = Math.max(5000, Math.min(180000, Number(config.requestTimeoutMs) || 45000));
    const directLocalNetwork = mode === 'direct' && isLikelyLocalNetworkUrl(config.ollamaUrl);
    const marinaraTimeout = mode === 'marinara'
      ? Math.max(0, Math.min(180000, Number(override.marinaraTimeoutMs) || 0))
      : configuredTimeout;
    const timeout = directLocalNetwork ? Math.max(120000, configuredTimeout) : marinaraTimeout;
    debugLogService.add('inference.request', {
      mode,
      systemChars: systemPrompt.length,
      userChars: userPrompt.length,
      timeoutMs: timeout,
      localNetwork: directLocalNetwork || undefined,
    });

    if (mode === 'marinara') {
      const resolved = await this.resolveMarinaraConnection(config, signal, override.chatId);
      if (resolved.error || !resolved.connectionId) return { error: resolved.error || 'No Marinara connection is available.' };
      const connectionId = resolved.connectionId;
      const fastRewrite = config.fastRewrite !== false;
      debugLogService.add('inference.connection', {
        mode,
        source: resolved.source,
        chatId: resolved.chatId || null,
        connectionId,
        fastRewrite,
      });

      const requestRaw = async (parameters = null) => {
        const runId = createRawRunId();
        const body = {
          connectionId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          streaming: true,
          runId,
          ...(parameters ? { parameters } : {}),
        };

        let abortSent = false;
        const abortServerRun = () => {
          if (abortSent) return;
          abortSent = true;
          void MarinaraHost.apiFetch(`${ENDPOINTS.generateRaw}/abort`, {
            method: 'POST',
            body: JSON.stringify({ runId, connectionId }),
          }, 5000).catch(() => {});
        };
        if (signal?.aborted) {
          abortServerRun();
          return { aborted: true };
        }
        signal?.addEventListener?.('abort', abortServerRun, { once: true });

        try {
          const response = await MarinaraHost.fetch(`/api${ENDPOINTS.generateRaw}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-marinara-csrf': '1',
              Accept: 'text/event-stream',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
            signal,
          }, timeout);

          if (!response.ok) {
            const raw = await response.text().catch(() => '');
            let detail = raw;
            try {
              const parsed = JSON.parse(raw);
              detail = parsed?.error || parsed?.message || raw;
            } catch { /* keep raw text */ }
            return normalizeProviderFailure(detail || `HTTP ${response.status} from Marinara.`);
          }

          const streamed = await readRawStream(response, signal, override.onProgress);
          if (streamed.aborted) return { aborted: true };
          if (streamed.error) {
            debugLogService.add('inference.stream_error', {
              mode,
              runId,
              partialChars: String(streamed.partial || '').length,
              message: streamed.error,
            });
            return normalizeProviderFailure(streamed.error, 'Marinara streaming failed.');
          }
          return { result: streamed.content || '', streamed: true };
        } catch (err) {
          if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
          return normalizeProviderFailure(err, 'Marinara request failed.');
        } finally {
          signal?.removeEventListener?.('abort', abortServerRun);
        }
      };

      const initialParameters = fastRewrite ? { reasoningEffort: null } : null;
      const result = await requestRaw(initialParameters);
      if (!result) return { error: 'Marinara returned an unreadable response.' };
      if (result.aborted === true) return { aborted: true };
      if (result.error) return result;

      let content = extractMarinaraContent(result);
      let streamed = result.streamed === true;
      if (!content.trim() && !fastRewrite) {
        debugLogService.add('inference.empty_response', {
          mode,
          stage: 'initial',
          connectionId,
          retry: 'reasoning-disabled',
        });

        const retry = await requestRaw({ reasoningEffort: null });
        if (!retry) return { error: 'Marinara returned an unreadable response while retrying an empty generation.' };
        if (retry.aborted === true) return { aborted: true };
        if (retry.error) return retry;
        content = extractMarinaraContent(retry);
        streamed = retry.streamed === true;

        if (!content.trim()) {
          debugLogService.add('inference.empty_response', {
            mode,
            stage: 'reasoning-disabled-retry',
            connectionId,
          });
          return {
            error: 'Marinara completed the request but returned no usable text. Rewrite Assistant retried once with reasoning disabled and still received an empty answer. Check the active chat model/output-token settings.',
            errorCode: 'RWA_PROVIDER_EMPTY_RESPONSE',
          };
        }
      } else if (!content.trim()) {
        return {
          error: 'Marinara completed the fast rewrite but returned no usable text. Try disabling Fast rewrite for this connection or check the active chat model/output-token settings.',
          errorCode: 'RWA_PROVIDER_EMPTY_RESPONSE',
        };
      }

      debugLogService.add('inference.response', { mode, resultChars: content.length, streamed });
      return { result: content, streamed };
    }

    if (mode === 'sidecar') {
      if (systemPrompt.length > 16000 || userPrompt.length > 16000) {
        return { error: 'Marinara v2.4.4 Sidecar accepts at most 16,000 characters per prompt.', errorCode: 'RWA_PROVIDER_CONTEXT_LIMIT' };
      }
      const result = await MarinaraHost.apiFetch(ENDPOINTS.tracker, {
        method: 'POST', body: JSON.stringify({ systemPrompt, userPrompt }), signal,
      }, timeout);
      if (!result) return { error: 'The local sidecar returned an unreadable response.' };
      if (result.error) return normalizeProviderFailure(result.error);
      debugLogService.add('inference.response', { mode, resultChars: String(result.result || '').length });
      return result;
    }

    if (mode === 'extender') {
      const root = extenderRoot(config.extenderUrl);
      if (!root) return { error: 'No Extender URL is configured.' };
      try { validateProviderHttpUrl(root, 'Extender'); } catch (err) { return { error: err?.message || String(err) }; }
      try {
        const endpoint = `${root}/v1/chat/completions`;
        const response = await MarinaraHost.fetch(endpoint, withProviderNetworkHints(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: Math.max(0, Math.min(2, Number.isFinite(Number(config.directTemp)) ? Number(config.directTemp) : 0.7)),
            stream: false,
          }),
          signal,
        }), timeout);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return normalizeProviderFailure(data?.error || data || `HTTP ${response.status} from Extender.`, `HTTP ${response.status} from Extender.`);
        if (data?.error) return normalizeProviderFailure(data.error);
        const result = data?.choices?.[0]?.message?.content || '';
        debugLogService.add('inference.response', { mode, resultChars: result.length });
        return { result };
      } catch (err) {
        if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
        debugLogService.add('inference.error', { mode, message: err?.message || String(err) });
        return normalizeProviderFailure(err, 'Extender request failed.');
      }
    }

    const base = directBase(config.ollamaUrl);
    if (!base) return { error: 'No Direct API URL is configured.' };
    if (!config.ollamaModel?.trim()) return { error: 'No Direct API model is configured.' };
    try { validateProviderHttpUrl(base, 'Direct API'); } catch (err) {
      const message = err?.message || String(err);
      return { error: message.includes('credentials') ? `${message} Use a Marinara connection for credentialed remote providers.` : message };
    }

    try {
      const endpoint = `${base}/chat/completions`;
      const response = await MarinaraHost.fetch(endpoint, withProviderNetworkHints(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel.trim(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: Math.max(0, Math.min(2, Number.isFinite(Number(config.directTemp)) ? Number(config.directTemp) : 0.7)),
          stream: false,
        }),
        signal,
      }), timeout);
      const data = await response.json().catch(() => ({}));
      if (data.error) return normalizeProviderFailure(data.error);
      if (!response.ok) return normalizeProviderFailure(data, `HTTP ${response.status} from Direct API.`);
      const result = data.choices?.[0]?.message?.content || '';
      debugLogService.add('inference.response', { mode, resultChars: result.length });
      return { result };
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
      debugLogService.add('inference.error', {
        mode,
        timeoutMs: timeout,
        localNetwork: directLocalNetwork,
        message: err?.message || String(err),
      });
      return normalizeProviderFailure(err, 'Direct API request failed.');
    }
  }

  static async discoverModels(url, signal) {
    const base = directBase(url);
    if (!base) return { models: [], error: 'No Direct API URL is configured.' };
    try { validateProviderHttpUrl(base, 'Direct API'); } catch (err) { return { models: [], error: err?.message || String(err) }; }
    const root = base.replace(/\/v1$/, '');
    const tagsEndpoint = `${root}/api/tags`;
    try {
      const tags = await MarinaraHost.fetch(tagsEndpoint, withProviderNetworkHints(tagsEndpoint, { signal }), 12000);
      if (tags.ok) {
        const data = await tags.json();
        const models = Array.isArray(data?.models) ? data.models.map((model) => model.name).filter(Boolean) : [];
        if (models.length) return { models };
      }
    } catch { /* fall through */ }
    const modelsEndpoint = `${base}/models`;
    try {
      const response = await MarinaraHost.fetch(modelsEndpoint, withProviderNetworkHints(modelsEndpoint, { signal }), 12000);
      const data = await response.json().catch(() => ({}));
      const models = Array.isArray(data?.data) ? data.data.map((model) => model.id).filter(Boolean) : [];
      if (!response.ok) return { models: [], error: `HTTP ${response.status}` };
      return { models };
    } catch (err) {
      const failure = normalizeProviderFailure(err, 'Model discovery failed.');
      return { models: [], error: failure.error, errorCode: failure.errorCode };
    }
  }

  static async diagnoseDirectApi(url, signal) {
    const base = directBase(url);
    if (!base) return { ok: false, issue: 'config', message: 'No Direct API URL is configured.' };
    try { validateProviderHttpUrl(base, 'Direct API'); } catch (err) {
      return { ok: false, issue: 'config', message: err?.message || String(err) };
    }

    const root = base.replace(/\/v1$/, '');
    const endpoint = `${root}/api/tags`;
    const targetAddressSpace = getProviderTargetAddressSpace(endpoint);
    const permission = await queryLocalNetworkPermission(targetAddressSpace);
    const browserOrigin = globalThis.location?.origin || '';

    try {
      const response = await MarinaraHost.fetch(endpoint, withProviderNetworkHints(endpoint, { signal }), 10000);
      if (!response.ok) {
        return {
          ok: false,
          issue: 'http',
          httpStatus: response.status,
          targetAddressSpace,
          permission,
          browserOrigin,
          message: `The server is reachable but returned HTTP ${response.status} from /api/tags.`,
        };
      }
      const data = await response.json().catch(() => ({}));
      const models = Array.isArray(data?.models) ? data.models.map((model) => model.name).filter(Boolean) : [];
      return {
        ok: true,
        issue: null,
        models,
        targetAddressSpace,
        permission,
        browserOrigin,
        message: `LAN provider is reachable with readable CORS${models.length ? `; ${models.length} model(s) found.` : '.'}`,
      };
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) throw err;
      if (permission === 'denied') {
        return {
          ok: false,
          issue: 'permission',
          targetAddressSpace,
          permission,
          browserOrigin,
          message: 'Browser Local Network Access permission is denied for this site.',
        };
      }

      try {
        // An opaque no-cors response proves the TCP/HTTP path is reachable even
        // when the readable CORS request is blocked by the provider policy.
        await MarinaraHost.fetch(endpoint, withProviderNetworkHints(endpoint, { signal, mode: 'no-cors' }), 10000);
        return {
          ok: false,
          issue: 'cors',
          transportReachable: true,
          targetAddressSpace,
          permission,
          browserOrigin,
          message: 'The LAN server is reachable, but the browser cannot read its response. Configure Ollama CORS for this Marinara origin and restart Ollama.',
        };
      } catch (transportErr) {
        if (signal?.aborted || MarinaraHost.isAbortError(transportErr)) throw transportErr;
        return {
          ok: false,
          issue: 'transport',
          transportReachable: false,
          targetAddressSpace,
          permission,
          browserOrigin,
          message: 'The browser cannot reach the LAN server. Verify Ollama is listening on 0.0.0.0, the laptop firewall allows TCP 11434 from the local subnet, and both machines can reach each other.',
        };
      }
    }
  }
}
