import { useEffect, useRef, useState } from 'react';
import { getProfileViewportHeight } from '../../popupGeometry';
import { Button } from '../ui/Button';

const TYPEAHEAD_RESET_MS = 650;
const PROFILE_LABELS_VI = Object.freeze({
  expand: 'Làm giàu',
  compress: 'Cô đọng',
  thoughts: 'Nội tâm',
  dialogue: 'Thoại',
  active: 'Chủ động',
  diffwords: 'Diễn đạt',
  showdont: 'Thể hiện',
  emotion: 'Cảm xúc',
  transitions: 'Mượt ý',
  noai: 'Tự nhiên',
  expdialogue: 'Hội thoại+',
  romance: 'Lãng mạn',
  grammar: 'Trau chuốt',
});

const PROFILE_LABELS_EN = Object.freeze({
  thoughts: 'Inner',
  dialogue: 'Dialogue',
  active: 'Active',
  diffwords: 'Reword',
  emotion: 'Emotion',
  transitions: 'Flow',
  noai: 'Natural',
  expdialogue: 'Dialogue+',
  romance: 'Romantic',
});

function profileDisplayName(profile, language) {
  if (language === 'vi') return PROFILE_LABELS_VI[profile.id] || profile.name;
  return PROFILE_LABELS_EN[profile.id] || profile.name;
}

function PresetIcon({ id }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (id === 'expand') return <svg {...common}><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h5M9 12h7M9 16h7" /></svg>;
  if (id === 'compress') return <svg {...common}><path d="M5 7h14M5 12h11M5 17h8" /></svg>;
  if (id === 'thoughts') return <svg {...common}><path d="M8.4 20v-3.1c-2.1-1.2-3.4-3.5-3.4-6C5 6.5 8.1 3 12 3s7 3.5 7 7.9c0 1.2-.2 2.3-.7 3.3l1.7 2.2h-3.7V20" /><path d="M11 8.5h2M10 12h4" /></svg>;
  if (id === 'dialogue') return <svg {...common}><path d="M4 5.5h16v10H9l-5 4z" /></svg>;
  if (id === 'active') return <svg {...common}><path d="m13.5 2-8 12h7l-2 8 8-12h-7z" /></svg>;
  if (id === 'diffwords') return <svg {...common}><path d="M4 18c7-1 12-5 15-13 1 7-1 13-7 15-3 1-6 .2-8-2Z" /><path d="M6 17c3-3 6-5 10-7" /></svg>;
  if (id === 'showdont') return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
  if (id === 'emotion' || id === 'romance') return <svg {...common}><path d="M12 20.2 4.2 12.6C-.1 8.4 6 2.4 10.2 6.5L12 8.3l1.8-1.8c4.2-4.1 10.3 1.9 6 6.1z" /></svg>;
  if (id === 'transitions') return <svg {...common}><path d="M3 7c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0S20.5 5 22 6.3M3 12c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.3-2 5.8-.7M3 17c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.3-2 5.8-.7" /></svg>;
  if (id === 'noai') return <svg {...common}><path d="M12 21V9M12 14c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7ZM12 11c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z" /></svg>;
  if (id === 'expdialogue') return <svg {...common}><path d="M4 5h12v8H8l-4 3z" /><path d="M10 15h6l4 3v-8h-2" /></svg>;
  if (id === 'grammar') return <svg {...common}><path d="M8 3c.4 3 2 4.6 5 5-3 .4-4.6 2-5 5-.4-3-2-4.6-5-5 3-.4 4.6-2 5-5ZM17 11c.35 2.5 1.7 3.85 4.2 4.2-2.5.35-3.85 1.7-4.2 4.2-.35-2.5-1.7-3.85-4.2-4.2 2.5-.35 3.85-1.7 4.2-4.2Z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="7" /></svg>;
}

export function ProfileGrid({
  language = 'en',
  profiles,
  colCount,
  rows,
  compact,
  onRun,
  onTooltip,
  onTooltipLeave,
}) {
  const gridProfiles = profiles;
  const requestedCols = Math.max(1, Number(colCount) || 1);
  const effectiveCols = compact ? Math.min(requestedCols, 6) : Math.min(requestedCols, 4);
  const viewportHeight = getProfileViewportHeight(rows, compact);
  const gridRef = useRef(null);
  const typeaheadRef = useRef({ query: '', timer: null });
  const [activeIndex, setActiveIndex] = useState(0);
  const classes = [
    'rwa2-profile-grid',
    'rwa2-cols-' + effectiveCols,
    compact ? 'rwa2-profile-grid-compact' : '',
  ].filter(Boolean).join(' ');
  const placeholderCount = !compact && effectiveCols === 3
    ? Math.max(0, 15 - Math.min(15, gridProfiles.length))
    : 0;

  useEffect(() => {
    if (!gridProfiles.length) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => Math.min(current, gridProfiles.length - 1));
  }, [gridProfiles.length]);

  useEffect(() => () => {
    if (typeaheadRef.current.timer !== null) window.clearTimeout(typeaheadRef.current.timer);
  }, []);

  const focusButton = (button) => {
    if (!(button instanceof HTMLElement)) return false;
    const profileIndex = Number.parseInt(button.dataset.profileIndex || '', 10);
    if (Number.isInteger(profileIndex)) setActiveIndex(profileIndex);
    button.focus({ preventScroll: true });
    return true;
  };

  const findTypeaheadMatch = (buttons, currentIndex, query) => {
    const normalized = query.toLocaleLowerCase();
    for (let offset = 1; offset <= buttons.length; offset += 1) {
      const index = (currentIndex + offset) % buttons.length;
      const name = String(buttons[index]?.dataset?.profileName || '').toLocaleLowerCase();
      if (name.startsWith(normalized)) return index;
    }
    return -1;
  };

  const moveFocus = (event) => {
    if (!gridRef.current) return;
    const target = event.target instanceof Element ? event.target.closest('.rwa2-profile-btn') : null;
    if (!target) return;
    const buttons = Array.from(gridRef.current.querySelectorAll('.rwa2-profile-btn:not(:disabled)'));
    const currentIndex = buttons.indexOf(target);
    if (currentIndex < 0 || buttons.length === 0) return;

    const isTypeaheadKey = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.trim().length > 0;
    if (isTypeaheadKey) {
      const state = typeaheadRef.current;
      if (state.timer !== null) window.clearTimeout(state.timer);
      let query = state.query + event.key;
      let nextIndex = findTypeaheadMatch(buttons, currentIndex, query);
      if (nextIndex < 0 && query.length > 1) {
        query = event.key;
        nextIndex = findTypeaheadMatch(buttons, currentIndex, query);
      }
      state.query = query;
      state.timer = window.setTimeout(() => {
        typeaheadRef.current.query = '';
        typeaheadRef.current.timer = null;
      }, TYPEAHEAD_RESET_MS);
      if (nextIndex >= 0) {
        event.preventDefault();
        focusButton(buttons[nextIndex]);
      }
      return;
    }

    const computedColumns = window.getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
    else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === 'ArrowDown') nextIndex = Math.min(buttons.length - 1, currentIndex + computedColumns);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - computedColumns);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else return;

    event.preventDefault();
    if (nextIndex === currentIndex) return;
    focusButton(buttons[nextIndex]);
  };

  return (
    <div
      ref={gridRef}
      className={classes}
      role="toolbar"
      aria-orientation="horizontal"
      aria-label={language === 'vi'
        ? 'Các kiểu viết lại. Dùng phím mũi tên để di chuyển hoặc gõ tên kiểu để nhảy tới.'
        : 'Rewrite styles. Use arrow keys to move or type a style name to jump.'}
      style={{ maxHeight: viewportHeight + 'px' }}
      onKeyDown={moveFocus}
    >
      {gridProfiles.map((profile, index) => {
        const displayName = profileDisplayName(profile, language);
        return (
          <Button
            key={profile.id}
            glow={false}
            className="rwa2-profile-btn"
            data-profile-index={index}
            data-profile-name={displayName}
            tabIndex={index === activeIndex ? 0 : -1}
            aria-label={displayName}
            aria-description={profile.prompt}
            onMouseEnter={(event) => onTooltip(event, { kind: 'preset', title: displayName, prompt: profile.prompt })}
            onMouseLeave={onTooltipLeave}
            onFocus={(event) => {
              setActiveIndex(index);
              onTooltip(event, { kind: 'preset', title: displayName, prompt: profile.prompt });
            }}
            onBlur={onTooltipLeave}
            onClick={(event) => {
              event.stopPropagation();
              onRun(profile);
            }}
          >
            {!compact ? <span className="rwa2-profile-icon"><PresetIcon id={profile.id} /></span> : null}
            <span className="rwa2-profile-name" style={profile.color ? { color: profile.color } : {}}>
              {compact ? displayName.slice(0, 2).toUpperCase() : displayName}
            </span>
          </Button>
        );
      })}
      {Array.from({ length: placeholderCount }, (_, index) => (
        <div className="rwa2-profile-placeholder" aria-hidden="true" key={'placeholder-' + index}>
          <span>+</span>
        </div>
      ))}
    </div>
  );
}
