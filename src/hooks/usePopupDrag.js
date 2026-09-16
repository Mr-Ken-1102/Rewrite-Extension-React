import { useCallback, useEffect, useRef } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export function usePopupDrag({ popupRef, pinnedPos, updateConfig }) {
  const setDragging = useRuntimeStore((state) => state.setDragging);
  const cleanupRef = useRef(null);
  const releaseTimerRef = useRef(0);

  const handleDragStart = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const el = popupRef.current;
    if (!el) return;

    event.preventDefault();
    cleanupRef.current?.(false);

    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = 0;
    }

    const pointerId = event.pointerId;
    const captureTarget = event.currentTarget;
    const startRect = el.getBoundingClientRect();
    const startLeft = startRect.left;
    const startTop = startRect.top;
    const width = startRect.width;
    const height = startRect.height;
    const originX = event.clientX;
    const originY = event.clientY;

    let latestLeft = startLeft;
    let latestTop = startTop;
    let finished = false;

    try { captureTarget?.setPointerCapture?.(pointerId); } catch { /* best effort */ }

    setDragging(true);
    captureTarget.style.cursor = 'grabbing';
    el.style.willChange = 'transform';
    el.style.transform = 'translate3d(0, 0, 0)';

    const onPointerMove = (moveEvent) => {
      if (pointerId !== undefined && moveEvent.pointerId !== pointerId) return;
      if (moveEvent.pointerType === 'mouse' && moveEvent.buttons === 0) {
        cleanup(true);
        return;
      }

      moveEvent.preventDefault();
      const samples = moveEvent.getCoalescedEvents?.();
      const latest = samples?.length ? samples[samples.length - 1] : moveEvent;

      latestLeft = clamp(
        startLeft + latest.clientX - originX,
        8,
        Math.max(8, window.innerWidth - width - 8),
      );
      latestTop = clamp(
        startTop + latest.clientY - originY,
        8,
        Math.max(8, window.innerHeight - height - 8),
      );

      const dx = Math.round(latestLeft - startLeft);
      const dy = Math.round(latestTop - startTop);
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const cleanup = (commit) => {
      if (finished) return;
      finished = true;

      captureTarget?.removeEventListener?.('pointermove', onPointerMove);
      captureTarget?.removeEventListener?.('pointerup', onPointerUp);
      captureTarget?.removeEventListener?.('pointercancel', onPointerCancel);
      captureTarget?.removeEventListener?.('lostpointercapture', onLostPointerCapture);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      try {
        if (pointerId !== undefined && captureTarget?.hasPointerCapture?.(pointerId)) {
          captureTarget.releasePointerCapture(pointerId);
        }
      } catch { /* best effort */ }

      el.style.transform = '';
      el.style.willChange = '';
      captureTarget.style.cursor = '';

      if (commit && el.isConnected) {
        const left = Math.round(latestLeft);
        const top = Math.round(latestTop);

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;

        useRuntimeStore.getState().setPopupPosition({
          ...useRuntimeStore.getState().popupPosition,
          left,
          top,
          isDragged: true,
        });

        if (pinnedPos) updateConfig({ pinnedPos: { left, top } });

        releaseTimerRef.current = window.setTimeout(() => {
          releaseTimerRef.current = 0;
          useRuntimeStore.getState().setDragging(false);
        }, 64);
      } else {
        useRuntimeStore.getState().setDragging(false);
      }

      cleanupRef.current = null;
    };

    const onPointerUp = (upEvent) => {
      if (pointerId !== undefined && upEvent.pointerId !== pointerId) return;
      cleanup(true);
    };
    const onPointerCancel = () => cleanup(false);
    const onWindowBlur = () => cleanup(false);
    const onVisibilityChange = () => { if (document.hidden) cleanup(false); };
    const onLostPointerCapture = () => cleanup(false);

    cleanupRef.current = cleanup;
    captureTarget?.addEventListener?.('pointermove', onPointerMove, { passive: false });
    captureTarget?.addEventListener?.('pointerup', onPointerUp);
    captureTarget?.addEventListener?.('pointercancel', onPointerCancel);
    captureTarget?.addEventListener?.('lostpointercapture', onLostPointerCapture, { once: true });
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
  }, [pinnedPos, popupRef, setDragging, updateConfig]);

  useEffect(() => () => {
    cleanupRef.current?.(false);
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    useRuntimeStore.getState().setDragging(false);
  }, []);

  return handleDragStart;
}
