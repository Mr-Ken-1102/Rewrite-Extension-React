import { Button } from '../ui/Button';

export function PopupFooter({ msgHistory, onUndo, onRedo, onCustom, onSettings }) {
  return (
    <footer className="rwa2-actionbar">
      <Button glow={false} className="rwa2-action rwa2-undo" title="Undo" onClick={onUndo} disabled={!msgHistory.undo || msgHistory.undo.length === 0}>
        <span className="rwa2-action-icon" aria-hidden="true">↺</span>
      </Button>
      <Button glow={false} className="rwa2-action rwa2-redo" title="Redo" onClick={onRedo} disabled={!msgHistory.redo || msgHistory.redo.length === 0}>
        <span className="rwa2-action-icon" aria-hidden="true">↻</span>
      </Button>
      <Button glow={false} className="rwa2-action rwa2-custom" onClick={onCustom}>Custom Prompt</Button>
      <Button glow={false} className="rwa2-action rwa2-settings" onClick={onSettings}>Settings</Button>
    </footer>
  );
}
