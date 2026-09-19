function asRecord(value) {
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

function clean(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

export function decodeMarinaraCharacter(entity, fallbackId = '') {
  const row = asRecord(entity);
  const data = asRecord(row.data);
  const extensions = asRecord(data.extensions);
  const id = clean(row.id || fallbackId, 220);
  const name = clean(data.name || row.name || id, 160);
  const convoDisplayName = clean(
    extensions.convoDisplayName
    || data.convoDisplayName
    || row.convoDisplayName,
    160,
  );
  const aliases = Array.isArray(extensions.nameAliases)
    ? extensions.nameAliases.map((value) => clean(value, 160)).filter(Boolean)
    : [];

  return {
    id,
    name,
    convoDisplayName,
    aliases,
    data,
    extensions,
    row,
  };
}

export function decodeMarinaraPersona(entity) {
  const row = asRecord(entity);
  const data = asRecord(row.data);
  return {
    id: clean(row.id || data.id, 220),
    name: clean(row.name || data.name, 160),
    data,
    row,
  };
}
