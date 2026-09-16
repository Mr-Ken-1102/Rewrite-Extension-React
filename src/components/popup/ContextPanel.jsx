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
  return (
    <div className="rwa-bottom-controls">
      <div className="rwa-radar-container rwa-radar-compact">
        <div className="rwa-radar-header">
          <div className="rwa-radar-title">
            🧠 CONTEXT ENGINE
            <span
              className="rwa-info-icon"
              onMouseEnter={(event) => onTooltip(event, 'Free Mode Off: Best for character POV, direct dialogue, or inner thoughts.\nFree Mode On: Best for descriptive scenes, general actions or setting time/space.')}
              onMouseLeave={onTooltipLeave}
            >ℹ️</span>
          </div>
          <div className="rwa-radar-target">
            Target: <span style={{ color: radarColor }}>{radarText}</span>
          </div>
        </div>

        <div className="rwa-token-panel" title={tokenInfo.error || 'Estimated Selection + context prompt cost; not a provider billing/tokenizer count'}>
          <span className="rwa-token-total">
            {tokenInfo.loading ? 'Selection + context ≈ … tok' : tokenInfo.parts ? `Selection + context ≈ ${tokenInfo.parts.total.toLocaleString()} tok` : 'Selection + context ≈ — tok'}
          </span>
          {tokenInfo.parts && Object.entries(tokenInfo.parts)
            .filter(([key, value]) => key !== 'total' && value > 0)
            .map(([key, value]) => <span key={key} className="rwa-token-part">{key}: {value}</span>)}
        </div>

        <div className="rwa-panel-box rwa-panel-compact">
          <div className="rwa-context-primary">
            <ToggleSwitch
              label="Free Mode"
              labelStyle={{ fontSize: '11px', fontWeight: '800', color: 'var(--rwa-primary)' }}
              checked={config.freeMode}
              onChange={(value) => { updateConfig({ freeMode: value }); keepFocus(); }}
            />
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
              {contextSources.map((source) => {
                const excluded = !!contextExclusions[source.key];
                return (
                  <button
                    key={source.key}
                    type="button"
                    className={`rwa-context-chip ${excluded ? 'rwa-context-chip-off' : ''}`}
                    aria-pressed={!excluded}
                    title={`${excluded ? 'Excluded from' : 'Included in'} this rewrite only`}
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggleContext(source.key); }}
                  >
                    {source.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rwa-merged-row">
            <div className="rwa-length-side" style={{ opacity: config.lengthEnabled ? '1' : '0.45' }}>
              <ToggleSwitch
                checked={config.lengthEnabled}
                onChange={(value) => {
                  updateConfig({ lengthEnabled: value, lengthPct: value ? config.lengthPct : 0 });
                  keepFocus();
                }}
              />
              <span className="rwa-len-lbl">LEN</span>
              <input
                className="rwa-range rwa-len-range"
                type="range"
                min="-99"
                max="200"
                value={config.lengthPct || 0}
                disabled={!config.lengthEnabled}
                onChange={(event) => updateConfig({ lengthPct: parseInt(event.target.value, 10) })}
                onMouseUp={keepFocus}
                onTouchEnd={keepFocus}
              />
              <span className="rwa-len-val">{`${config.lengthPct >= 0 ? '+' : ''}${config.lengthPct}%`}</span>
            </div>

            <div className="rwa-depth-side">
              <span className="rwa-depth-lbl">Depth:</span>
              <input
                type="number"
                className="rwa-inp rwa-depth-inp-mini"
                min="0"
                max="20"
                value={config.contextDepth !== undefined ? config.contextDepth : 0}
                onChange={(event) => updateConfig({ contextDepth: Math.max(0, parseInt(event.target.value, 10) || 0) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
