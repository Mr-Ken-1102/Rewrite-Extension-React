import { ToggleSwitch } from '../ui/ToggleSwitch';

const CONTEXT_MODE_HELP = 'Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.';
const CONTEXT_MODE_HELP_VI = 'Tắt Chế độ tự do: phù hợp với POV nhân vật, hội thoại trực tiếp hoặc nội tâm.\nBật Chế độ tự do: phù hợp với cảnh miêu tả, hành động chung hoặc bối cảnh thời gian/không gian.';

export function ContextPanel({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  radarText,
  radarColor,
  tokenInfo,
  contextSources,
  contextExclusions,
  onToggleContext,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const contextHelp = vi ? CONTEXT_MODE_HELP_VI : CONTEXT_MODE_HELP;
  const displayRadarText = String(radarText || '').replace(/^[^A-Za-z0-9]+/, '');
  const tokenBreakdown = tokenInfo.parts
    ? Object.entries(tokenInfo.parts)
      .filter(([key, value]) => key !== 'total' && value > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ')
    : '';
  const tokenTitle = tokenInfo.error
    || [
      text('Estimated prompt size; not a provider billing/tokenizer count.', 'Ước lượng kích thước prompt; không phải số token tính phí hoặc tokenizer chính xác của provider.'),
      tokenBreakdown,
    ].filter(Boolean).join(' ');
  const tokenLabel = tokenInfo.loading
    ? text('Selection + context ≈ calculating…', 'Vùng chọn + ngữ cảnh ≈ đang tính…')
    : tokenInfo.parts
      ? text(`Selection + context ≈ ${tokenInfo.parts.total.toLocaleString()} tok`, `Vùng chọn + ngữ cảnh ≈ ${tokenInfo.parts.total.toLocaleString()} tok`)
      : text('Selection + context ≈ — tok', 'Vùng chọn + ngữ cảnh ≈ — tok');

  return (
    <section className="rwa2-context-rail" aria-label={text('Context controls', 'Điều khiển ngữ cảnh')}>
      <div className="rwa2-context-region rwa2-context-identity">
        <div className="rwa2-region-head">
          <div className="rwa2-region-label-row">
            <span className="rwa2-region-label">{text('Context', 'Ngữ cảnh')}</span>
            <button
              type="button"
              className="rwa2-info"
              onMouseEnter={(event) => onTooltip(event, contextHelp)}
              onMouseLeave={onTooltipLeave}
              onFocus={(event) => onTooltip(event, contextHelp)}
              onBlur={onTooltipLeave}
              aria-label={text('Context mode help', 'Trợ giúp chế độ ngữ cảnh')}
              aria-description={contextHelp}
            >i</button>
          </div>
          <div className="rwa2-target-chip" aria-label={text(`Rewrite target: ${displayRadarText}`, `Đối tượng viết lại: ${displayRadarText}`)}>
            <span className="rwa2-target-dot" style={{ backgroundColor: radarColor }}></span>
            <span>{displayRadarText}</span>
          </div>
        </div>

        <div className="rwa2-token-status" title={tokenTitle}>
          <span className="rwa2-status-dot" aria-hidden="true"></span>
          <span>{tokenLabel}</span>
        </div>
      </div>

      <div className="rwa2-context-region rwa2-context-sources">
        <div className="rwa2-region-label">{text('Sources', 'Nguồn')}</div>
        <div className="rwa2-free-mode-row">
          <ToggleSwitch
            label={text('Free Mode', 'Chế độ tự do')}
            labelStyle={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--rwa2-brand)' }}
            checked={config.freeMode}
            onChange={(value) => { updateConfig({ freeMode: value }); keepFocus(); }}
          />
          <span className="rwa2-free-note">{text('Ignore character, persona and lore injection', 'Bỏ qua chèn character, persona và lore')}</span>
        </div>

        <div className="rwa2-source-grid" role="group" aria-label={text('Persistent context sources', 'Nguồn ngữ cảnh cố định')}>
          <ToggleSwitch label={text('Character', 'Nhân vật')} checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
          <ToggleSwitch label="Persona" checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
          <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
          <ToggleSwitch label={text('Around', 'Xung quanh')} checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
        </div>

        {contextSources.length > 0 && (
          <div className="rwa2-one-shot">
            <span className="rwa2-one-shot-label">{text('This rewrite:', 'Lần viết lại này:')}</span>
            <div className="rwa2-one-shot-chips" role="group" aria-label={text('Sources for this rewrite only', 'Nguồn chỉ dùng cho lần viết lại này')}>
              {contextSources.map((source) => {
                const excluded = !!contextExclusions[source.key];
                return (
                  <button
                    key={source.key}
                    type="button"
                    className={`rwa2-chip ${excluded ? 'rwa2-chip-off' : ''}`}
                    aria-pressed={!excluded}
                    title={text(
                      `${excluded ? 'Excluded from' : 'Included in'} this rewrite only`,
                      `${excluded ? 'Đã loại khỏi' : 'Đã đưa vào'} lần viết lại này`,
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
      </div>

      <div className="rwa2-context-region rwa2-context-modifiers">
        <div className="rwa2-region-label">{text('Adjust', 'Điều chỉnh')}</div>

        <div className="rwa2-length-row" style={{ opacity: config.lengthEnabled ? '1' : '0.48' }}>
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
          <span className="rwa2-length-value">{`${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%`}</span>
        </div>

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
      </div>
    </section>
  );
}
