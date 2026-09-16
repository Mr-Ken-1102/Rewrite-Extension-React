export function PopupHeader({ selection, pinned, onDragStart, onTrim, onPinToggle }) {
  const multiCount = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  return (
    <div className="rwa-header-drag-zone" onMouseDown={onDragStart}>
      <div className="rwa-topbar"></div>
      <div className="rwa-mini-hdr rwa-drag-handle">
        <span className="rwa-mini-title">REWRITE ASSISTANT v3</span>
        <div className="rwa-mini-actions" onMouseDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="rwa-mini-action"
            onClick={onTrim}
            disabled={multiCount > 1}
            title={multiCount > 1 ? 'Trim is available only for a single-message selection' : 'Trim selection before sending'}
            aria-label={multiCount > 1 ? 'Trim unavailable for multi-message selection' : 'Trim selection before sending'}
          >✂</button>
          <button
            type="button"
            className={`rwa-mini-action ${pinned ? 'rwa-mini-action-active' : ''}`}
            onClick={onPinToggle}
            title={pinned ? 'Unpin popup' : 'Pin popup here'}
            aria-label={pinned ? 'Unpin popup' : 'Pin popup here'}
          >📌</button>
        </div>
      </div>
    </div>
  );
}
