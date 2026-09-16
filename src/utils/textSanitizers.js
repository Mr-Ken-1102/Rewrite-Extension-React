export function unwrapMatchingOuterQuotes(value) {
  let text = String(value ?? '').trim();
  if (text.length < 2) return text;
  const quotePairs = new Map([
    ["'", "'"],
    ['"', '"'],
    ['“', '”'],
    ['‘', '’'],
    ['«', '»'],
  ]);
  const closing = quotePairs.get(text[0]);
  if (closing && text.endsWith(closing)) text = text.slice(1, -1).trim();
  return text;
}
