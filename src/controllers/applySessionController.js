import { TextEditorService } from '../services/textEditorService';
import { partialApplySummary, pendingApplyIndexes, sessionLedgerStore } from '../services/advancedRewriteService';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { segmentSelection } from './rewriteSelection';

export function createApplySessionController({
  setState,
  showToast,
  pushHistory,
  resumeSequential,
}) {
  let commitInFlight = false;

  const applyMergedSequence = async (targetState) => {
    if (commitInFlight) return;
    commitInFlight = true;
    setState((current) => current ? { ...current, status: 'applying' } : current);
    const results = Array.from({ length: targetState.segments.length }, (_, index) => targetState.applyResults?.[index] || null);
    try {
      for (const index of pendingApplyIndexes(results, targetState.segments.length)) {
        const selection = segmentSelection(targetState.selection, targetState.segments[index], index);
        const applied = await TextEditorService.doCommit(targetState.pieces[index], selection, selection.mid, pushHistory, showToast, null);
        results[index] = { applied };
        if (!applied) break;
      }
      const summary = partialApplySummary(results, targetState.segments.length);
      if (results.every((item) => item?.applied)) {
        showToast(summary, 'ok');
        setState(null);
      } else {
        showToast(summary, 'warn');
        setState({ ...targetState, status: 'success', applyResults: results, applyReport: `${summary} Press Accept All again to retry only the remaining messages.` });
      }
    } finally {
      commitInFlight = false;
    }
  };

  const accept = async (targetState, resultText, selection) => {
    if (!targetState || commitInFlight) return;
    if (targetState.kind === 'merged') {
      await applyMergedSequence(targetState);
      return;
    }

    commitInFlight = true;
    setState((current) => current ? { ...current, status: 'applying' } : current);
    try {
      const applied = await TextEditorService.doCommit(
        resultText,
        selection,
        selection?.mid || useRuntimeStore.getState().lastClickedMid,
        pushHistory,
        showToast,
        null,
      );
      if (!applied) {
        let report = targetState.applyReport || '';
        if (targetState.kind === 'sequential') {
          const nextResults = [...(targetState.results || [])];
          nextResults[targetState.index] = { applied: false };
          report = partialApplySummary(nextResults, targetState.segments.length);
        }
        setState({ ...targetState, status: 'success', result: resultText, applyReport: report });
        return;
      }

      if (targetState.kind === 'ledger-final') {
        sessionLedgerStore.delete(targetState.ledgerKey);
        const continuation = targetState.continuation;
        if (continuation?.kind === 'sequential') {
          const nextResults = [...(continuation.results || [])];
          nextResults[continuation.index] = { applied: true };
          // The current destructive write is complete. Release the commit lock
          // before starting the next inference so sequential Auto Apply can
          // acquire it independently instead of deadlocking on this call.
          commitInFlight = false;
          await resumeSequential(
            continuation.profile || targetState.profile,
            continuation.parentSelection,
            continuation.segments,
            continuation.index + 1,
            nextResults,
          );
          return;
        }
        setState(null);
        return;
      }

      if (targetState.kind === 'sequential') {
        const nextResults = [...(targetState.results || [])];
        nextResults[targetState.index] = { applied: true };
        if (targetState.index + 1 < targetState.segments.length) {
          commitInFlight = false;
          await resumeSequential(targetState.profile, targetState.parentSelection, targetState.segments, targetState.index + 1, nextResults);
        } else {
          const summary = partialApplySummary(nextResults, targetState.segments.length);
          showToast(summary, 'ok');
          setState(null);
        }
        return;
      }
      setState(null);
    } finally {
      commitInFlight = false;
    }
  };

  return Object.freeze({
    accept,
    applyMergedSequence,
    isBusy: () => commitInFlight,
  });
}
