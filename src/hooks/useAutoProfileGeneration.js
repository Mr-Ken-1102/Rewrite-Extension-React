import { useEffect, useRef, useState } from 'react';
import { APIService } from '../services/apiService';
import { autoProfileBackoffRemaining, shouldStartAutoProfile } from '../services/autoProfilePolicy';

const PROFILE_REVALIDATE_MS = 5 * 60_000;

export function useAutoProfileGeneration({
  selection,
  config,
  identity,
  targetMessage,
  profile,
  isProcessing,
  showToast,
}) {
  const attemptsRef = useRef(new Map());
  const validatedRef = useRef(new Map());
  const profileRef = useRef(profile);
  const targetMessageRef = useRef(targetMessage);
  profileRef.current = profile;
  targetMessageRef.current = targetMessage;
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const cid = selection?.cid;
    const identityKey = identity?.key;
    if (!cid || !identityKey || !config.autoProfileEnabled) return undefined;

    const now = Date.now();
    const runKey = `${cid}\u0000${identityKey}`;
    const lastValidated = validatedRef.current.get(runKey) || 0;
    const needsValidation = !profileRef.current || (now - lastValidated >= PROFILE_REVALIDATE_MS);
    if (!needsValidation) {
      const remaining = Math.max(1, PROFILE_REVALIDATE_MS - (now - lastValidated));
      const timer = window.setTimeout(() => setRetryTick((value) => value + 1), remaining);
      return () => window.clearTimeout(timer);
    }

    const attempts = attemptsRef.current;
    const previous = attempts.get(runKey);
    if (!shouldStartAutoProfile({
      enabled: true,
      hasProfile: false,
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
    attempts.set(runKey, { state: 'running', at: now });
    APIService.generateAutoProfile(cid, controller.signal, {
      messageId: selection?.mid,
      targetMessage: targetMessageRef.current,
      expectedIdentityKey: identityKey,
      preferredCharacterIds: config.charCardIds,
    }).then((result) => {
      if (controller.signal.aborted) {
        const current = attempts.get(runKey);
        if (current?.state === 'running') attempts.delete(runKey);
        return;
      }

      if (result?.profile) {
        attempts.delete(runKey);
        validatedRef.current.set(runKey, Date.now());
        setRetryTick((value) => value + 1);
        if (!result.reused) {
          const prefix = result.identity?.kind === 'persona' ? 'Persona' : 'Character';
          const label = result.profile.identityName || result.identity?.name || result.profile.name;
          showToast(`${prefix} voice profile ready: ${label}`, 'ok');
        }
      } else if (result?.error) {
        attempts.set(runKey, { state: 'failed', at: Date.now() });
        showToast(`Voice profile skipped: ${result.error}. Retry available in 60 seconds.`, 'warn');
        setRetryTick((value) => value + 1);
      }
    }).catch((error) => {
      if (controller.signal.aborted) return;
      attempts.set(runKey, { state: 'failed', at: Date.now() });
      showToast(`Voice profile skipped: ${error?.message || String(error)}. Retry available in 60 seconds.`, 'warn');
      setRetryTick((value) => value + 1);
    });

    return () => {
      controller.abort();
      const current = attempts.get(runKey);
      if (current?.state === 'running') attempts.delete(runKey);
    };
  }, [
    config.autoProfileEnabled,
    config.charCardIds,
    identity?.key,
    isProcessing,
    retryTick,
    selection?.cid,
    selection?.mid,
    showToast,
  ]);
}
