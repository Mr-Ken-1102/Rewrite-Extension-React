import { useEffect, useRef, useState } from 'react';
import { getProfileViewportHeight } from '../../popupGeometry';
import { Button } from '../ui/Button';

export function ProfileGrid({ profiles, colCount, rows, compact, onRun, onTooltip, onTooltipLeave }) {
  const requestedCols = Math.max(1, Number(colCount) || 1);
  const effectiveCols = compact ? Math.min(requestedCols, 6) : Math.min(requestedCols, 4);
  const viewportHeight = getProfileViewportHeight(rows, compact);
  const gridRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const classes = [
    'rwa2-profile-grid',
    `rwa2-cols-${effectiveCols}`,
    compact ? 'rwa2-profile-grid-compact' : '',
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!profiles.length) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => Math.min(current, profiles.length - 1));
  }, [profiles.length]);

  const moveFocus = (event) => {
    if (!gridRef.current) return;
    const target = event.target instanceof Element ? event.target.closest('.rwa2-profile-btn') : null;
    if (!target) return;

    const buttons = Array.from(gridRef.current.querySelectorAll('.rwa2-profile-btn:not(:disabled)'));
    const currentIndex = buttons.indexOf(target);
    if (currentIndex < 0) return;

    const computedColumns = window.getComputedStyle(gridRef.current).gridTemplateColumns
      .split(' ')
      .filter(Boolean).length || 1;
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
    else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === 'ArrowDown') nextIndex = Math.min(buttons.length - 1, currentIndex + computedColumns);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - computedColumns);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else return;

    event.preventDefault();
    if (nextIndex === currentIndex) return;
    const nextButton = buttons[nextIndex];
    if (!(nextButton instanceof HTMLElement)) return;
    setActiveIndex(nextIndex);
    nextButton.focus({ preventScroll: true });
  };

  return (
    <div
      ref={gridRef}
      className={classes}
      role="group"
      aria-label="Rewrite styles. Use arrow keys to move between styles."
      style={{ maxHeight: `${viewportHeight}px` }}
      onKeyDown={moveFocus}
    >
      {profiles.map((profile, index) => (
        <Button
          key={profile.id}
          glow={false}
          className="rwa2-profile-btn"
          tabIndex={index === activeIndex ? 0 : -1}
          aria-label={profile.name}
          aria-description={profile.prompt}
          onMouseEnter={(event) => onTooltip(event, `${profile.name}: ${profile.prompt}`)}
          onMouseLeave={onTooltipLeave}
          onFocus={(event) => {
            setActiveIndex(index);
            onTooltip(event, `${profile.name}: ${profile.prompt}`);
          }}
          onBlur={onTooltipLeave}
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
