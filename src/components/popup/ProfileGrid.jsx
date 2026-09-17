import { getProfileViewportHeight } from '../../popupGeometry';
import { Button } from '../ui/Button';

export function ProfileGrid({ profiles, colCount, rows, compact, onRun, onTooltip, onTooltipLeave }) {
  const requestedCols = Math.max(1, Number(colCount) || 1);
  const effectiveCols = compact ? Math.min(requestedCols, 6) : Math.min(requestedCols, 4);
  const viewportHeight = getProfileViewportHeight(rows, compact);
  const classes = [
    'rwa2-profile-grid',
    `rwa2-cols-${effectiveCols}`,
    compact ? 'rwa2-profile-grid-compact' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role="group"
      aria-label="Rewrite styles"
      style={{ maxHeight: `${viewportHeight}px` }}
    >
      {profiles.map((profile) => (
        <Button
          key={profile.id}
          glow={false}
          className="rwa2-profile-btn"
          onMouseEnter={(event) => onTooltip(event, `${profile.name}: ${profile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onClick={(event) => {
            event.stopPropagation();
            onRun(profile);
          }}
        >
          <span className="rwa2-profile-name" style={profile.color ? { color: profile.color } : {}}>
            {compact ? profile.name.slice(0, 2).toUpperCase() : profile.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
