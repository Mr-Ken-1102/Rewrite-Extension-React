import { useEffect } from 'react';
import { useRuntimeStore } from '../store/useRuntimeStore';
import { usePersistentStore } from '../store/usePersistentStore';
import { useToastStore } from '../store/useToastStore';
import { DOMUtils } from '../utils/domUtils';

export const useNativeEvents = () => {
  // [TỐI ƯU HÓA TẬN GỐC]: Chỉ subscribe hostElement phản ứng khi khởi tạo, cắt bỏ hoàn toàn việc lắng nghe biến biến động chuột
  const hostElement = useRuntimeStore((state) => state.hostElement);
  const setHistoryData = usePersistentStore((state) => state.setHistoryData);
  const showToast = useToastStore((state) => state.showToast);

  // =========================================================================
  // [BẢN VÁ QUAN TRỌNG]: Phục hồi MutationObserver để đồng bộ Giao diện Sáng/Tối
  // =========================================================================
  useEffect(() => {
    if (!hostElement) return;

    const syncTheme = () => {
      const htmlClass = document.documentElement.className || '';
      const bodyClass = document.body.className || '';
      const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || '';
      
      hostElement.className = `${htmlClass} ${bodyClass}`.trim();
      if (themeAttr) {
        hostElement.setAttribute('data-theme', themeAttr);
      } else {
        hostElement.removeAttribute('data-theme');
      }
    };

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    syncTheme(); // Kích hoạt đồng bộ ngay lần đầu mount

    return () => themeObserver.disconnect();
  }, [hostElement]);

  // =========================================================================
  // Xử lý Sự kiện Toàn cục (Chuột & Bàn phím) - Dùng getState() để triệt tiêu lỗi nhấp nháy render
  // =========================================================================
  useEffect(() => {
    const activeListeners = [];

    const addManagedListener = (target, event, handler, options = false) => {
      target.addEventListener(event, handler, options);
      activeListeners.push({ target, event, handler, options });
    };

    addManagedListener(document, "mousemove", (e) => {
      // Cập nhật tọa độ ngầm tĩnh, không làm App.jsx bị ép re-render liên hồi
      useRuntimeStore.getState().setMousePos(e.clientX, e.clientY);
    });

    addManagedListener(document, "click", (e) => {
      const btn = e.target.closest('button[title*="Edit" i], .message-action-edit, [class*="edit"]');
      if (btn) {
        const msgEl = btn.closest('[data-message-id], [mesid], .mari-message, .message, .chat-message, .mes');
        if (msgEl) {
          const mid = msgEl.getAttribute('data-message-id') || msgEl.getAttribute('mesid') || msgEl.id;
          useRuntimeStore.getState().setLastClickedMid(mid);
        }
      }
    }, true);

    addManagedListener(document, "mouseup", (e) => {
      const runtime = useRuntimeStore.getState();
      const config = usePersistentStore.getState().config;
      
      if (runtime.isDragging) return;
      if (runtime.hostElement && e.composedPath().includes(runtime.hostElement)) return;

      const clickX = e.clientX || runtime.mouseX;
      const clickY = e.clientY || runtime.mouseY;

      // Giữ nguyên khoảng trễ 50ms để DOM cập nhật vùng chọn
      setTimeout(() => {
        const savedSel = DOMUtils.getSelectionData(e.target, config, runtime.lastClickedMid);
        if (!savedSel) return;

        const popupPosition = { left: clickX, top: clickY - 20, right: clickX, bottom: clickY };
        runtime.setSelection(savedSel);
        runtime.setPopupPosition(popupPosition);
      }, 50);
    }, true);

    addManagedListener(document, "keydown", (e) => {
      const runtime = useRuntimeStore.getState();
      const config = usePersistentStore.getState().config;
      
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        e.preventDefault();
        return;
      }

      // --- HỒI SINH PHÍM TẤT ALT + R ---
      if (e.altKey && e.code === "KeyR") {
        e.preventDefault(); 
        
        let savedSel = DOMUtils.getSelectionData(null, config, runtime.lastClickedMid);
        
        // Nếu không bôi đen chữ, tạo một vùng chọn trống thay vì chặn
        if (!savedSel) {
          savedSel = {
            text: "",
            mid: runtime.lastClickedMid || "temp-mid-" + Math.random().toString(36).substr(2, 9),
            cid: DOMUtils.getChatId(config),
            isTa: false,
            start: -1,
            end: -1,
            el: null,
            detectedRole: null
          };
        }
        savedSel.forced = true;

        const popupPosition = { 
          left: runtime.mouseX, 
          top: runtime.mouseY - 20, 
          right: runtime.mouseX, 
          bottom: runtime.mouseY 
        };
        runtime.setSelection(savedSel);
        runtime.setPopupPosition(popupPosition);
      }
    }, true);

    addManagedListener(document, "mousedown", (e) => {
      const runtime = useRuntimeStore.getState();
      const path = e.composedPath();
      if (runtime.hostElement && path.includes(runtime.hostElement)) {
        return; 
      }
      if (runtime.popupPosition || runtime.activeModal) {
        runtime.reset();
      }
    }, true);

    // Xử lý nút Save/Cancel của Native DOM (dọn dẹp history khi lưu/hủy)
    addManagedListener(document, "click", (e) => {
      const runtime = useRuntimeStore.getState();
      const historyStore = usePersistentStore.getState().history;
      if (runtime.hostElement && e.composedPath().includes(runtime.hostElement)) return;

      const btn = e.target.closest("button");
      if (!btn) return;
      
      const isEditAction = btn.className.includes("save") || btn.className.includes("cancel") || btn.querySelector('.ph-check, .fa-check, .ph-x, .fa-times') || btn.title;
      if (!isEditAction) return;

      const activeTa = document.activeElement && document.activeElement.tagName === "TEXTAREA" && DOMUtils.isEditTextarea(document.activeElement) ? document.activeElement : null;
      if (!activeTa) return;

      const titleTxt = (btn.title || "").toLowerCase();
      const innerTxt = (btn.textContent || "").toLowerCase();

      const isSave = btn.querySelector('.ph-check, .fa-check') || titleTxt.includes("save") || innerTxt.includes("save") || innerTxt.includes("lưu");
      const isCancel = btn.querySelector('.ph-x, .fa-times') || titleTxt.includes("cancel") || titleTxt.includes("close") || innerTxt.includes("cancel") || innerTxt.includes("hủy");

      if (isSave && activeTa.dataset.rwaMid) {
        const mid = activeTa.dataset.rwaMid;
        if (historyStore[mid]) {
           setHistoryData(mid, [], []); 
        }
        showToast("Saved successfully", "ok");
        runtime.reset();
      } else if (isCancel && activeTa.dataset.rwaMid) {
        const midC = activeTa.dataset.rwaMid;
        if (historyStore[midC]) {
           setHistoryData(midC, [], []);
        }
        showToast("Edit cancelled", "err");
        runtime.reset();
      }
    }, true);

    return () => {
      activeListeners.forEach(({ target, event, handler, options }) => {
        target.removeEventListener(event, handler, options);
      });
    };
  }, []); 
};