import { useCallback, useEffect, useRef, useState } from 'react';
import { DraftReplyService } from '../services/draftReplyService.js';
import { DOMUtils } from '../utils/domUtils.js';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { useToastStore } from '../store/useToastStore';

function baseState(chatId, chatMode, direction) {
  return {
    status: 'editing',
    chatId,
    chatMode,
    direction,
    mode: 'idea',
    result: '',
    partialResult: '',
    streamStatus: null,
    streamChars: 0,
    persona: null,
    genericMode: false,
    personaSourceFingerprint: '',
    personaResolving: true,
    personaResolutionFailed: false,
    voiceProfile: null,
    historyDepth: 0,
    error: '',
  };
}

export function useDraftReplySession() {
  const [draftState, setDraftState] = useState(null);
  const controllerRef = useRef(null);
  const personaControllerRef = useRef(null);
  const sessionSeqRef = useRef(0);
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

  const abortPersonaResolution = useCallback(() => {
    const controller = personaControllerRef.current;
    if (!controller) return;
    personaControllerRef.current = null;
    try { controller.abort(new DOMException('Persona resolution cancelled', 'AbortError')); } catch { controller.abort(); }
  }, []);

  const openDraftReply = useCallback(() => {
    const chatId = DOMUtils.getChatId();
    const anchor = DOMUtils.getChatComposerAnchor();
    const composer = anchor?.composer || null;
    const chatMode = anchor?.mode || null;
    if (!chatId || !composer || !chatMode) {
      showToast('Draft Reply needs an active Marinara chat composer and chat mode.', 'warn');
      return;
    }

    abortCurrent();
    abortPersonaResolution();
    const sessionId = sessionSeqRef.current + 1;
    sessionSeqRef.current = sessionId;
    setDraftState(baseState(chatId, chatMode, composer.value || ''));

    const controller = new AbortController();
    personaControllerRef.current = controller;
    void DraftReplyService.resolveActivePersona(chatId, controller.signal)
      .then((resolved) => {
        if (controller.signal.aborted || sessionSeqRef.current !== sessionId) return;
        const liveAnchor = DOMUtils.getChatComposerAnchor();
        if (DOMUtils.getChatId() !== chatId || liveAnchor?.mode !== chatMode) {
          setDraftState(null);
          return;
        }
        if (!resolved?.identity?.key) {
          setDraftState((current) => current?.chatId === chatId ? {
            ...current,
            status: 'editing',
            persona: null,
            genericMode: true,
            personaSourceFingerprint: '',
            personaResolving: false,
            personaResolutionFailed: false,
            voiceProfile: null,
            error: '',
          } : current);
          return;
        }
        setDraftState((current) => current?.chatId === chatId ? {
          ...current,
          status: 'editing',
          persona: resolved.identity,
          genericMode: false,
          personaSourceFingerprint: resolved.sourceFingerprint || '',
          personaResolving: false,
          personaResolutionFailed: false,
          voiceProfile: resolved.profile || null,
          error: '',
        } : current);
      })
      .catch((error) => {
        if (controller.signal.aborted || sessionSeqRef.current !== sessionId) return;
        setDraftState((current) => current?.chatId === chatId ? {
          ...current,
          status: 'error',
          personaResolving: false,
          personaResolutionFailed: true,
          error: `Could not resolve the active Persona safely: ${error?.message || String(error)}`,
        } : current);
      })
      .finally(() => {
        if (personaControllerRef.current === controller) personaControllerRef.current = null;
      });
  }, [abortCurrent, abortPersonaResolution, showToast]);

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
    if (current.personaResolving) {
      showToast('Draft Reply is still resolving the active Persona. Try again in a moment.', 'warn');
      return;
    }
    if (!current.genericMode && (!current.persona?.key || !current.personaSourceFingerprint)) {
      showToast('Draft Reply cannot verify the active Persona. Reopen Draft Reply before generating.', 'warn');
      return;
    }

    const activeChatId = DOMUtils.getChatId();
    const activeAnchor = DOMUtils.getChatComposerAnchor();
    if (!activeChatId || activeChatId !== current.chatId || activeAnchor?.mode !== current.chatMode) {
      showToast('The active chat or chat mode changed. Reopen Draft Reply in the current context before generating.', 'warn');
      setDraftState(null);
      return;
    }
    if (!activeAnchor?.composer) {
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
        expectedPersonaFingerprint: current.personaSourceFingerprint || '',
        expectNoPersona: current.genericMode === true,
        signal: controller.signal,
        onMeta: (meta) => {
          if (controller.signal.aborted) return;
          setDraftState((state) => state ? {
            ...state,
            persona: meta?.genericMode ? null : (meta?.persona || state.persona),
            genericMode: meta?.genericMode === true,
            personaSourceFingerprint: meta?.genericMode ? '' : (meta?.personaSourceFingerprint || state.personaSourceFingerprint),
            voiceProfile: meta?.genericMode ? null : (meta?.voiceProfile || null),
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
        persona: response.genericMode ? null : (response.persona || state.persona),
        genericMode: response.genericMode === true,
        personaSourceFingerprint: response.genericMode ? '' : (response.personaSourceFingerprint || state.personaSourceFingerprint),
        voiceProfile: response.genericMode ? null : (response.voiceProfile || null),
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
    sessionSeqRef.current += 1;
    abortCurrent();
    abortPersonaResolution();
    setDraftState(null);
  }, [abortCurrent, abortPersonaResolution]);

  const insertDraftReply = useCallback(async () => {
    const current = draftState;
    if (!current?.result || current.status !== 'success') return false;
    const insertionAnchor = DOMUtils.getChatComposerAnchor();
    if (DOMUtils.getChatId() !== current.chatId || insertionAnchor?.mode !== current.chatMode) {
      showToast('The active chat or chat mode changed. Draft Reply was not inserted into a different context.', 'warn');
      return false;
    }
    if (!current.genericMode && (!current.persona?.key || !current.personaSourceFingerprint)) {
      showToast('Draft Reply cannot verify which Persona owns this draft. Nothing was inserted.', 'warn');
      return false;
    }

    try {
      const resolved = await DraftReplyService.resolveActivePersona(current.chatId, new AbortController().signal);
      const live = draftStateRef.current;
      if (
        !live
        || live.status !== 'success'
        || live.chatId !== current.chatId
        || live.result !== current.result
        || live.genericMode !== current.genericMode
        || live.persona?.key !== current.persona?.key
        || live.personaSourceFingerprint !== current.personaSourceFingerprint
      ) return false;

      const verifiedAnchor = DOMUtils.getChatComposerAnchor();
      if (DOMUtils.getChatId() !== current.chatId || verifiedAnchor?.mode !== current.chatMode) {
        showToast('The active chat or chat mode changed during identity verification. Nothing was inserted.', 'warn');
        return false;
      }

      if (current.genericMode) {
        if (resolved.identity) {
          showToast('A Persona is now active. The generic draft was not inserted; generate again so it can use the current Persona.', 'warn');
          return false;
        }
      } else {
        if (!resolved.identity || resolved.identity.key !== current.persona.key) {
          showToast('The active Persona changed after this draft was generated. Reopen Draft Reply before inserting.', 'warn');
          return false;
        }
        if (!resolved.sourceFingerprint || resolved.sourceFingerprint !== current.personaSourceFingerprint) {
          showToast('The active Persona card changed after this draft was generated. Generate a new draft before inserting.', 'warn');
          return false;
        }
      }

      const inserted = DOMUtils.setChatComposerValue(current.result);
      showToast(
        inserted
          ? 'Draft inserted into the composer. Review it, edit anything you want, then press Send yourself.'
          : 'Could not find the active Marinara composer. The generated draft remains available for copying.',
        inserted ? 'ok' : 'warn',
      );
      if (inserted) {
        sessionSeqRef.current += 1;
        setDraftState(null);
      }
      return inserted;
    } catch (error) {
      showToast(`Could not verify the current Draft Reply identity mode, so nothing was inserted: ${error?.message || String(error)}`, 'warn');
      return false;
    }
  }, [draftState, showToast]);

  const rewriteDraftAgain = useCallback((kind = 'another') => {
    const current = draftState;
    if (!current || current.status !== 'success') return;
    const voiceLabel = current.genericMode ? 'current user voice' : 'Persona voice';
    const adjustment = kind === 'shorter'
      ? `Rewrite the previous draft more concisely while preserving its intent and ${voiceLabel}.`
      : kind === 'longer'
        ? `Rewrite the previous draft with more natural detail, emotional texture, and completeness while preserving the ${voiceLabel} and without advancing the other Characters’ turns.`
        : `Write a meaningfully different alternative that follows the same user direction and ${voiceLabel}.`;
    void generateDraftReply({
      direction: current.direction,
      mode: current.mode,
      adjustment,
      previousDraft: current.result,
    });
  }, [draftState, generateDraftReply]);

  useEffect(() => {
    if (!draftState?.chatId || !draftState?.chatMode) return undefined;

    let timer = 0;
    let missingCount = 0;
    const closeForContextChange = () => {
      sessionSeqRef.current += 1;
      abortCurrent();
      abortPersonaResolution();
      setDraftState(null);
    };
    const validate = () => {
      timer = 0;
      const activeChatId = DOMUtils.getChatId();
      const activeAnchor = DOMUtils.getChatComposerAnchor();
      const definiteMismatch = (
        (activeChatId && activeChatId !== draftState.chatId)
        || (activeAnchor?.mode && activeAnchor.mode !== draftState.chatMode)
      );
      if (definiteMismatch) {
        closeForContextChange();
        return;
      }

      if (!activeAnchor?.composer || !activeAnchor.composer.isConnected) {
        missingCount += 1;
        if (missingCount >= 2) closeForContextChange();
        return;
      }
      missingCount = 0;
    };
    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(validate, 70);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-chat-mode', 'data-chat-composer'],
    });
    window.addEventListener('popstate', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('popstate', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, [
    abortCurrent,
    abortPersonaResolution,
    draftState?.chatId,
    draftState?.chatMode,
  ]);

  useEffect(() => () => {
    sessionSeqRef.current += 1;
    abortCurrent();
    abortPersonaResolution();
  }, [abortCurrent, abortPersonaResolution]);

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
