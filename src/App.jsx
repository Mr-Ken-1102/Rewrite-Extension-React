import { useState } from 'react';
import { useNativeEvents } from './hooks/useNativeEvents';
import { useRewriteSession } from './hooks/useRewriteSession';
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

export default function App() {
  useNativeEvents();
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
      {activeModal === 'settings' && (
        <SettingsModal
          onClose={() => setActiveModal(null)}
          openEditProfile={(profile) => {
            setModalPayload({ profile, returnTo: 'settings' });
            setActiveModal('editProfile');
          }}
          openAIArchitect={() => setActiveModal('aiArchitect')}
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
        <ErrorModal
          message={processState.errorMsg}
          mode={processState.providerMode}
          errorCode={processState.errorCode}
          onClose={handleCancelProcess}
        />
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
      {processState && ['loading', 'success', 'partial', 'applying'].includes(processState.status) && (
        <PreviewModal
          status={processState.status}
          result={processState.result}
          profile={processState.profile}
          selection={processState.selection}
          progress={processState.progress}
          pieces={processState.pieces}
          applyReport={processState.applyReport}
          streamed={processState.streamed === true}
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
