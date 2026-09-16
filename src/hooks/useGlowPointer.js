import { useCallback, useEffect, useRef } from 'react';

export function useGlowPointer() {
  const frameRef = useRef(0);
  const pendingRef = useRef(null);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  return useCallback((event) => {
    const target = event.target instanceof Element ? event.target.closest('.rwa-glow-button') : null;
    if (!target) return;
    pendingRef.current = { target, clientX: event.clientX, clientY: event.clientY };
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const pending = pendingRef.current;
      if (!pending?.target?.isConnected) return;
      const rect = pending.target.getBoundingClientRect();
      pending.target.style.setProperty('--x', `${pending.clientX - rect.left}px`);
      pending.target.style.setProperty('--y', `${pending.clientY - rect.top}px`);
    });
  }, []);
}
