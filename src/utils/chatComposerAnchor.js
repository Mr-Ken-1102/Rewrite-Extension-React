const SUPPORTED_CHAT_MODES = new Set(['roleplay', 'conversation', 'game']);

function safeRect(element) {
  try {
    const rect = element?.getBoundingClientRect?.();
    if (!rect) return null;
    if (![rect.left, rect.top, rect.right, rect.bottom, rect.width, rect.height].every(Number.isFinite)) return null;
    return rect;
  } catch {
    return null;
  }
}

function isVisible(element) {
  const rect = safeRect(element);
  return !!rect && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0;
}

function safeClosest(element, selector) {
  try { return element?.closest?.(selector) || null; } catch { return null; }
}

function readMode(element) {
  const root = safeClosest(element, '[data-chat-mode]');
  const mode = root?.getAttribute?.('data-chat-mode') || '';
  return SUPPORTED_CHAT_MODES.has(mode) ? { mode, root } : null;
}

function visibleTextareas(root, selector = 'textarea') {
  try {
    return [...(root?.querySelectorAll?.(selector) || [])]
      .filter((element) => String(element?.tagName || '').toUpperCase() === 'TEXTAREA')
      .filter(isVisible);
  } catch {
    return [];
  }
}

function componentModeFallback(documentLike, composer) {
  const pairs = [
    ['roleplay', '[data-component="ChatArea.Roleplay"]'],
    ['conversation', '[data-component="ChatArea.Conversation"]'],
    ['game', '[data-chat-mode="game"]'],
  ];
  for (const [mode, selector] of pairs) {
    const root = (() => {
      try { return documentLike?.querySelector?.(selector) || null; } catch { return null; }
    })();
    if (!root || !isVisible(root)) continue;
    if (!composer) return { mode, root };
    try {
      if (root === composer || root.contains?.(composer)) return { mode, root };
    } catch { /* keep searching */ }
  }
  return null;
}

export function detectMarinaraChatMode(documentLike = globalThis.document, composer = null) {
  const fromComposer = readMode(composer);
  if (fromComposer) return fromComposer;
  return componentModeFallback(documentLike, composer) || { mode: null, root: null };
}

export function resolveMarinaraChatComposer(documentLike = globalThis.document) {
  if (!documentLike) return null;

  // Roleplay and Conversation explicitly mark their active composer.
  const marked = visibleTextareas(
    documentLike,
    'textarea[data-chat-composer="true"], textarea[data-chat-composer]',
  );
  const markedInMode = marked.find((element) => readMode(element));
  if (markedInMode) return markedInMode;
  if (marked.length) return marked[0];

  // Marinara Engine 2.4.6 GameInput does not currently expose
  // data-chat-composer. Scope the fallback strictly to the visible game root
  // and its resource-drop-excluded input shell so unrelated textareas are
  // never treated as the chat composer.
  const gameRoots = (() => {
    try { return [...(documentLike.querySelectorAll?.('[data-chat-mode="game"]') || [])]; } catch { return []; }
  })();
  for (const gameRoot of gameRoots) {
    if (!isVisible(gameRoot)) continue;
    const resourceShells = (() => {
      try { return [...(gameRoot.querySelectorAll?.('[data-chat-resource-drop-exclude]') || [])]; } catch { return []; }
    })();
    for (const resourceShell of resourceShells) {
      if (!isVisible(resourceShell)) continue;
      const candidate = visibleTextareas(resourceShell)
        .find((element) => !safeClosest(element, '[data-message-id]'));
      if (candidate) return candidate;
    }
  }

  return null;
}

export function resolveMarinaraChatComposerAnchor(documentLike = globalThis.document) {
  const composer = resolveMarinaraChatComposer(documentLike);
  if (!composer) return null;

  const { mode, root } = detectMarinaraChatMode(documentLike, composer);
  const resourceShell = safeClosest(composer, '[data-chat-resource-drop-exclude]');
  const parent = composer.parentElement || null;

  // In Roleplay/Conversation the resource shell is the input bar itself.
  // In Game, data-chat-resource-drop-exclude wraps a larger GameInput region;
  // the textarea's direct parent is the actual input bar. Prefer that exact
  // local bar when it remains inside the authoritative resource shell.
  let shell = resourceShell || parent || composer;
  if (parent && resourceShell) {
    try {
      if (resourceShell === parent || resourceShell.contains?.(parent)) shell = parent;
    } catch { /* keep resource shell */ }
  } else if (parent) {
    shell = parent;
  }

  return {
    composer,
    shell,
    resourceShell: resourceShell || shell,
    root,
    mode,
  };
}

export const chatComposerAnchorInternals = {
  isVisible,
};
