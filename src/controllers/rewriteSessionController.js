import { APIService } from '../services/apiService';
import { TextEditorService } from '../services/textEditorService';
import {
  buildMergedPayload,
  normalizeSelectionSegments,
  partialApplySummary,
  shouldUseLedger,
  splitMergedResult,
} from '../services/advancedRewriteService';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { createExecutionCoordinator } from './rewriteExecution';
import { createLedgerSessionController } from './ledgerSessionController';
import { createApplySessionController } from './applySessionController';
import { executionMeta, segmentSelection } from './rewriteSelection';

export const RESIZABLE_OVERFLOW_CODES = new Set(['RWA_TARGET_TOO_LARGE', 'RWA_PROVIDER_CONTEXT_LIMIT']);

const CONTEXT_LABELS = {
  history: 'previous messages',
  lore: 'lorebook',
  character: 'character card',
  persona: 'persona',
  surrounding: 'surrounding prose',
  memory: 'Extender memory',
  ledger: 'ledger continuity',
};

export function createRewriteSessionController({
  setViewState,
  setActiveModal,
  showToast,
  pushHistory,
  setHistoryData,
}) {
  let state = null;
  const executions = createExecutionCoordinator();

  const setState = (next) => {
    state = typeof next === 'function' ? next(state) : next;
    setViewState(state);
    return state;
  };

  const getState = () => state;

  const contextTrimHook = (droppedContext) => {
    showToast(`Context trimmed to fit the prompt budget: ${droppedContext.map((key) => CONTEXT_LABELS[key] || key).join(', ')}.`, 'warn');
  };

  const ledger = createLedgerSessionController({ getState, setState, setActiveModal, showToast, contextTrimHook });

  const finishExecution = (execution) => {
    executions.finish(execution);
    useRuntimeStore.getState().unregisterController(execution.controller);
  };

  let runSequential;
  const applyController = createApplySessionController({
    setState,
    showToast,
    pushHistory,
    resumeSequential: (...args) => runSequential(...args),
  });

  const generateOne = async (profile, selection, meta = {}) => {
    const config = usePersistentStore.getState().config;
    if (shouldUseLedger(selection?.text, config, profile)) {
      await ledger.start(profile, selection, meta.kind === 'sequential' ? meta : null);
      return;
    }

    executions.abort();
    const runtimeAPI = useRuntimeStore.getState();
    runtimeAPI.reset();
    setActiveModal(null);
    const loadingState = {
      status: 'loading',
      kind: meta.kind || 'single',
      profile,
      selection,
      progress: meta.progress || null,
      ...meta,
    };
    setState(loadingState);
    const execution = executions.begin(executionMeta(loadingState.kind, selection));
    runtimeAPI.registerController(execution.controller);

    try {
      const resp = await APIService.fetchAIResponse(profile, selection, execution.controller.signal, {
        onContextTrim: contextTrimHook,
        onProgress: (partialResult) => {
          if (!executions.isCurrent(execution)) return;
          setState({ ...loadingState, status: 'loading', partialResult, streamed: true });
        },
      });
      if (!executions.isCurrent(execution)) return;
      if (resp?.aborted) {
        setState(null);
        return;
      }
      if (RESIZABLE_OVERFLOW_CODES.has(resp?.errorCode)) {
        finishExecution(execution);
        await ledger.start(profile, selection, meta.kind === 'sequential' ? meta : null);
        return;
      }
      if (resp?.error) {
        const prefix = meta.kind === 'sequential' && (meta.results || []).some((item) => item?.applied)
          ? `${partialApplySummary(meta.results, meta.segments.length)} `
          : '';
        setState({ ...loadingState, status: 'error', errorMsg: `${prefix}${resp.error}` });
        return;
      }
      const result = typeof resp?.result === 'string' ? resp.result.trim() : '';
      if (!result) {
        setState({ ...loadingState, status: 'error', errorMsg: 'The LLM returned an empty response. Verify configuration.' });
        return;
      }
      const successState = { ...loadingState, status: 'success', result, streamed: resp?.streamed === true };
      setState(successState);
      if (usePersistentStore.getState().config.autoApply) await applyController.accept(successState, result, selection);
    } catch (error) {
      if (!executions.isCurrent(execution) || error?.name === 'AbortError') return;
      setState({ ...loadingState, status: 'error', errorMsg: error?.message || String(error) });
    } finally {
      finishExecution(execution);
    }
  };

  runSequential = async (profile, parentSelection, segments, index = 0, results = []) => {
    if (index >= segments.length) {
      showToast(partialApplySummary(results, segments.length), results.every((item) => item?.applied) ? 'ok' : 'warn');
      setState(null);
      return;
    }
    const selection = segmentSelection(parentSelection, segments[index], index);
    await generateOne(profile, selection, {
      kind: 'sequential',
      parentSelection,
      segments,
      index,
      results: [...results],
      progress: `Multi-message sequential rewrite — Message ${index + 1}/${segments.length}. Earlier messages, if accepted, are already committed and are never rolled back implicitly.`,
    });
  };

  const runMerged = async (profile, parentSelection, segments) => {
    const config = usePersistentStore.getState().config;
    const merged = buildMergedPayload(segments, parentSelection?.captureId);
    const markerRule = `Keep every section marker EXACTLY unchanged and in the same order: ${merged.markers.join(' ')}. Do not add, remove, duplicate, rename, reorder, or move a marker into another section.`;
    const mergedProfile = { ...profile, prompt: `${profile.prompt}\n\n${markerRule}` };
    if (shouldUseLedger(merged.text, config, mergedProfile)) {
      showToast('Merged selection is too large for one safe marker-preserving request. Falling back to per-message sequential/ledger processing.', 'warn');
      await runSequential(profile, parentSelection, segments, 0, []);
      return;
    }

    executions.abort();
    const anchorSelection = segmentSelection(parentSelection, segments[0], 0);
    const runtimeAPI = useRuntimeStore.getState();
    runtimeAPI.reset();
    setActiveModal(null);
    const loadingState = {
      kind: 'merged',
      status: 'loading',
      profile,
      selection: parentSelection,
      segments,
      merged,
      progress: `Merged rewrite — ${segments.length} message spans. Apply is disabled unless every nonce marker survives exactly and in order.`,
    };
    setState(loadingState);
    const execution = executions.begin(executionMeta('merged', parentSelection, segments));
    runtimeAPI.registerController(execution.controller);

    try {
      const mergedContext = await APIService.collectMergedContext(parentSelection, segments, execution.controller.signal);
      if (!executions.isCurrent(execution)) return;
      if (!mergedContext.compatible) {
        finishExecution(execution);
        showToast(`Merged mode is not semantically safe for this selection (${mergedContext.reason}). Switching to sequential mode.`, 'warn');
        await runSequential(profile, parentSelection, segments, 0, []);
        return;
      }
      const response = await APIService.fetchAIResponse(mergedProfile, mergedContext.anchorSelection || anchorSelection, execution.controller.signal, {
        targetText: merged.text,
        context: mergedContext.context,
        systemPromptSuffix: markerRule,
        onContextTrim: contextTrimHook,
        onProgress: (partialResult) => {
          if (!executions.isCurrent(execution)) return;
          setState({ ...loadingState, status: 'loading', partialResult, streamed: true });
        },
      });
      if (!executions.isCurrent(execution)) return;
      if (response?.aborted) {
        setState(null);
        return;
      }
      if (response?.error) {
        if (RESIZABLE_OVERFLOW_CODES.has(response.errorCode)) {
          finishExecution(execution);
          showToast('Merged request exceeded the real provider budget. Falling back to sequential mode.', 'warn');
          await runSequential(profile, parentSelection, segments, 0, []);
          return;
        }
        setState({ ...loadingState, status: 'error', errorMsg: response.error });
        return;
      }
      const parsed = splitMergedResult(response?.result || '', merged.markers);
      if (!parsed.ok) {
        finishExecution(execution);
        showToast(`Merged markers failed validation (${parsed.reason}). No message was changed; switching to sequential mode.`, 'warn');
        await runSequential(profile, parentSelection, segments, 0, []);
        return;
      }
      const rawRecovery = parsed.pieces.map((piece, index) => `--- Message ${index + 1} ---\n${piece}`).join('\n\n');
      const successState = { ...loadingState, status: 'success', pieces: parsed.pieces, result: rawRecovery, streamed: response?.streamed === true };
      setState(successState);
      if (usePersistentStore.getState().config.autoApply) await applyController.applyMergedSequence(successState);
    } catch (error) {
      if (!executions.isCurrent(execution) || error?.name === 'AbortError') return;
      setState({ ...loadingState, status: 'error', errorMsg: error?.message || String(error) });
    } finally {
      finishExecution(execution);
    }
  };

  const handleRewrite = async (actionProfile, overrideSelection = null) => {
    const runtimeAPI = useRuntimeStore.getState();
    const currentSelection = overrideSelection || runtimeAPI.selection;
    const currentMid = currentSelection?.mid || runtimeAPI.lastClickedMid;
    if (actionProfile.type === 'undo' || actionProfile.type === 'redo') {
      await TextEditorService.doUndoRedo(
        currentMid,
        actionProfile.type,
        currentSelection,
        usePersistentStore.getState().history,
        pushHistory,
        setHistoryData,
        runtimeAPI.setSelection,
        showToast,
      );
      return;
    }

    const segments = currentSelection?.source === 'message' ? normalizeSelectionSegments(currentSelection) : [];
    if (segments.length > 1) {
      if (usePersistentStore.getState().config.mergeMultiMsg) await runMerged(actionProfile, currentSelection, segments);
      else await runSequential(actionProfile, currentSelection, segments, 0, []);
      return;
    }
    await generateOne(actionProfile, currentSelection);
  };

  const handleRetry = async () => {
    const current = state;
    if (!current) return;
    if (current.kind === 'merged') {
      if (current.applyResults?.some((item) => item?.applied)) {
        showToast('This merged result is already partially committed. Use Accept All to resume only the remaining messages; regenerating now could mix two different merged outputs.', 'warn');
        return;
      }
      await runMerged(current.profile, current.selection, current.segments);
    } else if (current.kind === 'sequential') {
      await runSequential(current.profile, current.parentSelection, current.segments, current.index, current.results || []);
    } else if (current.kind === 'ledger-final') {
      await ledger.start(current.profile, current.selection, current.continuation, true);
    } else {
      await generateOne(current.profile, current.selection);
    }
  };

  const handleCancel = () => {
    const current = state;
    executions.abort();
    ledger.abort();
    useRuntimeStore.getState().abortAll();
    if (current?.kind === 'sequential' && (current.results || []).some((item) => item?.applied)) {
      showToast(partialApplySummary(current.results, current.segments.length), 'warn');
    } else if (current?.kind === 'merged' && (current.applyResults || []).some((item) => item?.applied)) {
      showToast(partialApplySummary(current.applyResults, current.segments.length), 'warn');
    }
    setState(null);
  };

  const handleManualSave = async (resultText, selection) => {
    const prepared = await TextEditorService.prepareNativeEditor(resultText, selection, showToast);
    if (prepared) {
      setState((current) => current ? {
        ...current,
        applyReport: 'Native editor prepared. Rewrite Assistant has not saved it; review and press Marinara Save manually.',
      } : current);
    }
  };

  return Object.freeze({
    getState,
    handleRewrite,
    accept: (resultText, selection) => applyController.accept(state, resultText, selection),
    replaceAll: (resultText, selection) => applyController.accept({ ...state, kind: 'single' }, resultText, selection),
    manualSave: handleManualSave,
    retry: handleRetry,
    cancel: handleCancel,
    retryLedger: ledger.retry,
    toggleLedgerSkip: ledger.toggleSkip,
    reviewLedger: ledger.review,
    closeLedger: ledger.close,
    dispose: () => {
      executions.abort();
      ledger.abort();
    },
  });
}
