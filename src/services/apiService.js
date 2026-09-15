import { usePersistentStore } from '../store/usePersistentStore';
import { apiJson, fetchJson, SIDECAR_PROMPT_MAX_CHARS } from './marinaraBridge';

const MAX_CHARACTER_CONTEXT = 8;
const MAX_CHARACTER_PERSONALITY = 800;
const MAX_CHARACTER_DESCRIPTION = 1_200;
const MAX_TARGET_CHARS = 10_000;
const MAX_PROFILE_PROMPT_CHARS = 5_000;
const CUSTOM_PROVIDER_PROMPT_MAX_CHARS = 32_000;

const ENDPOINTS = Object.freeze({
  tracker: '/sidecar/tracker',
  chats: '/chats',
  characters: '/characters',
  personas: '/characters/personas',
});

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  const error = signal.reason instanceof Error ? signal.reason : new Error('cancelled');
  if (!error.name) error.name = 'AbortError';
  throw error;
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function parseCharacterIds(value) {
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim()))]
    .slice(0, MAX_CHARACTER_CONTEXT);
}

function extractRecordData(record) {
  if (!record || typeof record !== 'object') return {};
  return { ...record, ...parseJsonObject(record.data) };
}

function findMessageElement(messageId) {
  if (!messageId) return null;
  return Array.from(document.querySelectorAll('[data-message-id]'))
    .find((element) => element.getAttribute('data-message-id') === messageId) || null;
}

function normalizeMessages(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.messages)) return payload.messages;
  return [];
}

function truncateWithMarker(value, maxChars) {
  if (value.length <= maxChars) return value;
  if (maxChars <= 1) return value.slice(0, maxChars);
  return `${value.slice(0, maxChars - 1)}…`;
}

function composeBoundedPrompt(profile, cardContext, historyContext, targetText, config, maxChars) {
  const profilePrompt = truncateWithMarker(String(profile?.prompt || '').trim(), MAX_PROFILE_PROMPT_CHARS);
  const core = `[CORE INSTRUCTION]:\n${profilePrompt}`;
  const pct = Number(config.lengthPct) || 0;
  const constraints = config.lengthEnabled && pct !== 0
    ? (pct < 0
      ? `\n\n[CONSTRAINT]: Make the final rewritten output approximately ${Math.abs(pct)}% shorter (more concise) than the original text.`
      : `\n\n[CONSTRAINT]: Make the final rewritten output approximately ${pct}% longer (more detailed) than the original text.`)
    : '';
  const target = truncateWithMarker(String(targetText || ''), MAX_TARGET_CHARS);
  const targetBlock = `\n\n[TARGET TEXT TO REWRITE]:\n${target}`;
  const context = [cardContext, historyContext].map((value) => String(value || '').trim()).filter(Boolean).join('\n\n');
  const base = `${core}${constraints}${targetBlock}`;

  if (!Number.isFinite(maxChars) || maxChars <= 0) {
    return context ? `${core}${constraints}\n\n[CONTEXT DATA]:\n${context}${targetBlock}` : base;
  }

  if (base.length >= maxChars) {
    const reserved = `${constraints}${targetBlock}`;
    const coreBudget = Math.max(0, maxChars - reserved.length);
    return `${truncateWithMarker(core, coreBudget)}${reserved}`.slice(0, maxChars);
  }

  if (!context) return base;
  const prefix = `${core}${constraints}\n\n[CONTEXT DATA]:\n`;
  const contextBudget = Math.max(0, maxChars - prefix.length - targetBlock.length);
  return `${prefix}${truncateWithMarker(context, contextBudget)}${targetBlock}`.slice(0, maxChars);
}

export class APIService {
  static async fetchChat(chatId, signal) {
    if (!chatId) return null;
    throwIfAborted(signal);
    const chat = await apiJson(`${ENDPOINTS.chats}/${encodeURIComponent(chatId)}`, { signal });
    throwIfAborted(signal);
    return chat && typeof chat === 'object' ? chat : null;
  }

  static async fetchCharacterContext(chat, signal) {
    const ids = parseCharacterIds(chat?.characterIds);
    if (ids.length === 0) return '';

    const records = await Promise.allSettled(
      ids.map((id) => apiJson(`${ENDPOINTS.characters}/${encodeURIComponent(id)}`, { signal })),
    );
    throwIfAborted(signal);

    const blocks = records.flatMap((result) => {
      if (result.status !== 'fulfilled') return [];
      const data = extractRecordData(result.value);
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      const personality = typeof data.personality === 'string'
        ? truncateWithMarker(data.personality.trim(), MAX_CHARACTER_PERSONALITY)
        : '';
      const description = typeof data.description === 'string'
        ? truncateWithMarker(data.description.trim(), MAX_CHARACTER_DESCRIPTION)
        : '';
      if (!name && !personality && !description) return [];

      const lines = [];
      if (name) lines.push(`Character: ${name}`);
      if (personality) lines.push(`Personality: ${personality}`);
      if (description) lines.push(`Description: ${description}`);
      return [`[CHARACTER PROFILE${name ? `: ${name}` : ''}]\n${lines.join('\n')}`];
    });

    return blocks.length ? `\n\n${blocks.join('\n\n')}` : '';
  }

  static async fetchUserPersona(chat, signal) {
    const fallback = '\n\n[USER / AUTHOR CONTEXT]\nThe selected prose belongs to the author/editor. Do not roleplay as story characters and do not add conversational commentary.';
    const personaId = typeof chat?.personaId === 'string' ? chat.personaId.trim() : '';
    if (!personaId) return fallback;

    try {
      const persona = await apiJson(`${ENDPOINTS.personas}/${encodeURIComponent(personaId)}`, { signal });
      throwIfAborted(signal);
      const data = extractRecordData(persona);
      const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'User';
      const description = typeof data.description === 'string' ? data.description.trim() : '';
      const personality = typeof data.personality === 'string' ? data.personality.trim() : '';
      const details = [description, personality].filter(Boolean).join('\n');
      if (!details) return fallback;
      return `\n\n[USER / AUTHOR PERSONA: ${name}]\n${truncateWithMarker(details, 2_000)}\nUse this only as author context. Do not roleplay as story characters.`;
    } catch (error) {
      if (signal?.aborted) throw error;
      return fallback;
    }
  }

  static async fetchMessageContext(chatId, targetMessageId, depth, signal) {
    const requestedDepth = Math.max(0, Math.min(20, Number.parseInt(depth, 10) || 0));
    if (!chatId || !targetMessageId || requestedDepth === 0) return { history: '', targetRole: null };

    try {
      const payload = await apiJson(`${ENDPOINTS.chats}/${encodeURIComponent(chatId)}/messages`, { signal });
      throwIfAborted(signal);
      const messages = normalizeMessages(payload);
      const targetIndex = messages.findIndex((message) => message?.id === targetMessageId);
      if (targetIndex < 0) return { history: '', targetRole: null };

      const targetRole = typeof messages[targetIndex]?.role === 'string' ? messages[targetIndex].role : null;
      const history = messages
        .slice(Math.max(0, targetIndex - requestedDepth), targetIndex)
        .map((message) => {
          const content = typeof message?.content === 'string' ? message.content.trim() : '';
          if (!content) return null;
          const role = message.role === 'user' ? 'User' : (message.role === 'assistant' ? 'Character' : 'System');
          return `${role}: ${truncateWithMarker(content, 800)}`;
        })
        .filter(Boolean);

      return {
        history: history.length ? `\n\n[RECENT STORY CONTEXT]\n${history.join('\n\n')}` : '',
        targetRole,
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      return { history: '', targetRole: null };
    }
  }

  static resolveDomRole(messageId) {
    const element = findMessageElement(messageId);
    const role = element?.getAttribute('data-message-role');
    return role === 'user' || role === 'assistant' ? role : null;
  }

  static async fetchAIResponse(profile, savedSel, signal) {
    const config = usePersistentStore.getState().config;
    const messageId = savedSel?.mid || '';
    const chatId = savedSel?.cid || '';
    throwIfAborted(signal);

    const [chat, messageContext] = await Promise.all([
      this.fetchChat(chatId, signal).catch((error) => {
        if (signal?.aborted) throw error;
        return null;
      }),
      this.fetchMessageContext(chatId, messageId, config.contextDepth, signal),
    ]);
    throwIfAborted(signal);

    const role = savedSel?.detectedRole
      || this.resolveDomRole(messageId)
      || messageContext.targetRole;

    let speakerContext = '';
    if (!config.freeMode) {
      if (role === 'user' && config.injectUser) {
        speakerContext = await this.fetchUserPersona(chat, signal);
      } else if (role === 'assistant' && config.injectChar) {
        speakerContext = await this.fetchCharacterContext(chat, signal);
      }
    }
    throwIfAborted(signal);

    const targetText = truncateWithMarker(String(savedSel?.text || ''), MAX_TARGET_CHARS);
    const systemPrompt = `You are a neutral, objective writing assistant transforming text for an author.
Rules:
- Follow the requested rewrite operation exactly.
- ROLE ISOLATION: You are an editing tool, not a character in the story. Never roleplay or adopt a character's identity merely because that character appears in context.
- LANGUAGE LOCK: Preserve the language of the selected input unless the rewrite instruction explicitly requests translation.
- GRAMMATICAL FIDELITY: Use natural grammar, register, and cultural conventions for that language while preserving the original narrative perspective.
- NARRATIVE CONTINUITY: Use context only to preserve established facts and references.
- OUTPUT FORMAT: Return only the transformed prose, with no introduction, explanation, or surrounding quotation marks.
- Preserve wrapping markdown or punctuation only when it belongs to the selected source text.`;

    const customProvider = typeof config.ollamaModel === 'string' && config.ollamaModel.trim();
    const maxUserPrompt = customProvider ? CUSTOM_PROVIDER_PROMPT_MAX_CHARS : SIDECAR_PROMPT_MAX_CHARS;
    const userPrompt = composeBoundedPrompt(
      profile,
      speakerContext,
      messageContext.history,
      targetText,
      config,
      maxUserPrompt,
    );

    if (customProvider) {
      const url = (config.ollamaUrl || 'http://127.0.0.1:11434/v1').replace(/\/$/, '');
      const data = await fetchJson(
        `${url}/chat/completions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: customProvider,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
          }),
          signal,
        },
        25_000,
      );
      if (data?.error) return { error: data.error.message || data.error };
      const content = data?.choices?.[0]?.message?.content;
      return typeof content === 'string' && content.trim()
        ? { result: content }
        : { error: 'No response from language model' };
    }

    const sidecarResult = await apiJson(
      ENDPOINTS.tracker,
      {
        method: 'POST',
        body: {
          systemPrompt: truncateWithMarker(systemPrompt, SIDECAR_PROMPT_MAX_CHARS),
          userPrompt: truncateWithMarker(userPrompt, SIDECAR_PROMPT_MAX_CHARS),
        },
        signal,
      },
      25_000,
    );
    throwIfAborted(signal);
    return sidecarResult && typeof sidecarResult === 'object'
      ? sidecarResult
      : { error: 'Invalid response from Marinara Sidecar' };
  }
}
