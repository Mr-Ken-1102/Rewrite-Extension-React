import { forwardRef } from 'react';

export const PopupTooltip = forwardRef(function PopupTooltip({ tip, language = 'en' }, ref) {
  const vi = language === 'vi';
  const kindClass = tip.kind === 'preset'
    ? 'rwa2-tooltip-preset'
    : (tip.kind === 'token' ? 'rwa2-tooltip-token' : '');

  return (
    <div
      ref={ref}
      className={['rwa2-tooltip', kindClass, tip.show ? 'rwa2-tooltip-show' : ''].filter(Boolean).join(' ')}
      role="tooltip"
      aria-hidden={!tip.show}
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.kind === 'preset' && tip.content && typeof tip.content === 'object' ? (
        <>
          <div className="rwa2-tooltip-preset-head">
            <span className="rwa2-tooltip-preset-name">{tip.content.title}</span>
            <span className="rwa2-tooltip-preset-meta">{vi ? 'PROMPT THIẾT LẬP' : 'PRESET PROMPT'}</span>
          </div>
          <div className="rwa2-tooltip-preset-copy">{tip.content.prompt}</div>
        </>
      ) : tip.kind === 'token' && tip.content && typeof tip.content === 'object' ? (
        <>
          <div className="rwa2-tooltip-token-head">
            <span>{tip.content.title}</span>
            <strong>{tip.content.total}</strong>
          </div>
          {Array.isArray(tip.content.parts) && tip.content.parts.length ? (
            <div className="rwa2-tooltip-token-grid">
              {tip.content.parts.map((part) => (
                <div className="rwa2-tooltip-token-row" key={part.key}>
                  <span>{part.label}</span>
                  <strong>≈{part.value.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          ) : null}
          <div className="rwa2-tooltip-token-note">{tip.content.note}</div>
        </>
      ) : String(tip.content || '')}
    </div>
  );
});
