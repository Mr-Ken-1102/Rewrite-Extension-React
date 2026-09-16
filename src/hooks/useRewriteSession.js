import { useEffect, useRef, useState } from 'react';
import { usePersistentStore } from '../store/usePersistentStore';
import { useToastStore } from '../store/useToastStore';
import { createRewriteSessionController } from '../controllers/rewriteSessionController';

export function useRewriteSession(setActiveModal) {
  const pushHistory = usePersistentStore((state) => state.pushHistory);
  const setHistoryData = usePersistentStore((state) => state.setHistoryData);
  const showToast = useToastStore((state) => state.showToast);
  const [processState, setProcessState] = useState(null);
  const controllerRef = useRef(null);

  if (!controllerRef.current) {
    controllerRef.current = createRewriteSessionController({
      setViewState: setProcessState,
      setActiveModal,
      showToast,
      pushHistory,
      setHistoryData,
    });
  }

  useEffect(() => () => controllerRef.current?.dispose(), []);

  return {
    processState,
    handleRewrite: controllerRef.current.handleRewrite,
    handleAcceptPreview: controllerRef.current.accept,
    handleReplaceAll: controllerRef.current.replaceAll,
    handleManualSave: controllerRef.current.manualSave,
    handleRetry: controllerRef.current.retry,
    handleCancelProcess: controllerRef.current.cancel,
    retryLedger: controllerRef.current.retryLedger,
    toggleLedgerSkip: controllerRef.current.toggleLedgerSkip,
    reviewLedger: controllerRef.current.reviewLedger,
    closeLedger: controllerRef.current.closeLedger,
  };
}
