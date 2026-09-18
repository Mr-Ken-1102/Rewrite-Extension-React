import { usePersistentStore } from '../store/usePersistentStore';
import { MarinaraHost } from './marinaraHost';
import { debugLogService } from './debugLogService';
import { ContextService } from './context/contextService.js';
import { ProviderService } from './providers/providerService.js';
import {
  REWRITE_SYSTEM_PROMPT,
  REWRITE_SYSTEM_PROMPT_CONCISE,
  composePrompt,
  composePromptDetailed,
  escFence,
  estimateTokens,
  rewriteSystemPrompt,
} from './prompt/promptService.js';
import { resolveAutoProfileCharacter } from './policies/contextPolicy.js';
import { normalizeProviderFailure } from './policies/providerPolicy.js';

/**
 * Stable facade used by UI code and the failure-mode harness.
 * Domain behavior lives in prompt/context/provider modules so this file remains
 * an orchestration boundary rather than becoming another monolith.
 */
export class APIService {
  static listConnections(signal) { return ProviderService.listConnections(signal); }
  static resolveConnectionId(config, signal, chatId = '') { return ProviderService.resolveConnectionId(config, signal, chatId); }
  static resolveMarinaraConnection(config, signal, chatId = '') { return ProviderService.resolveMarinaraConnection(config, signal, chatId); }
  static runInference(systemPrompt, userPrompt, signal, override = {}) {
    return ProviderService.runInference(systemPrompt, userPrompt, signal, override);
  }
  static discoverModels(url, signal) { return ProviderService.discoverModels(url, signal); }
  static diagnoseDirectApi(url, signal) { return ProviderService.diagnoseDirectApi(url, signal); }

  static fetchChat(cid, signal) { return ContextService.fetchChat(cid, signal); }
  static fetchMessages(cid, signal) { return ContextService.fetchMessages(cid, signal); }
  static fetchChatCharacters(cid, signal) { return ContextService.fetchChatCharacters(cid, signal); }
  static fetchCharCard(cid, signal, preferredCharacterIds = null) {
    return ContextService.fetchCharCard(cid, signal, preferredCharacterIds);
  }
  static fetchUserPersona(cid, signal, preferredSnapshot = null) {
    return ContextService.fetchUserPersona(cid, signal, preferredSnapshot);
  }
  static fetchLorebookContext(cid, signal) { return ContextService.fetchLorebookContext(cid, signal); }
  static fetchExtenderMemoryViaLorebooks(cid, signal) { return ContextService.fetchExtenderMemoryViaLorebooks(cid, signal); }
  static fetchExtenderMemory(cid, signal, characterIds = []) {
    return ContextService.fetchExtenderMemory(cid, signal, characterIds);
  }
  static speakerNote(role) { return ContextService.speakerNote(role); }
  static getMessageInfo(cid, mid, signal) { return ContextService.getMessageInfo(cid, mid, signal); }
  static buildHistoryContext(messages, targetIndex, depth, audienceCharacterId = null) {
    return ContextService.buildHistoryContext(messages, targetIndex, depth, audienceCharacterId);
  }
  static collectContext(savedSel, signal, options = {}) { return ContextService.collectContext(savedSel, signal, options); }
  static collectMergedContext(parentSelection, segments, signal) {
    return ContextService.collectMergedContext(parentSelection, segments, signal);
  }
  static inspectContext(savedSel, signal) { return ContextService.inspectContext(savedSel, signal); }

  static estimateTokens(text) { return estimateTokens(text); }
  static composePromptDetailed(profile, targetText, config, context = {}) {
    return composePromptDetailed(profile, targetText, config, context);
  }
  static composePrompt(profile, targetText, config, context = {}) {
    return composePrompt(profile, targetText, config, context);
  }

  static async fetchAIResponse(profile, savedSel, signal, hooks = {}) {
    const config = usePersistentStore.getState().config;
    const targetText = typeof hooks?.targetText === 'string' ? hooks.targetText : savedSel?.text;
    if (!String(targetText || '').trim()) return { error: 'No text is selected.' };

    let context;
    try {
      context = hooks?.context && typeof hooks.context === 'object'
        ? { ...hooks.context }
        : await this.collectContext(savedSel, signal);
      if (hooks?.extraContext) context.ledger = String(hooks.extraContext).slice(0, 4_000);
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
      return { error: `Could not assemble the enabled context: ${err?.message || String(err)}` };
    }
    if (signal?.aborted) return { aborted: true };

    let promptInfo;
    try {
      promptInfo = this.composePromptDetailed(profile, targetText, config, context);
    } catch (err) {
      return { error: err?.message || String(err), errorCode: err?.code || null };
    }
    if (promptInfo.dropped.length && typeof hooks?.onContextTrim === 'function') {
      try { hooks.onContextTrim([...promptInfo.dropped]); } catch { /* UI notification hooks never block inference */ }
    }
    const suffix = typeof hooks?.systemPromptSuffix === 'string' && hooks.systemPromptSuffix.trim()
      ? `\n${hooks.systemPromptSuffix.trim()}` : '';

    let response;
    try {
      response = await this.runInference(`${rewriteSystemPrompt(config)}${suffix}`, promptInfo.prompt, signal, {
        chatId: savedSel?.cid || '',
        onProgress: hooks?.onProgress,
        onStreamStatus: hooks?.onStreamStatus,
      });
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true, droppedContext: promptInfo.dropped };
      response = normalizeProviderFailure(err);
    }
    if (response?.error && !response.errorCode) response = { ...response, ...normalizeProviderFailure(response.error, response.error) };
    return { ...response, droppedContext: promptInfo.dropped };
  }

  static async generateAutoProfile(chatId, signal, options = {}) {
    if (!chatId) return { error: 'No active chat.' };
    try {
      const config = usePersistentStore.getState().config;
      const characters = await this.fetchChatCharacters(chatId, signal);
      if (!characters.length) return { error: 'This chat has no character to profile.' };

      let targetMessage = null;
      if (options?.messageId) targetMessage = (await this.getMessageInfo(chatId, options.messageId, signal)).message;
      const preferredCharacterIds = options?.preferredCharacterIds ?? config.charCardIds;
      const characterId = resolveAutoProfileCharacter({ preferredCharacterIds, targetMessage, chatCharacters: characters });
      if (!characterId) {
        return { error: 'This chat has multiple possible characters. Select exactly one Character in Context settings or run auto-profile from an assistant message with an authoritative character ID.' };
      }
      const character = characters.find((item) => item.id === characterId) || { id: characterId, name: characterId };
      const card = await this.fetchCharCard(chatId, signal, [characterId]);
      if (!card) return { error: 'The character card does not contain enough information to generate a voice profile.' };

      const response = await this.runInference(
        'Output ONLY a valid JSON object with "name" (1-3 words) and "prompt" (one precise instruction to rewrite text in this character voice). No markdown fences or commentary.',
        `Character reference:\n${card.slice(0, 3000)}`,
        signal,
        { chatId },
      );
      if (response?.aborted || response?.error) return response;
      const raw = String(response.result || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      let data;
      try { data = JSON.parse(raw); } catch { return { error: 'Auto-profile model response was not valid JSON.' }; }
      if (typeof data?.name !== 'string' || typeof data?.prompt !== 'string' || !data.prompt.trim()) {
        return { error: 'Auto-profile response was missing name or prompt.' };
      }
      const profile = {
        id: `auto-${chatId}`,
        name: data.name.trim().slice(0, 80) || `${character.name} Voice`,
        prompt: data.prompt.trim().slice(0, 5000),
        order: -1,
        auto: true,
      };
      usePersistentStore.getState().setAutoProfile(chatId, profile);
      debugLogService.add('auto_profile.generated', { chatId, characterId, name: profile.name });
      return { profile, characterId };
    } catch (err) {
      if (signal?.aborted || MarinaraHost.isAbortError(err)) return { aborted: true };
      return normalizeProviderFailure(err);
    }
  }
}

export { REWRITE_SYSTEM_PROMPT, REWRITE_SYSTEM_PROMPT_CONCISE, rewriteSystemPrompt, escFence };
