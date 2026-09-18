import { useCallback, useRef, useState } from 'react';
import { DraftReplyService } from '../services/draftReplyService.js';
import { DOMUtils } from '../utils/domUtils.js';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { useToastStore } from '../store/useToastStore';

function baseState(chatId, direction) {
  return {
    status: 'editing',
    chatId,
    direction,
    mode: direction.trim() ? 'idea' : 'idea',
    result: '',
    partialResult: '',
    streamStatus: null,
    streamChars: 0,
    persona: null,
    voiceProfile: null,
    historyDepth: 0,
    error: '',
  };
}

export function useDraftReplySession() {
  const [draftState, setDraftState] = useState(null);
  const controllerRef = useRef(null);
  const draftStateRef = useRef(draftState);
  draftStateRef.current = draftState;
  const showToast = useToastStore((state) => state.showToast);

  const abortCurrent = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controllerRef.current = null;
    try { controller.abort(new DOMException('Draft Reply cancelled', 'AbortError')); } catch { controller.abort(); }
    useRuntimeStore.getState().unregisterController(controller);
  }, []);

  const openDraftReply = useCallback(() => {
    const chatId = DOMUtils.getChatId();
    const composer = DOMUtils.getChatComposer();
    if (!chatId || !composer) {
      showToast('Draft Reply needs an active Marinara chat composer.', 'warn');
      return;
    }
    setDraftState(baseState(chatId, composer.value || ''));
  }, [showToast]);

  const updateDraftInput = useCallback((patch) => {
    setDraftState((current) => current ? { ...current, ...(patch || {}) } : current);
  }, []);

  const generateDraftReply = useCallback(async ({
    direction,
    mode,
    adjustment = '',
    previousDraft = '',
  }) => {
    const current = draftState;
    if (!current?.chatId) return;

    const activeChatId = DOMUtils.getChatId();
    if (!activeChatId || activeChatId !== current.chatId) {
      showToast('The active chat changed. Reopen Draft Reply in the current chat before generating.', 'warn');
      setDraftState(null);
      return;
    }
    if (!DOMUtils.getChatComposer()) {
      showToast('Draft Reply cannot find the active Marinara composer. Reopen the chat and try again.', 'warn');
      return;
    }

    abortCurrent();
    const controller = new AbortController();
    controllerRef.current = controller;
    useRuntimeStore.getState().registerController(controller);

    const nextDirection = typeof direction === 'string' ? direction : current.direction;
    const nextMode = mode === 'continue' ? 'continue' : 'idea';
    setDraftState((state) => state ? {
      ...state,
      status: 'loading',
      direction: nextDirection,
      mode: nextMode,
      partialResult: '',
      streamStatus: 'connecting',
      streamChars: 0,
      error: '',
    } : state);

    try {
      const response = await DraftReplyService.generate({
        chatId: current.chatId,
        direction: nextDirection,
        mode: nextMode,
        adjustment,
        previousDraft,
        expectedPersonaKey: current.persona?.key || '',
        signal: controller.signal,
        onMeta: (meta) => {
          if (controller.signal.aborted) return;
          setDraftState((state) => state ? {
            ...state,
            persona: meta?.persona || state.persona,
            voiceProfile: meta?.voiceProfile || null,
            historyDepth: meta?.historyDepth || state.historyDepth,
          } : state);
        },
        onProgress: (partialResult) => {
          if (controller.signal.aborted) return;
          setDraftState((state) => state ? {
            ...state,
            partialResult,
            streamChars: partialResult.length,
          } : state);
        },
        onStreamStatus: (info) => {
          if (controller.signal.aborted) return;
          setDraftState((state) => state ? {
            ...state,
            streamStatus: info?.status || state.streamStatus,
            streamChars: Number.isFinite(Number(info?.chars)) ? Number(info.chars) : state.streamChars,
          } : state);
        },
      });

      if (controller.signal.aborted || response?.aborted) return;
      if (response?.error) {
        setDraftState((state) => state ? {
          ...state,
          status: 'error',
          error: response.error,
          streamStatus: null,
        } : state);
        return;
      }

      setDraftState((state) => state ? {
        ...state,
        status: 'success',
        result: response.result || '',
        partialResult: response.result || state.partialResult,
        persona: response.persona || state.persona,
        voiceProfile: response.voiceProfile || null,
        historyDepth: response.historyDepth || state.historyDepth,
        streamStatus: response.streamed ? 'done' : null,
        streamChars: String(response.result || '').length,
      } : state);
    } catch (error) {
      if (!controller.signal.aborted) {
        setDraftState((state) => state ? {
          ...state,
          status: 'error',
          error: error?.message || String(error),
          streamStatus: null,
        } : state);
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      useRuntimeStore.getState().unregisterController(controller);
    }
  }, [abortCurrent, draftState, showToast]);

  const cancelGeneration = useCallback(() => {
    abortCurrent();
    setDraftState((current) => current ? {
      ...current,
      status: 'editing',
      partialResult: '',
      streamStatus: null,
      streamChars: 0,
      error: '',
    } : current);
  }, [abortCurrent]);

  const closeDraftReply = useCallback(() => {
    abortCurrent();
    setDraftState(null);
  }, [abortCurrent]);

  const insertDraftReply = useCallback(async () => {
    const current = draftState;
    if (!current?.result || current.status !== 'success') return false;
    if (DOMUtils.getChatId() !== current.chatId) {
      showToast('The active chat changed. Draft Reply was not inserted into a different chat.', 'warn');
      return false;
    }
    if (!current.persona?.key) {
      showToast('Draft Reply cannot verify which Persona owns this draft. Nothing was inserted.', 'warn');
      return false;
    }

    try {
      const resolved = await DraftReplyService.resolveActivePersonaIdentity(current.chatId, new AbortController().signal);
      const live = draftStateRef.current;
      if (
        !live
        || live.status !== 'success'
        || live.chatId !== current.chatId
        || live.result !== current.result
        || live.persona?.key !== current.persona.key
      ) return false;

      if (DOMUtils.getChatId() !== current.chatId) {
        showToast('The active chat changed during Persona verification. Nothing was inserted.', 'warn');
        return false;
      }
      if (!resolved.identity || resolved.identity.key !== current.persona.key) {
        showToast('The active Persona changed after this draft was generated. Reopen Draft Reply before inserting.', 'warn');
        return false;
      }

      const inserted = DOMUtils.setChatComposerValue(current.result);
      showToast(
        inserted
          ? 'Draft inserted into the composer. Review it, edit anything you want, then press Send yourself.'
          : 'Could not find the active Marinara composer. The generated draft remains available for copying.',
        inserted ? 'ok' : 'warn',
      );
      if (inserted) setDraftState(null);
      return inserted;
    } catch (error) {
      showToast(`Could not verify the active Persona, so Draft Reply was not inserted: ${error?.message || String(error)}`, 'warn');
      return false;
    }
  }, [draftState, showToast]);

  const rewriteDraftAgain = useCallback((kind = 'another') => {
    const current = draftState;
    if (!current) return;
    const adjustment = kind === 'shorter'
      ? 'Rewrite the previous draft more concisely while preserving its intent and Persona voice.'
      : kind === 'longer'
        ? 'Rewrite the previous draft with more natural detail, emotional texture, and completeness without advancing the other Characters’ turns.'
        : 'Write a meaningfully different alternative that follows the same user direction and Persona voice.';
    void generateDraftReply({
      direction: current.direction,
      mode: current.mode,
      adjustment,
      previousDraft: current.result,
    });
  }, [draftState, generateDraftReply]);

  return {
    draftState,
    openDraftReply,
    updateDraftInput,
    generateDraftReply,
    cancelGeneration,
    closeDraftReply,
    insertDraftReply,
    rewriteDraftAgain,
  };
}
