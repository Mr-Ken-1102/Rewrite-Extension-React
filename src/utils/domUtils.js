export const DOMUtils = {
  getChatId(config) {
    const fromStore = localStorage.getItem("marinara-active-chat-id");
    if (fromStore) return fromStore;
    const el = document.querySelector('[data-chat-id][class*="sidebar-accent"]');
    return el ? el.getAttribute("data-chat-id") : null;
  },

  isEditTextarea(t) {
    if (!t || t.tagName !== 'TEXTAREA') return false;
    const id = (t.id || "").toLowerCase();
    if (id === "chat-input" || id === "main-input" || id === "send_textarea") return false;
    const className = (t.className || "").toLowerCase();
    if (className.includes("send_textarea") || className.includes("chat-input")) return false;
    if (t.offsetWidth === 0 && t.offsetHeight === 0) return false;
    return true;
  },

  getSelectionData(targetEl, config, lastClickedMid) {
    let active = null;
    if (targetEl) {
      if (this.isEditTextarea(targetEl)) {
        active = targetEl;
      } else {
        const nearestTa = targetEl.closest('textarea');
        if (nearestTa && this.isEditTextarea(nearestTa)) {
          active = nearestTa;
        }
      }
    }
    if (!active) active = document.activeElement;

    const isTa = this.isEditTextarea(active);
    if (!isTa) return null;

    const txt = active.value.substring(active.selectionStart, active.selectionEnd).trim();
    if (!txt || txt.length < 2) return null;

    let mid = active.dataset.rwaMid;
    let parentMsg = active.closest('.mari-message, .message, [data-message-id]');
    
    if (!mid && parentMsg) {
      mid = parentMsg.getAttribute("data-message-id") || parentMsg.getAttribute("mesid") || parentMsg.id;
    }
    if (!mid) {
      mid = lastClickedMid || "temp-mid-" + Math.random().toString(36).substr(2, 9);
    }
    active.dataset.rwaMid = mid;

    // [BẢN VÁ]: Trả kiến trúc về nguyên bản gốc. KHÔNG gán cứng detectedRole ở đây.
    // Việc xác định Role sẽ được PopupMain nhường quyền cho API ngầm quét.
    return { 
      text: txt, 
      mid, 
      cid: this.getChatId(config), 
      isTa: true, 
      start: active.selectionStart, 
      end: active.selectionEnd, 
      el: active
    };
  },
  
  safeCopy(txt) {
    try { navigator.clipboard.writeText(txt); } 
    catch (e) {
      const temp = document.createElement("textarea");
      temp.value = txt;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
  }
};