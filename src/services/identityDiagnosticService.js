import { MarinaraHost } from './marinaraHost';
import { ContextService } from './context/contextService.js';
import { decodeMarinaraCharacter } from './context/marinaraEntityAdapter.js';
import { getMessagePersonaSnapshot } from '../utils/messageContext.js';

const MAX_SNAPSHOTS = 20;
const snapshots = [];
const listeners = new Set();
let fallbackId = 0;

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function parseRecord(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return record(parsed);
    } catch {
      return {};
    }
  }
  return {};
}

function clean(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeIdentityName(value) {
  return clean(value, 160).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ');
}

function snapshotId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  fallbackId += 1;
  return `rwa-diag-${Date.now()}-${fallbackId}`;
}

function buildInfo() {
  return {
    extensionVersion: clean(globalThis.__RWA_EXTENSION_VERSION__ || '3.0.3', 64),
    extensionCommit: clean(globalThis.__RWA_BUILD_COMMIT__ || 'unknown', 80),
    engineVersion: clean(
      MarinaraHost.getHost?.()?.engineVersion
      || MarinaraHost.getHost?.()?.version
      || globalThis.__MARINARA_VERSION__
      || 'unknown',
      80,
    ),
  };
}

function notify() {
  for (const listener of listeners) {
    try { listener(snapshots.length); } catch { /* diagnostic observers must never affect runtime */ }
  }
}

function append(snapshot) {
  snapshots.push(snapshot);
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
  notify();
  return snapshot;
}

function chatCharacterIds(chat) {
  let ids = chat?.characterIds || [];
  if (typeof ids === 'string') {
    try { ids = JSON.parse(ids); } catch { ids = []; }
  }
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((item) => clean(item?.id || item, 220)).filter(Boolean))];
}

function rawCharacter(row, fallbackCharacterId, fetchStatus = 'ok') {
  const source = record(row);
  const data = parseRecord(source.data);
  const extensions = record(data.extensions);
  return {
    id: clean(source.id || fallbackCharacterId, 220),
    fetchStatus,
    rowConvoDisplayName: Object.prototype.hasOwnProperty.call(source, 'convoDisplayName')
      ? source.convoDisplayName
      : null,
    dataType: Array.isArray(source.data) ? 'array' : typeof source.data,
    dataName: Object.prototype.hasOwnProperty.call(data, 'name') ? data.name : null,
    dataConvoDisplayName: Object.prototype.hasOwnProperty.call(data, 'convoDisplayName')
      ? data.convoDisplayName
      : null,
    extensionsConvoDisplayName: Object.prototype.hasOwnProperty.call(extensions, 'convoDisplayName')
      ? extensions.convoDisplayName
      : null,
    extensionsNameAliases: Array.isArray(extensions.nameAliases)
      ? extensions.nameAliases.map((value) => clean(value, 160)).filter(Boolean)
      : null,
  };
}

async function fetchRawRoster(chatId, signal) {
  if (!chatId) return { characterIds: [], characters: [], decoded: [] };
  const chat = await MarinaraHost.apiFetch(`/chats/${encodeURIComponent(chatId)}`, { signal }, 15000);
  const ids = chatCharacterIds(chat);
  const rows = await Promise.all(ids.map(async (id) => {
    try {
      const row = await MarinaraHost.apiFetch(`/characters/${encodeURIComponent(id)}`, { signal }, 15000);
      return { id, row, raw: rawCharacter(row, id, 'ok') };
    } catch (error) {
      if (signal?.aborted || MarinaraHost.isAbortError(error)) throw error;
      return { id, row: null, raw: rawCharacter(null, id, 'error') };
    }
  }));
  return {
    characterIds: ids,
    characters: rows.map((item) => item.raw),
    decoded: rows.map(({ id, row }) => (
      row
        ? decodeMarinaraCharacter(row, id)
        : { id, name: id, convoDisplayName: '', aliases: [] }
    )),
  };
}

function groupedMatchCandidates(selectedName, characters) {
  const normalizedSelectedName = normalizeIdentityName(selectedName);
  if (!normalizedSelectedName) return [];

  const candidates = [];
  for (const character of characters) {
    const fields = [
      ['name', character?.name],
      ['convoDisplayName', character?.convoDisplayName],
      ...(Array.isArray(character?.aliases)
        ? character.aliases.map((value) => ['nameAliases', value])
        : []),
    ];

    for (const [matchedField, matchedValue] of fields) {
      const rawValue = clean(matchedValue, 160);
      if (!rawValue) continue;
      if (normalizeIdentityName(rawValue) !== normalizedSelectedName) continue;
      candidates.push({
        id: clean(character?.id, 220),
        matchedField,
        matchedValue: rawValue,
      });
    }
  }
  return candidates;
}

function uniqueCandidateIds(candidates) {
  return [...new Set(candidates.map((candidate) => candidate.id).filter(Boolean))];
}

function failureReason(selection, candidates, resolvedIdentity) {
  if (resolvedIdentity) return '';
  if (!selection?.cid || !selection?.mid) return 'selection-missing-chat-or-message';
  if (selection?.multiMessage === true || (Array.isArray(selection?.segments) && selection.segments.length > 1)) {
    return 'multi-message-selection';
  }
  if (selection?.detectedGroupedSpeaker === true) {
    if (selection?.detectedGroupedSpeakerAmbiguous === true) return 'grouped-selection-ambiguous';
    if (!clean(selection?.detectedName, 160)) return 'grouped-speaker-name-empty';
    const ids = uniqueCandidateIds(candidates);
    if (ids.length === 0) return 'no-grouped-candidate';
    if (ids.length > 1) return 'multiple-grouped-candidates';
  }
  return 'resolver-returned-null';
}

async function referenceLength(identity, targetMessage, signal) {
  if (!identity?.key) return 0;
  try {
    if (identity.kind === 'character') {
      const reference = await ContextService.fetchCharacterVoiceReference(identity.id, signal);
      return reference.length;
    }
    if (identity.kind === 'persona') {
      const snapshot = getMessagePersonaSnapshot(targetMessage);
      const reference = await ContextService.fetchPersonaVoiceReference(snapshot, signal);
      return reference.length;
    }
  } catch {
    return 0;
  }
  return 0;
}

function safeDomRaw(selection) {
  const source = record(selection?.identityDiagnosticRaw);
  return {
    range: record(source.range),
    dom: record(source.dom),
  };
}

export const identityDiagnosticService = Object.freeze({
  async capture(selection, {
    triggerReason = 'manual',
    profileGenerationStatus = 'not-attempted',
    signal = null,
  } = {}) {
    const rawDom = safeDomRaw(selection);
    let roster = { characterIds: [], characters: [], decoded: [] };
    let resolvedTarget = null;
    let diagnosticFailure = '';

    try {
      roster = await fetchRawRoster(selection?.cid, signal);
    } catch (error) {
      if (signal?.aborted || MarinaraHost.isAbortError(error)) return null;
      diagnosticFailure = 'roster-fetch-failed';
    }

    const selectedName = clean(selection?.detectedName || rawDom.dom.detectedName, 160);
    const candidates = groupedMatchCandidates(selectedName, roster.decoded);

    try {
      resolvedTarget = await ContextService.resolveVoiceProfileTarget(selection, signal);
    } catch (error) {
      if (signal?.aborted || MarinaraHost.isAbortError(error)) return null;
      diagnosticFailure ||= 'resolver-threw';
    }

    const identity = resolvedTarget?.identity || null;
    const profileReferenceLength = await referenceLength(identity, resolvedTarget?.targetMessage || null, signal);

    const snapshot = {
      schemaVersion: 'rwa.identity-diagnostic.v1',
      snapshotId: snapshotId(),
      capturedAt: new Date().toISOString(),
      triggerReason: triggerReason === 'profile-generation-failure' ? 'profile-generation-failure' : 'manual',
      exportedVia: null,
      runtime: buildInfo(),
      raw: {
        chatId: clean(selection?.cid, 220),
        messageId: clean(selection?.mid, 220),
        range: rawDom.range,
        dom: rawDom.dom,
        characterIds: roster.characterIds,
        characters: roster.characters,
      },
      derived: {
        normalizedSelectedName: normalizeIdentityName(selectedName),
        matchCandidates: candidates,
        resolvedIdentity: identity?.key || null,
        resolutionFailureReason: diagnosticFailure || failureReason(selection, candidates, identity?.key || null),
        profileReferenceLength,
        profileGenerationStatus: clean(profileGenerationStatus, 80) || 'unknown',
      },
    };

    return append(snapshot);
  },

  list() {
    return snapshots.map((snapshot) => JSON.parse(JSON.stringify(snapshot)));
  },

  count() {
    return snapshots.length;
  },

  clear() {
    snapshots.length = 0;
    notify();
  },

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  exportText(via = 'clipboard') {
    const exportedAt = new Date().toISOString();
    const exportedVia = ['clipboard', 'download', 'console'].includes(via) ? via : 'clipboard';
    return JSON.stringify({
      type: 'rewrite-assistant-identity-diagnostics',
      schemaVersion: 'rwa.identity-diagnostic.v1',
      exportedAt,
      exportedVia,
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        exportedVia,
      })),
    }, null, 2);
  },

  markExported(via = 'clipboard') {
    const exportedVia = ['clipboard', 'download', 'console'].includes(via) ? via : 'clipboard';
    for (const snapshot of snapshots) snapshot.exportedVia = exportedVia;
    notify();
  },
});
