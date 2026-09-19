import { useEffect, useState } from 'react';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { useToastStore } from '../store/useToastStore';
import { APIService } from '../services/apiService';
import { resolveVoiceIdentity, voiceIdentityFromSelection } from '../services/voiceProfileIdentity.js';
import { useAutoProfileGeneration } from './useAutoProfileGeneration';

export function useAutoVoiceProfileCoordinator() {
  const selection = useRuntimeStore((state) => state.selection);
  const isProcessing = useRuntimeStore((state) => state.isProcessing);
  const config = usePersistentStore((state) => state.config);
  const bucket = usePersistentStore((state) => (
    selection?.cid ? state.autoProfiles?.[selection.cid] || null : null
  ));
  const showToast = useToastStore((state) => state.showToast);
  const [resolved, setResolved] = useState({ selectionKey: '', identity: null, targetMessage: null });
  const selectionCaptureKey = selection?.captureId
    || [
      selection?.detectedGroupedSpeaker === true ? 'grouped' : 'message',
      selection?.detectedCharacterId || '',
      selection?.detectedName || '',
    ].join(':');
  const selectionKey = selection?.cid && selection?.mid
    ? `${selection.cid}\u0000${selection.mid}\u0000${selectionCaptureKey}`
    : '';
  const domIdentity = voiceIdentityFromSelection(selection);
  const resolvedIdentity = resolved.selectionKey === selectionKey ? resolved.identity : null;
  const resolvedMessage = resolved.selectionKey === selectionKey ? resolved.targetMessage : null;
  const identity = domIdentity || resolvedIdentity;
  const targetMessage = domIdentity
    ? {
      id: selection?.mid,
      role: 'assistant',
      characterId: domIdentity.id,
      characterName: domIdentity.name || undefined,
      content: selection?.text || '',
    }
    : resolvedMessage;

  useEffect(() => {
    if (!config.autoProfileEnabled || !selection?.cid || !selection?.mid) {
      setResolved({ selectionKey: '', identity: null, targetMessage: null });
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();

    const resolve = async () => {
      const info = await APIService.getMessageInfo(selection.cid, selection.mid, controller.signal);
      if (!alive || controller.signal.aborted) return;
      const message = info?.message || null;
      const chatCharacters = selection.detectedGroupedSpeaker === true && selection.detectedGroupedSpeakerAmbiguous !== true
        ? await APIService.fetchChatCharacters(selection.cid, controller.signal)
        : [];
      if (!alive || controller.signal.aborted) return;

      const identity = resolveVoiceIdentity(selection, message, chatCharacters);
      const targetMessage = identity?.kind === 'character' && selection.detectedGroupedSpeaker === true
        ? {
          id: selection.mid,
          role: 'assistant',
          characterId: identity.id,
          characterName: identity.name || selection.detectedName || undefined,
          content: selection.text || '',
        }
        : message;

      setResolved({ selectionKey, identity, targetMessage });
    };

    resolve().catch(() => {
      if (alive && !controller.signal.aborted) {
        setResolved({ selectionKey, identity: null, targetMessage: null });
      }
    });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [config.autoProfileEnabled, selection, selectionKey]);

  const profile = identity?.key && bucket ? bucket[identity.key] || null : null;

  useAutoProfileGeneration({
    selection,
    config,
    identity,
    targetMessage,
    profile,
    isProcessing,
    showToast,
  });
}
