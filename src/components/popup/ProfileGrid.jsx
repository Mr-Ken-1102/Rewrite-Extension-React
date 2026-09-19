import { useEffect, useRef, useState } from 'react';
import { getProfileViewportHeight } from '../../popupGeometry';
import { Button } from '../ui/Button';

const TYPEAHEAD_RESET_MS = 650;
const PROFILE_LABELS_VI = Object.freeze({
  expand: 'Làm giàu',
  compress: 'Cô đọng',
  thoughts: 'Nội tâm',
  dialogue: 'Chuyển thoại',
  active: 'Chủ động',
  diffwords: 'Diễn đạt mới',
  showdont: 'Thể hiện',
  emotion: 'Chiều sâu cảm xúc',
  transitions: 'Mượt chuyển ý',
  noai: 'Tự nhiên hóa',
  expdialogue: 'Đào sâu hội thoại',
  romance: 'Sắc thái lãng mạn',
  grammar: 'Trau chuốt',
});

function profileDisplayName(profile, language) {
  if (language !== 'vi') return profile.name;
  return PROFILE_LABELS_VI[profile.id] || profile.name;
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
    `rwa2-cols-${effectiveCols}`,
    compact ? 'rwa2-profile-grid-compact' : '',
  ].filter(Boolean).join(' ');

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

    const isTypeaheadKey = event.key.length === 1
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey
      && event.key.trim().length > 0;

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

    const computedColumns = window.getComputedStyle(gridRef.current).gridTemplateColumns
      .split(' ')
      .filter(Boolean).length || 1;
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
            onMouseEnter={(event) => onTooltip(event, {
              kind: 'preset',
              title: displayName,
              prompt: profile.prompt,
            })}
            onMouseLeave={onTooltipLeave}
            onFocus={(event) => {
              setActiveIndex(index);
              onTooltip(event, {
                kind: 'preset',
                title: displayName,
                prompt: profile.prompt,
              });
            }}
            onBlur={onTooltipLeave}
            onClick={(event) => {
              event.stopPropagation();
              onRun(profile);
            }}
          >
            <span className="rwa2-profile-name" style={profile.color ? { color: profile.color } : {}}>
              {compact ? displayName.slice(0, 2).toUpperCase() : displayName}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
