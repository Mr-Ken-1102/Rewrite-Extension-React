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

function messageCount(selection) {
  if (Array.isArray(selection?.segments) && selection.segments.length > 1) return selection.segments.length;
  return selection?.source === 'message' ? 1 : 0;
}

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
  open,
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  tokenInfo,
  selection,
  contextSources,
  contextExclusions,
  onToggleContext,
  onToggleOpen,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const parts = tokenParts(tokenInfo.parts, vi);
  const total = Math.max(0, Number(tokenInfo.parts?.total) || 0);
  const count = messageCount(selection);
  const countLabel = count > 0
    ? (vi ? `${count} tin` : `${count} ${count === 1 ? 'msg' : 'msgs'}`)
    : text('selection', 'vùng chọn');
  const tokenLabel = tokenInfo.loading && !tokenInfo.parts
    ? `${countLabel} · ${text('calculating…', 'đang tính…')}`
    : tokenInfo.parts
      ? `${countLabel} · ≈${total.toLocaleString()} tok`
      : `${countLabel} · ≈— tok`;
  const tokenHelp = tokenInfo.error || text(
    'Show the estimated token breakdown for this rewrite.',
    'Hiện chi tiết ước lượng token của lần viết lại này.',
  );

  const summaryLabel = (source) => source.key === 'history'
    ? `${source.label} ${Math.max(0, Number(config.contextDepth) || 0)}`
    : source.label;

  return (
    <section className={`rwa2-context-deck ${open ? 'rwa2-context-deck-open' : ''}`.trim()} aria-label={text('This rewrite and context details', 'Lần viết lại này và chi tiết ngữ cảnh')}>
      <div className="rwa2-context-summary">
        <div className="rwa2-context-summary-left">
          <span className="rwa2-context-title">{text('This rewrite', 'Lần này')}</span>
          <div className="rwa2-context-chips" role="group" aria-label={text('Sources for this rewrite', 'Nguồn cho lần viết lại này')}>
            {contextSources.map((source) => {
              const excluded = !!contextExclusions[source.key];
              return (
                <button
                  key={source.key}
                  type="button"
                  className={`rwa2-context-chip ${excluded ? 'rwa2-context-chip-off' : ''}`.trim()}
                  aria-pressed={!excluded}
                  title={text(
                    `${source.detail || source.label} — ${excluded ? 'excluded from' : 'included in'} this rewrite only`,
                    `${source.detail || source.label} — ${excluded ? 'đã loại khỏi' : 'đang dùng trong'} lần viết lại này`,
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleContext(source.key);
                  }}
                >
                  <span className="rwa2-context-chip-dot" aria-hidden="true"></span>
                  {summaryLabel(source)}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="rwa2-token-trigger"
          aria-expanded={open}
          aria-controls="rwa2-context-detail"
          aria-description={tokenHelp}
          title={tokenHelp}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleOpen();
          }}
        >
          <span>{tokenLabel}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div id="rwa2-context-detail" className="rwa2-context-collapse" inert={open ? undefined : true}>
        <div className="rwa2-context-detail">
          <div className="rwa2-token-detail">
            <div className="rwa2-context-detail-head">
              <span className="rwa2-context-detail-label">{text('Token details', 'Chi tiết token')}</span>
              <span className="rwa2-context-detail-total">
                {tokenInfo.loading && !tokenInfo.parts
                  ? text('Calculating…', 'Đang tính…')
                  : total > 0
                    ? `≈${total.toLocaleString()} tok`
                    : '≈— tok'}
              </span>
            </div>

            {parts.length > 0 ? (
              <div className="rwa2-token-detail-grid">
                {parts.map((part) => (
                  <div className="rwa2-token-detail-item" key={part.key}>
                    <span className="rwa2-token-detail-dot" aria-hidden="true"></span>
                    <span className="rwa2-token-detail-name">{part.label}</span>
                    <span className="rwa2-token-detail-value">≈{part.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rwa2-token-detail-empty">{tokenInfo.error || text('No token estimate available yet.', 'Chưa có ước lượng token.')}</div>
            )}

            <div className="rwa2-token-detail-note">
              {text(
                'Estimate only — not the provider billing/tokenizer count.',
                'Chỉ là ước lượng — không phải số token tính phí/tokenizer chính xác của nhà cung cấp.',
              )}
            </div>
          </div>

          <div className="rwa2-context-control-grid">
            <div className="rwa2-context-control-block">
              <div className="rwa2-context-detail-label">{text('Sources', 'Nguồn')}</div>
              <div className="rwa2-context-source-grid" role="group" aria-label={text('Persistent context sources', 'Nguồn ngữ cảnh mặc định')}>
                <ToggleSwitch label={text('Character', 'Nhân vật')} checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
                <ToggleSwitch label="Persona" checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
                <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
                <ToggleSwitch label={text('Around', 'Xung quanh')} checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
              </div>
            </div>

            <div className="rwa2-context-control-block rwa2-context-adjust">
              <div className="rwa2-context-detail-label">{text('Adjust', 'Điều chỉnh')}</div>
              <label className="rwa2-context-depth">
                <span>{text('History depth', 'Độ sâu lịch sử')}</span>
                <input
                  type="number"
                  className="rwa2-depth-input"
                  min="0"
                  max="20"
                  value={config.contextDepth !== undefined ? config.contextDepth : 0}
                  aria-label={text('History context depth', 'Độ sâu ngữ cảnh lịch sử')}
                  onChange={(event) => updateConfig({ contextDepth: Math.max(0, parseInt(event.target.value, 10) || 0) })}
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
                  <span>{config.lengthEnabled ? `${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%` : text('Auto', 'Auto')}</span>
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
          </div>
        </div>
      </div>
    </section>
  );
}
