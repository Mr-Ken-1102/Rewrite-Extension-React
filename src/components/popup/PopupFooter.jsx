import { Button } from '../ui/Button';

function UndoIcon({ redo = false }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {redo
        ? <><path d="m14 7 4-4 4 4" /><path d="M20 3v8a7 7 0 0 1-7 7H6" /></>
        : <><path d="m10 7-4-4-4 4" /><path d="M4 3v8a7 7 0 0 0 7 7h7" /></>}
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 2.5c.45 3.6 2.35 5.5 6 6-3.65.5-5.55 2.4-6 6-.45-3.6-2.35-5.5-6-6 3.65-.5 5.55-2.4 6-6Z" fill="currentColor" />
      <path d="M18 11c.3 2.25 1.45 3.4 3.7 3.7-2.25.3-3.4 1.45-3.7 3.7-.3-2.25-1.45-3.4-3.7-3.7 2.25-.3 3.4-1.45 3.7-3.7Z" fill="currentColor" opacity=".72" />
    </svg>
  );
}

export function PopupFooter({ language = 'en', msgHistory, onUndo, onRedo, onCustom, onSettings }) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);

  return (
    <footer className="rwa2-actionbar">
      <Button glow={false} className="rwa2-action rwa2-undo" title={text('Undo', 'Hoàn tác')} onClick={onUndo} disabled={!msgHistory.undo || msgHistory.undo.length === 0}>
        <span className="rwa2-action-icon"><UndoIcon /></span>
        <span>{text('Undo', 'Hoàn tác')}</span>
      </Button>
      <Button glow={false} className="rwa2-action rwa2-redo" title={text('Redo', 'Làm lại')} onClick={onRedo} disabled={!msgHistory.redo || msgHistory.redo.length === 0}>
        <span className="rwa2-action-icon"><UndoIcon redo /></span>
        <span>{text('Redo', 'Làm lại')}</span>
      </Button>
      <Button glow={false} className="rwa2-action rwa2-custom" onClick={onCustom}>
        <span className="rwa2-action-icon rwa2-custom-icon"><SparklesIcon /></span>
        <span>{text('Custom Prompt', 'Yêu cầu tùy chỉnh')}</span>
      </Button>
      <Button
        glow={false}
        className="rwa2-action rwa2-settings"
        onClick={onSettings}
        title={text('Settings', 'Cài đặt')}
        aria-label={text('Settings', 'Cài đặt')}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.17.36.38.7.6 1 .28.32.64.54 1.05.62H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      </Button>
    </footer>
  );
}
