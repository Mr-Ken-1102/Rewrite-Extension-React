export function PopupHeader({
  language = 'en',
  selection,
  pinned,
  voiceIdentity = null,
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
  const identityKind = voiceIdentity?.kind || identityProfile?.identityKind || '';
  const identityName = String(voiceIdentity?.name || identityProfile?.identityName || identityProfile?.name || '').trim();
  const identityLabel = identityName
    ? `${identityKind === 'persona' ? 'Persona' : 'Char'}: ${identityName}`
    : '';
  const identityTooltip = identityProfile
    ? `${identityLabel}\nVoice Profile: ${identityProfile.name}\n${identityProfile.prompt}`
    : identityLabel
      ? text(
          `${identityLabel}\nDetected rewrite identity. No reusable Voice Profile is active for this identity.`,
          `${identityLabel}\nDanh tính viết lại đã được nhận diện. Chưa có Hồ sơ giọng tái sử dụng đang hoạt động cho danh tính này.`,
        )
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

  const identityContents = identityLabel ? (
    <>
      <span className="rwa2-identity-chip-mark" aria-hidden="true">{identityProfile ? '✦' : '•'}</span>
      <span className="rwa2-identity-chip-text">{identityLabel}</span>
    </>
  ) : null;

  return (
    <header className="rwa2-toolbar" onPointerDown={onDragStart}>
      <div className="rwa2-brand">
        <span className="rwa2-brand-title">Rewrite Assistant</span>
        <span className="rwa2-version">V3.0.3</span>
      </div>

      <div className="rwa2-toolbar-actions">
        {identityLabel && (
          identityProfile ? (
            <button
              type="button"
              data-rwa-no-drag="true"
              className="rwa2-identity-chip rwa2-identity-chip-profile"
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
              {identityContents}
            </button>
          ) : (
            <div
              className="rwa2-identity-chip rwa2-identity-chip-static"
              aria-label={identityLabel}
              onMouseEnter={(event) => onTooltip?.(event, identityTooltip)}
              onMouseLeave={onTooltipLeave}
            >
              {identityContents}
            </div>
          )
        )}
        <button
          type="button"
          data-rwa-no-drag="true"
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
          data-rwa-no-drag="true"
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
