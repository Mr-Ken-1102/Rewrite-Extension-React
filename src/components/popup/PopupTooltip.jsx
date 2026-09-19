import { forwardRef } from 'react';

export const PopupTooltip = forwardRef(function PopupTooltip({ tip, language = 'en' }, ref) {
  const vi = language === 'vi';
  return (
    <div
      ref={ref}
      className={`rwa2-tooltip ${tip.kind === 'preset' ? 'rwa2-tooltip-preset' : ''} ${tip.show ? 'rwa2-tooltip-show' : ''}`.trim()}
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
      ) : String(tip.content || '')}
    </div>
  );
});
