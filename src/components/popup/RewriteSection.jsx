import { Button } from '../ui/Button';
import { MultiMessageNotice } from './MultiMessageNotice';
import { ProfileGrid } from './ProfileGrid';

export function RewriteSection({
  language = 'en',
  profiles,
  colCount,
  rows,
  compact,
  autoProfile,
  selection,
  mergeMultiMsg,
  onRun,
  onTooltip,
  onTooltipLeave,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const autoIdentityLabel = autoProfile
    ? `${autoProfile.identityKind === 'persona' ? 'Persona' : 'Char'}: ${autoProfile.identityName || autoProfile.name}`
    : '';

  return (
    <section className="rwa2-rewrite" aria-label={text('Rewrite commands', 'Lệnh viết lại')}>
      <div className="rwa2-section-head">
        <div>
          <div className="rwa2-kicker">Rewrite</div>
          <div className="rwa2-section-title">{text('Choose a style', 'Chọn kiểu viết')}</div>
        </div>
        <div className="rwa2-section-meta">
          {vi
            ? `${profiles.length} kiểu · cuộn hoặc gõ để tìm`
            : `${profiles.length} ${profiles.length === 1 ? 'style' : 'styles'} · scroll or type`}
        </div>
      </div>

      {autoProfile && (
        <Button
          glow={false}
          className="rwa2-auto-profile"
          aria-label={autoIdentityLabel}
          aria-description={autoProfile.prompt}
          onMouseEnter={(event) => onTooltip(event, `${autoIdentityLabel} · ${autoProfile.name}: ${autoProfile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onFocus={(event) => onTooltip(event, `${autoIdentityLabel} · ${autoProfile.name}: ${autoProfile.prompt}`)}
          onBlur={onTooltipLeave}
          onClick={(event) => {
            event.stopPropagation();
            onRun(autoProfile);
          }}
        >
          <span aria-hidden="true">✦</span>
          <span>{autoIdentityLabel}</span>
        </Button>
      )}

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
