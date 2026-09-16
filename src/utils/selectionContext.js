import { ctxFingerprint } from '../services/spanMapper.js';

function normalizeLineEndings(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function nthIndexOf(haystack, needle, occurrence = 0) {
  const text = String(haystack ?? '');
  const target = String(needle ?? '');
  if (!target) return -1;
  let from = 0;
  let found = -1;
  const wanted = Math.max(0, Math.trunc(Number(occurrence) || 0));
  for (let index = 0; index <= wanted; index += 1) {
    found = text.indexOf(target, from);
    if (found < 0) return -1;
    from = found + target.length;
  }
  return found;
}

function countOccurrencesBefore(haystack, needle, endIndex) {
  const text = String(haystack ?? '');
  const target = String(needle ?? '');
  if (!target || endIndex <= 0) return 0;
  let count = 0;
  let from = 0;
  while (from < endIndex) {
    const found = text.indexOf(target, from);
    if (found < 0 || found >= endIndex) break;
    count += 1;
    from = found + target.length;
  }
  return count;
}

function edgeWords(text, count, fromEnd) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const slice = fromEnd ? words.slice(-count) : words.slice(0, count);
  return slice.join(' ');
}

export function deriveTrimmedSelection(savedSelection, requestedText) {
  if (!savedSelection || typeof savedSelection !== 'object') {
    return { selection: null, error: 'The original selection is no longer available.' };
  }

  const original = String(savedSelection.text ?? '');
  const nextText = String(requestedText ?? '').trim();
  if (!nextText) return { selection: null, error: 'Trimmed selection cannot be empty.' };

  const offset = original.indexOf(nextText);
  if (offset < 0) {
    return { selection: null, error: 'Trim can only remove text from the captured selection; editing or replacing its interior is not allowed here.' };
  }
  if (original.indexOf(nextText, offset + Math.max(1, nextText.length)) >= 0) {
    return { selection: null, error: 'That trimmed text occurs more than once inside the selection. Keep a little more text so the target remains unambiguous.' };
  }

  if (savedSelection.source === 'textarea') {
    if (!Number.isInteger(savedSelection.start) || savedSelection.start < 0) {
      return { selection: null, error: 'The edit-box selection no longer has a reliable start position.' };
    }
    return {
      selection: {
        ...savedSelection,
        text: nextText,
        start: savedSelection.start + offset,
        end: savedSelection.start + offset + nextText.length,
      },
      error: '',
    };
  }

  if (savedSelection.source === 'message') {
    const rendered = normalizeLineEndings(savedSelection.renderedAtSelection);
    const originalNormalized = normalizeLineEndings(original);
    const nextNormalized = normalizeLineEndings(nextText);
    const baseStart = nthIndexOf(rendered, originalNormalized, savedSelection.occ || 0);
    if (baseStart < 0) {
      return { selection: null, error: 'The captured message snapshot can no longer locate the original selection safely.' };
    }
    const absoluteStart = baseStart + originalNormalized.indexOf(nextNormalized);
    const occurrence = countOccurrencesBefore(rendered, nextNormalized, absoluteStart);
    return {
      selection: {
        ...savedSelection,
        text: nextNormalized,
        occ: occurrence,
        fp: ctxFingerprint(rendered, nextNormalized, occurrence),
      },
      error: '',
    };
  }

  return { selection: null, error: 'This selection type cannot be trimmed safely.' };
}

export function extractSurroundingContext(savedSelection, wordsPerSide = 150) {
  if (!savedSelection || typeof savedSelection !== 'object') return '';
  const limit = Math.max(50, Math.min(400, Math.trunc(Number(wordsPerSide) || 150)));

  let fullText = '';
  let start = -1;
  let end = -1;

  if (savedSelection.source === 'textarea') {
    fullText = String(savedSelection.originalValue ?? '');
    start = Number(savedSelection.start);
    end = Number(savedSelection.end);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > fullText.length) return '';
  } else if (savedSelection.source === 'message') {
    fullText = normalizeLineEndings(savedSelection.renderedAtSelection);
    const selected = normalizeLineEndings(savedSelection.text);
    start = nthIndexOf(fullText, selected, savedSelection.occ || 0);
    if (start < 0) return '';
    end = start + selected.length;
  } else {
    return '';
  }

  const before = edgeWords(fullText.slice(0, start), limit, true);
  const after = edgeWords(fullText.slice(end), limit, false);
  if (!before && !after) return '';

  const parts = [];
  if (before) parts.push(`Before selection:\n${before}`);
  if (after) parts.push(`After selection:\n${after}`);
  return parts.join('\n\n');
}

export { nthIndexOf };
