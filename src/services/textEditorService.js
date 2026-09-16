import { DOMUtils } from '../utils/domUtils';
import { MarinaraHost } from './marinaraHost';
import { fingerprintOk, mapRenderedSpanToRaw, normalizeLineEndings, nthIndexOf } from './spanMapper';
import { makeHistoryKey } from '../utils/historyKey';

let queryClientCache = null;
const activeCommitKeys = new Set();

function findQueryClient() {
  if (queryClientCache && typeof queryClientCache.invalidateQueries === 'function') return queryClientCache;
  const root = document.getElementById('root') || document.body;
  if (!root) return null;
  const fiberKey = Object.keys(root).find((key) => key.startsWith('__reactContainer') || key.startsWith('__reactFiber'));
  if (!fiberKey) return null;
  let start = root[fiberKey];
  if (start?.current) start = start.current;
  const stack = [start];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < 50000) {
    const fiber = stack.pop();
    count += 1;
    if (!fiber || typeof fiber !== 'object' || seen.has(fiber)) continue;
    seen.add(fiber);
    const client = fiber.memoizedProps?.client;
    if (client && typeof client.invalidateQueries === 'function') {
      queryClientCache = client;
      return client;
    }
    if (fiber.child) stack.push(fiber.child);
    if (fiber.sibling) stack.push(fiber.sibling);
  }
  return null;
}

function refreshMessages(cid) {
  try {
    const client = findQueryClient();
    if (!client || !cid) return;
    client.invalidateQueries({
      predicate: (query) => {
        const key = query?.queryKey;
        return Array.isArray(key) && key.includes('messages') && key.includes(cid);
      },
    });
  } catch {
    // Best effort. Marinara will refetch on navigation even if internals change.
  }
}

async function getMessage(cid, mid) {
  if (!cid || !mid) throw new Error('Missing chat or message id.');
  const messages = await MarinaraHost.apiFetch(`/chats/${encodeURIComponent(cid)}/messages`, {}, 15000);
  if (!Array.isArray(messages)) throw new Error('Could not read the current message list. Nothing was written.');
  const message = messages.find((item) => item?.id === mid);
  if (!message) throw new Error('The selected message no longer exists in this chat.');
  return message;
}

async function patchMessage(cid, mid, content) {
  const { ok, data, status } = await MarinaraHost.apiJSON(
    `/chats/${encodeURIComponent(cid)}/messages/${encodeURIComponent(mid)}`,
    { method: 'PATCH', body: JSON.stringify({ content }) },
    20000,
  );
  if (!ok || !data || data.error || data.id == null) {
    const detail = data?.error ? String(data.error) : `HTTP ${status}`;
    throw new Error(`Marinara rejected the message update (${detail}).`);
  }
  refreshMessages(cid);
  return data;
}

function assertActiveChat(cid) {
  const activeCid = DOMUtils.getChatId();
  if (cid && activeCid && String(activeCid) !== String(cid)) {
    const err = new Error('The active chat changed after this rewrite started. Nothing was written to the previous chat. Return to that chat and re-select the text.');
    err.code = 'RWA_CONFLICT';
    throw err;
  }
}

async function guardedPatch(cid, mid, expected, content) {
  assertActiveChat(cid);
  const current = await getMessage(cid, mid);
  if (expected != null && current.content !== expected) {
    const err = new Error('The message changed after the rewrite started. Nothing was overwritten. Re-select the text and try again.');
    err.code = 'RWA_CONFLICT';
    throw err;
  }
  // Narrow the GET→PATCH race as far as the current Engine API allows. A true
  // compare-and-swap still requires server-side revision/If-Match support.
  assertActiveChat(cid);
  return patchMessage(cid, mid, content);
}

function applyTextareaValue(textarea, value, start = 0, end = value.length) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  textarea.focus({ preventScroll: true });
  if (setter) setter.call(textarea, value);
  else textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  const safeStart = Math.max(0, Math.min(start, value.length));
  const safeEnd = Math.max(safeStart, Math.min(end, value.length));
  textarea.setSelectionRange(safeStart, safeEnd);
}

function buildMessageUpdate(message, savedSel, newText) {
  const rawContent = normalizeLineEndings(message?.content || '');
  const renderedFull = DOMUtils.renderedTextForMid(savedSel.mid);
  const needle = normalizeLineEndings(savedSel.text).trim();
  const occurrence = Number.isInteger(savedSel.occ) ? savedSel.occ : 0;
  let renderedStart = nthIndexOf(renderedFull, needle, occurrence);
  if (renderedStart === -1) renderedStart = renderedFull.indexOf(needle);
  if (renderedStart === -1) {
    throw new Error('The selected text is no longer present in the rendered message. Re-select it and try again.');
  }
  if (!fingerprintOk(savedSel.fp, renderedFull, renderedStart, needle.length)) {
    const conflict = new Error('The text around this selection changed after you selected it. Nothing was written.');
    conflict.code = 'RWA_CONFLICT';
    throw conflict;
  }
  const span = mapRenderedSpanToRaw(renderedFull, rawContent, renderedStart, renderedStart + needle.length);
  if (!span) {
    const error = new Error('The selection could not be mapped safely back to stored content.');
    error.code = 'RWA_UNMAPPABLE';
    throw error;
  }
  return {
    rawContent,
    span,
    updated: rawContent.slice(0, span.as) + String(newText ?? '') + rawContent.slice(span.ae),
  };
}

function messageRoots(mid) {
  const roots = DOMUtils.messageElementsForMid?.(mid);
  if (Array.isArray(roots) && roots.length) return roots;
  const first = DOMUtils.messageElementForMid(mid);
  return first ? [first] : [];
}

function editorForMessage(mid) {
  for (const root of messageRoots(mid)) {
    const editor = [...root.querySelectorAll('textarea')].find((textarea) => DOMUtils.isEditTextarea(textarea));
    if (editor) return editor;
  }
  return null;
}

function findEditButton(mid) {
  for (const root of messageRoots(mid)) {
    const direct = root.querySelector('.message-action-edit, [data-action="edit-message"], button[title*="Edit" i], button[aria-label*="Edit" i]');
    if (direct) return direct;
    const fallback = [...root.querySelectorAll('button')].find((button) => {
      // Marinara v2.4.4 uses Lucide's Pencil icon for both Roleplay and
      // Conversation edit actions. The icon fallback keeps manual-save usable
      // when the host UI is localized and the title no longer contains "Edit".
      if (button.querySelector?.('svg.lucide-pencil, svg[class*="lucide-pencil"]')) return true;
      const label = `${button.title || ''} ${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`.toLowerCase();
      return /\bedit\b|\bsửa\b|chỉnh sửa/.test(label);
    });
    if (fallback) return fallback;
  }
  return null;
}

function requestNativeEdit(mid) {
  try {
    window.dispatchEvent(new CustomEvent('marinara:start-edit-message', { detail: { messageId: mid } }));
    return true;
  } catch {
    return false;
  }
}

async function waitForMessageEditor(mid, timeoutMs = 2500) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const editor = editorForMessage(mid);
    if (editor) return editor;
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }
  return null;
}

export class TextEditorService {
  static async doCommit(newText, savedSel, lastClickedMid, pushHistory, showToast, onDone) {
    const mid = savedSel?.mid || lastClickedMid;
    const cid = savedSel?.cid || DOMUtils.getChatId();
    if (!savedSel || !mid) {
      const copied = await DOMUtils.safeCopy(newText);
      showToast(copied
        ? '⚠️ The original selection is unavailable. Result copied to clipboard.'
        : '⚠️ The original selection is unavailable and automatic clipboard copy failed. Preview is kept open for manual recovery.', 'warn');
      if (copied) onDone?.();
      return false;
    }

    const commitKey = `${cid || ''}::${mid}::${savedSel.source || ''}::${savedSel.start ?? ''}::${savedSel.end ?? ''}::${savedSel.captureId || ''}`;
    if (activeCommitKeys.has(commitKey)) {
      showToast('⚠️ This rewrite is already being applied.', 'warn');
      return false;
    }
    activeCommitKeys.add(commitKey);

    try {
      if (savedSel.source === 'message') {
        if (!cid) throw new Error('Cannot detect the active chat.');
        assertActiveChat(cid);
        const message = await getMessage(cid, mid);
        const { updated } = buildMessageUpdate(message, { ...savedSel, mid }, newText);
        await guardedPatch(cid, mid, message.content, updated);
        pushHistory(makeHistoryKey(cid, mid), {
          mode: 'message', cid, mid, old: message.content, post: updated, when: Date.now(),
        });
        showToast('✓ Rewrite applied safely', 'ok');
        onDone?.();
        return true;
      }

      const textarea = savedSel.el;
      if (!textarea || !textarea.isConnected || !DOMUtils.isEditTextarea(textarea)) {
        throw new Error('The original sent-message editor was closed or replaced. Nothing was written.');
      }
      if (typeof savedSel.start !== 'number' || typeof savedSel.end !== 'number' || savedSel.start < 0) {
        throw new Error('The original insertion range is missing. Nothing was written.');
      }
      if (textarea.value !== savedSel.originalValue || textarea.value.slice(savedSel.start, savedSel.end) !== savedSel.text) {
        const err = new Error('The editor changed while the model was working. Nothing was overwritten.');
        err.code = 'RWA_CONFLICT';
        throw err;
      }

      const oldValue = textarea.value;
      const updated = oldValue.slice(0, savedSel.start) + newText + oldValue.slice(savedSel.end);
      applyTextareaValue(textarea, updated, savedSel.start, savedSel.start + newText.length);
      pushHistory(makeHistoryKey(cid, mid), {
        mode: 'textarea', cid, mid, old: oldValue, post: updated, element: textarea, when: Date.now(),
      });
      showToast('✓ Rewrite applied safely', 'ok');
      onDone?.();
      return true;
    } catch (err) {
      const copied = await DOMUtils.safeCopy(newText);
      const conflict = err?.code === 'RWA_CONFLICT' || err?.code === 'RWA_UNMAPPABLE';
      const recovery = copied
        ? (conflict ? ' The rewrite was copied to clipboard.' : ' Result copied to clipboard.')
        : ' Clipboard recovery also failed; preview remains open so you can copy the result manually.';
      showToast(`⚠️ ${err?.message || String(err)}${recovery}`, 'warn');
      if (copied) onDone?.();
      return false;
    } finally {
      activeCommitKeys.delete(commitKey);
    }
  }

  static async prepareNativeEditor(newText, savedSel, showToast) {
    const mid = savedSel?.mid;
    const cid = savedSel?.cid || DOMUtils.getChatId();
    if (!savedSel || !mid) {
      showToast('⚠️ The original selection is unavailable. Native editor mode cannot be prepared safely.', 'warn');
      return false;
    }

    try {
      if (savedSel.source === 'textarea') {
        const textarea = savedSel.el;
        if (!textarea?.isConnected || !DOMUtils.isEditTextarea(textarea)) {
          throw new Error('The original sent-message editor is no longer open.');
        }
        if (textarea.value !== savedSel.originalValue || textarea.value.slice(savedSel.start, savedSel.end) !== savedSel.text) {
          const error = new Error('The editor changed after selection. Manual save preparation was cancelled.');
          error.code = 'RWA_CONFLICT';
          throw error;
        }
        const updated = textarea.value.slice(0, savedSel.start) + String(newText ?? '') + textarea.value.slice(savedSel.end);
        applyTextareaValue(textarea, updated, savedSel.start, savedSel.start + String(newText ?? '').length);
        showToast('Native editor prepared. Review it, then use Marinara’s Save button yourself.', 'ok');
        return true;
      }

      if (!cid) throw new Error('Cannot detect the active chat.');
      assertActiveChat(cid);
      const message = await getMessage(cid, mid);
      const { updated, span } = buildMessageUpdate(message, savedSel, newText);
      let textarea = editorForMessage(mid);
      if (!textarea) {
        // v2.4.4 exposes a host edit event consumed by both Roleplay and
        // Conversation message components. Prefer it because it is independent
        // of localization and visual button labels; retain a DOM button fallback
        // for compatible forks that do not expose the event.
        requestNativeEdit(mid);
        textarea = await waitForMessageEditor(mid, 600);
      }
      if (!textarea) {
        const editButton = findEditButton(mid);
        if (!editButton) throw new Error('Marinara’s native Edit action is not available for this message.');
        editButton.click();
        textarea = await waitForMessageEditor(mid, 1900);
      }
      if (!textarea) throw new Error('Marinara’s native message editor did not open.');
      if (normalizeLineEndings(textarea.value) !== normalizeLineEndings(message.content || '')) {
        const error = new Error('The native editor content does not match the message that was verified. Nothing was changed.');
        error.code = 'RWA_CONFLICT';
        throw error;
      }
      applyTextareaValue(textarea, updated, span.as, span.as + String(newText ?? '').length);
      textarea.dataset.rwaMid = mid;
      showToast('Native editor prepared. Rewrite Assistant did NOT save it — review and press Marinara Save when ready.', 'ok');
      return true;
    } catch (err) {
      const copied = await DOMUtils.safeCopy(newText);
      showToast(`⚠️ ${err?.message || String(err)}${copied ? ' Result copied to clipboard instead.' : ' Preview remains available; use Save .txt or select the result manually.'}`, 'warn');
      return false;
    }
  }

  static async doUndoRedo(mid, type, savedSel, historyStore, _pushHistory, setHistoryData, setSelection, showToast) {
    const cid = savedSel?.cid || DOMUtils.getChatId();
    const key = makeHistoryKey(cid, mid);
    const bucket = historyStore[key];
    if (!key || !bucket) return false;
    const undo = [...(bucket.undo || [])];
    const redo = [...(bucket.redo || [])];
    const source = type === 'undo' ? undo : redo;
    if (!source.length) return false;
    const entry = source[0];

    try {
      if (entry.mode === 'message') {
        assertActiveChat(entry.cid || cid);
        const expected = type === 'undo' ? entry.post : entry.old;
        const target = type === 'undo' ? entry.old : entry.post;
        await guardedPatch(entry.cid || cid, entry.mid || mid, expected, target);
      } else {
        const textarea = entry.element;
        if (!textarea || !textarea.isConnected || !DOMUtils.isEditTextarea(textarea)) {
          throw new Error('The editor used by this history entry is no longer open.');
        }
        const expected = type === 'undo' ? entry.post : entry.old;
        const target = type === 'undo' ? entry.old : entry.post;
        if (textarea.value !== expected) {
          throw new Error('The editor changed after this history entry. Undo/redo was cancelled to avoid data loss.');
        }
        applyTextareaValue(textarea, target, 0, target.length);
        setSelection({ ...savedSel, source: 'textarea', el: textarea, originalValue: target, start: 0, end: target.length, text: target });
      }

      if (type === 'undo') {
        undo.shift();
        redo.unshift(entry);
      } else {
        redo.shift();
        undo.unshift(entry);
      }
      setHistoryData(key, undo, redo);
      showToast(type === 'undo' ? '↶ Undone' : '↷ Redone', 'ok');
      return true;
    } catch (err) {
      showToast(`⚠️ ${err?.message || String(err)}`, 'warn');
      return false;
    }
  }
}
