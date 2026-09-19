import { getMessagePersonaSnapshot } from '../utils/messageContext.js';

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function normalizeIdentityName(name) {
  return clean(name, 160).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ');
}

function fallbackNameId(name) {
  const normalized = normalizeIdentityName(name);
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

export function voiceIdentityFromSelection(selection) {
  const role = clean(selection?.detectedRole, 30);
  if (role !== 'assistant' || selection?.detectedGroupedSpeaker === true) return null;
  const id = clean(selection?.detectedCharacterId, 220);
  if (!id) return null;
  const name = clean(selection?.detectedName, 160);
  const identity = { kind: 'character', source: 'character', id, name };
  return { ...identity, key: makeVoiceIdentityKey(identity), weak: false, sourceOfTruth: 'dom' };
}

export function voiceIdentityFromGroupedSelection(selection, chatCharacters = []) {
  const role = clean(selection?.detectedRole, 30);
  if (role !== 'assistant' || selection?.detectedGroupedSpeaker !== true || selection?.detectedGroupedSpeakerAmbiguous === true) {
    return null;
  }

  const selectedName = clean(selection?.detectedName, 160);
  const normalizedSelectedName = normalizeIdentityName(selectedName);
  if (!normalizedSelectedName) return null;

  const matches = (Array.isArray(chatCharacters) ? chatCharacters : []).filter((character) => {
    const aliases = [
      character?.name,
      character?.convoDisplayName,
      ...(Array.isArray(character?.aliases) ? character.aliases : []),
    ].map(normalizeIdentityName).filter(Boolean);
    return aliases.includes(normalizedSelectedName);
  });

  if (matches.length !== 1) return null;
  const match = matches[0];
  const id = clean(match?.id, 220);
  if (!id) return null;
  const name = clean(match?.name || selectedName, 160);
  const identity = { kind: 'character', source: 'character', id, name };
  return {
    ...identity,
    key: makeVoiceIdentityKey(identity),
    weak: false,
    sourceOfTruth: 'grouped-dom-name',
    selectedDisplayName: selectedName,
  };
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

export function resolveVoiceIdentity(selection, message, chatCharacters = []) {
  // A normal browser selection can use a DOM-bound Character id directly.
  const direct = voiceIdentityFromSelection(selection);
  if (direct) return direct;

  // Marinara grouped Conversation messages can contain multiple visible
  // speakers inside one assistant message while every segment still inherits
  // the parent message.characterId. In that layout the per-segment speaker name
  // must resolve uniquely against the active chat Character set. If it cannot,
  // fail closed instead of falling back to the parent message Character.
  if (selection?.detectedGroupedSpeaker === true) {
    return voiceIdentityFromGroupedSelection(selection, chatCharacters);
  }

  return voiceIdentityFromMessage(message);
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
