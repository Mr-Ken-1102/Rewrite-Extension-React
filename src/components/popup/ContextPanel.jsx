import { ToggleSwitch } from '../ui/ToggleSwitch';

export function ContextPanel({
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
  const displayRadarText = String(radarText || '').replace(/^[^A-Za-z0-9]+/, '');
  const tokenBreakdown = tokenInfo.parts
    ? Object.entries(tokenInfo.parts)
      .filter(([key, value]) => key !== 'total' && value > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ')
    : '';
  const tokenTitle = tokenInfo.error
    || [
      'Estimated prompt size; not a provider billing/tokenizer count.',
      tokenBreakdown,
    ].filter(Boolean).join(' ');
  const tokenLabel = tokenInfo.loading
    ? 'Selection + context ≈ calculating…'
    : tokenInfo.parts
      ? `Selection + context ≈ ${tokenInfo.parts.total.toLocaleString()} tok`
      : 'Selection + context ≈ — tok';

  return (
    <section className="rwa2-context-rail" aria-label="Context controls">
      <div className="rwa2-context-region rwa2-context-identity">
        <div className="rwa2-region-head">
          <div className="rwa2-region-label-row">
            <span className="rwa2-region-label">Context</span>
            <button
              type="button"
              className="rwa2-info"
              onMouseEnter={(event) => onTooltip(event, 'Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.')}
              onMouseLeave={onTooltipLeave}
              aria-label="Context mode help"
            >i</button>
          </div>
          <div className="rwa2-target-chip" aria-label={`Rewrite target: ${displayRadarText}`}>
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
        <div className="rwa2-region-label">Sources</div>
        <div className="rwa2-free-mode-row">
          <ToggleSwitch
            label="Free Mode"
            labelStyle={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--rwa2-brand)' }}
            checked={config.freeMode}
            onChange={(value) => { updateConfig({ freeMode: value }); keepFocus(); }}
          />
          <span className="rwa2-free-note">Ignore character, persona and lore injection</span>
        </div>

        <div className="rwa2-source-grid">
          <ToggleSwitch label="Character" checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
          <ToggleSwitch label="Persona" checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
          <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
          <ToggleSwitch label="Around" checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
        </div>

        {contextSources.length > 0 && (
          <div className="rwa2-one-shot">
            <span className="rwa2-one-shot-label">This rewrite:</span>
            <div className="rwa2-one-shot-chips">
              {contextSources.map((source) => {
                const excluded = !!contextExclusions[source.key];
                return (
                  <button
                    key={source.key}
                    type="button"
                    className={`rwa2-chip ${excluded ? 'rwa2-chip-off' : ''}`}
                    aria-pressed={!excluded}
                    title={`${excluded ? 'Excluded from' : 'Included in'} this rewrite only`}
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
        <div className="rwa2-region-label">Adjust</div>

        <div className="rwa2-length-row" style={{ opacity: config.lengthEnabled ? '1' : '0.48' }}>
          <ToggleSwitch
            checked={config.lengthEnabled}
            onChange={(value) => {
              updateConfig({ lengthEnabled: value, lengthPct: value ? config.lengthPct : 0 });
              keepFocus();
            }}
          />
          <span className="rwa2-control-label">Length</span>
          <input
            className="rwa2-range"
            type="range"
            min="-99"
            max="200"
            value={config.lengthPct || 0}
            disabled={!config.lengthEnabled}
            aria-label="Rewrite length adjustment"
            onChange={(event) => updateConfig({ lengthPct: parseInt(event.target.value, 10) })}
            onMouseUp={keepFocus}
            onTouchEnd={keepFocus}
          />
          <span className="rwa2-length-value">{`${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%`}</span>
        </div>

        <label className="rwa2-depth-row">
          <span className="rwa2-control-label">History depth</span>
          <input
            type="number"
            className="rwa2-depth-input"
            min="0"
            max="20"
            value={config.contextDepth !== undefined ? config.contextDepth : 0}
            aria-label="History context depth"
            onChange={(event) => updateConfig({ contextDepth: Math.max(0, parseInt(event.target.value, 10) || 0) })}
          />
        </label>
      </div>
    </section>
  );
}
