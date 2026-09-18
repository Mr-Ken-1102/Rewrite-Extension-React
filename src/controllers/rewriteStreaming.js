export function createRewriteStreamingHooks({ executions, execution, setState }) {
  return {
    onProgress(partialResult) {
      if (!executions.isCurrent(execution)) return;
      setState((current) => current && current.status === 'loading'
        ? { ...current, partialResult, streamed: true, streamChars: partialResult.length }
        : current);
    },
    onStreamStatus(info) {
      if (!executions.isCurrent(execution)) return;
      setState((current) => current && current.status === 'loading'
        ? {
          ...current,
          streamStatus: info?.status || current.streamStatus,
          streamChars: Number.isFinite(Number(info?.chars)) ? Number(info.chars) : current.streamChars,
        }
        : current);
    },
  };
}
