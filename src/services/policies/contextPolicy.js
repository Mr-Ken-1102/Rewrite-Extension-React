import { getMessagePersonaSnapshot } from '../../utils/messageContext.js';

// Lowest-value context is removed first. Surrounding prose and ledger continuity
// are kept as the highest-priority semantic references because they are the most
// local to the exact text being rewritten.
export const CONTEXT_DROP_ORDER = Object.freeze([
  'history',
  'memory',
  'lore',
  'character',
  'persona',
  'surrounding',
  'ledger',
]);

export const CONTEXT_DISPLAY_ORDER = Object.freeze([
  'character',
  'memory',
  'persona',
  'lore',
  'surrounding',
  'history',
  'ledger',
]);

function personaIdentity(message) {
  const snapshot = getMessagePersonaSnapshot(message);
  if (!snapshot) return '';
  return `${String(snapshot.personaId || '').trim()}::${String(snapshot.name || '').trim()}`;
}

function semanticIdentity(message) {
  const role = String(message?.role || '').trim() || 'unknown';
  if (role === 'assistant') return { role, author: String(message?.characterId || '').trim() };
  if (role === 'user') return { role, author: personaIdentity(message) };
  return { role, author: '' };
}

export function analyzeMergedMessageCompatibility(messages, segments) {
  if (!Array.isArray(messages) || !Array.isArray(segments) || segments.length < 2) {
    return { ok: false, reason: 'not-enough-segments' };
  }
  const byId = new Map(messages.filter(Boolean).map((message) => [String(message.id), message]));
  const resolved = [];
  for (const segment of segments) {
    const message = byId.get(String(segment?.mid || ''));
    if (!message) return { ok: false, reason: `message-missing:${segment?.mid || '?'}` };
    resolved.push(message);
  }

  const firstIdentity = semanticIdentity(resolved[0]);
  for (let index = 1; index < resolved.length; index += 1) {
    const identity = semanticIdentity(resolved[index]);
    if (identity.role !== firstIdentity.role) return { ok: false, reason: 'mixed-role' };
    if (identity.author !== firstIdentity.author) {
      return { ok: false, reason: firstIdentity.role === 'assistant' ? 'mixed-character' : 'mixed-persona' };
    }
  }
  return { ok: true, identity: firstIdentity, messages: resolved };
}

export function resolveAutoProfileCharacter({ preferredCharacterIds = [], targetMessage = null, chatCharacters = [] } = {}) {
  const preferred = [...new Set((Array.isArray(preferredCharacterIds) ? preferredCharacterIds : [preferredCharacterIds])
    .map((item) => String(item?.id || item || '').trim()).filter(Boolean))];
  const targetId = targetMessage?.role === 'assistant' ? String(targetMessage?.characterId || '').trim() : '';

  if (preferred.length === 1) return preferred[0];
  if (targetId && (!preferred.length || preferred.includes(targetId))) return targetId;
  const chatIds = [...new Set((Array.isArray(chatCharacters) ? chatCharacters : [])
    .map((item) => String(item?.id || item || '').trim()).filter(Boolean))];
  if (chatIds.length === 1) return chatIds[0];
  return '';
}
