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

/**
 * Read the identity metadata attached to one rendered Marinara message.
 *
 * When an anchor element from the browser selection is available, prefer the
 * nearest [data-card-css] scope containing that exact anchor. This prevents a
 * duplicate/alternate DOM subtree with the same data-message-id from donating
 * the wrong Character identity.
 */
export function readMessageDomIdentity(messageElement, anchorElement = null) {
  if (!messageElement) {
    return { detectedRole: null, detectedCharacterId: null, detectedName: null };
  }

  const anchorRoleElement = anchorElement?.closest?.('[data-message-role]') || null;
  const detectedRole = attr(messageElement, 'data-message-role')
    || (belongsTo(messageElement, anchorRoleElement) ? attr(anchorRoleElement, 'data-message-role') : '');

  let scopedCard = anchorElement?.closest?.('[data-card-css]') || null;
  if (scopedCard && !belongsTo(messageElement, scopedCard)) scopedCard = null;

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
  };
}
