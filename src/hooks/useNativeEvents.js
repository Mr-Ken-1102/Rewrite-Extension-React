import { useEffect } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { usePersistentStore } from '../store/usePersistentStore';
import { useToastStore } from '../store/useToastStore';
import { DOMUtils } from '../utils/domUtils';
import { makeHistoryKey } from '../utils/historyKey';

export const useNativeEvents = () => {
  const hostElement = useRuntimeStore((state) => state.hostElement);
  const clearHistory = usePersistentStore((state) => state.clearHistory);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (!hostElement) return undefined;
    const syncTheme = () => {
      const htmlClass = document.documentElement.className || '';
      const bodyClass = document.body.className || '';
      const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || '';
      hostElement.className = `${htmlClass} ${bodyClass}`.trim();
      if (themeAttr) hostElement.setAttribute('data-theme', themeAttr);
      else hostElement.removeAttribute('data-theme');
    };
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    syncTheme();
    return () => observer.disconnect();
  }, [hostElement]);

  useEffect(() => {
    const listeners = [];
    const timers = new Set();
    let mouseFrame = 0;
    let lastMouse = { x: 0, y: 0 };

    const add = (target, event, handler, options = false) => {
      target.addEventListener(event, handler, options);
      listeners.push({ target, event, handler, options });
    };

    const schedule = (fn, ms) => {
      const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    };

    add(document, 'pointermove', (event) => {
      const runtime = useRuntimeStore.getState();
      if (runtime.isDragging) return;
      if (runtime.hostElement && event.composedPath().includes(runtime.hostElement)) return;

      lastMouse = { x: event.clientX, y: event.clientY };
      if (mouseFrame) return;
      mouseFrame = requestAnimationFrame(() => {
        mouseFrame = 0;
        const current = useRuntimeStore.getState();
        if (current.isDragging) return;
        current.setMousePos(lastMouse.x, lastMouse.y);
      });
    }, { passive: true });

    add(window, 'pointercancel', () => useRuntimeStore.getState().setDragging(false));
    add(window, 'blur', () => useRuntimeStore.getState().setDragging(false));
    add(document, 'visibilitychange', () => {
      if (document.hidden) useRuntimeStore.getState().setDragging(false);
    });

    add(document, 'click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest('button[title*="Edit" i], .message-action-edit');
      const message = button?.closest?.('[data-message-id], [mesid], .mari-message, .message');
      if (!message) return;
      const mid = message.getAttribute('data-message-id') || message.getAttribute('mesid') || message.id;
      if (mid) useRuntimeStore.getState().setLastClickedMid(mid);
    }, true);

    add(document, 'mouseup', (event) => {
      const runtime = useRuntimeStore.getState();
      const config = usePersistentStore.getState().config;
      if (runtime.isDragging || config.onlyAltR) return;
      if (runtime.hostElement && event.composedPath().includes(runtime.hostElement)) return;
      const x = Number.isFinite(event.clientX) ? event.clientX : runtime.mouseX;
      const y = Number.isFinite(event.clientY) ? event.clientY : runtime.mouseY;
      schedule(() => {
        const saved = DOMUtils.getSelectionData(event.target, config, runtime.lastClickedMid);
        if (!saved) return;
        runtime.setSelection(saved);
        runtime.setPopupPosition({
          left: x,
          top: y,
          right: x,
          bottom: y,
          anchorX: x,
          anchorY: y,
          isDragged: false,
        });
      }, 100);
    }, true);

    add(document, 'keydown', (event) => {
      if (!event.altKey || event.code !== 'KeyR') return;
      const runtime = useRuntimeStore.getState();
      const config = usePersistentStore.getState().config;
      const saved = DOMUtils.getSelectionData(null, config, runtime.lastClickedMid);
      if (!saved) {
        showToast('Select text in a message or edit box first, then press Alt+R.', 'warn');
        return;
      }
      event.preventDefault();
      saved.forced = true;
      runtime.setSelection(saved);
      runtime.setPopupPosition({
        left: runtime.mouseX,
        top: runtime.mouseY,
        right: runtime.mouseX,
        bottom: runtime.mouseY,
        anchorX: runtime.mouseX,
        anchorY: runtime.mouseY,
        isDragged: false,
      });
    }, true);

    add(document, 'mousedown', (event) => {
      const runtime = useRuntimeStore.getState();
      if (runtime.hostElement && event.composedPath().includes(runtime.hostElement)) return;
      if (runtime.popupPosition) runtime.reset();
    }, true);

    add(document, 'click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest('button');
      if (!button) return;
      const active = DOMUtils.isEditTextarea(document.activeElement) ? document.activeElement : null;
      if (!active?.dataset.rwaMid) return;
      const title = (button.title || '').toLowerCase();
      const label = (button.textContent || '').toLowerCase();
      const isSave = !!button.querySelector('.ph-check, .fa-check, svg.lucide-check, svg[class*="lucide-check"]') || title.includes('save') || label.includes('save') || label.includes('lưu');
      const isCancel = !!button.querySelector('.ph-x, .fa-times, svg.lucide-x, svg[class*="lucide-x"]') || title.includes('cancel') || label.includes('cancel') || label.includes('hủy');
      if (!isSave && !isCancel) return;
      const key = makeHistoryKey(DOMUtils.getChatId(), active.dataset.rwaMid);
      clearHistory(key);
    }, true);

    return () => {
      listeners.forEach(({ target, event, handler, options }) => target.removeEventListener(event, handler, options));
      timers.forEach((id) => window.clearTimeout(id));
      if (mouseFrame) cancelAnimationFrame(mouseFrame);
    };
  }, [clearHistory, showToast]);
};
