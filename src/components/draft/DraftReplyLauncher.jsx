import { useCallback, useEffect, useRef, useState } from 'react';
import { DOMUtils } from '../../utils/domUtils.js';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useFloatingPanelDrag } from '../../hooks/useFloatingPanelDrag.js';
import {
  clampFloatingPanelPosition,
  getVisualViewportBounds,
} from '../../utils/floatingPanelGeometry.js';

const LAUNCHER_WIDTH = 118;
const LAUNCHER_HEIGHT = 30;
const SETTINGS_BUTTON_SIZE = 30;
const CLUSTER_GAP = 6;
const CLUSTER_WIDTH = LAUNCHER_WIDTH + CLUSTER_GAP + SETTINGS_BUTTON_SIZE;
const SUPPORTED_MODES = new Set(['roleplay', 'conversation', 'game']);

function SettingsGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  );
}

function getAutoLauncherPosition(anchor) {
  if (!anchor?.composer || !anchor?.shell) return null;
  const composerRect = anchor.composer.getBoundingClientRect?.();
  const shellRect = anchor.shell.getBoundingClientRect?.();
  if (!composerRect || !shellRect) return null;
  if (composerRect.width <= 0 || composerRect.height <= 0 || shellRect.width <= 0 || shellRect.height <= 0) return null;

  const bounds = getVisualViewportBounds(window);
  const gutter = 8;
  const gap = 8;
  const preferredLeft = shellRect.right - CLUSTER_WIDTH;
  const aboveTop = shellRect.top - LAUNCHER_HEIGHT - gap;
  const belowTop = shellRect.bottom + gap;
  const preferredTop = aboveTop >= bounds.top + gutter
    ? aboveTop
    : belowTop + LAUNCHER_HEIGHT <= bounds.bottom - gutter
      ? belowTop
      : Math.max(bounds.top + gutter, Math.min(shellRect.top, bounds.bottom - LAUNCHER_HEIGHT - gutter));

  const clamped = clampFloatingPanelPosition(
    { left: preferredLeft, top: preferredTop },
    { width: CLUSTER_WIDTH, height: LAUNCHER_HEIGHT },
    bounds,
    gutter,
  );
  return { ...clamped, mode: anchor.mode || 'unknown' };
}

function getRememberedLauncherPosition(anchor, savedPositions) {
  const mode = anchor?.mode;
  const saved = SUPPORTED_MODES.has(mode) ? savedPositions?.[mode] : null;
  if (!saved) return null;
  const clamped = clampFloatingPanelPosition(
    saved,
    { width: CLUSTER_WIDTH, height: LAUNCHER_HEIGHT },
    getVisualViewportBounds(window),
  );
  return { ...clamped, mode };
}

export function DraftReplyLauncher({ onOpen, onOpenSettings, hidden = false }) {
  const enabled = usePersistentStore((state) => state.config.draftReplyEnabled !== false);
  const language = usePersistentStore((state) => state.config.uiLanguage === 'vi' ? 'vi' : 'en');
  const placement = usePersistentStore((state) => (
    state.config.draftReplyLauncherPlacement === 'remember' ? 'remember' : 'auto'
  ));
  const savedPositions = usePersistentStore((state) => state.config.draftReplyLauncherPositions || {});
  const updateConfig = usePersistentStore((state) => state.updateConfig);
  const [position, setPosition] = useState(null);
  const frameRef = useRef(0);
  const clusterRef = useRef(null);
  const modeRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(0);

  const commitDraggedPosition = useCallback((next) => {
    const mode = modeRef.current;
    if (placement !== 'remember' || !SUPPORTED_MODES.has(mode)) return;
    const normalized = { left: Math.round(next.left), top: Math.round(next.top) };
    setPosition((current) => current ? { ...current, ...normalized, mode } : { ...normalized, mode });
    updateConfig({
      draftReplyLauncherPositions: {
        ...savedPositions,
        [mode]: normalized,
      },
    });
    suppressClickRef.current = true;
    if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = window.setTimeout(() => {
      suppressTimerRef.current = 0;
      suppressClickRef.current = false;
    }, 250);
  }, [placement, savedPositions, updateConfig]);

  const handleDragStart = useFloatingPanelDrag({
    panelRef: clusterRef,
    onPositionChange: commitDraggedPosition,
    allowInteractiveRoot: true,
  });

  useEffect(() => {
    if (!enabled || hidden) {
      setPosition(null);
      modeRef.current = null;
      return undefined;
    }

    let resizeObserver = null;
    let observedComposer = null;
    let observedShell = null;

    const update = () => {
      frameRef.current = 0;
      const anchor = DOMUtils.getChatComposerAnchor();
      modeRef.current = anchor?.mode || null;
      const remembered = placement === 'remember'
        ? getRememberedLauncherPosition(anchor, savedPositions)
        : null;
      setPosition(remembered || getAutoLauncherPosition(anchor));

      if (anchor?.composer !== observedComposer || anchor?.shell !== observedShell) {
        resizeObserver?.disconnect();
        resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
        observedComposer = anchor?.composer || null;
        observedShell = anchor?.shell || null;
        if (resizeObserver && observedComposer) resizeObserver.observe(observedComposer);
        if (resizeObserver && observedShell && observedShell !== observedComposer) resizeObserver.observe(observedShell);
      }
    };

    const schedule = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(update);
    };

    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener?.('resize', schedule);
    window.visualViewport?.addEventListener?.('scroll', schedule);
    schedule();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener?.('resize', schedule);
      window.visualViewport?.removeEventListener?.('scroll', schedule);
    };
  }, [enabled, hidden, placement, savedPositions]);

  useEffect(() => () => {
    if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current);
  }, []);

  if (!enabled || hidden || !position) return null;

  const draggable = placement === 'remember' && SUPPORTED_MODES.has(position.mode);
  const title = language === 'vi'
    ? draggable
      ? 'Soạn trả lời theo Persona hiện tại · kéo để đổi vị trí'
      : 'Soạn trả lời theo Persona hiện tại'
    : draggable
      ? 'Draft a reply as the active Persona · drag to reposition'
      : 'Draft a reply as the active Persona';
  const settingsTitle = language === 'vi'
    ? 'Mở cài đặt Rewrite Assistant'
    : 'Open Rewrite Assistant settings';

  const handleClick = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      if (suppressTimerRef.current) {
        window.clearTimeout(suppressTimerRef.current);
        suppressTimerRef.current = 0;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onOpen?.();
  };

  return (
    <div
      ref={clusterRef}
      className="rwa-draft-launcher-cluster"
      data-rwa-chat-mode={position.mode}
      data-rwa-placement={placement}
      style={{ left: position.left, top: position.top }}
    >
      <button
        type="button"
        className="rwa-draft-settings-button"
        data-rwa-feature="draft-reply-settings"
        data-rwa-no-drag="true"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onOpenSettings}
        title={settingsTitle}
        aria-label={settingsTitle}
      >
        <SettingsGlyph />
      </button>

      <button
        type="button"
        className={'rwa-draft-launcher ' + (draggable ? 'rwa-draft-launcher-draggable' : '')}
        data-rwa-feature="draft-reply"
        onPointerDown={draggable ? handleDragStart : undefined}
        onClick={handleClick}
        title={title}
        aria-label={title}
      >
        <span className="rwa-draft-launcher-icon" aria-hidden="true">✦</span>
        <span>{language === 'vi' ? 'Trả lời theo Persona' : 'Persona Reply'}</span>
      </button>
    </div>
  );
}
