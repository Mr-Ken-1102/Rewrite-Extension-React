import { useEffect, useRef, useState } from 'react';
import { APIService } from '../services/apiService';
import { autoProfileBackoffRemaining, shouldStartAutoProfile } from '../services/autoProfilePolicy';

export function useAutoProfileGeneration({ selection, config, hasProfile, isProcessing, showToast }) {
  const attemptsRef = useRef(new Map());
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const cid = selection?.cid;
    if (!cid) return undefined;

    const attempts = attemptsRef.current;
    const now = Date.now();
    const previous = attempts.get(cid);
    if (!shouldStartAutoProfile({
      enabled: config.autoProfileEnabled,
      hasProfile,
      isProcessing,
      attempt: previous,
      now,
    })) {
      const remaining = autoProfileBackoffRemaining(previous, now);
      if (remaining > 0) {
        const timer = window.setTimeout(() => setRetryTick((value) => value + 1), remaining);
        return () => window.clearTimeout(timer);
      }
      return undefined;
    }

    const controller = new AbortController();
    attempts.set(cid, { state: 'running', at: now });
    APIService.generateAutoProfile(cid, controller.signal, {
      messageId: selection?.mid,
      preferredCharacterIds: config.charCardIds,
    }).then((result) => {
      if (controller.signal.aborted) {
        const current = attempts.get(cid);
        if (current?.state === 'running') attempts.delete(cid);
        return;
      }
      if (result?.profile) {
        attempts.delete(cid);
        showToast(`Auto-profile ready: ${result.profile.name}`, 'ok');
      } else if (result?.error) {
        attempts.set(cid, { state: 'failed', at: Date.now() });
        showToast(`Auto-profile skipped: ${result.error}. Retry available in 60 seconds.`, 'warn');
        setRetryTick((value) => value + 1);
      }
    }).catch((error) => {
      if (controller.signal.aborted) return;
      attempts.set(cid, { state: 'failed', at: Date.now() });
      showToast(`Auto-profile skipped: ${error?.message || String(error)}. Retry available in 60 seconds.`, 'warn');
      setRetryTick((value) => value + 1);
    });

    return () => {
      controller.abort();
      const current = attempts.get(cid);
      if (current?.state === 'running') attempts.delete(cid);
    };
  }, [selection?.cid, selection?.mid, config.autoProfileEnabled, config.charCardIds, hasProfile, isProcessing, showToast, retryTick]);
}
