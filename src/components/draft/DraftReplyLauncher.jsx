import { useEffect, useRef, useState } from 'react';
import { DOMUtils } from '../../utils/domUtils.js';
import { usePersistentStore } from '../../store/usePersistentStore';

function getLauncherPosition(anchor) {
  if (!anchor?.composer || !anchor?.shell) return null;
  const composerRect = anchor.composer.getBoundingClientRect?.();
  const shellRect = anchor.shell.getBoundingClientRect?.();
  if (!composerRect || !shellRect) return null;
  if (composerRect.width <= 0 || composerRect.height <= 0 || shellRect.width <= 0 || shellRect.height <= 0) return null;

  const viewport = window.visualViewport;
  const viewportLeft = Number(viewport?.offsetLeft) || 0;
  const viewportTop = Number(viewport?.offsetTop) || 0;
  const viewportWidth = Number(viewport?.width) || window.innerWidth;
  const viewportHeight = Number(viewport?.height) || window.innerHeight;
  const viewportRight = viewportLeft + viewportWidth;
  const viewportBottom = viewportTop + viewportHeight;
  const launcherWidth = 118;
  const launcherHeight = 30;
  const gutter = 8;
  const gap = 8;

  const preferredLeft = shellRect.right - launcherWidth;
  const aboveTop = shellRect.top - launcherHeight - gap;
  const belowTop = shellRect.bottom + gap;
  const preferredTop = aboveTop >= viewportTop + gutter
    ? aboveTop
    : belowTop + launcherHeight <= viewportBottom - gutter
      ? belowTop
      : Math.max(viewportTop + gutter, Math.min(shellRect.top, viewportBottom - launcherHeight - gutter));

  return {
    left: Math.max(viewportLeft + gutter, Math.min(preferredLeft, viewportRight - launcherWidth - gutter)),
    top: preferredTop,
    mode: anchor.mode || 'unknown',
  };
}

export function DraftReplyLauncher({ onOpen, hidden = false }) {
  const enabled = usePersistentStore((state) => state.config.draftReplyEnabled !== false);
  const language = usePersistentStore((state) => state.config.uiLanguage === 'vi' ? 'vi' : 'en');
  const [position, setPosition] = useState(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!enabled || hidden) {
      setPosition(null);
      return undefined;
    }

    let resizeObserver = null;
    let observedComposer = null;
    let observedShell = null;

    const update = () => {
      frameRef.current = 0;
      const anchor = DOMUtils.getChatComposerAnchor();
      const next = getLauncherPosition(anchor);
      setPosition(next);

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
  }, [enabled, hidden]);

  if (!enabled || hidden || !position) return null;

  const title = language === 'vi'
    ? 'Soạn câu trả lời bằng Persona hiện tại'
    : 'Draft a reply as the active Persona';

  return (
    <button
      type="button"
      className="rwa-draft-launcher"
      data-rwa-feature="draft-reply"
      data-rwa-chat-mode={position.mode}
      style={{ left: position.left, top: position.top }}
      onClick={onOpen}
      title={title}
      aria-label={title}
    >
      <span className="rwa-draft-launcher-icon" aria-hidden="true">✦</span>
      <span>{language === 'vi' ? 'Trả lời Persona' : 'Persona Reply'}</span>
    </button>
  );
}
