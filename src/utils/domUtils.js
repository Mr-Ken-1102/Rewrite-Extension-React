import { ctxFingerprint } from '../services/spanMapper.js';

function escapeSelectorValue(value) {
  const str = String(value ?? '');
  if (globalThis.CSS && typeof globalThis.CSS.escape === 'function') return globalThis.CSS.escape(str);
  return str.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function normalized(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

let selectionCaptureSeq = 0;
function nextSelectionCaptureId() {
  selectionCaptureSeq = (selectionCaptureSeq + 1) % Number.MAX_SAFE_INTEGER;
  return selectionCaptureSeq;
}

export const DOMUtils = {
  escapeSelectorValue,

  getChatId() {
    let fromStore = null;
    try { fromStore = localStorage.getItem('marinara-active-chat-id'); } catch { /* storage may be unavailable */ }
    if (fromStore) return fromStore;
    const el = document.querySelector('[data-chat-id][class*="sidebar-accent"], [data-chat-id][aria-current="true"]');
    return el ? el.getAttribute('data-chat-id') : null;
  },

  isEditTextarea(t) {
    if (!t || t.tagName !== 'TEXTAREA') return false;
    // Marinara v2.4.4 marks the normal composer with data-chat-composer and
    // renders sent-message editors inside [data-message-id]. Never treat an
    // arbitrary page textarea (composer, settings, lorebook editor, etc.) as a
    // message editor merely because it is visible.
    if (t.matches?.('[data-chat-composer="true"]') || t.closest?.('[data-chat-composer="true"]')) return false;
    const id = (t.id || '').toLowerCase();
    if (['chat-input', 'main-input', 'send_textarea'].includes(id)) return false;
    const className = String(t.className || '').toLowerCase();
    if (className.includes('send_textarea') || className.includes('chat-input')) return false;
    if (!t.closest?.('[data-message-id]')) return false;
    const rect = t.getBoundingClientRect?.();
    if (rect && rect.width === 0 && rect.height === 0) return false;
    return true;
  },

  messageElementsForMid(mid) {
    if (!mid) return [];
    const esc = escapeSelectorValue(mid);
    const matches = [...document.querySelectorAll(`[data-message-id="${esc}"]`)];
    const byId = document.getElementById(String(mid));
    if (byId && !matches.includes(byId)) matches.push(byId);
    return matches;
  },

  messageElementForMid(mid) {
    return this.messageElementsForMid(mid)[0] || null;
  },

  renderedTextForMid(mid) {
    if (!mid) return '';
    const esc = escapeSelectorValue(mid);
    const segs = document.querySelectorAll(`[data-message-id="${esc}"]`);
    let out = '';
    for (const seg of segs) {
      const contents = seg.querySelectorAll('.mari-message-content');
      if (contents.length) contents.forEach((node) => { out += node.textContent || ''; });
      else out += seg.textContent || '';
    }
    return normalized(out);
  },

  selectionTextInMessage(range, mid) {
    const esc = escapeSelectorValue(mid);
    const segs = document.querySelectorAll(`[data-message-id="${esc}"]`);
    if (!segs.length) return normalized(range.toString());
    const contents = [];
    segs.forEach((seg) => seg.querySelectorAll('.mari-message-content').forEach((node) => contents.push(node)));
    const startEl = contents[0] || segs[0];
    const endEl = contents[contents.length - 1] || segs[segs.length - 1];
    try {
      const bound = document.createRange();
      bound.setStartBefore(startEl);
      bound.setEndAfter(endEl);
      const clamped = range.cloneRange();
      if (range.compareBoundaryPoints(Range.START_TO_START, bound) < 0) {
        clamped.setStart(bound.startContainer, bound.startOffset);
      }
      if (range.compareBoundaryPoints(Range.END_TO_END, bound) > 0) {
        clamped.setEnd(bound.endContainer, bound.endOffset);
      }
      return normalized(clamped.toString());
    } catch {
      return normalized(range.toString());
    }
  },

  selectionOccurrence(range, mid, selectedText) {
    try {
      const needle = normalized(selectedText);
      if (!needle.trim()) return 0;
      const esc = escapeSelectorValue(mid);
      const contents = document.querySelectorAll(`[data-message-id="${esc}"] .mari-message-content`);
      const startEl = contents[0] || document.querySelector(`[data-message-id="${esc}"]`);
      if (!startEl) return 0;
      const pre = document.createRange();
      pre.setStartBefore(startEl);
      pre.setEnd(range.startContainer, range.startOffset);
      const before = normalized(pre.toString());
      let count = 0;
      let idx = 0;
      while ((idx = before.indexOf(needle, idx)) !== -1) {
        count += 1;
        idx += needle.length;
      }
      return count;
    } catch {
      return 0;
    }
  },

  collectSelectionSegments(range) {
    if (!range) return [];
    const ordered = [];
    const seen = new Set();
    const messageEls = document.querySelectorAll('[data-message-id]');
    for (const element of messageEls) {
      let intersects = false;
      try { intersects = range.intersectsNode(element); } catch { intersects = false; }
      if (!intersects) continue;
      const mid = element.getAttribute('data-message-id');
      if (!mid || seen.has(mid)) continue;
      seen.add(mid);
      ordered.push(mid);
    }

    const segments = [];
    for (const mid of ordered) {
      const text = this.selectionTextInMessage(range, mid);
      if (!text || text.trim().length < 2) continue;
      const renderedFull = this.renderedTextForMid(mid);
      const occ = this.selectionOccurrence(range, mid, text);
      segments.push({
        source: 'message',
        mid,
        text,
        occ,
        fp: ctxFingerprint(renderedFull, text, occ),
        renderedAtSelection: renderedFull,
        detectedRole: null,
      });
    }
    return segments;
  },

  getSelectionData(targetEl, _config, lastClickedMid) {
    let active = null;
    if (targetEl) {
      if (this.isEditTextarea(targetEl)) active = targetEl;
      else if (targetEl.closest) {
        const nearest = targetEl.closest('textarea');
        if (this.isEditTextarea(nearest)) active = nearest;
      }
    }
    if (!active && this.isEditTextarea(document.activeElement)) active = document.activeElement;

    if (active) {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      const text = active.value.substring(start, end);
      if (!text.trim() || text.trim().length < 2) return null;
      const parentMsg = active.closest('[data-message-id], [mesid], .mari-message, .message');
      const mid = active.dataset.rwaMid || parentMsg?.getAttribute('data-message-id') || parentMsg?.getAttribute('mesid') || parentMsg?.id || lastClickedMid;
      if (!mid) return null;
      active.dataset.rwaMid = mid;
      return {
        source: 'textarea',
        text,
        mid,
        cid: this.getChatId(),
        start,
        end,
        el: active,
        originalValue: active.value,
        detectedRole: null,
        captureId: nextSelectionCaptureId(),
      };
    }

    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0) return null;
    const selectedText = normalized(selection.toString()).trim();
    if (!selectedText || selectedText.length < 2) return null;

    let range;
    try { range = selection.getRangeAt(0); } catch { return null; }
    const segments = this.collectSelectionSegments(range);
    if (!segments.length) return null;
    const cid = this.getChatId();
    const captureId = nextSelectionCaptureId();
    const first = segments[0];
    const text = segments.length === 1
      ? first.text
      : segments.map((segment) => segment.text).join('\n\n');

    return {
      source: 'message',
      text,
      mid: first.mid,
      cid,
      start: -1,
      end: -1,
      el: null,
      occ: first.occ,
      fp: first.fp,
      renderedAtSelection: first.renderedAtSelection,
      detectedRole: first.detectedRole,
      segments: segments.map((segment) => ({ ...segment, cid })),
      multiMessage: segments.length > 1,
      captureId,
    };
  },

  async safeCopy(txt) {
    try {
      await navigator.clipboard.writeText(String(txt ?? ''));
      return true;
    } catch {
      let temp = null;
      try {
        temp = document.createElement('textarea');
        temp.value = String(txt ?? '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        temp.style.pointerEvents = 'none';
        temp.setAttribute('aria-hidden', 'true');
        document.body.appendChild(temp);
        temp.focus({ preventScroll: true });
        temp.select();
        return document.execCommand('copy');
      } catch {
        return false;
      } finally {
        temp?.remove();
      }
    }
  },

  saveTextFile(txt, filename = 'rewrite-result.txt') {
    let url = null;
    let anchor = null;
    try {
      const blob = new Blob([String(txt ?? '')], { type: 'text/plain;charset=utf-8' });
      url = URL.createObjectURL(blob);
      anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = String(filename || 'rewrite-result.txt').replace(/[\/:*?"<>|]+/g, '-');
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      return true;
    } catch {
      return false;
    } finally {
      anchor?.remove();
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  },
};
