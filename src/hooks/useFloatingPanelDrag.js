import { useCallback, useEffect, useRef } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';
import {
  clampFloatingPanelPosition,
  getVisualViewportBounds,
} from '../utils/floatingPanelGeometry.js';

export function useFloatingPanelDrag({ panelRef, onPositionChange }) {
  const setDragging = useRuntimeStore((state) => state.setDragging);
  const cleanupRef = useRef(null);
  const releaseTimerRef = useRef(0);

  const handleDragStart = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target = event.target;
    if (target?.closest?.('button, input, textarea, select, a, [role="button"]')) return;

    event.preventDefault();
    cleanupRef.current?.(false);
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = 0;
    }

    const pointerId = event.pointerId;
    const captureTarget = event.currentTarget;
    const startRect = panel.getBoundingClientRect();
    const originX = event.clientX;
    const originY = event.clientY;
    let latest = { left: startRect.left, top: startRect.top };
    let finished = false;

    try { captureTarget?.setPointerCapture?.(pointerId); } catch { /* best effort */ }

    setDragging(true);
    panel.style.willChange = 'transform';
    captureTarget.style.cursor = 'grabbing';

    const onPointerMove = (moveEvent) => {
      if (pointerId !== undefined && moveEvent.pointerId !== pointerId) return;
      if (moveEvent.pointerType === 'mouse' && moveEvent.buttons === 0) {
        cleanup(true);
        return;
      }
      moveEvent.preventDefault();
      const samples = moveEvent.getCoalescedEvents?.();
      const sample = samples?.length ? samples[samples.length - 1] : moveEvent;
      latest = clampFloatingPanelPosition(
        {
          left: startRect.left + sample.clientX - originX,
          top: startRect.top + sample.clientY - originY,
        },
        { width: startRect.width, height: startRect.height },
        getVisualViewportBounds(window),
      );
      panel.style.transform = `translate3d(${Math.round(latest.left - startRect.left)}px, ${Math.round(latest.top - startRect.top)}px, 0)`;
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

      panel.style.transform = '';
      panel.style.willChange = '';
      captureTarget.style.cursor = '';

      if (commit && panel.isConnected) {
        onPositionChange?.({ left: Math.round(latest.left), top: Math.round(latest.top) });
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
    const onLostPointerCapture = () => cleanup(false);
    const onWindowBlur = () => cleanup(false);
    const onVisibilityChange = () => { if (document.hidden) cleanup(false); };

    cleanupRef.current = cleanup;
    captureTarget?.addEventListener?.('pointermove', onPointerMove, { passive: false });
    captureTarget?.addEventListener?.('pointerup', onPointerUp);
    captureTarget?.addEventListener?.('pointercancel', onPointerCancel);
    captureTarget?.addEventListener?.('lostpointercapture', onLostPointerCapture, { once: true });
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
  }, [onPositionChange, panelRef, setDragging]);

  useEffect(() => () => {
    cleanupRef.current?.(false);
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    useRuntimeStore.getState().setDragging(false);
  }, []);

  return handleDragStart;
}
