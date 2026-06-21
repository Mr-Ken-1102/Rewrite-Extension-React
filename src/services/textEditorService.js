import { DOMUtils } from '../utils/domUtils';

export class TextEditorService {
  
  // [BẢN VÁ LỖI CO TEXTAREA X2 LỚP]: Khóa chặt DOM trước khi bơm text, sau đó dãn dòng với cờ !important
  static applyTextToTextarea(ta, newText, savedSel, lastClickedMid, showToast, onDone) {
    const parent = ta.parentElement;

    // BƯỚC 1: Xóa bộ đệm chiều cao cũ (nếu có)
    if (ta.dataset.rwaOrigHeight !== undefined) {
      ta.style.removeProperty("height");
      delete ta.dataset.rwaOrigHeight;
    }
    if (parent && parent.dataset.rwaOrigHeight !== undefined) {
      parent.style.removeProperty("height");
      delete parent.dataset.rwaOrigHeight;
    }

    ta.dataset.rwaMid = savedSel.mid || lastClickedMid;
    if (typeof savedSel.start !== 'number' || typeof savedSel.end !== 'number' || savedSel.start === -1) {
      DOMUtils.safeCopy(newText);
      showToast("⚠️ Missing insertion target. Copied output to clipboard.", "warn");
      if (onDone) onDone();
      return;
    }

    // BƯỚC 2: KHÓA CHIỀU CAO TRƯỚC KHI BƠM TEXT (Ngăn Marinara co giật)
    ta.style.setProperty("height", `${ta.offsetHeight}px`, "important");
    if (parent) parent.style.setProperty("height", `${parent.offsetHeight}px`, "important");

    const currentVal = ta.value || "";
    const updatedVal = currentVal.substring(0, savedSel.start) + newText + currentVal.substring(savedSel.end);
    ta.focus({ preventScroll: true });

    // BƯỚC 3: KÍCH HOẠT NATIVE SETTER ĐỂ VƯỢT QUA REACT CỦA MARINARA
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    if (nativeSetter) {
      nativeSetter.call(ta, updatedVal);
    } else {
      ta.value = updatedVal;
    }

    // BƯỚC 4: BẮN NATIVE EVENTS THỦ CÔNG
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  
    // BƯỚC 5: MỞ KHÓA VÀ ÉP DÃN CHIỀU CAO KÈM CỜ !IMPORTANT CHỐNG GHI ĐÈ
    ta.style.removeProperty("height");
    ta.style.setProperty("height", "auto", "important"); // Ép tính toán lại
    
    if (ta.scrollHeight) {
      ta.style.setProperty("height", `${ta.scrollHeight}px`, "important"); // Khóa chiều cao mới an toàn
    }
    if (parent) parent.style.removeProperty("height"); // Nhả cha ra để tự co dãn theo con
  
    ta.setSelectionRange(savedSel.start, savedSel.start + newText.length);

    if (onDone) onDone();
  }

  static doCommit(newText, savedSel, lastClickedMid, pushHistory, showToast, onDone) {
    const resolvedMidForCommit = savedSel.mid || lastClickedMid;
    let ta = document.querySelector(`textarea[data-rwa-mid="${resolvedMidForCommit}"]`);
    if (!ta && document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
      ta = document.activeElement;
    }

    if (ta) {
      pushHistory(resolvedMidForCommit, ta.value, savedSel.start, savedSel.end);
      this.applyTextToTextarea(ta, newText, savedSel, lastClickedMid, showToast, onDone);
    } else {
      DOMUtils.safeCopy(newText);
      showToast("⚠️ Active Editor unavailable. Copied output to clipboard.", "warn");
      if (onDone) onDone();
    }
  }

  static doUndoRedo(mid, type, savedSel, historyStore, pushHistory, setHistoryData, setSelection, showToast) {
    if (!mid || !historyStore[mid]) return;
    let ta = document.querySelector(`textarea[data-rwa-mid="${mid}"]`);
    if (!ta && document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
      ta = document.activeElement;
    }
    if (!ta) return;

    const currentVal = ta.value;
    const h = { 
      undo: [...historyStore[mid].undo], 
      redo: [...historyStore[mid].redo] 
    };

    let targetText = "";
    let targetStart = 0;
    let targetEnd = 0;

    if (type === "undo" && h.undo.length > 0) {
      const item = h.undo.shift();
      targetText = typeof item === 'object' ? item.text : item;
      targetStart = typeof item === 'object' ? item.start : 0;
      targetEnd = typeof item === 'object' ? item.end : targetText.length;

      h.redo.unshift({ text: currentVal, start: savedSel.start, end: savedSel.end });
    } else if (type === "redo" && h.redo.length > 0) {
      const item = h.redo.shift();
      targetText = typeof item === 'object' ? item.text : item;
      targetStart = typeof item === 'object' ? item.start : 0;
      targetEnd = typeof item === 'object' ? item.end : targetText.length;

      h.undo.unshift({ text: currentVal, start: savedSel.start, end: savedSel.end });
    } else {
      return;
    }

    // Cập nhật lại History Store
    setHistoryData(mid, h.undo, h.redo);

    // Ghi đè toàn cục để đổi text
    this.applyTextToTextarea(ta, targetText, { start: 0, end: currentVal.length, mid }, mid, showToast, null);

    // KHÓA VÙNG CHỌN CHUẨN XÁC
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(targetStart, targetEnd);

    // Cập nhật Runtime Selection state
    setSelection({ 
      ...savedSel, 
      start: targetStart, 
      end: targetEnd, 
      text: ta.value.substring(targetStart, targetEnd) 
    });
    
    showToast(`Applied ${type}`, "ok");
  }
}