import { MultiMessageNotice } from './MultiMessageNotice';
import { PerformanceStrip } from './PerformanceStrip';
import { ProfileGrid } from './ProfileGrid';

export function RewriteSection({
  language = 'en',
  profiles,
  identityProfile = null,
  voiceIdentity = null,
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
    <section className="rwa2-rewrite" aria-label={text('Rewrite styles', 'Kiểu viết lại')}>
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
        featuredProfile={identityProfile}
        featuredLabel={identityProfile
          ? `✦ ${String(voiceIdentity?.name || identityProfile.identityName || identityProfile.name || '').trim() || identityProfile.name}`
          : ''}
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
