import { ToggleSwitch } from '../ui/ToggleSwitch';
import { getProviderCapabilities } from '../../services/providers/providerCapabilities.js';

const CONTEXT_MODE_HELP = 'Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.';
const CONTEXT_MODE_HELP_VI = 'Tắt Tự do: phù hợp khi viết theo POV nhân vật, hội thoại trực tiếp hoặc nội tâm.\nBật Tự do: phù hợp với miêu tả cảnh, hành động chung hoặc bối cảnh thời gian/không gian.';
function fastRewriteHelp(mode, vi) {
  if (mode === 'marinara') {
    return vi
      ? 'Viết lại nhanh giúp tăng tốc xử lý và trả kết quả sớm hơn. Nếu bạn ưu tiên chất lượng hơn tốc độ, hãy tắt tùy chọn này. Hiện chỉ hỗ trợ kết nối Marinara.'
      : 'Fast Rewrite speeds up rewriting and returns results sooner. Turn it off if you prefer maximum quality over speed. Currently supported only with Marinara connections.';
  }
  return vi
    ? 'Viết lại nhanh hiện chỉ hỗ trợ kết nối Marinara. Chuyển sang Marinara để sử dụng tính năng này.'
    : 'Fast Rewrite is currently supported only with Marinara connections. Switch to Marinara to use this feature.';
}



export function ContextPanel({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  radarText,
  radarColor,
  tokenInfo,
  voiceIdentity = null,
  contextSources,
  contextExclusions,
  onToggleContext,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const contextHelp = vi ? CONTEXT_MODE_HELP_VI : CONTEXT_MODE_HELP;
  const capabilities = getProviderCapabilities(config.connMode);
  const fastRewriteHelpText = fastRewriteHelp(config.connMode, vi);
  const characterNames = tokenInfo.identities?.characterNames || [];
  const personaNames = tokenInfo.identities?.personaNames || [];
  const targetCharacterName = voiceIdentity?.kind === 'character' ? String(voiceIdentity.name || '').trim() : '';
  const targetPersonaName = voiceIdentity?.kind === 'persona' ? String(voiceIdentity.name || '').trim() : '';
  const characterLabel = targetCharacterName
    ? `Char: ${targetCharacterName}`
    : (characterNames.length ? `Char: ${characterNames.join(' · ')}` : text('Character', 'Nhân vật'));
  const personaLabel = targetPersonaName
    ? `Persona: ${targetPersonaName}`
    : (personaNames.length ? `Persona: ${personaNames.join(' · ')}` : 'Persona');
  const displayRadarText = String(radarText || '').replace(/^[^A-Za-z0-9]+/, '');
  const tokenBreakdown = tokenInfo.parts
    ? Object.entries(tokenInfo.parts)
      .filter(([key, value]) => key !== 'total' && value > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ')
    : '';
  const tokenTitle = tokenInfo.error
    || [
      text('Estimated prompt size; not a provider billing/tokenizer count.', 'Ước lượng kích thước yêu cầu; không phải số token tính phí hay kết quả tokenizer chính xác của nhà cung cấp AI.'),
      tokenBreakdown,
    ].filter(Boolean).join(' ');
  const tokenLabel = tokenInfo.loading && !tokenInfo.parts
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
        <div className="rwa2-source-mode-grid">
          <div className="rwa2-source-mode-item">
            <ToggleSwitch
              label={text('Free Mode', 'Chế độ tự do')}
              labelStyle={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--rwa2-brand)' }}
              checked={config.freeMode}
              onChange={(value) => { updateConfig({ freeMode: value }); keepFocus(); }}
            />
            <button
              type="button"
              className="rwa2-info rwa2-mode-info"
              onMouseEnter={(event) => onTooltip(event, contextHelp)}
              onMouseLeave={onTooltipLeave}
              onFocus={(event) => onTooltip(event, contextHelp)}
              onBlur={onTooltipLeave}
              aria-label={text('Free Mode help', 'Trợ giúp Chế độ tự do')}
              aria-description={contextHelp}
            >i</button>
          </div>
          <div className="rwa2-source-mode-item">
            <ToggleSwitch
              label={text('Fast Rewrite', 'Viết lại nhanh')}
              labelStyle={{ fontSize: '11.5px', fontWeight: '700', color: capabilities.fastRewrite ? 'var(--rwa2-brand)' : 'var(--rwa2-muted)' }}
              checked={config.fastRewrite !== false}
              disabled={!capabilities.fastRewrite}
              onChange={(value) => { updateConfig({ fastRewrite: value }); keepFocus(); }}
            />
            <button
              type="button"
              className="rwa2-info rwa2-mode-info"
              onMouseEnter={(event) => onTooltip(event, fastRewriteHelpText)}
              onMouseLeave={onTooltipLeave}
              onFocus={(event) => onTooltip(event, fastRewriteHelpText)}
              onBlur={onTooltipLeave}
              aria-label={text('Fast Rewrite help', 'Trợ giúp Viết lại nhanh')}
              aria-description={fastRewriteHelpText}
            >i</button>
          </div>

        </div>

        <div className="rwa2-source-grid" role="group" aria-label={text('Persistent context sources', 'Nguồn ngữ cảnh')}>
          <ToggleSwitch label={characterLabel} checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
          <ToggleSwitch label={personaLabel} checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
          <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
          <ToggleSwitch label={text('Around', 'Ngữ cảnh gần')} checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
        </div>

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

      {contextSources.length > 0 && (
        <div className="rwa2-context-region rwa2-context-applied">
          <span className="rwa2-one-shot-label">{text('This rewrite:', 'Lần này:')}</span>
          <div className="rwa2-one-shot-chips" role="group" aria-label={text('Sources for this rewrite only', 'Nguồn dùng riêng cho lần này')}>
            {contextSources.map((source) => {
              const excluded = !!contextExclusions[source.key];
              return (
                <button
                  key={source.key}
                  type="button"
                  className={`rwa2-chip ${excluded ? 'rwa2-chip-off' : ''}`}
                  aria-pressed={!excluded}
                  title={text(
                    `${source.label} — ${excluded ? 'Excluded from' : 'Included in'} this rewrite only`,
                    `${source.label} — ${excluded ? 'Đã loại khỏi' : 'Đã đưa vào'} lần viết lại này`,
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
    </section>
  );
}
