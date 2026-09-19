function attr(element, name) {
  const value = element?.getAttribute?.(name);
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function text(element) {
  return typeof element?.textContent === 'string' ? element.textContent.trim() : '';
}

function belongsTo(messageElement, candidate) {
  if (!messageElement || !candidate) return false;
  if (candidate === messageElement) return true;
  if (typeof messageElement.contains === 'function') {
    try { return messageElement.contains(candidate); } catch { return false; }
  }
  return true;
}

function groupedConversationRoot(messageElement, anchorElement) {
  const fromAnchor = anchorElement?.closest?.('[data-component="ConversationMessage.Grouped"]') || null;
  if (fromAnchor && belongsTo(messageElement, fromAnchor)) return fromAnchor;
  return attr(messageElement, 'data-component') === 'ConversationMessage.Grouped' ? messageElement : null;
}

function groupedSpeakerName(scopedCard) {
  if (!scopedCard) return '';

  // Marinara's grouped Conversation renderer puts each speaker name in the
  // segment's items-baseline header. The segment-level data-card-css attribute
  // still contains the parent message.characterId, so the visible speaker name
  // is the only DOM identity signal that is actually scoped to the selection.
  const header = scopedCard.querySelector?.('.items-baseline') || null;
  const headerName = header?.querySelector?.('span:not(.mari-conversation-transcript-chrome-text)')
    || header?.querySelector?.('span')
    || null;
  const fromHeader = text(headerName);
  if (fromHeader) return fromHeader;

  // Bubble layouts may have an avatar even when utility classes change. Its alt
  // text is the same segName that Marinara renders beside the selected segment.
  const avatar = scopedCard.querySelector?.('img[alt]') || null;
  return attr(avatar, 'alt');
}

/**
 * Read the identity metadata attached to one rendered Marinara message.
 *
 * Normal messages can trust the nearest [data-card-css] scope because Marinara
 * binds that attribute to message.characterId. Grouped multi-speaker
 * Conversation messages are different: every speaker segment currently inherits
 * the parent message.characterId. For those segments we intentionally discard
 * that id, capture the visible segment speaker name, and let the context layer
 * map that name to one unique Character in the active chat.
 */
export function readMessageDomIdentity(messageElement, anchorElement = null) {
  if (!messageElement) {
    return {
      detectedRole: null,
      detectedCharacterId: null,
      detectedName: null,
      detectedGroupedSpeaker: false,
    };
  }

  const anchorRoleElement = anchorElement?.closest?.('[data-message-role]') || null;
  const detectedRole = attr(messageElement, 'data-message-role')
    || (belongsTo(messageElement, anchorRoleElement) ? attr(anchorRoleElement, 'data-message-role') : '');

  let scopedCard = anchorElement?.closest?.('[data-card-css]') || null;
  if (scopedCard && !belongsTo(messageElement, scopedCard)) scopedCard = null;

  const groupedRoot = groupedConversationRoot(messageElement, anchorElement);
  if (groupedRoot && scopedCard) {
    return {
      detectedRole: detectedRole || 'assistant',
      detectedCharacterId: null,
      detectedName: groupedSpeakerName(scopedCard) || null,
      detectedGroupedSpeaker: true,
    };
  }

  const fallbackCard = messageElement.querySelector?.('[data-card-css]') || null;
  const detectedCharacterId = attr(scopedCard, 'data-card-css')
    || attr(messageElement, 'data-card-css')
    || attr(fallbackCard, 'data-card-css');

  const scopedName = scopedCard?.querySelector?.('.mari-message-name') || null;
  const fallbackName = messageElement.querySelector?.('.mari-message-name') || null;
  const detectedName = text(scopedName) || text(fallbackName);

  return {
    detectedRole: detectedRole || null,
    detectedCharacterId: detectedCharacterId || null,
    detectedName: detectedName || null,
    detectedGroupedSpeaker: false,
  };
}
