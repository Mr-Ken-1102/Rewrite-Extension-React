function SourceIcon({ type }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (type === 'character') return <svg {...common}><circle cx="12" cy="7" r="3.2" /><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" /></svg>;
  if (type === 'persona') return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.6" /><path d="M5.8 15c.4-2 1.2-3 2.2-3s1.8 1 2.2 3M13 8h5M13 12h5M13 16h4" /></svg>;
  if (type === 'lore') return <svg {...common}><path d="M4 5.5c3-1 5.6-.6 8 1.2v12c-2.4-1.8-5-2.2-8-1.2zM20 5.5c-3-1-5.6-.6-8 1.2v12c2.4-1.8 5-2.2 8-1.2z" /></svg>;
  if (type === 'surrounding') return <svg {...common}><circle cx="12" cy="12" r="6.2" /><circle cx="12" cy="12" r="2.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /></svg>;
  if (type === 'history') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3.3 2M4 5v4h4" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="7" /></svg>;
}

function StackIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>;
}

function LengthIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7h14M5 12h10M5 17h7" /></svg>;
}

function StepIcon({ direction }) {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === 'up' ? <path d="m3 7.5 3-3 3 3" /> : <path d="m3 4.5 3 3 3-3" />}
    </svg>
  );
}

function clampDepth(value) {
  return Math.min(20, Math.max(1, Number(value) || 1));
}

export function ContextDeck({
  language = 'en',
  config,
  updateConfig,
  keepFocus,
  contextSources,
  onToggleContext,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const depth = clampDepth(config.contextDepth);

  const setDepth = (value) => {
    updateConfig({ contextDepth: clampDepth(value) });
    keepFocus();
  };

  return (
    <section className="rwa2-context-deck" aria-label={text('Context and rewrite controls', 'Ngữ cảnh và điều khiển viết lại')}>
      <div className="rwa2-context-chips" role="group" aria-label={text('Default rewrite sources', 'Nguồn viết lại mặc định')}>
        {contextSources.map((source) => (
          <button
            key={source.key}
            type="button"
            className={['rwa2-context-chip', source.enabled ? 'rwa2-context-chip-on' : 'rwa2-context-chip-off'].join(' ')}
            aria-pressed={source.enabled}
            disabled={source.disabled}
            title={source.disabled
              ? text('This source is unavailable while Free Mode is on.', 'Nguồn này không khả dụng khi Chế độ tự do đang bật.')
              : (source.detail || source.label)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleContext(source.key, !source.enabled);
            }}
          >
            <span className="rwa2-context-chip-icon"><SourceIcon type={source.key} /></span>
            <span className="rwa2-context-chip-label">{source.label}</span>
          </button>
        ))}
      </div>

      <div className="rwa2-context-adjust-row">
        <div
          className="rwa2-context-depth"
          role="group"
          aria-label={text('History context depth', 'Độ sâu ngữ cảnh lịch sử')}
          title={text('History depth', 'Độ sâu lịch sử')}
        >
          <span className="rwa2-adjust-icon"><StackIcon /></span>
          <span className="rwa2-adjust-label">{text('Depth', 'Độ sâu')}</span>
          <div className="rwa2-depth-stepper" aria-label={text('History depth value', 'Giá trị độ sâu lịch sử')}>
            <span className="rwa2-depth-value" aria-live="polite">{depth}</span>
            <span className="rwa2-depth-step-buttons">
              <button
                type="button"
                className="rwa2-depth-step"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDepth(depth + 1);
                }}
                disabled={depth >= 20}
                aria-label={text('Increase history depth', 'Tăng độ sâu lịch sử')}
              >
                <StepIcon direction="up" />
              </button>
              <button
                type="button"
                className="rwa2-depth-step"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDepth(depth - 1);
                }}
                disabled={depth <= 1}
                aria-label={text('Decrease history depth', 'Giảm độ sâu lịch sử')}
              >
                <StepIcon direction="down" />
              </button>
            </span>
          </div>
        </div>

        <div className={'rwa2-context-length ' + (!config.lengthEnabled ? 'rwa2-context-length-auto' : '')}>
          <div className="rwa2-length-label">
            <span className="rwa2-adjust-icon"><LengthIcon /></span>
            <span>{text('Length', 'Độ dài')}</span>
          </div>
          <input
            className="rwa2-range"
            type="range"
            min="-99"
            max="200"
            value={config.lengthEnabled ? (config.lengthPct || 0) : 0}
            disabled={!config.lengthEnabled}
            aria-disabled={!config.lengthEnabled}
            aria-label={text('Rewrite length adjustment', 'Điều chỉnh độ dài viết lại')}
            onChange={(event) => updateConfig({ lengthEnabled: true, lengthPct: parseInt(event.target.value, 10) })}
            onMouseUp={keepFocus}
            onTouchEnd={keepFocus}
          />
          <button
            type="button"
            className={'rwa2-length-auto ' + (config.lengthEnabled ? '' : 'rwa2-length-auto-active')}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              updateConfig(config.lengthEnabled
                ? { lengthEnabled: false, lengthPct: 0 }
                : { lengthEnabled: true, lengthPct: 0 });
              keepFocus();
            }}
            aria-pressed={!config.lengthEnabled}
            title={config.lengthEnabled
              ? text('Use automatic length', 'Dùng độ dài tự động')
              : text('Switch to manual length adjustment', 'Chuyển sang điều chỉnh độ dài thủ công')}
          >
            {config.lengthEnabled ? ((config.lengthPct >= 0 ? '+' : '') + config.lengthPct + '%') : text('Auto', 'Auto')}
          </button>
        </div>
      </div>
    </section>
  );
}
