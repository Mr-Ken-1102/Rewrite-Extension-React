import { usePersistentStore } from '../../store/usePersistentStore';
import { MarinaraHost } from '../marinaraHost';
import { debugLogService } from '../debugLogService';
import { normalizeProviderFailure, validateProviderHttpUrl } from '../policies/providerPolicy.js';

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

export class ProviderService {
  static async listConnections(signal) {
    const result = await MarinaraHost.apiFetch(ENDPOINTS.connections, { signal }, 15000);
    return normalizeConnectionList(result);
  }

  static async resolveMarinaraConnection(config, signal, chatId = '') {
    const list = await this.listConnections(signal);
    const requestedChatId = String(chatId || '').trim();

    if (requestedChatId) {
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
      if (chatConnectionId) {
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
    }

    const fallbackId = String(config.connectionId || '').trim();
    if (config.connectionId && list.some((item) => item.id === config.connectionId)) {
      const connection = list.find((item) => item.id === fallbackId) || null;
      return { connectionId: fallbackId, connection, source: 'fallback', chatId: requestedChatId, error: '' };
    }
    if (config.connectionId) usePersistentStore.getState().updateConfig({ connectionId: '' });

    return {
      connectionId: '',
      connection: null,
      source: requestedChatId ? 'chat-empty' : 'fallback-empty',
      chatId: requestedChatId,
      error: requestedChatId
        ? 'The current chat has no Marinara connection. Choose a connection in the chat settings, or configure a fallback connection in Rewrite Assistant.'
        : 'No Marinara connection is available for this request.',
    };
  }

  static async resolveConnectionId(config, signal, chatId = '') {
    const resolved = await this.resolveMarinaraConnection(config, signal, chatId);
    return resolved.connectionId;
  }

  static async runInference(systemPrompt, userPrompt, signal, override = {}) {
    const config = { ...usePersistentStore.getState().config, ...override };
    const mode = ['marinara', 'sidecar', 'direct', 'extender'].includes(config.connMode) ? config.connMode : 'marinara';
    const configuredTimeout = Math.max(5000, Math.min(180000, Number(config.requestTimeoutMs) || 45000));
    // /generate/raw is deliberately non-streaming. Cold local models can take
    // longer than 45s to return their first complete response, so Marinara mode
    // gets a transparent 90s floor while Direct/Sidecar keep the configured value.
    const timeout = mode === 'marinara' ? Math.max(90000, configuredTimeout) : configuredTimeout;
    debugLogService.add('inference.request', { mode, systemChars: systemPrompt.length, userChars: userPrompt.length });

    if (mode === 'marinara') {
      const resolved = await this.resolveMarinaraConnection(config, signal, override.chatId);
      if (resolved.error || !resolved.connectionId) return { error: resolved.error || 'No Marinara connection is available.' };
      const connectionId = resolved.connectionId;
      debugLogService.add('inference.connection', { mode, source: resolved.source, chatId: resolved.chatId || null });
      const result = await MarinaraHost.apiFetch(ENDPOINTS.generateRaw, {
        method: 'POST',
        body: JSON.stringify({
          connectionId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          streaming: false,
        }),
        signal,
      }, timeout);
      if (!result) return { error: 'Marinara returned an unreadable response.' };
      if (result.aborted === true) return { aborted: true };
      if (result.error) return normalizeProviderFailure(result.error);
      const content = typeof result.content === 'string' ? result.content : (result.result || '');
      debugLogService.add('inference.response', { mode, resultChars: content.length });
      return { result: content };
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
        const response = await MarinaraHost.fetch(`${root}/v1/chat/completions`, {
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
        }, timeout);
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

    const base = String(config.ollamaUrl || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    if (!base) return { error: 'No Direct API URL is configured.' };
    if (!config.ollamaModel?.trim()) return { error: 'No Direct API model is configured.' };
    try { validateProviderHttpUrl(base, 'Direct API'); } catch (err) {
      const message = err?.message || String(err);
      return { error: message.includes('credentials') ? `${message} Use a Marinara connection for credentialed remote providers.` : message };
    }

    try {
      const response = await MarinaraHost.fetch(`${base}/chat/completions`, {
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
      }, timeout);
      const data = await response.json().catch(() => ({}));
      if (data.error) return normalizeProviderFailure(data.error);
      if (!response.ok) return normalizeProviderFailure(data, `HTTP ${response.status} from Direct API.`);
      const result = data.choices?.[0]?.message?.content || '';
      debugLogService.add('inference.response', { mode, resultChars: result.length });
      return { result };
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
      return normalizeProviderFailure(err, 'Direct API request failed.');
    }
  }

  static async discoverModels(url, signal) {
    const base = String(url || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    if (!base) return { models: [], error: 'No Direct API URL is configured.' };
    try { validateProviderHttpUrl(base, 'Direct API'); } catch (err) { return { models: [], error: err?.message || String(err) }; }
    const root = base.replace(/\/v1$/, '');
    try {
      const tags = await MarinaraHost.fetch(`${root}/api/tags`, { signal }, 12000);
      if (tags.ok) {
        const data = await tags.json();
        const models = Array.isArray(data?.models) ? data.models.map((model) => model.name).filter(Boolean) : [];
        if (models.length) return { models };
      }
    } catch { /* fall through */ }
    try {
      const response = await MarinaraHost.fetch(`${base}/models`, { signal }, 12000);
      const data = await response.json().catch(() => ({}));
      const models = Array.isArray(data?.data) ? data.data.map((model) => model.id).filter(Boolean) : [];
      if (!response.ok) return { models: [], error: `HTTP ${response.status}` };
      return { models };
    } catch (err) {
      return { models: [], error: err?.message || String(err) };
    }
  }
}
