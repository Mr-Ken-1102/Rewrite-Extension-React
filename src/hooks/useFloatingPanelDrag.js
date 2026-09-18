import { useCallback, useEffect, useRef } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';
import {
  clampFloatingPanelPosition,
  getVisualViewportBounds,
} from '../utils/floatingPanelGeometry.js';

export function useFloatingPanelDrag({ panelRef, onPositionChange, allowInteractiveRoot = false }) {
  const setDragging = useRuntimeStore((state) => state.setDragging);
  const cleanupRef = useRef(null);
  const releaseTimerRef = useRef(0);

  const handleDragStart = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target = event.target;
    const interactive = target?.closest?.('button, input, textarea, select, a, [role="button"]');
    if (interactive && (!allowInteractiveRoot || interactive !== event.currentTarget)) return;

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
    let moved = false;
    let finished = false;

    try { captureTarget?.setPointerCapture?.(pointerId); } catch { /* best effort */ }

    setDragging(true);
    panel.dataset.rwaDragging = 'true';
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
      const dx = latest.left - startRect.left;
      const dy = latest.top - startRect.top;
      if (Math.hypot(dx, dy) >= 3) moved = true;
      panel.style.transform = `translate3d(${Math.round(dx)}px, ${Math.round(dy)}px, 0)`;
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

      panel.style.willChange = '';
      captureTarget.style.cursor = '';

      if (commit && panel.isConnected && moved) {
        const committed = { left: Math.round(latest.left), top: Math.round(latest.top) };
        // Commit the final DOM position before removing the transient transform.
        // This avoids a one-frame snap back to the old React left/top while the
        // state update is still being scheduled.
        panel.style.left = `${committed.left}px`;
        panel.style.top = `${committed.top}px`;
        panel.style.transform = '';
        delete panel.dataset.rwaDragging;
        onPositionChange?.(committed);
        releaseTimerRef.current = window.setTimeout(() => {
          releaseTimerRef.current = 0;
          useRuntimeStore.getState().setDragging(false);
        }, 64);
      } else {
        panel.style.transform = '';
        delete panel.dataset.rwaDragging;
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
  }, [allowInteractiveRoot, onPositionChange, panelRef, setDragging]);

  useEffect(() => () => {
    cleanupRef.current?.(false);
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    useRuntimeStore.getState().setDragging(false);
  }, []);

  return handleDragStart;
}
