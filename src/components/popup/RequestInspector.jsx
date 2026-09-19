import { ToggleSwitch } from '../ui/ToggleSwitch';

const PART_LABELS = Object.freeze({
  selection: ['Selected', 'Vùng chọn'],
  character: ['Character', 'Nhân vật'],
  persona: ['Persona', 'Persona'],
  lore: ['Lore', 'Lore'],
  surrounding: ['Around', 'Xung quanh'],
  history: ['History', 'Lịch sử'],
  memory: ['Memory', 'Bộ nhớ'],
  speaker: ['Speaker cues', 'Vai người nói'],
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

export function RequestInspector({
  open,
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  tokenInfo,
  onClose,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const parts = tokenParts(tokenInfo.parts, vi);
  const total = Math.max(0, Number(tokenInfo.parts?.total) || 0);

  return (
    <section
      id="rwa2-request-inspector"
      className={`rwa2-inspector ${open ? 'rwa2-inspector-open' : ''}`.trim()}
      aria-hidden={!open}
    >
      <div className="rwa2-inspector-clip" inert={open ? undefined : true}>
        <div className="rwa2-inspector-panel">
          <div className="rwa2-inspector-head">
            <div>
              <div className="rwa2-inspector-kicker">{text('Request Inspector', 'Request Inspector')}</div>
              <div className="rwa2-inspector-subtitle">
                {text('What this rewrite will send and use', 'Những gì lần viết lại này sẽ gửi và sử dụng')}
              </div>
            </div>
            <div className="rwa2-inspector-head-actions">
              <span className="rwa2-inspector-total">
                {tokenInfo.loading && !tokenInfo.parts
                  ? text('Calculating…', 'Đang tính…')
                  : total > 0
                    ? `≈${total.toLocaleString()} tok`
                    : '≈— tok'}
              </span>
              <button
                type="button"
                className="rwa2-inspector-close"
                onClick={onClose}
                aria-label={text('Close Request Inspector', 'Đóng Request Inspector')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="rwa2-inspector-token-block">
            <div className="rwa2-inspector-section-label">{text('Input composition', 'Thành phần đầu vào')}</div>
            {parts.length > 0 ? (
              <>
                <div className="rwa2-token-composition" aria-hidden="true">
                  {parts.map((part) => (
                    <span
                      key={part.key}
                      className={`rwa2-token-segment rwa2-token-segment-${part.key}`}
                      style={{ flexGrow: Math.max(1, part.value) }}
                    ></span>
                  ))}
                </div>
                <div className="rwa2-token-grid">
                  {parts.map((part) => (
                    <div className="rwa2-token-cell" key={part.key}>
                      <span className={`rwa2-token-swatch rwa2-token-swatch-${part.key}`} aria-hidden="true"></span>
                      <span className="rwa2-token-cell-label">{part.label}</span>
                      <span className="rwa2-token-cell-value">≈{part.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rwa2-inspector-empty">{tokenInfo.error || text('No token estimate available yet.', 'Chưa có ước lượng token.')}</div>
            )}
            <div className="rwa2-inspector-note">
              {text(
                'Estimate only — not the provider billing/tokenizer count.',
                'Chỉ là ước lượng — không phải số token tính phí/tokenizer chính xác của nhà cung cấp.',
              )}
            </div>
          </div>

          <div className="rwa2-inspector-controls">
            <div className="rwa2-inspector-control-group">
              <div className="rwa2-inspector-section-label">{text('Default context', 'Ngữ cảnh mặc định')}</div>
              <div className="rwa2-inspector-source-grid" role="group" aria-label={text('Persistent context sources', 'Nguồn ngữ cảnh mặc định')}>
                <ToggleSwitch label={text('Character', 'Nhân vật')} checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
                <ToggleSwitch label="Persona" checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
                <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
                <ToggleSwitch label={text('Around', 'Xung quanh')} checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
              </div>
            </div>

            <div className="rwa2-inspector-control-group rwa2-inspector-parameters">
              <div className="rwa2-inspector-section-label">{text('Parameters', 'Tham số')}</div>
              <label className="rwa2-inspector-depth">
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

              <div className="rwa2-inspector-length">
                <div className="rwa2-inspector-length-head">
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
