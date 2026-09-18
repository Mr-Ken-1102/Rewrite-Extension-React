export function createStreamProgressHook({ executions, execution, setState }) {
  return (partialResult) => {
    if (!executions.isCurrent(execution)) return;
    const live = typeof partialResult === 'string' ? partialResult : '';
    if (!live) return;
    setState((current) => current?.status === 'loading'
      ? { ...current, result: live, streamed: true }
      : current);
  };
}

export function providerResponseMeta(response, providerMode) {
  return {
    streamed: response?.streamed === true,
    providerMode,
    errorCode: response?.errorCode || null,
    connectionSource: response?.connectionSource || null,
    connectionId: response?.connectionId || null,
  };
}

export function partialRecoveryState(loadingState, response, providerMode, applyReport) {
  const partialResult = typeof response?.partialResult === 'string' ? response.partialResult.trim() : '';
  if (!partialResult) return null;
  return {
    ...loadingState,
    status: 'partial',
    result: partialResult,
    ...providerResponseMeta(response, providerMode),
    applyReport,
  };
}
