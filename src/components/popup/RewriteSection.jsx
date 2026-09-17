import { Button } from '../ui/Button';
import { MultiMessageNotice } from './MultiMessageNotice';
import { ProfileGrid } from './ProfileGrid';

export function RewriteSection({
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
  return (
    <section className="rwa2-rewrite" aria-label="Rewrite commands">
      <div className="rwa2-section-head">
        <div>
          <div className="rwa2-kicker">Rewrite</div>
          <div className="rwa2-section-title">Choose a style</div>
        </div>
        <div className="rwa2-section-meta">
          {profiles.length} {profiles.length === 1 ? 'style' : 'styles'} · scroll or type
        </div>
      </div>

      {autoProfile && (
        <Button
          glow={false}
          className="rwa2-auto-profile"
          aria-label={autoProfile.name}
          aria-description={autoProfile.prompt}
          onMouseEnter={(event) => onTooltip(event, `${autoProfile.name}: ${autoProfile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onFocus={(event) => onTooltip(event, `${autoProfile.name}: ${autoProfile.prompt}`)}
          onBlur={onTooltipLeave}
          onClick={(event) => {
            event.stopPropagation();
            onRun(autoProfile);
          }}
        >
          <span aria-hidden="true">✦</span>
          <span>{autoProfile.name}</span>
        </Button>
      )}

      <MultiMessageNotice selection={selection} mergeMultiMsg={mergeMultiMsg} />

      <ProfileGrid
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
