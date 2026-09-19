import { ToggleSwitch } from '../ui/ToggleSwitch';

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

export function ContextDeck({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  tokenInfo,
  contextSources,
  voiceIdentity,
  identityProfile,
  onToggleContext,
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
  const identityTitle = identityKind
    ? (profileReady
      ? text('Voice Profile ready for ', 'Hồ sơ giọng đã sẵn sàng cho ') + identityLabel
      : text('No Voice Profile yet for ', 'Chưa có Hồ sơ giọng cho ') + identityLabel)
    : '';

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
    <section className="rwa2-context-deck" aria-label={text('Context and rewrite controls', 'Ngữ cảnh và điều khiển viết lại')}>
      <div className="rwa2-context-identity-row">
        {identityLabel ? (
          <span
            className={[
              'rwa2-identity-chip',
              'rwa2-identity-' + identityKind,
              profileReady ? 'rwa2-identity-profile-ready' : '',
            ].filter(Boolean).join(' ')}
            title={identityTitle}
          >
            {profileReady ? <span className="rwa2-identity-profile-mark" aria-hidden="true">✦</span> : null}
            <span className="rwa2-identity-copy">{identityLabel}</span>
          </span>
        ) : <span aria-hidden="true" />}

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
          {tokenLabel}
        </button>
      </div>

      <div className="rwa2-context-chips" role="group" aria-label={text('Default rewrite sources', 'Nguồn viết lại mặc định')}>
        {contextSources.map((source) => (
          <button
            key={source.key}
            type="button"
            className={[
              'rwa2-context-chip',
              source.enabled ? 'rwa2-context-chip-on' : 'rwa2-context-chip-off',
            ].join(' ')}
            aria-pressed={source.enabled}
            disabled={source.disabled}
            title={source.disabled
              ? text(
                'This source is unavailable while Free Mode is on.',
                'Nguồn này không khả dụng khi Chế độ tự do đang bật.',
              )
              : (source.detail || source.label)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleContext(source.key, !source.enabled);
            }}
          >
            <span className="rwa2-context-chip-dot" aria-hidden="true"></span>
            {source.label}
          </button>
        ))}
      </div>

      <div className="rwa2-context-adjust-row">
        <label className="rwa2-context-depth">
          <span>{text('History depth', 'Độ sâu lịch sử')}</span>
          <input
            type="number"
            className="rwa2-depth-input"
            min="1"
            max="20"
            value={config.contextDepth !== undefined ? config.contextDepth : 0}
            aria-label={text('History context depth', 'Độ sâu ngữ cảnh lịch sử')}
            onChange={(event) => updateConfig({ contextDepth: Math.max(1, parseInt(event.target.value, 10) || 1) })}
          />
        </label>

        <div className="rwa2-context-length">
          <div className="rwa2-context-length-head">
            <ToggleSwitch
              label={text('Length', 'Độ dài')}
              checked={config.lengthEnabled}
              onChange={(value) => {
                updateConfig({ lengthEnabled: value, lengthPct: value ? config.lengthPct : 0 });
                keepFocus();
              }}
            />
            <span>{config.lengthEnabled ? (config.lengthPct >= 0 ? '+' : '') + config.lengthPct + '%' : text('Auto', 'Auto')}</span>
          </div>
          <input
            className="rwa2-range"
            type="range"
            min="-99"
            max="200"
            value={config.lengthPct || 0}
            disabled={!config.lengthEnabled}
            aria-label={text('Rewrite length adjustment', 'Điều chỉnh độ dài viết lại')}
            onChange={(event) => updateConfig({ lengthPct: parseInt(event.target.value, 10) })}
            onMouseUp={keepFocus}
            onTouchEnd={keepFocus}
          />
        </div>
      </div>
    </section>
  );
}
