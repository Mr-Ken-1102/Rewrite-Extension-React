import { useEffect, useState } from 'react';
import { APIService } from '../services/apiService';

export function useContextInspector(selection, rewriteSelection, config) {
  const [tokenInfo, setTokenInfo] = useState({ loading: false, parts: null, identities: null, error: '' });

  useEffect(() => {
    if (!selection?.text) {
      setTokenInfo({ loading: false, parts: null, identities: null, error: '' });
      return undefined;
    }
    const controller = new AbortController();
    const oneShot = rewriteSelection();
    setTokenInfo((current) => ({ ...current, loading: true, identities: null, error: '' }));
    APIService.inspectContext(oneShot, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result?.error) setTokenInfo({ loading: false, parts: null, identities: null, error: result.error });
        else if (!result?.aborted) setTokenInfo({
          loading: false,
          parts: result?.parts || null,
          identities: result?.identities || null,
          error: '',
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setTokenInfo({ loading: false, parts: null, identities: null, error: error?.message || String(error) });
      });
    return () => controller.abort();
  }, [
    rewriteSelection,
    selection?.captureId,
    selection?.text,
    config.contextDepth,
    config.injectChar,
    config.injectUser,
    config.injectLorebook,
    config.localContextEnabled,
    config.localContextWords,
    config.useExtenderMemory,
    config.speakerAware,
    config.freeMode,
    config.charCardIds,
  ]);

  return tokenInfo;
}
