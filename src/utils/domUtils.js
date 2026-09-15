export const DOMUtils = {
  getChatId() {
    const fromStore = localStorage.getItem('marinara-active-chat-id');
    if (fromStore) return fromStore;
    const element = document.querySelector('[data-chat-id][class*="sidebar-accent"]');
    return element ? element.getAttribute('data-chat-id') : null;
  },

  getMessageElement(target) {
    if (!(target instanceof Element)) return null;
    return target.closest('[data-message-id]');
  },

  getMessageId(target) {
    return this.getMessageElement(target)?.getAttribute('data-message-id') || null;
  },

  getMessageRole(target) {
    const role = this.getMessageElement(target)?.getAttribute('data-message-role');
    return role === 'user' || role === 'assistant' ? role : null;
  },

  isEditTextarea(target) {
    if (!(target instanceof HTMLTextAreaElement)) return false;
    if (target.matches('[data-chat-composer]') || target.closest('[data-chat-composer]')) return false;
    if (!this.getMessageElement(target)) return false;
    if (target.disabled || target.readOnly) return false;
    if (target.offsetWidth === 0 && target.offsetHeight === 0) return false;
    return true;
  },

  getSelectionData(targetEl) {
    let active = null;
    if (this.isEditTextarea(targetEl)) {
      active = targetEl;
    } else if (targetEl instanceof Element) {
      const nearestTextarea = targetEl.closest('textarea');
      if (this.isEditTextarea(nearestTextarea)) active = nearestTextarea;
    }

    if (!active && this.isEditTextarea(document.activeElement)) {
      active = document.activeElement;
    }
    if (!active) return null;

    const start = active.selectionStart;
    const end = active.selectionEnd;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) return null;

    const rawText = active.value.substring(start, end);
    if (rawText.trim().length < 2) return null;

    const mid = this.getMessageId(active);
    if (!mid) return null;
    active.dataset.rwaMid = mid;

    return {
      text: rawText,
      rawText,
      mid,
      cid: this.getChatId(),
      isTa: true,
      start,
      end,
      el: active,
      detectedRole: this.getMessageRole(active),
    };
  },

  safeCopy(text) {
    try {
      const result = navigator.clipboard.writeText(text);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
  },
};
