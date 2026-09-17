import { Button } from '../ui/Button';

export function PopupFooter({ language = 'en', msgHistory, onUndo, onRedo, onCustom, onSettings }) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);

  return (
    <footer className="rwa2-actionbar">
      <Button glow={false} className="rwa2-action rwa2-undo" title={text('Undo', 'Hoàn tác')} aria-label={text('Undo', 'Hoàn tác')} onClick={onUndo} disabled={!msgHistory.undo || msgHistory.undo.length === 0}>
        <span className="rwa2-action-icon" aria-hidden="true">↺</span>
      </Button>
      <Button glow={false} className="rwa2-action rwa2-redo" title={text('Redo', 'Làm lại')} aria-label={text('Redo', 'Làm lại')} onClick={onRedo} disabled={!msgHistory.redo || msgHistory.redo.length === 0}>
        <span className="rwa2-action-icon" aria-hidden="true">↻</span>
      </Button>
      <Button glow={false} className="rwa2-action rwa2-custom" onClick={onCustom}>{text('Custom Prompt', 'Prompt tùy chỉnh')}</Button>
      <Button glow={false} className="rwa2-action rwa2-settings" onClick={onSettings}>{text('Settings', 'Cài đặt')}</Button>
    </footer>
  );
}
