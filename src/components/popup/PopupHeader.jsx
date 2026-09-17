export function PopupHeader({ selection, pinned, onDragStart, onTrim, onPinToggle }) {
  const multiCount = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  const iconProps = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  return (
    <header className="rwa2-toolbar" onPointerDown={onDragStart}>
      <div className="rwa2-brand">
        <span className="rwa2-brand-title">Rewrite Assistant</span>
        <span className="rwa2-version">V3</span>
      </div>

      <div className="rwa2-toolbar-actions" onPointerDown={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="rwa2-icon-button"
          onClick={onTrim}
          disabled={multiCount > 1}
          title={multiCount > 1 ? 'Trim is available only for a single-message selection' : 'Trim selection before sending'}
          aria-label={multiCount > 1 ? 'Trim unavailable for multi-message selection' : 'Trim selection before sending'}
        >
          <svg {...iconProps}>
            <circle cx="6" cy="7" r="3" />
            <circle cx="6" cy="17" r="3" />
            <path d="M8.7 8.4 20 3M8.7 15.6 20 21M9 10l4 2" />
          </svg>
        </button>
        <button
          type="button"
          className={`rwa2-icon-button ${pinned ? 'rwa2-icon-button-active' : ''}`}
          onClick={onPinToggle}
          title={pinned ? 'Unpin popup' : 'Pin popup here'}
          aria-label={pinned ? 'Unpin popup' : 'Pin popup here'}
        >
          <svg {...iconProps}>
            <path d="M8 3h8M9 3v5l-3 4h12l-3-4V3M12 12v9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
