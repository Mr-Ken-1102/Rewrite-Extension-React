function safeExtra(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function getMessagePersonaSnapshot(message) {
  const extra = safeExtra(message?.extra);
  const snapshot = extra.personaSnapshot;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;

  const personaId = typeof snapshot.personaId === 'string' ? snapshot.personaId.trim() : '';
  const name = typeof snapshot.name === 'string' ? snapshot.name.trim() : '';
  if (!personaId && !name) return null;
  const source = snapshot.source === 'character' || snapshot.source === 'persona' ? snapshot.source : null;
  return { personaId, name, ...(source ? { source } : {}) };
}

export function isMessageHiddenFromRewriteContext(message, audienceCharacterId = null) {
  const extra = safeExtra(message?.extra);
  if (extra.hiddenFromAI === true) return true;

  const hiddenIds = Array.isArray(extra.hiddenFromAICharacterIds)
    ? extra.hiddenFromAICharacterIds.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim())
    : [];
  if (!hiddenIds.length) return false;

  // A rewrite request is still AI processing. When there is no unambiguous
  // character audience (for example, rewriting a user/narrator message), use
  // the privacy-conservative interpretation and exclude any selectively hidden
  // message rather than leaking it to a different model connection.
  if (!audienceCharacterId) return true;
  return hiddenIds.includes(String(audienceCharacterId));
}

export function isRewriteContextStartBoundary(message, audienceCharacterId = null) {
  const extra = safeExtra(message?.extra);
  if (extra.isConversationStart === true) return true;
  if (!audienceCharacterId || !Array.isArray(extra.conversationStartForCharacterIds)) return false;
  const audience = String(audienceCharacterId);
  return extra.conversationStartForCharacterIds.some((id) => typeof id === 'string' && id.trim() === audience);
}

function roleLabel(role) {
  if (role === 'user') return 'User';
  if (role === 'assistant') return 'Character';
  if (role === 'system') return 'System';
  if (role === 'narrator') return 'Narrator';
  return 'Message';
}

export function buildHistoryContext(messages, targetIndex, depth, audienceCharacterId = null) {
  if (!Array.isArray(messages) || targetIndex <= 0 || depth <= 0) return '';
  const limit = Math.max(0, Math.min(20, Math.trunc(Number(depth) || 0)));
  if (!limit) return '';

  const selected = [];
  for (let index = targetIndex - 1; index >= 0 && selected.length < limit; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    const isStartBoundary = isRewriteContextStartBoundary(message, audienceCharacterId);
    if (!isMessageHiddenFromRewriteContext(message, audienceCharacterId)) selected.push(message);
    // Marinara scopes generation history from the latest start marker forward.
    // Stop even when the marker itself is hidden, otherwise backfilling visible
    // messages would cross a boundary the Engine intentionally established.
    if (isStartBoundary) break;
  }
  selected.reverse();

  return selected.map((message) => {
    const content = String(message?.content || '').slice(0, 1200);
    return `${roleLabel(message?.role)}: ${content}`;
  }).filter(Boolean).join('\n\n');
}
