export function makeHistoryKey(cid, mid) {
  if (!mid) return '';
  return `${cid || 'no-chat'}::${mid}`;
}
