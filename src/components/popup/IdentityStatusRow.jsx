const PART_LABELS = Object.freeze({
  selection: ['Selected', 'Vùng chọn'],
  character: ['Character', 'Nhân vật'],
  persona: ['Persona', 'Persona'],
  lore: ['Lore', 'Lore'],
  surrounding: ['Around', 'Xung quanh'],
  history: ['History', 'Lịch sử'],
  memory: ['Memory', 'Bộ nhớ'],
  speaker: ['Speaker', 'Vai nói'],
});

function tokenParts(parts, vi) {
  if (!parts) return [];
  return Object.entries(PART_LABELS)
    .map(([key, labels]) => ({
      key,
      label: vi ? labels[1] : labels[0],
      value: Math.max(0, Number(parts[key]) || 0),
    }))
    .filter((part) => part.key === 'selection' || part.value > 0);
}

function SparkleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8c.6 4.6 3 7 7.6 7.6-4.6.6-7 3-7.6 7.6-.6-4.6-3-7-7.6-7.6C9 9.8 11.4 7.4 12 2.8Z" fill="currentColor" />
      <path d="M19 15.2c.25 1.85 1.2 2.8 3 3-1.8.25-2.75 1.2-3 3-.25-1.8-1.2-2.75-3-3 1.8-.2 2.75-1.15 3-3Z" fill="currentColor" opacity=".7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 10.5v5" />
      <path d="M12 7.7h.01" />
    </svg>
  );
}

export function IdentityStatusRow({
  language = 'en',
  tokenInfo,
  voiceIdentity,
  identityProfile,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const parts = tokenParts(tokenInfo.parts, vi);
  const total = Math.max(0, Number(tokenInfo.parts?.total) || 0);
  const tokenLabel = tokenInfo.loading && !tokenInfo.parts
    ? text('calculating…', 'đang tính…')
    : tokenInfo.parts
      ? '≈' + total.toLocaleString() + ' tok'
      : '≈— tok';

  const identityKind = voiceIdentity?.kind === 'persona'
    ? 'persona'
    : (voiceIdentity?.kind === 'character' ? 'character' : '');
  const identityName = String(voiceIdentity?.name || '').trim();
  const identityLabel = identityKind
    ? (identityKind === 'persona' ? 'Persona: ' : 'Char: ') + (identityName || text('Unknown', 'Không rõ'))
    : '';
  const profileReady = !!identityProfile;

  const tokenTooltip = {
    kind: 'token',
    title: text('Request size', 'Kích thước yêu cầu'),
    total: tokenLabel,
    parts,
    note: tokenInfo.error || text(
      'Estimate only — not the provider billing/tokenizer count.',
      'Chỉ là ước lượng — không phải số token tính phí/tokenizer chính xác của nhà cung cấp.',
    ),
  };

  return (
    <div className="rwa2-status-row" aria-label={text('Current identity and request size', 'Danh tính hiện tại và kích thước yêu cầu')}>
      <div className="rwa2-status-identity-slot">
        {identityLabel ? (
          <span
            className={[
              'rwa2-identity-chip',
              'rwa2-identity-' + identityKind,
              profileReady ? 'rwa2-identity-profile-ready' : '',
            ].filter(Boolean).join(' ')}
            title={profileReady
              ? text('Voice Profile ready', 'Hồ sơ giọng đã sẵn sàng')
              : text('No Voice Profile yet', 'Chưa có Hồ sơ giọng')}
          >
            <span className="rwa2-identity-mark" aria-hidden="true">
              {profileReady ? <SparkleIcon size={13} /> : <span className="rwa2-identity-dot" />}
            </span>
            <span className="rwa2-identity-copy">{identityLabel}</span>
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className="rwa2-token-trigger"
        aria-label={text('Show token estimate details', 'Xem chi tiết ước lượng token')}
        aria-description={tokenTooltip.note}
        onMouseEnter={(event) => onTooltip?.(event, tokenTooltip)}
        onMouseLeave={onTooltipLeave}
        onFocus={(event) => onTooltip?.(event, tokenTooltip)}
        onBlur={onTooltipLeave}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onTooltip?.(event, tokenTooltip);
        }}
      >
        <span className="rwa2-token-value">{tokenLabel}</span>
        <InfoIcon />
      </button>
    </div>
  );
}
