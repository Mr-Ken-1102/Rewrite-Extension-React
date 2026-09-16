let executionSequence = 0;

function normalizeMessageIds(messageIds) {
  if (!Array.isArray(messageIds)) return [];
  return messageIds.map((id) => String(id || '').trim()).filter(Boolean);
}

export function createExecutionIdentity(meta = {}) {
  executionSequence += 1;
  return Object.freeze({
    id: `rwa-exec-${executionSequence}`,
    kind: String(meta.kind || 'rewrite'),
    captureId: meta.captureId || null,
    chatId: meta.chatId || null,
    messageIds: Object.freeze(normalizeMessageIds(meta.messageIds)),
    startedAt: Date.now(),
  });
}

/**
 * Coordinates one async execution channel. Starting a new execution invalidates
 * the previous one before aborting it, so late provider results cannot mutate
 * session state even when an upstream transport ignores AbortSignal.
 */
export function createExecutionCoordinator() {
  let current = null;

  const isCurrent = (execution) => (
    !!execution
    && current === execution
    && !execution.controller.signal.aborted
  );

  const abort = (execution = current) => {
    if (!execution) return false;
    if (current === execution) current = null;
    try { execution.controller.abort(); } catch {}
    return true;
  };

  const begin = (meta = {}) => {
    const previous = current;
    if (previous) {
      current = null;
      try { previous.controller.abort(); } catch {}
    }
    const controller = new AbortController();
    const execution = {
      identity: createExecutionIdentity(meta),
      controller,
    };
    current = execution;
    return execution;
  };

  const finish = (execution) => {
    if (current !== execution) return false;
    current = null;
    return true;
  };

  return Object.freeze({
    begin,
    abort,
    finish,
    isCurrent,
    current: () => current,
  });
}
