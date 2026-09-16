import { Button } from '../ui/Button';

export function ProfileGrid({ profiles, colCount, rows, compact, onRun, onTooltip, onTooltipLeave }) {
  const requestedCols = Math.max(1, Number(colCount) || 1);
  const effectiveCols = compact ? Math.min(requestedCols, 4) : Math.min(requestedCols, 2);
  const rowHeight = compact ? 38 : 42;

  return (
    <section className="rwa-command-section" aria-label="Rewrite styles">
      <div className="rwa-command-head">
        <div>
          <div className="rwa-command-kicker">Rewrite</div>
          <div className="rwa-command-title">Choose a style</div>
        </div>
        <div className="rwa-command-count">{profiles.length} {profiles.length === 1 ? 'style' : 'styles'}</div>
      </div>

      <div
        className="rwa-grid rwa-profile-grid"
        style={{ gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`, maxHeight: `${Math.max(1, rows || 3) * rowHeight}px` }}
      >
        {profiles.map((profile) => (
          <Button
            key={profile.id}
            className="rwa-pb rwa-profile-btn"
            onMouseEnter={(event) => onTooltip(event, `${profile.name}: ${profile.prompt}`)}
            onMouseLeave={onTooltipLeave}
            onClick={(event) => {
              event.stopPropagation();
              onRun(profile);
            }}
          >
            <span className="rwa-profile-name" style={profile.color ? { color: profile.color } : {}}>
              {compact ? profile.name.slice(0, 2).toUpperCase() : profile.name}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
