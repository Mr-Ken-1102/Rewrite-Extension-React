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
    <section className="rwa-command-section rwa-rewrite-section" aria-label="Rewrite commands">
      <div className="rwa-command-head">
        <div>
          <div className="rwa-command-kicker">Rewrite</div>
          <div className="rwa-command-title">Choose a style</div>
        </div>
        <div className="rwa-command-count">{profiles.length} {profiles.length === 1 ? 'style' : 'styles'}</div>
      </div>

      {autoProfile && (
        <Button
          className="rwa-auto-profile"
          onMouseEnter={(event) => onTooltip(event, `${autoProfile.name}: ${autoProfile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onClick={(event) => {
            event.stopPropagation();
            onRun(autoProfile);
          }}
        >
          ✨ {autoProfile.name}
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
