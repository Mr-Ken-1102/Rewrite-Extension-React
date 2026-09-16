import { Button } from '../ui/Button';

export function PopupFooter({ msgHistory, onUndo, onRedo, onCustom, onSettings }) {
  return (
    <div className="rwa-foot rwa-popup-foot">
      <Button className="rwa-btn-icon-square" title="Undo" variant="rwa-btn-undo" onClick={onUndo} disabled={!msgHistory.undo || msgHistory.undo.length === 0}>
        <span className="rwa-icon-txt">↺</span>
      </Button>
      <Button className="rwa-btn-icon-square" title="Redo" variant="rwa-btn-redo" onClick={onRedo} disabled={!msgHistory.redo || msgHistory.redo.length === 0}>
        <span className="rwa-icon-txt">↻</span>
      </Button>
      <Button className="rwa-btn-custom" onClick={onCustom}>Custom Prompt</Button>
      <Button className="rwa-btn-settings" onClick={onSettings}>Settings</Button>
    </div>
  );
}
