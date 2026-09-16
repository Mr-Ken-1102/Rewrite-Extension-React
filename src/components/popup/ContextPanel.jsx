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
    <section className="rwa-bottom-controls rwa-context-section rwa-context-rail" aria-label="Context controls">
      <div className="rwa-context-region rwa-context-identity">
        <div className="rwa-context-section-head">
          <div className="rwa-context-heading">
            <div className="rwa-context-kicker-row">
              <span className="rwa-radar-kicker">Context</span>
              <button
                type="button"
                className="rwa-info-icon"
                onMouseEnter={(event) => onTooltip(event, 'Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.')}
                onMouseLeave={onTooltipLeave}
                aria-label="Context mode help"
              >i</button>
            </div>
            <div className="rwa-context-subtitle">Control what the model sees for this rewrite.</div>
          </div>

          <div className="rwa-radar-target" aria-label={`Rewrite target: ${radarText}`}>
            <span className="rwa-target-dot" style={{ backgroundColor: radarColor }}></span>
            <span style={{ color: radarColor }}>{radarText}</span>
          </div>
        </div>

        <div className="rwa-token-panel" title={tokenTitle}>
          <span className="rwa-token-dot" aria-hidden="true"></span>
          <span className="rwa-token-total">{tokenLabel}</span>
        </div>
      </div>

      <div className="rwa-context-region rwa-context-sources">
        <div className="rwa-panel-box rwa-panel-compact">
          <div className="rwa-context-primary">
            <ToggleSwitch
              label="Free Mode"
              labelStyle={{ fontSize: '11.5px', fontWeight: '750', color: 'var(--rwa-brand)' }}
              checked={config.freeMode}
              onChange={(value) => { updateConfig({ freeMode: value }); keepFocus(); }}
            />
            <span className="rwa-context-primary-note">Ignore character/persona/lore injection</span>
          </div>

          <div className="rwa-context-switch-grid">
            <ToggleSwitch label="Character" checked={config.injectChar} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectChar: value }); keepFocus(); }} />
            <ToggleSwitch label="Persona" checked={config.injectUser} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectUser: value }); keepFocus(); }} />
            <ToggleSwitch label="Lore" checked={config.injectLorebook} disabled={config.freeMode} onChange={(value) => { updateConfig({ injectLorebook: value }); keepFocus(); }} />
            <ToggleSwitch label="Around" checked={config.localContextEnabled} onChange={(value) => { updateConfig({ localContextEnabled: value }); keepFocus(); }} />
          </div>

          {contextSources.length > 0 && (
            <div className="rwa-one-shot-context">
              <span className="rwa-one-shot-label">This rewrite:</span>
              <div className="rwa-one-shot-chips">
                {contextSources.map((source) => {
                  const excluded = !!contextExclusions[source.key];
                  return (
                    <button
                      key={source.key}
                      type="button"
                      className={`rwa-context-chip ${excluded ? 'rwa-context-chip-off' : ''}`}
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
      </div>

      <div className="rwa-context-region rwa-context-modifiers">
        <div className="rwa-merged-row">
          <div className="rwa-length-side" style={{ opacity: config.lengthEnabled ? '1' : '0.45' }}>
            <ToggleSwitch
              checked={config.lengthEnabled}
              onChange={(value) => {
                updateConfig({ lengthEnabled: value, lengthPct: value ? config.lengthPct : 0 });
                keepFocus();
              }}
            />
            <span className="rwa-len-lbl">Length</span>
            <input
              className="rwa-range rwa-len-range"
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
            <span className="rwa-len-val">{`${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%`}</span>
          </div>

          <div className="rwa-depth-side">
            <span className="rwa-depth-lbl">Depth</span>
            <input
              type="number"
              className="rwa-inp rwa-depth-inp-mini"
              min="0"
              max="20"
              value={config.contextDepth !== undefined ? config.contextDepth : 0}
              aria-label="History context depth"
              onChange={(event) => updateConfig({ contextDepth: Math.max(0, parseInt(event.target.value, 10) || 0) })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
