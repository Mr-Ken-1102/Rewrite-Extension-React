function BrandSparkle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1.8c.72 5.45 3.55 8.28 9 9-5.45.72-8.28 3.55-9 9-.72-5.45-3.55-8.28-9-9 5.45-.72 8.28-3.55 9-9Z" fill="currentColor" />
    </svg>
  );
}

function TrimIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v12.5A3.5 3.5 0 0 0 10.5 19H21" />
      <path d="M3 7h12.5A3.5 3.5 0 0 1 19 10.5V21" />
    </svg>
  );
}

export function PopupHeader({
  language = 'en',
  selection,
  pinned,
  onDragStart,
  onTrim,
  onPinToggle,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const multiCount = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  const iconProps = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  return (
    <header className="rwa2-toolbar" onPointerDown={onDragStart}>
      <div className="rwa2-brand">
        <span className="rwa2-brand-mark"><BrandSparkle /></span>
        <span className="rwa2-brand-title">Rewrite Assistant</span>
        <span className="rwa2-version">V3.0.3</span>
      </div>

      <div className="rwa2-toolbar-actions">
        <button
          type="button"
          data-rwa-no-drag="true"
          className={'rwa2-icon-button ' + (pinned ? 'rwa2-icon-button-active' : '')}
          onClick={onPinToggle}
          title={pinned ? text('Unpin popup', 'Bỏ ghim popup') : text('Pin popup here', 'Ghim popup tại đây')}
          aria-label={pinned ? text('Unpin popup', 'Bỏ ghim popup') : text('Pin popup here', 'Ghim popup tại đây')}
        >
          <svg {...iconProps}>
            <path d="m15.4 3.2 5.4 5.4-3.2 1.1-3.8 3.8.7 4.6-1.7 1.7-4.1-4.1-5.5 5.1 5.1-5.5-4.1-4.1 1.7-1.7 4.6.7 3.8-3.8 1.1-3.2Z" />
          </svg>
        </button>
        <button
          type="button"
          data-rwa-no-drag="true"
          className="rwa2-trim-button"
          onClick={onTrim}
          disabled={multiCount > 1}
          title={multiCount > 1
            ? text('Trim is available only for a single-message selection', 'Chỉ có thể cắt vùng chọn khi chọn trong một tin nhắn')
            : text('Trim selection before sending', 'Cắt vùng chọn trước khi gửi')}
          aria-label={multiCount > 1
            ? text('Trim unavailable for multi-message selection', 'Không thể cắt vùng chọn qua nhiều tin nhắn')
            : text('Trim selection before sending', 'Cắt vùng chọn trước khi gửi')}
        >
          <TrimIcon />
          <span>{text('Trim', 'Cắt')}</span>
        </button>
      </div>
    </header>
  );
}
