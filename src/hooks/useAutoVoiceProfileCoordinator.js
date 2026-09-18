import { useEffect, useState } from 'react';
import { usePersistentStore } from '../store/usePersistentStore';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { useToastStore } from '../store/useToastStore';
import { APIService } from '../services/apiService';
import { voiceIdentityFromMessage } from '../services/voiceProfileIdentity.js';
import { useAutoProfileGeneration } from './useAutoProfileGeneration';

export function useAutoVoiceProfileCoordinator() {
  const selection = useRuntimeStore((state) => state.selection);
  const isProcessing = useRuntimeStore((state) => state.isProcessing);
  const config = usePersistentStore((state) => state.config);
  const bucket = usePersistentStore((state) => (
    selection?.cid ? state.autoProfiles?.[selection.cid] || null : null
  ));
  const showToast = useToastStore((state) => state.showToast);
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    if (!config.autoProfileEnabled || !selection?.cid || !selection?.mid) {
      setIdentity(null);
      return undefined;
    }

    let alive = true;
    const controller = new AbortController();
    APIService.getMessageInfo(selection.cid, selection.mid, controller.signal)
      .then((info) => {
        if (!alive || controller.signal.aborted) return;
        setIdentity(voiceIdentityFromMessage(info?.message || null));
      })
      .catch(() => {
        if (alive && !controller.signal.aborted) setIdentity(null);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [config.autoProfileEnabled, selection?.cid, selection?.mid]);

  const profile = identity?.key && bucket ? bucket[identity.key] || null : null;

  useAutoProfileGeneration({
    selection,
    config,
    identity,
    profile,
    isProcessing,
    showToast,
  });
}
