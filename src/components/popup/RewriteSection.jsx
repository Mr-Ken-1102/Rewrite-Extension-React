import { MultiMessageNotice } from './MultiMessageNotice';
import { PerformanceStrip } from './PerformanceStrip';
import { ProfileGrid } from './ProfileGrid';

export function RewriteSection({
  language = 'en',
  profiles,
  colCount,
  rows,
  compact,
  config,
  updateConfig,
  keepFocus,
  selection,
  mergeMultiMsg,
  onRun,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);

  return (
    <section className="rwa2-rewrite" aria-label={text('Choose a rewrite style', 'Chọn kiểu viết lại')}>
      <div className="rwa2-section-head">
        <div>
          <div className="rwa2-kicker">{text('Rewrite', 'Viết lại')}</div>
          <div className="rwa2-section-title">{text('Choose a style', 'Chọn kiểu viết')}</div>
        </div>
        <div className="rwa2-section-meta">
          {vi
            ? `${profiles.length} kiểu · cuộn hoặc gõ để tìm`
            : `${profiles.length} ${profiles.length === 1 ? 'style' : 'styles'} · scroll or type`}
        </div>
      </div>

      <PerformanceStrip
        language={language}
        config={config}
        updateConfig={updateConfig}
        keepFocus={keepFocus}
        onTooltip={onTooltip}
        onTooltipLeave={onTooltipLeave}
      />

      <MultiMessageNotice language={language} selection={selection} mergeMultiMsg={mergeMultiMsg} />

      <ProfileGrid
        language={language}
        profiles={profiles}
        colCount={colCount}
        rows={rows}
        compact={compact}
        onRun={onRun}
        onTooltip={onTooltip}
        onTooltipLeave={onTooltipLeave}
      />
    </section>
  );
}
