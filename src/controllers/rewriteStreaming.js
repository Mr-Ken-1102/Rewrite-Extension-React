function cleanStreamPreview(value) {
  return String(value || '')
    .replace(/^\s*<\s*rewrite_this\s*>\s*/i, '')
    .replace(/\s*<\s*\/\s*rewrite_this\s*>\s*$/i, '');
}

export function createRewriteStreamingHooks({ executions, execution, setState }) {
  return {
    onProgress(partialResult) {
      if (!executions.isCurrent(execution)) return;
      const preview = cleanStreamPreview(partialResult);
      setState((current) => current && current.status === 'loading'
        ? { ...current, partialResult: preview, streamed: true, streamChars: preview.length }
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
