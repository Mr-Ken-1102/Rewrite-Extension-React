import { ToggleSwitch } from '../ui/ToggleSwitch';

const TOKEN_LABELS = Object.freeze({
  selection: ['Selected', 'Vùng chọn'],
  surrounding: ['Around', 'Xung quanh'],
  persona: ['Persona', 'Persona'],
  character: ['Character', 'Nhân vật'],
  lore: ['Lore', 'Lore'],
  history: ['History', 'Lịch sử'],
  memory: ['Memory', 'Bộ nhớ'],
  speaker: ['Speaker cues', 'Vai người nói'],
});

function getTokenRows(parts, vi) {
  if (!parts) return [];
  return Object.entries(TOKEN_LABELS)
    .map(([key, labels]) => ({
      key,
      label: vi ? labels[1] : labels[0],
      value: Math.max(0, Number(parts[key]) || 0),
    }))
    .filter((row) => row.value > 0);
}

export function ContextPanel({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  tokenInfo,
  contextSources,
  contextExclusions,
  onToggleContext,
  open,
  onToggleOpen,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const tokenRows = getTokenRows(tokenInfo.parts, vi);
  const total = Math.max(0, Number(tokenInfo.parts?.total) || 0);
  const tokenSummary = tokenInfo.loading && !tokenInfo.parts
    ? text('calculating…', 'đang tính…')
    : total > 0
      ? `≈${total.toLocaleString()} tok`
      : '≈— tok';

  return (
    <section className="rwa2-context-shell" aria-label={text('Context controls', 'Điều khiển ngữ cảnh')}>
      <button
        type="button"
        className="rwa2-context-summary"
        aria-expanded={open}
        aria-controls="rwa2-context-details"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleOpen();
        }}
      >
        <span className="rwa2-context-summary-label">{text('Context', 'Ngữ cảnh')}</span>
        <span className="rwa2-context-summary-meta">
          <span>{tokenSummary}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {contextSources.length > 0 && (
        <div className="rwa2-context-applied">
          <span className="rwa2-one-shot-label">{text('This rewrite:', 'Lần này:')}</span>
          <div className="rwa2-one-shot-chips" role="group" aria-label={text('Sources for this rewrite only', 'Nguồn dùng riêng cho lần này')}>
            {contextSources.map((source) => {
              const excluded = !!contextExclusions[source.key];
              return (
                <button
                  key={source.key}
                  type="button"
                  className={`rwa2-chip ${excluded ? 'rwa2-chip-off' : ''}`.trim()}
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
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        id="rwa2-context-details"
        className={`rwa2-context-details ${open ? 'rwa2-context-details-open' : ''}`.trim()}
        aria-hidden={!open}
      >
        <div className="rwa2-context-details-clip" inert={open ? undefined : true}>
          <div className="rwa2-context-details-inner">
            <div className="rwa2-token-details">
              <div className="rwa2-detail-head">
                <span className="rwa2-region-label">{text('Token details', 'Chi tiết token')}</span>
                <span className="rwa2-token-total">{tokenSummary}</span>
              </div>

              {tokenRows.length > 0 ? (
                <div className="rwa2-token-detail-grid">
                  {tokenRows.map((row) => (
                    <div className="rwa2-token-detail-item" key={row.key}>
                      <span>{row.label}</span>
                      <strong>≈{row.value.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rwa2-token-detail-empty">
                  {tokenInfo.error || text('No token estimate available yet.', 'Chưa có ước lượng token.')}
                </div>
              )}

              <div className="rwa2-token-detail-note">
                {text(
                  'Estimate only — not the provider billing/tokenizer count.',
                  'Chỉ là ước lượng — không phải số token tính phí/tokenizer chính xác của nhà cung cấp.',
                )}
              </div>
            </div>

            <div className="rwa2-context-detail-grid">
              <div className="rwa2-context-region rwa2-context-sources">
                <div className="rwa2-region-label">{text('Sources', 'Nguồn')}</div>
                <div className="rwa2-source-grid" role="group" aria-label={text('Persistent context sources', 'Nguồn ngữ cảnh mặc định')}>
                  <ToggleSwitch label={text('Character', 'Nhân vật')} checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
                  <ToggleSwitch label="Persona" checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
                  <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
                  <ToggleSwitch label={text('Around', 'Xung quanh')} checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
                </div>
              </div>

              <div className="rwa2-context-region rwa2-context-modifiers">
                <div className="rwa2-region-label">{text('Adjust', 'Điều chỉnh')}</div>

                <label className="rwa2-depth-row">
                  <span className="rwa2-control-label">{text('History depth', 'Độ sâu lịch sử')}</span>
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

                <div className="rwa2-length-row" style={{ opacity: config.lengthEnabled ? '1' : '0.50' }}>
                  <ToggleSwitch
                    ariaLabel={text('Enable rewrite length adjustment', 'Bật điều chỉnh độ dài viết lại')}
                    checked={config.lengthEnabled}
                    onChange={(value) => {
                      updateConfig({ lengthEnabled: value, lengthPct: value ? config.lengthPct : 0 });
                      keepFocus();
                    }}
                  />
                  <span className="rwa2-control-label">{text('Length', 'Độ dài')}</span>
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
                  <span className="rwa2-length-value">
                    {config.lengthEnabled ? `${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%` : text('Auto', 'Auto')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
