import { useEffect } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { usePersistentStore } from '../store/usePersistentStore';
import { useToastStore } from '../store/useToastStore';
import { DOMUtils } from '../utils/domUtils';

export const useNativeEvents = () => {
  const setHistoryData = usePersistentStore((state) => state.setHistoryData);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const syncTheme = () => {
      const targetHost = useRuntimeStore.getState().hostElement;
      if (!targetHost) return;

      const htmlClass = document.documentElement.className || '';
      const bodyClass = document.body.className || '';
      const themeAttr = document.documentElement.getAttribute('data-theme')
        || document.body.getAttribute('data-theme')
        || '';

      targetHost.className = `${htmlClass} ${bodyClass}`.trim();
      if (themeAttr) targetHost.setAttribute('data-theme', themeAttr);
      else targetHost.removeAttribute('data-theme');
    };

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    syncTheme();

    return () => themeObserver.disconnect();
  }, []);

  useEffect(() => {
    const activeListeners = [];
    const scheduledTimers = new Map();

    const addManagedListener = (target, event, handler, options = false) => {
      target.addEventListener(event, handler, options);
      activeListeners.push({ target, event, handler, options });
    };

    const schedule = (callback, delay) => {
      const marinara = useRuntimeStore.getState().marinara;
      const setTimer = marinara && typeof marinara.setTimeout === 'function'
        ? marinara.setTimeout.bind(marinara)
        : window.setTimeout.bind(window);
      const clearTimer = marinara && typeof marinara.clearTimeout === 'function'
        ? marinara.clearTimeout.bind(marinara)
        : window.clearTimeout.bind(window);
      const timerId = setTimer(() => {
        scheduledTimers.delete(timerId);
        callback();
      }, delay);
      scheduledTimers.set(timerId, clearTimer);
      return timerId;
    };

    addManagedListener(document, 'mousemove', (event) => {
      useRuntimeStore.getState().setMousePos(event.clientX, event.clientY);
    });

    addManagedListener(document, 'click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('button[title*="edit" i], button[aria-label*="edit" i], .message-action-edit');
      const message = button?.closest('[data-message-id]');
      const messageId = message?.getAttribute('data-message-id');
      if (messageId) useRuntimeStore.getState().setLastClickedMid(messageId);
    }, true);

    addManagedListener(document, 'mouseup', (event) => {
      const runtime = useRuntimeStore.getState();
      const config = usePersistentStore.getState().config;
      if (runtime.isDragging || config.onlyAltR) return;
      if (runtime.hostElement && event.composedPath().includes(runtime.hostElement)) return;

      const clickX = event.clientX || runtime.mouseX;
      const clickY = event.clientY || runtime.mouseY;
      const target = event.target;

      schedule(() => {
        const savedSelection = DOMUtils.getSelectionData(target);
        if (!savedSelection) return;
        runtime.setLastClickedMid(savedSelection.mid);
        runtime.setSelection(savedSelection);
        runtime.setPopupPosition({ left: clickX, top: clickY - 20, right: clickX, bottom: clickY });
      }, 50);
    }, true);

    addManagedListener(document, 'keydown', (event) => {
      const runtime = useRuntimeStore.getState();

      if (event.ctrlKey && event.shiftKey && event.code === 'KeyD') {
        event.preventDefault();
        return;
      }

      if (event.altKey && event.code === 'KeyR') {
        event.preventDefault();
        let savedSelection = DOMUtils.getSelectionData(null);

        if (!savedSelection) {
          savedSelection = {
            text: '',
            rawText: '',
            mid: runtime.lastClickedMid || '',
            cid: DOMUtils.getChatId(),
            isTa: false,
            start: -1,
            end: -1,
            el: null,
            detectedRole: null,
          };
        }
        savedSelection.forced = true;
        runtime.setSelection(savedSelection);
        runtime.setPopupPosition({
          left: runtime.mouseX,
          top: runtime.mouseY - 20,
          right: runtime.mouseX,
          bottom: runtime.mouseY,
        });
      }
    }, true);

    addManagedListener(document, 'mousedown', (event) => {
      const runtime = useRuntimeStore.getState();
      const path = event.composedPath();
      if (runtime.hostElement && path.includes(runtime.hostElement)) return;
      if (runtime.popupPosition || runtime.activeModal) runtime.reset();
    }, true);

    addManagedListener(document, 'click', (event) => {
      const runtime = useRuntimeStore.getState();
      if (runtime.hostElement && event.composedPath().includes(runtime.hostElement)) return;
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest('button');
      if (!button) return;
      const activeTextarea = DOMUtils.isEditTextarea(document.activeElement) ? document.activeElement : null;
      if (!activeTextarea) return;

      const buttonMessageId = DOMUtils.getMessageId(button);
      const activeMessageId = DOMUtils.getMessageId(activeTextarea);
      if (!buttonMessageId || buttonMessageId !== activeMessageId) return;

      const label = `${button.title || ''} ${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`.toLowerCase();
      const isSave = /\b(save|lưu|apply|confirm)\b/i.test(label);
      const isCancel = /\b(cancel|close|hủy|huỷ)\b/i.test(label);
      if (!isSave && !isCancel) return;

      const historyStore = usePersistentStore.getState().history;
      if (activeMessageId && historyStore[activeMessageId]) {
        setHistoryData(activeMessageId, [], []);
      }

      showToast(isSave ? 'Saved successfully' : 'Edit cancelled', isSave ? 'ok' : 'err');
      runtime.reset();
    }, true);

    return () => {
      activeListeners.forEach(({ target, event, handler, options }) => {
        target.removeEventListener(event, handler, options);
      });
      for (const [timerId, clearTimer] of scheduledTimers) clearTimer(timerId);
      scheduledTimers.clear();
    };
  }, [setHistoryData, showToast]);
};
