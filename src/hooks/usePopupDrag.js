import { useCallback, useEffect, useRef } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';

export function usePopupDrag({ popupRef, pinnedPos, updateConfig }) {
  const setDragging = useRuntimeStore((state) => state.setDragging);
  const cleanupRef = useRef(null);
  const releaseTimerRef = useRef(0);
  const frameRef = useRef(0);

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
    const rect = el.getBoundingClientRect();
    const shiftX = event.clientX - rect.left;
    const shiftY = event.clientY - rect.top;
    let pendingX = event.clientX;
    let pendingY = event.clientY;
    let finished = false;

    setDragging(true);
    el.style.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    try { captureTarget?.setPointerCapture?.(pointerId); } catch { /* best effort */ }

    const applyPosition = () => {
      frameRef.current = 0;
      let newLeft = pendingX - shiftX;
      let newTop = pendingY - shiftY;
      newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - el.offsetWidth - 10));
      newTop = Math.max(10, Math.min(newTop, window.innerHeight - el.offsetHeight - 10));
      el.style.left = `${Math.round(newLeft)}px`;
      el.style.top = `${Math.round(newTop)}px`;
    };

    const schedulePosition = () => {
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(applyPosition);
    };

    const onPointerMove = (moveEvent) => {
      if (pointerId !== undefined && moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      pendingX = moveEvent.clientX;
      pendingY = moveEvent.clientY;
      schedulePosition();
    };

    const cleanup = (commit) => {
      if (finished) return;
      finished = true;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      captureTarget?.removeEventListener?.('lostpointercapture', onLostPointerCapture);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
        applyPosition();
      }
      try {
        if (pointerId !== undefined && captureTarget?.hasPointerCapture?.(pointerId)) captureTarget.releasePointerCapture(pointerId);
      } catch { /* best effort */ }
      if (el.isConnected) el.style.cursor = '';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      cleanupRef.current = null;

      if (commit && el.isConnected) {
        const finalRect = el.getBoundingClientRect();
        const left = Math.round(finalRect.left);
        const top = Math.round(finalRect.top);
        useRuntimeStore.getState().setPopupPosition({
          ...useRuntimeStore.getState().popupPosition,
          left,
          top,
          isDragged: true,
        });
        if (pinnedPos) updateConfig({ pinnedPos: { left, top } });

        // Keep the drag guard alive briefly so the pointer-up that ended the drag
        // cannot be mistaken for a fresh text selection by the page listener.
        releaseTimerRef.current = window.setTimeout(() => {
          releaseTimerRef.current = 0;
          useRuntimeStore.getState().setDragging(false);
        }, 80);
      } else {
        useRuntimeStore.getState().setDragging(false);
      }
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
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    captureTarget?.addEventListener?.('lostpointercapture', onLostPointerCapture, { once: true });
  }, [pinnedPos, popupRef, setDragging, updateConfig]);

  useEffect(() => () => {
    cleanupRef.current?.(false);
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    useRuntimeStore.getState().setDragging(false);
  }, []);

  return handleDragStart;
}
