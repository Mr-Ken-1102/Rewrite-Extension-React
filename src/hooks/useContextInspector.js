import { useEffect, useState } from 'react';
import { APIService } from '../services/apiService';

function contextSelectionKey(selection) {
  if (!selection?.text) return '';
  if (selection.captureId) return String(selection.captureId);
  return [selection.cid || '', selection.mid || '', selection.text].join('\u0000');
}

export function useContextInspector(selection, rewriteSelection, config) {
  const selectionKey = contextSelectionKey(selection);
  const [tokenInfo, setTokenInfo] = useState({
    loading: false,
    parts: null,
    identities: null,
    voiceIdentity: null,
    error: '',
    selectionKey: '',
  });

  useEffect(() => {
    if (!selection?.text) {
      setTokenInfo({ loading: false, parts: null, identities: null, voiceIdentity: null, error: '', selectionKey: '' });
      return undefined;
    }
    const controller = new AbortController();
    const oneShot = rewriteSelection();
    setTokenInfo((current) => {
      const sameSelection = current.selectionKey === selectionKey;
      return {
        loading: true,
        parts: sameSelection ? current.parts : null,
        identities: sameSelection ? current.identities : null,
        voiceIdentity: sameSelection ? current.voiceIdentity : null,
        error: '',
        selectionKey,
      };
    });
    APIService.inspectContext(oneShot, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result?.error) {
          setTokenInfo((current) => ({
            loading: false,
            parts: current.selectionKey === selectionKey ? current.parts : null,
            identities: current.selectionKey === selectionKey ? current.identities : null,
            voiceIdentity: current.selectionKey === selectionKey ? current.voiceIdentity : null,
            error: result.error,
            selectionKey,
          }));
        } else if (!result?.aborted) {
          setTokenInfo({
            loading: false,
            parts: result?.parts || null,
            identities: result?.identities || null,
            voiceIdentity: result?.voiceIdentity || null,
            error: '',
            selectionKey,
          });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setTokenInfo((current) => ({
          loading: false,
          parts: current.selectionKey === selectionKey ? current.parts : null,
          identities: current.selectionKey === selectionKey ? current.identities : null,
          voiceIdentity: current.selectionKey === selectionKey ? current.voiceIdentity : null,
          error: error?.message || String(error),
          selectionKey,
        }));
      });
    return () => controller.abort();
  }, [
    rewriteSelection,
    selectionKey,
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

  if (tokenInfo.selectionKey !== selectionKey) {
    return { loading: !!selectionKey, parts: null, identities: null, voiceIdentity: null, error: '' };
  }
  return tokenInfo;
}
