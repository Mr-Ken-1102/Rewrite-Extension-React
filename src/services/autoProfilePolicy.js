export const AUTO_PROFILE_FAILURE_BACKOFF_MS = 60_000;

export function autoProfileBackoffRemaining(attempt, now = Date.now()) {
  if (!attempt || attempt.state !== 'failed' || !Number.isFinite(Number(attempt.at))) return 0;
  return Math.max(0, AUTO_PROFILE_FAILURE_BACKOFF_MS - (now - Number(attempt.at)));
}

export function shouldStartAutoProfile({ enabled, hasProfile, isProcessing, attempt, now = Date.now() }) {
  if (!enabled || hasProfile || isProcessing) return false;
  if (attempt?.state === 'running') return false;
  return autoProfileBackoffRemaining(attempt, now) === 0;
}
