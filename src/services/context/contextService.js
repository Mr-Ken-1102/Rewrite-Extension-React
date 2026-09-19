import { usePersistentStore } from '../../store/usePersistentStore';
import { MarinaraHost } from '../marinaraHost';
import { debugLogService } from '../debugLogService';
import { buildHistoryContext as buildSafeHistoryContext, getMessagePersonaSnapshot } from '../../utils/messageContext.js';
import { extractSurroundingContext } from '../../utils/selectionContext.js';
import { analyzeMergedMessageCompatibility } from '../policies/contextPolicy.js';
import { validateProviderHttpUrl } from '../policies/providerPolicy.js';
import { estimateTokens } from '../prompt/promptService.js';
import { resolveVoiceIdentity } from '../voiceProfileIdentity.js';
import { decodeMarinaraCharacter } from './marinaraEntityAdapter.js';

const ENDPOINTS = {
  chats: '/chats',
  chars: '/characters',
  personas: '/characters/personas',
  loreScan: '/lorebooks/scan',
  lorebooks: '/lorebooks',
};

const SPEAKER_USER = `This passage is the author's/user's own narration or input, not a story character's speech. Edit it as the author's prose. Do not answer in a character's voice, adopt a persona or pronouns, or add roleplay or commentary.`;
const SPEAKER_CHARACTER = `This passage is written in the responding character's voice. Preserve that character's voice, register, and language; do not switch to the author's or editor's voice.`;

function safeObject(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

export function normalizeIdList(value, maxItems = 8) {
  let list = value;
  if (typeof list === 'string') {
    const trimmed = list.trim();
    if (trimmed.startsWith('[')) {
      try { list = JSON.parse(trimmed); } catch { list = [trimmed]; }
    } else list = trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(list)) list = list ? [list] : [];
  const unique = [...new Set(list.map((item) => String(item?.id || item || '').trim()).filter(Boolean))];
  if (!Number.isFinite(maxItems)) return unique;
  return unique.slice(0, Math.max(0, Math.trunc(Number(maxItems) || 0)));
}

function extenderRoot(value) {
  return String(value || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
}

function extractMemoryBlock(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/<memory(?:\s[^>]*)?>([\s\S]*?)<\/memory>/i);
  return (match ? match[1] : raw).trim().slice(0, 8000);
}

function extractIdentityNames(value) {
  const names = [];
  const seen = new Set();
  const re = /^Name:\s*(.+)$/gmi;
  let match;
  while ((match = re.exec(String(value || '')))) {
    const name = String(match[1] || '').trim().slice(0, 160);
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= 3) break;
  }
  return names;
}

function capWords(value, maxWords = 400) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '…' : '');
}

function boundedVoiceField(parts, label, value, maxChars) {
  const text = String(value || '').trim();
  if (!text) return false;
  parts.push(`${label}: ${text.slice(0, maxChars)}`);
  return true;
}

function buildVoiceReference(entity, kind, snapshotName = '') {
  const character = kind === 'character' ? decodeMarinaraCharacter(entity) : null;
  const data = character?.data || safeObject(entity?.data);
  const extensions = character?.extensions || safeObject(data.extensions);
  const name = snapshotName || character?.name || data.name || entity?.name || '';
  const parts = [];
  if (name) parts.push(`Name: ${String(name).slice(0, 160)}`);

  let evidence = 0;
  evidence += boundedVoiceField(parts, 'Personality', data.personality || entity?.personality, 900) ? 1 : 0;

  if (kind === 'character') {
    // Direct authored speech is the strongest evidence of cadence and register,
    // so keep it ahead of long descriptive/background fields when the final
    // provider prompt applies its hard reference cap.
    evidence += boundedVoiceField(parts, 'First message', data.first_mes || data.firstMessage, 1400) ? 1 : 0;
    evidence += boundedVoiceField(parts, 'Example dialogue', data.mes_example || data.exampleDialogue, 2200) ? 1 : 0;
  } else {
    // Persona cards normally leave these empty, but imported / character-like
    // personas may carry them. They are direct voice evidence when present.
    evidence += boundedVoiceField(parts, 'First message', data.first_mes || data.firstMessage, 900) ? 1 : 0;
    evidence += boundedVoiceField(parts, 'Example dialogue', data.mes_example || data.exampleDialogue, 1400) ? 1 : 0;
  }

  evidence += boundedVoiceField(parts, 'Description', data.description || entity?.description, 1200) ? 1 : 0;
  evidence += boundedVoiceField(parts, 'About me', extensions.aboutMe || data.aboutMe, 900) ? 1 : 0;
  evidence += boundedVoiceField(parts, 'Backstory', extensions.backstory || data.backstory, 800) ? 1 : 0;
  evidence += boundedVoiceField(parts, 'Scenario', data.scenario || entity?.scenario, 500) ? 1 : 0;

  // A name alone is not enough evidence to synthesize a trustworthy voice.
  return evidence > 0 ? parts.join('\n') : '';
}

export class ContextService {
  static async fetchChat(cid, signal) {
    if (!cid) return null;
    return MarinaraHost.apiFetch(`${ENDPOINTS.chats}/${encodeURIComponent(cid)}`, { signal }, 15000);
  }

  static async fetchMessages(cid, signal) {
    if (!cid) return [];
    const result = await MarinaraHost.apiFetch(`${ENDPOINTS.chats}/${encodeURIComponent(cid)}/messages`, { signal }, 15000);
    return Array.isArray(result) ? result : [];
  }

  static async fetchChatCharacters(cid, signal) {
    if (!cid) return [];
    const chat = await this.fetchChat(cid, signal);
    let ids = chat?.characterIds || [];
    if (typeof ids === 'string') {
      try { ids = JSON.parse(ids); } catch { ids = []; }
    }
    if (!Array.isArray(ids)) return [];
    // Identity discovery must inspect the full active-chat roster. Prompt and
    // memory consumers keep their own bounded defaults through normalizeIdList.
    const uniqueIds = normalizeIdList(ids.map((item) => String(item?.id || item || '')), Number.POSITIVE_INFINITY);
    return Promise.all(uniqueIds.map(async (id) => {
      try {
        const char = await MarinaraHost.apiFetch(`${ENDPOINTS.chars}/${encodeURIComponent(id)}`, { signal }, 15000);
        const character = decodeMarinaraCharacter(char, id);
        return {
          id: character.id || id,
          name: character.name || id,
          convoDisplayName: character.convoDisplayName,
          aliases: character.aliases,
        };
      } catch (err) {
        if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
        return { id, name: id, convoDisplayName: '' };
      }
    }));
  }

  static async fetchCharCard(cid, signal, preferredCharacterIds = null) {
    try {
      let ids = normalizeIdList(preferredCharacterIds);
      if (!ids.length) {
        const chat = await this.fetchChat(cid, signal);
        ids = normalizeIdList(chat?.characterIds || []);
        if (!ids.length && chat?.characterId) ids = normalizeIdList(chat.characterId);
      }
      if (!ids.length) return '';
      const chars = await Promise.all(ids.map(async (id) => {
        try {
          return await MarinaraHost.apiFetch(`${ENDPOINTS.chars}/${encodeURIComponent(id)}`, { signal }, 15000);
        } catch (err) {
          if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
          return null;
        }
      }));
      const blocks = chars.filter(Boolean).map((char) => {
        const character = decodeMarinaraCharacter(char);
        const data = character.data;
        const parts = [];
        if (character.name) parts.push(`Name: ${character.name}`);
        if (data.personality) parts.push(`Personality: ${String(data.personality).slice(0, 600)}`);
        if (data.description) parts.push(`Description: ${String(data.description).slice(0, 900)}`);
        return parts.join('\n');
      }).filter(Boolean);
      return blocks.join('\n\n');
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      return '';
    }
  }

  static async fetchCharacterVoiceReference(characterId, signal) {
    const id = String(characterId || '').trim();
    if (!id) return '';
    try {
      const character = await MarinaraHost.apiFetch(`${ENDPOINTS.chars}/${encodeURIComponent(id)}`, { signal }, 15000);
      return buildVoiceReference(character, 'character');
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      return '';
    }
  }

  static async fetchPersonaIdentityDetails(preferredSnapshot, signal) {
    const snapshot = preferredSnapshot && typeof preferredSnapshot === 'object' ? preferredSnapshot : null;
    const identityId = typeof snapshot?.personaId === 'string' ? snapshot.personaId.trim() : '';
    if (!identityId) return null;

    const source = snapshot?.source === 'character' ? 'character' : 'persona';
    const endpoint = source === 'character' ? ENDPOINTS.chars : ENDPOINTS.personas;
    const entity = await MarinaraHost.apiFetch(`${endpoint}/${encodeURIComponent(identityId)}`, { signal }, 15000);
    const data = safeObject(entity?.data);
    const name = String(snapshot?.name || data.name || entity?.name || '').trim().slice(0, 160);
    const reference = buildVoiceReference(entity, source === 'character' ? 'character' : 'persona', name);
    return { id: identityId, source, name, reference, entity };
  }

  static async fetchPersonaVoiceReference(preferredSnapshot, signal) {
    try {
      const details = await this.fetchPersonaIdentityDetails(preferredSnapshot, signal);
      return details?.reference || '';
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      return '';
    }
  }

  static async fetchUserPersona(cid, signal, preferredSnapshot = null) {
    try {
      const snapshot = preferredSnapshot && typeof preferredSnapshot === 'object' ? preferredSnapshot : null;
      let identityId = typeof snapshot?.personaId === 'string' ? snapshot.personaId.trim() : '';
      let identitySource = snapshot?.source === 'character' || snapshot?.source === 'persona' ? snapshot.source : null;

      if (!identityId) {
        const chat = await this.fetchChat(cid, signal);
        const personaCharacterId = typeof chat?.personaCharacterId === 'string' ? chat.personaCharacterId.trim() : '';
        const personaId = typeof chat?.personaId === 'string' ? chat.personaId.trim() : '';
        if (personaCharacterId) {
          identityId = personaCharacterId;
          identitySource = 'character';
        } else if (personaId) {
          identityId = personaId;
          identitySource = 'persona';
        }
      }

      if (!identityId) return snapshot?.name ? `Name: ${String(snapshot.name).slice(0, 160)}` : '';
      // Historical snapshots created before Engine 2.4.6 have no source field.
      // Preserve the legacy interpretation unless the Engine explicitly marks a
      // character-backed user identity.
      const source = identitySource === 'character' ? 'character' : 'persona';
      const endpoint = source === 'character' ? ENDPOINTS.chars : ENDPOINTS.personas;

      let identity;
      try {
        identity = await MarinaraHost.apiFetch(`${endpoint}/${encodeURIComponent(identityId)}`, { signal }, 15000);
      } catch (err) {
        if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
        if (snapshot?.personaId) return snapshot?.name ? `Name: ${String(snapshot.name).slice(0, 160)}` : '';
        return '';
      }

      const data = safeObject(identity?.data);
      const name = snapshot?.name || data.name || identity?.name || 'User';
      const description = data.description || identity?.description || '';
      if (!description) return name ? `Name: ${String(name).slice(0, 160)}` : '';
      return `Name: ${String(name).slice(0, 160)}\n${String(description).slice(0, 1800)}`;
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      return '';
    }
  }

  static async fetchLorebookContext(cid, signal) {
    if (!cid) return '';
    try {
      const payload = await MarinaraHost.apiFetch(`${ENDPOINTS.loreScan}/${encodeURIComponent(cid)}`, { signal }, 15000);
      const entries = Array.isArray(payload) ? payload : (Array.isArray(payload?.entries) ? payload.entries : []);
      if (!entries.length) return '';
      const lines = entries.slice(0, 20).map((entry) => {
        const key = String(entry?.key || (Array.isArray(entry?.keys) ? entry.keys.join(', ') : '') || '').trim();
        const content = String(entry?.content || entry?.value || '').trim();
        if (!content) return '';
        return key ? `${key}: ${content}` : content;
      }).filter(Boolean);
      if (!lines.length) return '';
      const words = lines.join('\n').split(/\s+/).filter(Boolean);
      return words.slice(0, 500).join(' ') + (words.length > 500 ? '…' : '');
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      return '';
    }
  }

  static async fetchExtenderMemoryViaLorebooks(cid, signal) {
    if (!cid) return '';
    try {
      const [booksPayload, scanPayload] = await Promise.all([
        MarinaraHost.apiFetch(ENDPOINTS.lorebooks, { signal }, 15000),
        MarinaraHost.apiFetch(`${ENDPOINTS.loreScan}/${encodeURIComponent(cid)}`, { signal }, 15000),
      ]);
      const books = Array.isArray(booksPayload) ? booksPayload : (Array.isArray(booksPayload?.lorebooks) ? booksPayload.lorebooks : []);
      const ids = new Set(books
        .filter((book) => String(book?.name || book?.data?.name || '').trim().toLowerCase().startsWith('marinara extender'))
        .map((book) => String(book?.id || '')).filter(Boolean));
      if (!ids.size) return '';
      const entries = Array.isArray(scanPayload) ? scanPayload : (Array.isArray(scanPayload?.entries) ? scanPayload.entries : []);
      const memory = entries
        .filter((entry) => ids.has(String(entry?.lorebookId ?? entry?.lorebook_id ?? entry?.bookId ?? '')))
        .filter((entry) => !/instruction/i.test(String(entry?.name || entry?.title || '')))
        .map((entry) => extractMemoryBlock(entry?.content || entry?.text || '')).filter(Boolean).join('\n\n');
      return capWords(memory, 400);
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      return '';
    }
  }

  static async fetchExtenderMemory(cid, signal, characterIds = []) {
    const config = usePersistentStore.getState().config;
    if (!config.useExtenderMemory || !cid) return '';
    const root = extenderRoot(config.extenderUrl);
    if (!root) return this.fetchExtenderMemoryViaLorebooks(cid, signal);
    try { validateProviderHttpUrl(root, 'Extender'); } catch { return this.fetchExtenderMemoryViaLorebooks(cid, signal); }

    let ids = normalizeIdList(characterIds);
    if (!ids.length) {
      try {
        const chat = await this.fetchChat(cid, signal);
        ids = normalizeIdList(chat?.characterIds || chat?.characterId || []);
      } catch (err) {
        if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
        return '';
      }
    }
    const characterId = ids[0];
    if (!characterId) return '';

    try {
      const url = `${root}/api/memory-block?characterId=${encodeURIComponent(characterId)}&chatId=${encodeURIComponent(cid)}`;
      const response = await MarinaraHost.fetch(url, { signal, cache: 'no-store' }, Math.min(10000, Number(config.requestTimeoutMs) || 45000));
      if (!response.ok) {
        debugLogService.add('extender.memory.http_error', { status: response.status });
        return this.fetchExtenderMemoryViaLorebooks(cid, signal);
      }
      const data = await response.json().catch(() => ({}));
      const memory = capWords(extractMemoryBlock(data?.memoryBlock || data?.memory || ''), 400);
      debugLogService.add('extender.memory', { chars: memory.length, characterId });
      return memory || this.fetchExtenderMemoryViaLorebooks(cid, signal);
    } catch (err) {
      if (MarinaraHost.isAbortError(err) || signal?.aborted) throw err;
      debugLogService.add('extender.memory.error', { message: err?.message || String(err) });
      return this.fetchExtenderMemoryViaLorebooks(cid, signal);
    }
  }

  static speakerNote(role) {
    if (role === 'user') return SPEAKER_USER;
    if (role === 'assistant') return SPEAKER_CHARACTER;
    return '';
  }

  static async getMessageInfo(cid, mid, signal) {
    const messages = await this.fetchMessages(cid, signal);
    const targetId = String(mid ?? '');
    const index = messages.findIndex((message) => String(message?.id ?? '') === targetId);
    return { messages, index, message: index >= 0 ? messages[index] : null };
  }

  static async resolveSelectionVoiceIdentity(savedSel, message, signal, suppliedCharacters = null) {
    if (!savedSel) return resolveVoiceIdentity(savedSel, message);
    if (savedSel.detectedGroupedSpeaker === true) {
      if (savedSel.detectedGroupedSpeakerAmbiguous === true || !savedSel.cid) return null;
      const characters = Array.isArray(suppliedCharacters)
        ? suppliedCharacters
        : await this.fetchChatCharacters(savedSel.cid, signal);
      return resolveVoiceIdentity(savedSel, message, characters);
    }
    return resolveVoiceIdentity(savedSel, message);
  }

  static async resolveVoiceProfileTarget(savedSel, signal) {
    if (!savedSel?.cid || !savedSel?.mid) {
      return { identity: null, targetMessage: null, messageInfo: null };
    }

    const messageInfo = await this.getMessageInfo(savedSel.cid, savedSel.mid, signal);
    const message = messageInfo?.message || null;
    const identity = await this.resolveSelectionVoiceIdentity(savedSel, message, signal);

    if (!identity?.key) {
      return { identity: null, targetMessage: message, messageInfo };
    }

    // Grouped Conversation messages can expose a speaker that differs from the
    // parent message.characterId. Voice-profile generation must therefore use
    // the exact selection-resolved Character instead of re-reading the parent
    // identity from the message API.
    const targetMessage = identity.kind === 'character' && savedSel.detectedGroupedSpeaker === true
      ? {
        id: savedSel.mid,
        role: 'assistant',
        characterId: identity.id,
        characterName: identity.name || savedSel.detectedName || undefined,
        content: savedSel.text || '',
      }
      : message;

    return { identity, targetMessage, messageInfo };
  }

  static buildHistoryContext(messages, targetIndex, depth, audienceCharacterId = null) {
    return buildSafeHistoryContext(messages, targetIndex, depth, audienceCharacterId);
  }

  static async collectContext(savedSel, signal, options = {}) {
    const config = usePersistentStore.getState().config;
    const exclusions = new Set(Array.isArray(savedSel?.contextExclusions) ? savedSel.contextExclusions : []);
    const wantsHistory = config.contextDepth > 0 && !exclusions.has('history');
    const wantsCharacter = !config.freeMode && config.injectChar && !exclusions.has('character');
    const wantsPersona = !config.freeMode && config.injectUser && !exclusions.has('persona');
    const wantsLore = !config.freeMode && config.injectLorebook && !exclusions.has('lore');
    const wantsSurrounding = config.localContextEnabled && !exclusions.has('surrounding');
    const wantsMemory = !config.freeMode && config.useExtenderMemory && !exclusions.has('memory');
    const wantsSpeaker = !config.freeMode && config.speakerAware;
    const explicitCharacterIds = normalizeIdList(config.charCardIds);
    const needsMessageInfo = wantsHistory || wantsPersona || wantsSpeaker || (wantsCharacter && !explicitCharacterIds.length);

    let info = { messages: [], index: -1, message: null };
    if (needsMessageInfo) {
      const suppliedInfo = options?.messageInfo;
      info = suppliedInfo?.message && Array.isArray(suppliedInfo?.messages)
        ? suppliedInfo
        : await this.getMessageInfo(savedSel.cid, savedSel.mid, signal);
      if (!info.message || info.index < 0) {
        throw new Error('The selected message is no longer available from Marinara. Re-select the text before using message-aware context.');
      }
    }

    const role = info.message?.role || savedSel.detectedRole || null;
    const resolvedVoiceIdentity = Object.hasOwn(options || {}, 'resolvedVoiceIdentity')
      ? options.resolvedVoiceIdentity
      : await this.resolveSelectionVoiceIdentity(savedSel, info.message, signal);
    const groupedSelection = savedSel?.detectedGroupedSpeaker === true;
    const authoritativeCharacterId = role === 'assistant'
      ? (
        resolvedVoiceIdentity?.kind === 'character'
          ? resolvedVoiceIdentity.id
          : (groupedSelection ? '' : (info.message?.characterId || ''))
      )
      : '';
    const history = wantsHistory
      ? this.buildHistoryContext(info.messages, info.index, config.contextDepth, authoritativeCharacterId || null)
      : '';
    const authoritativeSender = authoritativeCharacterId
      ? normalizeIdList(authoritativeCharacterId)
      : [];
    if (
      resolvedVoiceIdentity?.kind === 'character'
      && info.message?.characterId
      && String(resolvedVoiceIdentity.id) !== String(info.message.characterId)
    ) {
      debugLogService.add('identity.dom_api_mismatch', {
        chatId: savedSel?.cid || null,
        messageId: savedSel?.mid || null,
        domCharacterId: resolvedVoiceIdentity.id,
        apiCharacterId: String(info.message.characterId),
        chosen: resolvedVoiceIdentity.sourceOfTruth || 'dom',
      });
    }
    // The exact rendered Character selected by the user is authoritative.
    // Grouped multi-speaker Conversation segments never fall back to the parent
    // message Character or to a stale manual Character selection: if the visible
    // speaker cannot be mapped uniquely, Character-specific context is omitted.
    const fallbackCharacterIds = groupedSelection ? [] : explicitCharacterIds;
    const characterIds = authoritativeSender.length ? authoritativeSender : fallbackCharacterIds;
    const surrounding = wantsSurrounding ? extractSurroundingContext(savedSel, config.localContextWords) : '';
    const speaker = wantsSpeaker ? this.speakerNote(role) : '';
    const [character, persona, lore, memory] = await Promise.all([
      wantsCharacter && characterIds.length > 0
        ? this.fetchCharCard(savedSel.cid, signal, characterIds) : Promise.resolve(''),
      wantsPersona && role === 'user'
        ? this.fetchUserPersona(savedSel.cid, signal, getMessagePersonaSnapshot(info.message)) : Promise.resolve(''),
      wantsLore ? this.fetchLorebookContext(savedSel.cid, signal) : Promise.resolve(''),
      wantsMemory && (authoritativeSender.length || fallbackCharacterIds.length)
        ? this.fetchExtenderMemory(
          savedSel.cid,
          signal,
          authoritativeSender.length ? authoritativeSender : fallbackCharacterIds,
        ) : Promise.resolve(''),
    ]);
    return { role, character, persona, lore, surrounding, history, memory, speaker, messageInfo: info };
  }

  static async collectMergedContext(parentSelection, segments, signal) {
    const cid = parentSelection?.cid;
    if (!cid || !Array.isArray(segments) || segments.length < 2) return { compatible: false, reason: 'not-enough-segments' };
    const messages = await this.fetchMessages(cid, signal);
    const analysis = analyzeMergedMessageCompatibility(messages, segments);
    if (!analysis.ok) return { compatible: false, reason: analysis.reason };

    const firstSegment = segments[0];
    const firstMessage = analysis.messages[0];
    const index = messages.findIndex((message) => String(message?.id) === String(firstSegment.mid));
    const anchorSelection = {
      ...parentSelection,
      ...firstSegment,
      source: 'message', cid, mid: firstSegment.mid, text: firstSegment.text,
      segments: undefined, multiMessage: false,
    };
    const context = await this.collectContext(anchorSelection, signal, { messageInfo: { messages, index, message: firstMessage } });

    const config = usePersistentStore.getState().config;
    const exclusions = new Set(Array.isArray(parentSelection?.contextExclusions) ? parentSelection.contextExclusions : []);
    if (config.localContextEnabled && !exclusions.has('surrounding')) {
      const notes = segments.map((segment, segmentIndex) => {
        const selection = { ...parentSelection, ...segment, source: 'message', cid, segments: undefined, multiMessage: false };
        const local = extractSurroundingContext(selection, config.localContextWords);
        return local ? `Message ${segmentIndex + 1}:\n${local}` : '';
      }).filter(Boolean);
      context.surrounding = notes.join('\n\n').slice(0, 6000);
    }
    delete context.messageInfo;
    return { compatible: true, identity: analysis.identity, context, anchorSelection };
  }

  static async inspectContext(savedSel, signal) {
    if (!savedSel?.text?.trim()) return { error: 'No text is selected.' };
    try {
      const resolvedTarget = await this.resolveVoiceProfileTarget(savedSel, signal);
      const messageInfo = resolvedTarget.messageInfo;
      let voiceIdentity = resolvedTarget.identity;
      const context = await this.collectContext(
        savedSel,
        signal,
        {
          ...(messageInfo?.message ? { messageInfo } : {}),
          resolvedVoiceIdentity: voiceIdentity,
        },
      );
      if (voiceIdentity?.kind === 'character' && !voiceIdentity.name) {
        const resolvedName = extractIdentityNames(context.character)[0] || '';
        if (resolvedName) voiceIdentity = { ...voiceIdentity, name: resolvedName };
      }
      const parts = {
        selection: estimateTokens(savedSel.text),
        character: estimateTokens(context.character),
        memory: estimateTokens(context.memory),
        persona: estimateTokens(context.persona),
        lore: estimateTokens(context.lore),
        surrounding: estimateTokens(context.surrounding),
        history: estimateTokens(context.history),
        speaker: estimateTokens(context.speaker),
      };
      parts.total = Object.values(parts).reduce((sum, value) => sum + value, 0);
      return {
        parts,
        role: context.role,
        voiceIdentity,
        identities: {
          characterNames: extractIdentityNames(context.character),
          personaNames: extractIdentityNames(context.persona),
        },
      };
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
      return { error: err?.message || String(err) };
    }
  }
}
