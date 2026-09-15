import React, { useState, useCallback } from 'react';
import { useNativeEvents } from './hooks/useNativeEvents';
import { useRuntimeStore } from './store/useRuntimeStore';
import { usePersistentStore } from './store/usePersistentStore';
import { useToastStore } from './store/useToastStore';

import { APIService } from './services/apiService';
import { TextEditorService } from './services/textEditorService';

import { ToastContainer } from './components/ui/ToastContainer';
import { PopupMain } from './components/PopupMain';
import { SettingsModal } from './components/modals/SettingsModal';
import { CustomPromptModal } from './components/modals/CustomPromptModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { AIArchitectModal } from './components/modals/AIArchitectModal';
import { PreviewModal } from './components/modals/PreviewModal';
import { ErrorModal } from './components/modals/ErrorModal';

export default function App() {
  useNativeEvents();

  const popupPosition = useRuntimeStore((state) => state.popupPosition);
  const { config, history, pushHistory, setHistoryData } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);

  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);
  const [processState, setProcessState] = useState(null);

  const handleRewrite = useCallback(async (actionProfile, overrideSelection = null) => {
    const runtimeAPI = useRuntimeStore.getState();
    const currentSelection = overrideSelection || runtimeAPI.selection;
    const currentMid = currentSelection?.mid || runtimeAPI.lastClickedMid;

    if (actionProfile.type === 'undo' || actionProfile.type === 'redo') {
      TextEditorService.doUndoRedo(
        currentMid,
        actionProfile.type,
        currentSelection,
        history,
        setHistoryData,
        runtimeAPI.setSelection,
        showToast,
      );
      return;
    }

    runtimeAPI.reset();
    setActiveModal(null);
    setProcessState({ status: 'loading', profile: actionProfile, selection: currentSelection });
    runtimeAPI.setProcessing(true);

    const abortCtrl = new AbortController();
    runtimeAPI.registerController(abortCtrl);

    try {
      const resp = await APIService.fetchAIResponse(actionProfile, currentSelection, abortCtrl.signal);
      runtimeAPI.setProcessing(false);
      if (abortCtrl.signal.aborted) return;

      if (resp.error) {
        setProcessState({ status: 'error', profile: actionProfile, selection: currentSelection, errorMsg: resp.error });
        return;
      }

      const result = typeof resp.result === 'string'
        ? resp.result.trim().replace(/^["\u201c\u2018\u00ab]+|["\u201d\u2019\u00bb]+$/g, '')
        : '';

      if (!result) {
        setProcessState({
          status: 'error',
          profile: actionProfile,
          selection: currentSelection,
          errorMsg: 'The LLM returned an empty response. Verify configuration.',
        });
        return;
      }

      if (config.autoApply) {
        setProcessState(null);
        TextEditorService.doCommit(
          result,
          currentSelection,
          currentMid,
          pushHistory,
          showToast,
          () => runtimeAPI.abortAll(),
        );
      } else {
        setProcessState({ status: 'success', profile: actionProfile, selection: currentSelection, result });
      }
    } catch (error) {
      runtimeAPI.setProcessing(false);
      if (error.name === 'AbortError' || error.message === 'cancelled') return;
      setProcessState({
        status: 'error',
        profile: actionProfile,
        selection: currentSelection,
        errorMsg: error.message || String(error),
      });
    }
  }, [history, config.autoApply, pushHistory, setHistoryData, showToast]);

  const handleAcceptPreview = (resultText, selection) => {
    setProcessState(null);
    TextEditorService.doCommit(
      resultText,
      selection,
      useRuntimeStore.getState().lastClickedMid,
      pushHistory,
      showToast,
      () => useRuntimeStore.getState().abortAll(),
    );
  };

  const handleReplaceAll = (resultText, fullSelection) => {
    setProcessState(null);
    TextEditorService.doCommit(
      resultText,
      fullSelection,
      useRuntimeStore.getState().lastClickedMid,
      pushHistory,
      showToast,
      () => useRuntimeStore.getState().abortAll(),
    );
  };

  const handleRetry = () => {
    const { profile, selection } = processState;
    handleRewrite(profile, selection);
  };

  const handleCancelProcess = () => {
    useRuntimeStore.getState().abortAll();
    setProcessState(null);
  };

  return (
    <>
      <ToastContainer />

      {popupPosition && !activeModal && !processState && (
        <PopupMain
          onRewrite={handleRewrite}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenCustom={() => setActiveModal('custom')}
        />
      )}

      {['settings', 'editProfile', 'aiArchitect'].includes(activeModal) && (
        <SettingsModal
          onClose={() => setActiveModal(null)}
          openEditProfile={(profile, index) => {
            setModalPayload({ profile, index });
            setActiveModal('editProfile');
          }}
          openAIArchitect={() => setActiveModal('aiArchitect')}
        />
      )}

      {activeModal === 'custom' && (
        <CustomPromptModal onClose={() => setActiveModal(null)} onRunRewrite={handleRewrite} />
      )}

      {activeModal === 'editProfile' && (
        <EditProfileModal
          profileToEdit={modalPayload?.profile}
          editIndex={modalPayload?.index}
          onClose={() => {
            setModalPayload(null);
            setActiveModal('settings');
          }}
        />
      )}

      {activeModal === 'aiArchitect' && (
        <AIArchitectModal onClose={() => setActiveModal('settings')} onDone={() => setActiveModal('settings')} />
      )}

      {processState && processState.status === 'error' && (
        <ErrorModal message={processState.errorMsg} onClose={handleCancelProcess} />
      )}

      {processState && ['loading', 'success'].includes(processState.status) && (
        <PreviewModal
          status={processState.status}
          result={processState.result}
          profile={processState.profile}
          selection={processState.selection}
          onAccept={handleAcceptPreview}
          onReplaceAll={handleReplaceAll}
          onRetry={handleRetry}
          onClose={handleCancelProcess}
        />
      )}
    </>
  );
}
