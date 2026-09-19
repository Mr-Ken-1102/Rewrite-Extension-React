const SELECTIVE_ATTRIBUTES = Object.freeze([
  'data-component',
  'data-card-css',
  'data-message-id',
  'data-message-role',
]);

function elementForNode(node) {
  if (!node) return null;
  if (node.nodeType === 1) return node;
  return node.parentElement || null;
}

function classNames(element) {
  if (!element?.classList) return [];
  return [...element.classList].slice(0, 32);
}

function selectedAttributes(element) {
  if (!element?.getAttribute) return [];
  return SELECTIVE_ATTRIBUTES.flatMap((name) => {
    const value = element.getAttribute(name);
    return value == null ? [] : [{ name, value: String(value).slice(0, 240) }];
  });
}

function childIndexPath(root, target, maxDepth = 16) {
  if (!root || !target) return [];
  const targetElement = elementForNode(target);
  if (!targetElement) return [];
  if (targetElement === root) return [];

  const path = [];
  let current = targetElement;
  while (current && current !== root && path.length < maxDepth) {
    const parent = current.parentElement;
    if (!parent) return [];
    const index = Array.prototype.indexOf.call(parent.children || [], current);
    if (index < 0) return [];
    path.unshift(index);
    current = parent;
  }
  return current === root ? path : [];
}

function describeElement(element, pathRoot = null) {
  if (!element) return null;
  return {
    tagName: String(element.tagName || '').toLowerCase(),
    classes: classNames(element),
    attributes: selectedAttributes(element),
    childIndexPath: pathRoot ? childIndexPath(pathRoot, element) : [],
    textContentLength: String(element.textContent || '').length,
  };
}

function describeNode(node) {
  const parent = elementForNode(node);
  return {
    nodeType: node?.nodeType ?? null,
    nodeName: String(node?.nodeName || ''),
    parentTag: String(parent?.tagName || '').toLowerCase(),
    parentClass: String(parent?.className || '').slice(0, 320),
  };
}

export function captureIdentityDomEvidence({
  browserSelection = null,
  messageElement = null,
  anchorElement = null,
  domIdentity = null,
} = {}) {
  const groupedRoot = anchorElement?.closest?.('[data-component="ConversationMessage.Grouped"]') || null;
  let scopedCard = anchorElement?.closest?.('[data-card-css]') || null;
  if (scopedCard && messageElement?.contains && !messageElement.contains(scopedCard)) scopedCard = null;

  return {
    range: {
      anchorNodeType: browserSelection?.anchorNode?.nodeType ?? null,
      anchorNodeName: String(browserSelection?.anchorNode?.nodeName || ''),
      anchorParentTag: describeNode(browserSelection?.anchorNode).parentTag,
      anchorParentClass: describeNode(browserSelection?.anchorNode).parentClass,
      focusNodeType: browserSelection?.focusNode?.nodeType ?? null,
      focusNodeName: String(browserSelection?.focusNode?.nodeName || ''),
      focusParentTag: describeNode(browserSelection?.focusNode).parentTag,
      focusParentClass: describeNode(browserSelection?.focusNode).parentClass,
    },
    dom: {
      groupedRootFound: !!groupedRoot,
      scopedCardFound: !!scopedCard,
      groupedRoot: describeElement(groupedRoot, messageElement),
      scopedCard: describeElement(scopedCard, groupedRoot || messageElement),
      detectedName: String(domIdentity?.detectedName || '').slice(0, 240),
      dataCardCss: String(scopedCard?.getAttribute?.('data-card-css') || '').slice(0, 240),
      messageRole: String(
        domIdentity?.detectedRole
        || messageElement?.getAttribute?.('data-message-role')
        || '',
      ).slice(0, 80),
    },
  };
}
