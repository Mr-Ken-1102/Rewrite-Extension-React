import { useState } from 'react';
import { useNativeEvents } from './hooks/useNativeEvents';
import { useRewriteSession } from './hooks/useRewriteSession';
import { useAutoVoiceProfileCoordinator } from './hooks/useAutoVoiceProfileCoordinator';
import { useDraftReplySession } from './hooks/useDraftReplySession';
import { useRuntimeStore } from './store/useRuntimeStore';
import { ToastContainer } from './components/ui/ToastContainer';
import { PopupMain } from './components/PopupMain';
import { SettingsModal } from './components/modals/SettingsModal';
import { CustomPromptModal } from './components/modals/CustomPromptModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { AIArchitectModal } from './components/modals/AIArchitectModal';
import { PreviewModal } from './components/modals/PreviewModal';
import { LedgerModal } from './components/modals/LedgerModal';
import { ErrorModal } from './components/modals/ErrorModal';
import { DraftReplyLauncher } from './components/draft/DraftReplyLauncher';
import { DraftReplyModal } from './components/draft/DraftReplyModal';

export default function App() {
  useNativeEvents();
  useAutoVoiceProfileCoordinator();
  const popupPosition = useRuntimeStore((state) => state.popupPosition);
  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);
  const {
    processState,
    handleRewrite,
    handleAcceptPreview,
    handleReplaceAll,
    handleManualSave,
    handleRetry,
    handleCancelProcess,
    retryLedger,
    toggleLedgerSkip,
    reviewLedger,
    closeLedger,
  } = useRewriteSession(setActiveModal);
  const {
    draftState,
    openDraftReply,
    updateDraftInput,
    generateDraftReply,
    cancelGeneration: cancelDraftGeneration,
    closeDraftReply,
    insertDraftReply,
    rewriteDraftAgain,
  } = useDraftReplySession();
  const settingsLayerVisible = ['settings', 'editProfile', 'aiArchitect'].includes(activeModal);
  const draftUiOpen = !!draftState;

  return (
    <>
      <ToastContainer />
      <DraftReplyLauncher
        onOpen={openDraftReply}
        hidden={!!activeModal || !!processState || draftUiOpen || !!popupPosition}
      />
      {popupPosition && !activeModal && !processState && !draftUiOpen && (
        <PopupMain
          onRewrite={handleRewrite}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenCustom={() => setActiveModal('custom')}
        />
      )}
      {draftState && (
        <DraftReplyModal
          state={draftState}
          onUpdateInput={updateDraftInput}
          onGenerate={generateDraftReply}
          onCancelGeneration={cancelDraftGeneration}
          onClose={closeDraftReply}
          onInsert={insertDraftReply}
          onRewriteAgain={rewriteDraftAgain}
        />
      )}
      {settingsLayerVisible && (
        <SettingsModal
          suspended={activeModal !== 'settings'}
          onClose={() => setActiveModal(null)}
          openEditProfile={(profile) => {
            setModalPayload({ profile, returnTo: 'settings' });
            setActiveModal('editProfile');
          }}
          openAIArchitect={() => {
            setModalPayload({ returnTo: 'settings' });
            setActiveModal('aiArchitect');
          }}
        />
      )}
      {activeModal === 'custom' && (
        <CustomPromptModal
          onClose={() => setActiveModal(null)}
          onRunRewrite={handleRewrite}
          onSaveAsProfile={(prompt) => {
            setModalPayload({ draftProfile: { name: '', prompt }, returnTo: 'settings' });
            setActiveModal('editProfile');
          }}
        />
      )}
      {activeModal === 'editProfile' && (
        <EditProfileModal
          profileToEdit={modalPayload?.profile}
          initialDraft={modalPayload?.draftProfile}
          onClose={() => {
            const returnTo = modalPayload?.returnTo || 'settings';
            setModalPayload(null);
            setActiveModal(returnTo);
          }}
        />
      )}
      {activeModal === 'aiArchitect' && (
        <AIArchitectModal onClose={() => setActiveModal('settings')} onDone={() => setActiveModal('settings')} />
      )}
      {processState?.status === 'error' && (
        <ErrorModal message={processState.errorMsg} onClose={handleCancelProcess} />
      )}
      {processState?.kind === 'ledger' && processState.status === 'ledger' && (
        <LedgerModal
          ledger={processState.ledger}
          onRetry={retryLedger}
          onToggleSkip={toggleLedgerSkip}
          onReview={reviewLedger}
          onClose={closeLedger}
        />
      )}
      {processState && ['loading', 'success', 'applying'].includes(processState.status) && (
        <PreviewModal
          status={processState.status}
          result={processState.result}
          profile={processState.profile}
          selection={processState.selection}
          progress={processState.progress}
          partialResult={processState.partialResult}
          streamed={processState.streamed === true}
          streamStatus={processState.streamStatus}
          streamChars={processState.streamChars || 0}
          nativeEditorPrepared={processState.nativeEditorPrepared === true}
          pieces={processState.pieces}
          applyReport={processState.applyReport}
          onAccept={handleAcceptPreview}
          onReplaceAll={handleReplaceAll}
          onManualSave={processState.kind === 'merged' ? null : handleManualSave}
          onRetry={handleRetry}
          onClose={handleCancelProcess}
        />
      )}
    </>
  );
}
