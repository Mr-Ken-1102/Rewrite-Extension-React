import { Button } from '../ui/Button';

export function ProfileGrid({ profiles, colCount, rows, compact, onRun, onTooltip, onTooltipLeave }) {
  const requestedCols = Math.max(1, Number(colCount) || 1);
  const effectiveCols = compact ? Math.min(requestedCols, 6) : Math.min(requestedCols, 4);
  const rowHeight = compact ? 30 : 34;

  return (
    <div
      className="rwa-grid rwa-profile-grid"
      role="group"
      aria-label="Rewrite styles"
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
  );
}
