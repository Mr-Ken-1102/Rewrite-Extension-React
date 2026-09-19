export function PopupHeader({
  language = 'en',
  selection,
  pinned,
  identityProfile = null,
  onRunIdentityProfile,
  onTooltip,
  onTooltipLeave,
  onDragStart,
  onTrim,
  onPinToggle,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const multiCount = Array.isArray(selection?.segments) ? selection.segments.length : 0;
  const identityLabel = identityProfile
    ? `${identityProfile.identityKind === 'persona' ? 'Persona' : 'Char'}: ${identityProfile.identityName || identityProfile.name}`
    : '';
  const identityTooltip = identityProfile
    ? `${identityLabel} · ${identityProfile.name}: ${identityProfile.prompt}`
    : '';
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
        <span className="rwa2-version">V3.0.3</span>
      </div>

      <div className="rwa2-toolbar-actions" onPointerDown={(event) => event.stopPropagation()}>
        {identityProfile && (
          <button
            type="button"
            className="rwa2-identity-chip"
            aria-label={identityLabel}
            aria-description={identityProfile.prompt}
            onMouseEnter={(event) => onTooltip?.(event, identityTooltip)}
            onMouseLeave={onTooltipLeave}
            onFocus={(event) => onTooltip?.(event, identityTooltip)}
            onBlur={onTooltipLeave}
            onClick={(event) => {
              event.stopPropagation();
              onRunIdentityProfile?.(identityProfile);
            }}
          >
            <span className="rwa2-identity-chip-mark" aria-hidden="true">✦</span>
            <span className="rwa2-identity-chip-text">{identityLabel}</span>
          </button>
        )}
        <button
          type="button"
          className="rwa2-icon-button"
          onClick={onTrim}
          disabled={multiCount > 1}
          title={multiCount > 1
            ? text('Trim is available only for a single-message selection', 'Chỉ có thể cắt vùng chọn khi chọn trong một tin nhắn')
            : text('Trim selection before sending', 'Cắt vùng chọn trước khi gửi')}
          aria-label={multiCount > 1
            ? text('Trim unavailable for multi-message selection', 'Không thể cắt vùng chọn qua nhiều tin nhắn')
            : text('Trim selection before sending', 'Cắt vùng chọn trước khi gửi')}
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
          title={pinned ? text('Unpin popup', 'Bỏ ghim popup') : text('Pin popup here', 'Ghim popup tại đây')}
          aria-label={pinned ? text('Unpin popup', 'Bỏ ghim popup') : text('Pin popup here', 'Ghim popup tại đây')}
        >
          <svg {...iconProps}>
            <path d="M8 3h8M9 3v5l-3 4h12l-3-4V3M12 12v9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
