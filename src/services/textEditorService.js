import { DOMUtils } from '../utils/domUtils';

function editorForMessage(messageId) {
  if (!messageId) return null;
  return Array.from(document.querySelectorAll('textarea'))
    .find((textarea) => DOMUtils.isEditTextarea(textarea) && DOMUtils.getMessageId(textarea) === messageId) || null;
}

function selectedRangeIsCurrent(textarea, savedSel) {
  const { start, end } = savedSel || {};
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > textarea.value.length) {
    return false;
  }
  const expected = typeof savedSel.rawText === 'string'
    ? savedSel.rawText
    : (typeof savedSel.text === 'string' ? savedSel.text : null);
  return expected == null || textarea.value.substring(start, end) === expected;
}

export class TextEditorService {
  static applyTextToTextarea(textarea, newText, savedSel, showToast, onDone) {
    const parent = textarea.parentElement;
    const replacement = typeof newText === 'string' ? newText : String(newText ?? '');

    if (!DOMUtils.isEditTextarea(textarea)) {
      DOMUtils.safeCopy(replacement);
      showToast('⚠️ Message editor is no longer available. Copied output to clipboard.', 'warn');
      onDone?.();
      return false;
    }

    if (!selectedRangeIsCurrent(textarea, savedSel)) {
      DOMUtils.safeCopy(replacement);
      showToast('⚠️ The message changed after selection. Nothing was overwritten; output was copied.', 'warn');
      onDone?.();
      return false;
    }

    if (textarea.dataset.rwaOrigHeight !== undefined) {
      textarea.style.removeProperty('height');
      delete textarea.dataset.rwaOrigHeight;
    }
    if (parent?.dataset.rwaOrigHeight !== undefined) {
      parent.style.removeProperty('height');
      delete parent.dataset.rwaOrigHeight;
    }

    const messageId = DOMUtils.getMessageId(textarea);
    if (messageId) textarea.dataset.rwaMid = messageId;

    textarea.style.setProperty('height', `${textarea.offsetHeight}px`, 'important');
    if (parent) parent.style.setProperty('height', `${parent.offsetHeight}px`, 'important');

    const currentValue = textarea.value || '';
    const updatedValue = currentValue.substring(0, savedSel.start)
      + replacement
      + currentValue.substring(savedSel.end);
    textarea.focus({ preventScroll: true });

    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(textarea, updatedValue);
    else textarea.value = updatedValue;

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    textarea.style.removeProperty('height');
    textarea.style.setProperty('height', 'auto', 'important');
    if (textarea.scrollHeight) {
      textarea.style.setProperty('height', `${textarea.scrollHeight}px`, 'important');
    }
    if (parent) parent.style.removeProperty('height');

    const nextStart = savedSel.start;
    const nextEnd = nextStart + replacement.length;
    textarea.setSelectionRange(nextStart, nextEnd);
    onDone?.();
    return true;
  }

  static doCommit(newText, savedSel, lastClickedMid, pushHistory, showToast, onDone) {
    const resolvedMid = savedSel?.mid || lastClickedMid;
    let textarea = editorForMessage(resolvedMid);

    if (!textarea && DOMUtils.isEditTextarea(document.activeElement)) {
      const activeMessageId = DOMUtils.getMessageId(document.activeElement);
      if (activeMessageId === resolvedMid) textarea = document.activeElement;
    }

    if (!textarea) {
      DOMUtils.safeCopy(newText);
      showToast('⚠️ Active message editor unavailable. Copied output to clipboard.', 'warn');
      onDone?.();
      return false;
    }

    if (!selectedRangeIsCurrent(textarea, savedSel)) {
      DOMUtils.safeCopy(newText);
      showToast('⚠️ The message changed after selection. Nothing was overwritten; output was copied.', 'warn');
      onDone?.();
      return false;
    }

    pushHistory(resolvedMid, textarea.value, savedSel.start, savedSel.end);
    return this.applyTextToTextarea(textarea, newText, savedSel, showToast, onDone);
  }

  static doUndoRedo(mid, type, savedSel, historyStore, setHistoryData, setSelection, showToast) {
    if (!mid || !historyStore[mid]) return false;
    let textarea = editorForMessage(mid);
    if (!textarea && DOMUtils.isEditTextarea(document.activeElement) && DOMUtils.getMessageId(document.activeElement) === mid) {
      textarea = document.activeElement;
    }
    if (!textarea) return false;

    const currentValue = textarea.value;
    const history = {
      undo: [...historyStore[mid].undo],
      redo: [...historyStore[mid].redo],
    };

    let targetText = '';
    let targetStart = 0;
    let targetEnd = 0;

    if (type === 'undo' && history.undo.length > 0) {
      const item = history.undo.shift();
      targetText = typeof item === 'object' ? item.text : item;
      targetStart = typeof item === 'object' ? item.start : 0;
      targetEnd = typeof item === 'object' ? item.end : targetText.length;
      history.redo.unshift({ text: currentValue, start: savedSel.start, end: savedSel.end });
    } else if (type === 'redo' && history.redo.length > 0) {
      const item = history.redo.shift();
      targetText = typeof item === 'object' ? item.text : item;
      targetStart = typeof item === 'object' ? item.start : 0;
      targetEnd = typeof item === 'object' ? item.end : targetText.length;
      history.undo.unshift({ text: currentValue, start: savedSel.start, end: savedSel.end });
    } else {
      return false;
    }

    const applied = this.applyTextToTextarea(
      textarea,
      targetText,
      { start: 0, end: currentValue.length, mid },
      showToast,
      null,
    );
    if (!applied) return false;

    setHistoryData(mid, history.undo, history.redo);
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(targetStart, targetEnd);
    setSelection({
      ...savedSel,
      start: targetStart,
      end: targetEnd,
      text: textarea.value.substring(targetStart, targetEnd),
      rawText: textarea.value.substring(targetStart, targetEnd),
    });
    showToast(`Applied ${type}`, 'ok');
    return true;
  }
}
