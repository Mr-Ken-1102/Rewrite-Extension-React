import { getMessagePersonaSnapshot } from '../utils/messageContext.js';

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function fallbackNameId(name) {
  const normalized = clean(name, 160).toLocaleLowerCase().replace(/\s+/g, ' ');
  return normalized ? `name:${normalized}` : '';
}

export function makeVoiceIdentityKey(identity) {
  if (!identity || typeof identity !== 'object') return '';
  const kind = identity.kind === 'persona' ? 'persona' : (identity.kind === 'character' ? 'character' : '');
  if (!kind) return '';
  const source = kind === 'persona'
    ? (identity.source === 'character' ? 'character' : 'persona')
    : 'character';
  const id = clean(identity.id || fallbackNameId(identity.name), 220);
  if (!id) return '';
  return kind === 'persona' ? `persona:${source}:${id}` : `character:${id}`;
}

export function voiceIdentityFromMessage(message) {
  const role = clean(message?.role, 30);
  if (role === 'assistant') {
    const id = clean(message?.characterId, 220);
    if (!id) return null;
    const name = clean(
      message?.characterName
      || message?.name
      || message?.senderName
      || message?.extra?.characterName,
      160,
    );
    const identity = { kind: 'character', source: 'character', id, name };
    return { ...identity, key: makeVoiceIdentityKey(identity), weak: false };
  }

  if (role === 'user') {
    const snapshot = getMessagePersonaSnapshot(message);
    if (!snapshot) return null;
    const source = snapshot.source === 'character' ? 'character' : 'persona';
    const strongId = clean(snapshot.personaId, 220);
    const name = clean(snapshot.name, 160);
    const id = strongId || fallbackNameId(name);
    if (!id) return null;
    const identity = { kind: 'persona', source, id, name };
    return { ...identity, key: makeVoiceIdentityKey(identity), weak: !strongId };
  }

  return null;
}

export function getVoiceProfile(autoProfiles, chatId, identityKey) {
  if (!chatId || !identityKey || !autoProfiles || typeof autoProfiles !== 'object') return null;
  const bucket = autoProfiles[chatId];
  if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) return null;
  const profile = bucket[identityKey];
  return profile && typeof profile === 'object' ? profile : null;
}

export function listVoiceProfiles(autoProfiles, chatId) {
  if (!chatId || !autoProfiles || typeof autoProfiles !== 'object') return [];
  const bucket = autoProfiles[chatId];
  if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) return [];
  return Object.entries(bucket)
    .filter(([, profile]) => profile && typeof profile === 'object')
    .map(([identityKey, profile]) => ({ identityKey, ...profile }))
    .sort((a, b) => String(a.identityName || a.name || '').localeCompare(String(b.identityName || b.name || '')));
}

export function fingerprintVoiceReference(value) {
  const text = String(value || '').replace(/\r\n/g, '\n').trim();
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}:${text.length}`;
}

export function voiceIdentityLabel(identity, language = 'en') {
  if (!identity) return language === 'vi' ? 'Danh tính' : 'Identity';
  const name = clean(identity.name, 160) || clean(identity.id, 80) || (language === 'vi' ? 'Không rõ' : 'Unknown');
  return identity.kind === 'persona' ? `Persona: ${name}` : `Char: ${name}`;
}
