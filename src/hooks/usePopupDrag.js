import { useCallback, useEffect, useRef } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';

export function usePopupDrag({ popupRef, pinnedPos, updateConfig }) {
  const setDragging = useRuntimeStore((state) => state.setDragging);
  const cleanupRef = useRef(null);
  const timerRef = useRef(0);

  const handleDragStart = useCallback((event) => {
    const el = popupRef.current;
    if (!el) return;

    cleanupRef.current?.();
    setDragging(true);
    el.style.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';

    const shiftX = event.clientX - el.getBoundingClientRect().left;
    const shiftY = event.clientY - el.getBoundingClientRect().top;
    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (el.isConnected) el.style.cursor = '';
      document.body.style.cursor = '';
      cleanupRef.current = null;
    };

    const onMouseMove = (moveEvent) => {
      let newLeft = moveEvent.clientX - shiftX;
      let newTop = moveEvent.clientY - shiftY;
      newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - el.offsetWidth - 10));
      newTop = Math.max(10, Math.min(newTop, window.innerHeight - el.offsetHeight - 10));
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      cleanup();
      const left = parseInt(el.style.left, 10);
      const top = parseInt(el.style.top, 10);
      useRuntimeStore.getState().setPopupPosition({
        ...useRuntimeStore.getState().popupPosition,
        left,
        top,
        isDragged: true,
      });
      if (pinnedPos) updateConfig({ pinnedPos: { left, top } });
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = 0;
        setDragging(false);
      }, 80);
    };

    cleanupRef.current = cleanup;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [pinnedPos, popupRef, setDragging, updateConfig]);

  useEffect(() => () => {
    cleanupRef.current?.();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    document.body.style.cursor = '';
    useRuntimeStore.getState().setDragging(false);
  }, []);

  return handleDragStart;
}
