import { Button } from '../ui/Button';

export function ProfileGrid({ profiles, colCount, rows, compact, onRun, onTooltip, onTooltipLeave }) {
  return (
    <div
      className="rwa-grid rwa-profile-grid"
      style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, maxHeight: `${Math.max(1, rows || 3) * 42}px` }}
    >
      {profiles.map((profile) => (
        <Button
          key={profile.id}
          className="rwa-pb rwa-glow-button rwa-profile-btn"
          style={profile.color ? { color: profile.color } : {}}
          onMouseEnter={(event) => onTooltip(event, `${profile.name}: ${profile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onClick={(event) => {
            event.stopPropagation();
            onRun(profile);
          }}
        >
          <span className="rwa-profile-name">{compact ? profile.name.slice(0, 2).toUpperCase() : profile.name}</span>
        </Button>
      ))}
    </div>
  );
}
