function normalizeNewlines(value) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parseEventBlock(block) {
  const lines = normalizeNewlines(block).split('\n');
  const dataLines = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
  }
  if (!dataLines.length) return null;
  const raw = dataLines.join('\n');
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return { type: 'malformed', data: raw };
  }
}

/**
 * Incrementally consumes Marinara /generate/raw SSE text. Chunk boundaries may
 * occur anywhere (including inside JSON or between CR/LF); callers keep `rest`
 * and prepend it to the next decoded chunk.
 */
export function consumeRawSseText(rest, chunk, flush = false) {
  const joined = normalizeNewlines(`${rest || ''}${chunk || ''}`);
  const blocks = joined.split('\n\n');
  const tail = flush ? '' : (blocks.pop() || '');
  if (flush && blocks.length === 1 && !joined.endsWith('\n\n')) {
    blocks[0] = joined;
  }

  const events = [];
  for (const block of blocks) {
    const parsed = parseEventBlock(block);
    if (parsed) events.push(parsed);
  }
  return { events, rest: tail };
}

export function rawSseEventContent(event) {
  if (!event || typeof event !== 'object') return '';
  if (event.type === 'token' && typeof event.data === 'string') return event.data;
  if (event.type === 'result' && typeof event.data?.content === 'string') return event.data.content;
  return '';
}
