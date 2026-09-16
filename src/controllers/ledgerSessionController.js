import { APIService } from '../services/apiService';
import {
  assembleLedgerText,
  createLedger,
  ledgerContextNote,
  sessionLedgerStore,
  stripMessageSelectionEdgeWhitespace,
  subdivideLedgerSlice,
} from '../services/advancedRewriteService';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { createExecutionCoordinator } from './rewriteExecution';

const RESIZABLE_OVERFLOW_CODES = new Set(['RWA_TARGET_TOO_LARGE', 'RWA_PROVIDER_CONTEXT_LIMIT']);

function executionMeta(ledger) {
  return {
    kind: 'ledger',
    captureId: ledger?.selection?.captureId,
    chatId: ledger?.selection?.cid,
    messageIds: ledger?.selection?.mid ? [ledger.selection.mid] : [],
  };
}

export function createLedgerSessionController({
  getState,
  setState,
  setActiveModal,
  showToast,
  contextTrimHook,
}) {
  const executions = createExecutionCoordinator();

  const publish = (ledger) => {
    sessionLedgerStore.put(ledger);
    setState({
      kind: 'ledger',
      status: 'ledger',
      profile: ledger.profile,
      selection: ledger.selection,
      ledger: { ...ledger, slices: ledger.slices.map((slice) => ({ ...slice })) },
    });
  };

  const runLoop = async (ledger, startIndex = 0) => {
    const runtimeAPI = useRuntimeStore.getState();
    const execution = executions.begin(executionMeta(ledger));
    runtimeAPI.registerController(execution.controller);
    let context = null;

    try {
      if (!ledger.context) {
        const collected = await APIService.collectContext(ledger.selection, execution.controller.signal);
        if (!executions.isCurrent(execution)) return;
        const promptContext = { ...(collected || {}) };
        delete promptContext.messageInfo;
        ledger.context = promptContext;
        sessionLedgerStore.put(ledger);
      }
      context = ledger.context;

      for (let index = Math.max(0, startIndex); index < ledger.slices.length; index += 1) {
        if (!executions.isCurrent(execution)) return;
        const slice = ledger.slices[index];
        if (slice.status !== 'pending') continue;
        slice.status = 'running';
        slice.error = null;
        publish(ledger);

        const response = await APIService.fetchAIResponse(ledger.profile, ledger.selection, execution.controller.signal, {
          targetText: slice.text,
          context,
          extraContext: ledgerContextNote(ledger, index),
          onContextTrim: contextTrimHook,
        });
        if (!executions.isCurrent(execution)) return;
        if (response?.aborted) {
          slice.status = 'pending';
          sessionLedgerStore.put(ledger);
          return;
        }
        if (response?.error) {
          if (RESIZABLE_OVERFLOW_CODES.has(response.errorCode) && slice.text.length > 512) {
            const smaller = subdivideLedgerSlice(slice, Math.max(256, Math.floor(slice.text.length * 0.55)));
            if (smaller?.length > 1) {
              ledger.slices.splice(index, 1, ...smaller);
              ledger.slices.forEach((item, itemIndex) => { item.index = itemIndex; });
              ledger.sliceBudget = Math.min(ledger.sliceBudget, Math.max(...smaller.map((item) => item.text.length)));
              publish(ledger);
              index -= 1;
              continue;
            }
          }
          slice.status = 'error';
          slice.error = response.error;
          publish(ledger);
          return;
        }

        const result = typeof response?.result === 'string' ? response.result.trim() : '';
        if (!result) {
          slice.status = 'error';
          slice.error = 'The model returned an empty slice.';
          publish(ledger);
          return;
        }
        slice.result = result;
        slice.status = 'done';
        publish(ledger);
      }
    } catch (error) {
      if (executions.isCurrent(execution)) {
        const slice = ledger.slices.find((item) => item.status === 'running') || ledger.slices.find((item) => item.status === 'pending');
        if (slice) {
          slice.status = 'error';
          slice.error = error?.message || String(error);
        }
        publish(ledger);
      }
    } finally {
      executions.finish(execution);
      runtimeAPI.unregisterController(execution.controller);
    }
  };

  const start = async (profile, selection, continuation = null, restart = false) => {
    const config = usePersistentStore.getState().config;
    let candidate;
    try {
      candidate = createLedger(profile, selection, config, continuation);
    } catch (error) {
      if (!['RWA_LEDGER_CAPACITY', 'RWA_LEDGER_GRAPHEME_LIMIT'].includes(error?.code)) throw error;
      setActiveModal(null);
      setState({
        kind: 'ledger',
        status: 'error',
        profile,
        selection,
        continuation,
        errorMsg: error.message,
      });
      showToast(`⚠️ ${error.message}`, 'warn');
      return false;
    }
    let ledger = !restart ? sessionLedgerStore.get(candidate.key) : null;
    if (!ledger || ledger.original !== candidate.original || ledger.profileId !== candidate.profileId) ledger = candidate;
    ledger.profile = profile;
    ledger.selection = selection;
    ledger.continuation = continuation;
    sessionLedgerStore.put(ledger);
    useRuntimeStore.getState().reset();
    setActiveModal(null);
    publish(ledger);
    const firstPending = ledger.slices.findIndex((slice) => slice.status === 'pending');
    if (firstPending >= 0) await runLoop(ledger, firstPending);
    return true;
  };

  const retry = async (index) => {
    const ledger = sessionLedgerStore.get(getState()?.ledger?.key);
    if (!ledger || !ledger.slices[index]) return;
    ledger.slices[index].status = 'pending';
    ledger.slices[index].error = null;
    publish(ledger);
    await runLoop(ledger, index);
  };

  const toggleSkip = async (index) => {
    const ledger = sessionLedgerStore.get(getState()?.ledger?.key);
    const slice = ledger?.slices?.[index];
    if (!slice || slice.status === 'running') return;
    if (slice.status === 'skipped') slice.status = slice.result ? 'done' : 'pending';
    else slice.status = 'skipped';
    slice.error = null;
    publish(ledger);
    if (slice.status === 'pending') await runLoop(ledger, index);
    else {
      const next = ledger.slices.findIndex((item, i) => i > index && item.status === 'pending');
      if (next >= 0) await runLoop(ledger, next);
    }
  };

  const review = () => {
    const ledger = sessionLedgerStore.get(getState()?.ledger?.key);
    if (!ledger) return;
    const blocked = ledger.slices.some((slice) => ['pending', 'running', 'error'].includes(slice.status));
    if (blocked) {
      showToast('Resolve, retry, or skip every ledger slice before assembling.', 'warn');
      return;
    }
    const assembled = assembleLedgerText(ledger.slices);
    const result = stripMessageSelectionEdgeWhitespace(ledger.selection, assembled);
    setState({
      kind: 'ledger-final',
      status: 'success',
      profile: ledger.profile,
      selection: ledger.selection,
      result,
      ledgerKey: ledger.key,
      continuation: ledger.continuation,
      progress: `Large-selection ledger assembled from ${ledger.slices.length} slices. Apply still uses the original stale-write/fingerprint guard.`,
    });
  };

  const close = () => {
    const ledger = sessionLedgerStore.get(getState()?.ledger?.key);
    executions.abort();
    useRuntimeStore.getState().abortAll();
    if (ledger) {
      ledger.slices.forEach((slice) => { if (slice.status === 'running') slice.status = 'pending'; });
      sessionLedgerStore.put(ledger);
      const resolved = ledger.slices.filter((slice) => ['done', 'skipped'].includes(slice.status)).length;
      showToast(`Ledger closed. ${resolved}/${ledger.slices.length} slices remain in session RAM and will resume when you run the same rewrite again.`, 'ok');
    }
    setState(null);
  };

  return Object.freeze({
    start,
    retry,
    toggleSkip,
    review,
    close,
    abort: () => executions.abort(),
  });
}
