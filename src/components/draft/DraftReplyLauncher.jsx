import { useEffect, useRef, useState } from 'react';
import { DOMUtils } from '../../utils/domUtils.js';
import { usePersistentStore } from '../../store/usePersistentStore';

function getLauncherPosition() {
  const anchor = DOMUtils.getChatComposerAnchor();
  if (!anchor) return null;
  const composerRect = anchor.composer.getBoundingClientRect();
  const shellRect = anchor.shell?.getBoundingClientRect?.() || composerRect;
  if (composerRect.width <= 0 || composerRect.height <= 0) return null;

  const viewport = window.visualViewport;
  const viewportLeft = Number(viewport?.offsetLeft) || 0;
  const viewportTop = Number(viewport?.offsetTop) || 0;
  const viewportWidth = Number(viewport?.width) || window.innerWidth;
  const preferredLeft = shellRect.right - 34;
  const preferredTop = shellRect.top - 36;

  return {
    left: Math.max(viewportLeft + 8, Math.min(preferredLeft, viewportLeft + viewportWidth - 40)),
    top: Math.max(viewportTop + 8, preferredTop),
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
      const next = getLauncherPosition();
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
      style={{ left: position.left, top: position.top }}
      onClick={onOpen}
      title={title}
      aria-label={title}
    >
      <span aria-hidden="true">✦</span>
    </button>
  );
}
