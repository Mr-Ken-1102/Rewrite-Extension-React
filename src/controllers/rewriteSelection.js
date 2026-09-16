export function segmentSelection(parent, segment, index = 0) {
  return {
    ...parent,
    ...segment,
    source: 'message',
    cid: parent?.cid || segment?.cid || null,
    mid: segment.mid,
    text: segment.text,
    segments: undefined,
    multiMessage: false,
    captureId: `${parent?.captureId || 'capture'}:${index}:${segment.mid}`,
  };
}

export function executionMeta(kind, selection, segments = []) {
  return {
    kind,
    captureId: selection?.captureId,
    chatId: selection?.cid,
    messageIds: segments.length ? segments.map((segment) => segment.mid) : (selection?.mid ? [selection.mid] : []),
  };
}
