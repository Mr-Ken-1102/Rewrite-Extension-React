import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mapRenderedSpanToRaw, spanIsBalanced, ctxFingerprint, fingerprintOk } from '../../src/services/spanMapper.js';
import { computeWordDiffSync, DIFF_TOKEN_CAP } from '../../src/services/diffWorkerService.js';
import { makeHistoryKey } from '../../src/utils/historyKey.js';
import { unwrapMatchingOuterQuotes } from '../../src/utils/textSanitizers.js';
import { normalizeRewriteResult } from '../../src/services/prompt/promptService.js';
import { DOMUtils } from '../../src/utils/domUtils.js';
import { readMessageDomIdentity } from '../../src/utils/messageDomIdentity.js';
import {
  detectMarinaraChatMode,
  resolveMarinaraChatComposer,
  resolveMarinaraChatComposerAnchor,
} from '../../src/utils/chatComposerAnchor.js';
import {
  clampFloatingPanelPosition,
  defaultDraftReplyPanelPosition,
  defaultFloatingPanelPosition,
  getVisualViewportBounds,
} from '../../src/utils/floatingPanelGeometry.js';
import { AUTO_PROFILE_FAILURE_BACKOFF_MS, autoProfileBackoffRemaining, shouldStartAutoProfile } from '../../src/services/autoProfilePolicy.js';
import { createExecutionCoordinator } from '../../src/controllers/rewriteExecution.js';
import { sanitizeAutoProfiles, sanitizeConfig } from '../../src/store/persistence/schema.js';
import {
  getVoiceProfile,
  makeVoiceIdentityKey,
  resolveVoiceIdentity,
  voiceIdentityFromMessage,
} from '../../src/services/voiceProfileIdentity.js';
import { createExtensionManifest } from '../../extension-manifest.mjs';
import {
  assembleLedgerText,
  buildMergedPayload,
  ledgerSliceBudgetChars,
  ledgerExecutionSignature,
  normalizeSelectionSegments,
  partialApplySummary,
  pendingApplyIndexes,
  splitMergedResult,
  splitTextToLedgerSlices,
  stripMessageSelectionEdgeWhitespace,
  subdivideLedgerSlice,
} from '../../src/services/advancedRewriteService.js';
import {
  buildHistoryContext,
  getMessagePersonaSnapshot,
  isMessageHiddenFromRewriteContext,
  isRewriteContextStartBoundary,
} from '../../src/utils/messageContext.js';

let passed = 0;
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

ok('repository structure keeps architecture docs out of the root', () => {
  assert.equal(existsSync('./PARITY-DESIGN-GUARDRAILS.md'), false);
  assert.equal(existsSync('./docs/architecture/PARITY-DESIGN-GUARDRAILS.md'), true);
  const structure = readFileSync('./docs/REPOSITORY-STRUCTURE.md', 'utf8');
  const readme = readFileSync('./README.md', 'utf8');
  assert.match(structure, /docs\/\n  architecture\//);
  assert.match(structure, /eslint\.config\.js/);
  assert.match(structure, /extension-manifest\.mjs/);
  assert.match(readme, /What changed since the first React build/);
  assert.match(readme, /## Credits/);
  assert.match(readme, /Beoopo’s Marinara Rewrite/);
});


function spliceMapped(rendered, raw, start, end, replacement) {
  const span = mapRenderedSpanToRaw(rendered, raw, start, end);
  return span ? raw.slice(0, span.as) + replacement + raw.slice(span.ae) : null;
}

ok('history is scoped by chat + message', () => {
  assert.equal(makeHistoryKey('chat-a', '7'), 'chat-a::7');
  assert.notEqual(makeHistoryKey('chat-a', '7'), makeHistoryKey('chat-b', '7'));
});

ok('Voice Profile identity keys distinguish Characters, Personas, and character-backed Personas', () => {
  assert.equal(makeVoiceIdentityKey({ kind: 'character', id: 'same' }), 'character:same');
  assert.equal(makeVoiceIdentityKey({ kind: 'persona', source: 'persona', id: 'same' }), 'persona:persona:same');
  assert.equal(makeVoiceIdentityKey({ kind: 'persona', source: 'character', id: 'same' }), 'persona:character:same');

  const char = voiceIdentityFromMessage({ role: 'assistant', characterId: 'char-2', characterName: 'Sami 2.0' });
  const persona = voiceIdentityFromMessage({
    role: 'user',
    extra: { personaSnapshot: { personaId: 'persona-7', name: 'Detective Ken', source: 'persona' } },
  });
  assert.equal(char.key, 'character:char-2');
  assert.equal(char.name, 'Sami 2.0');
  assert.equal(persona.key, 'persona:persona:persona-7');
  assert.equal(persona.name, 'Detective Ken');
});

ok('exact selected DOM Character outranks stale fallback DOM and API identities', () => {
  const oldCard = {
    getAttribute: (name) => name === 'data-card-css' ? 'char-old' : null,
    querySelector: () => null,
  };
  const newName = { textContent: 'Sami 1.17' };
  const newCard = {
    getAttribute: (name) => name === 'data-card-css' ? 'char-new' : null,
    querySelector: (selector) => selector === '.mari-message-name' ? newName : null,
  };
  const anchor = {
    closest: (selector) => selector === '[data-card-css]' ? newCard : null,
  };
  const messageElement = {
    getAttribute: (name) => name === 'data-message-role' ? 'assistant' : null,
    contains: (candidate) => candidate === anchor || candidate === newCard || candidate === oldCard,
    querySelector: (selector) => selector === '[data-card-css]' ? oldCard : (selector === '.mari-message-name' ? { textContent: 'Hương Sami 2.0' } : null),
  };

  const dom = readMessageDomIdentity(messageElement, anchor);
  assert.equal(dom.detectedRole, 'assistant');
  assert.equal(dom.detectedCharacterId, 'char-new');
  assert.equal(dom.detectedName, 'Sami 1.17');

  const resolved = resolveVoiceIdentity(
    { ...dom, mid: 'm-new', cid: 'chat-group' },
    { id: 'm-new', role: 'assistant', characterId: 'char-old', characterName: 'Hương Sami 2.0' },
  );
  assert.equal(resolved.key, 'character:char-new');
  assert.equal(resolved.name, 'Sami 1.17');
  assert.equal(resolved.sourceOfTruth, 'dom');
});

ok('v5 chat-wide auto profiles migrate to quarantined legacy buckets instead of matching a random identity', () => {
  const migrated = sanitizeAutoProfiles({
    'chat-old': { id: 'auto-chat-old', name: 'Old Voice', prompt: 'old prompt', order: -1, auto: true },
  });
  assert.ok(migrated['chat-old']?.legacy);
  assert.equal(migrated['chat-old'].legacy.legacy, true);
  assert.equal(getVoiceProfile(migrated, 'chat-old', 'character:any'), null);
});


ok('rewrite result normalization removes leaked protocol delimiters only at output boundaries', () => {
  assert.equal(normalizeRewriteResult('<rewrite_this>\nHello world\n</rewrite_this>'), 'Hello world');
  assert.equal(normalizeRewriteResult('<rewrite_this>\nHello world'), 'Hello world');
  assert.equal(normalizeRewriteResult('Hello world\n</rewrite_this>'), 'Hello world');
  assert.equal(normalizeRewriteResult('Keep <rewrite_this> inside the prose'), 'Keep <rewrite_this> inside the prose');
});

ok('identity rendered→stored mapping is exact', () => {
  const text = 'Tiếng Việt 👋 — exact text';
  assert.deepEqual(mapRenderedSpanToRaw(text, text, 6, 10), { as: 6, ae: 10 });
});

ok('markdown boundary guard rejects partial opaque token', () => {
  const raw = 'Before `secret()` after';
  const start = raw.indexOf('secret');
  assert.equal(spanIsBalanced(raw, start, start + 6), false);
});

ok('rendered→raw mapper preserves wrappers and refuses delimiter orphaning', () => {
  const bisect = (raw, rendered, selected) => {
    const start = rendered.indexOf(selected);
    return spliceMapped(rendered, raw, start, start + selected.length, 'X');
  };

  for (const [raw, rendered, selected] of [
    ['**bold** text', 'bold text', 'ld text'],
    ['*one two* three *four five*', 'one two three four five', 'two three four'],
    ['`aa` bb `cc`', 'aa bb cc', 'a bb c'],
    ['Hi [label](https://e.co) word.', 'Hi label word.', 'Hi lab'],
    ['Hi <b>text</b> word.', 'Hi text word.', 'Hi tex'],
    ['**bold with *inner* italic**', 'bold with inner italic', 'with inner'],
    ['<b>She said <i>maybe</i> softly</b>', 'She said maybe softly', 'said maybe'],
  ]) assert.equal(bisect(raw, rendered, selected), null, `unsafe boundary must refuse: ${raw}`);

  for (const [raw, rendered, selected, expected] of [
    ['**hey** there', 'hey there', 'hey', '**X** there'],
    ['*hi* there', 'hi there', 'hi', '*X* there'],
    ['**bold** text', 'bold text', 'bold', '**X** text'],
  ]) assert.equal(bisect(raw, rendered, selected), expected, `wrapper must survive: ${raw}`);
});

ok('rendered→raw mapper handles large transformed messages and selections', () => {
  const filler = (tag, count) => {
    let text = '';
    for (let i = 0; i < count; i += 1) {
      text += `${tag}${i}: the quick brown fox ${i * 7} jumps over the lazy dog ${i * 13}. `;
    }
    return text;
  };

  const pre = filler('Pre', 40);
  const post = filler('Post', 40);
  const raw = `${pre} She whispered *softly* to {{char}}, "hi" now. ${post}`;
  const rendered = `${pre} She whispered softly to Alice, “hi” now. ${post}`;
  assert.ok(raw.length * rendered.length > 4_000_000);
  const start = rendered.indexOf('softly');
  assert.equal(
    spliceMapped(rendered, raw, start, start + 'softly'.length, 'MURMURED'),
    `${pre} She whispered *MURMURED* to {{char}}, "hi" now. ${post}`,
  );

  const edgePre = filler('Lp', 30);
  const selected = filler('Lm', 60);
  const edgePost = filler('Lq', 30);
  assert.ok(selected.length > 1900);
  const rawWithWrapper = `${edgePre}*${selected}*${edgePost}`;
  const renderedWithoutWrapper = `${edgePre}${selected}${edgePost}`;
  assert.equal(
    spliceMapped(renderedWithoutWrapper, rawWithWrapper, edgePre.length, edgePre.length + selected.length, '<<X>>'),
    `${edgePre}*<<X>>*${edgePost}`,
  );
});

ok('context fingerprint distinguishes changed surroundings', () => {
  const full = 'alpha same phrase omega';
  const fp = ctxFingerprint(full, 'same phrase', 0);
  const start = full.indexOf('same phrase');
  assert.equal(fingerprintOk(fp, full, start, 'same phrase'.length), true);
  const changed = 'beta same phrase omega';
  assert.equal(fingerprintOk(fp, changed, changed.indexOf('same phrase'), 'same phrase'.length), false);
});

ok('diff path is bounded and still returns content', () => {
  const small = computeWordDiffSync('one two', 'one three');
  assert.ok(small.some((op) => op.t === 'ins'));
  const huge = Array.from({ length: DIFF_TOKEN_CAP + 50 }, (_, i) => `w${i}`).join(' ');
  const bounded = computeWordDiffSync(huge, `${huge} tail`);
  assert.ok(bounded.some((op) => String(op.v).includes('Text too long for inline diff')));
});

ok('no persisted undo history in Zustand partialize', () => {
  const store = readFileSync('./src/store/usePersistentStore.js', 'utf8');
  assert.match(store, /partialize:\s*\(state\)\s*=>\s*\(\{[\s\S]*profiles:\s*state\.profiles,[\s\S]*config:\s*state\.config,[\s\S]*customs:\s*state\.customs,[\s\S]*autoProfiles:\s*state\.autoProfiles[\s\S]*\}\)/s);
  assert.doesNotMatch(store, /partialize:[\s\S]{0,250}history:/);
});


ok('new installs keep identity context opt-in while using the requested layout/history defaults', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  assert.match(schema, /cols:\s*4/);
  assert.match(schema, /rows:\s*4/);
  assert.match(schema, /historyDepth:\s*1/);
  assert.match(schema, /contextDepth:\s*1/);
  assert.match(schema, /injectChar:\s*false/);
  assert.match(schema, /injectUser:\s*false/);
  assert.match(schema, /injectLorebook:\s*false/);
  assert.match(schema, /useExtenderMemory:\s*false/);
  assert.match(schema, /autoProfileEnabled:\s*false/);
  assert.match(schema, /draftReplyEnabled:\s*true/);
  assert.match(schema, /draftReplyHistoryDepth:\s*8/);
  assert.match(schema, /draftReplyLauncherPlacement:\s*'auto'/);
  assert.match(schema, /draftReplyLauncherPositions:\s*\{\}/);
});

ok('Persona Reply launcher placement config is sanitized and scoped to supported Marinara modes', () => {
  const clean = sanitizeConfig({
    draftReplyLauncherPlacement: 'remember',
    draftReplyLauncherPositions: {
      roleplay: { left: 120.4, top: 55.8 },
      conversation: { left: -50, top: 200000 },
      game: { left: 42, top: 84 },
      unknown: { left: 1, top: 2 },
      __proto__: { left: 3, top: 4 },
    },
  });
  assert.equal(clean.draftReplyLauncherPlacement, 'remember');
  assert.deepEqual(clean.draftReplyLauncherPositions, {
    roleplay: { left: 120.4, top: 55.8 },
    conversation: { left: 0, top: 100000 },
    game: { left: 42, top: 84 },
  });

  const invalid = sanitizeConfig({
    draftReplyLauncherPlacement: 'freeform',
    draftReplyLauncherPositions: {
      roleplay: { left: 'not-a-number', top: 20 },
    },
  });
  assert.equal(invalid.draftReplyLauncherPlacement, 'auto');
  assert.deepEqual(invalid.draftReplyLauncherPositions, {});
});

ok('Marinara private storage is preferred with legacy migration fallback', () => {
  const store = readFileSync('./src/store/usePersistentStore.js', 'utf8');
  const storage = readFileSync('./src/store/persistence/storageAdapter.js', 'utf8');
  assert.match(storage, /host\?\.storage/);
  assert.match(storage, /storage\.get/);
  assert.match(storage, /storage\.patch/);
  assert.match(store, /skipHydration:\s*true/);
  assert.match(storage, /safeLocalStorage\.getItem\(name\)/);
});

ok('character context supports bounded multi-character chats', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /function normalizeIdList/);
  assert.match(context, /\.slice\(0, 8\)/);
  assert.match(context, /Promise\.all/);
});

ok('destructive clean-data wildcard is gone', () => {
  const ui = readFileSync('./src/components/modals/settings/TabUI.jsx', 'utf8');
  assert.doesNotMatch(ui, /startsWith\(["']rwa-/);
});

ok('unsafe active-textarea commit fallback is gone', () => {
  const editor = readFileSync('./src/services/textEditorService.js', 'utf8');
  assert.doesNotMatch(editor, /querySelector\([^\n]*textarea/i);
  assert.match(editor, /textarea\.value !== savedSel\.originalValue/);
});

ok('Marinara v2.4.4 persona and lorebook contracts are pinned', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /personas:\s*['"]\/characters\/personas['"]/);
  assert.match(context, /Array\.isArray\(payload\?\.entries\)\s*\?\s*payload\.entries/);
  assert.match(context, /loreScan:\s*['"]\/lorebooks\/scan['"]/);
});

ok('Marinara v2.4.4 raw-generation payload stays schema-compatible', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  assert.match(provider, /generateRaw:\s*['"]\/generate\/raw['"]/);
  assert.match(provider, /connectionId,/);
  assert.match(provider, /messages:\s*\[/);
  assert.match(provider, /streaming:\s*true/);
  assert.match(provider, /runId,/);
  assert.match(provider, /generateRaw\}\/abort/);
  assert.match(provider, /reasoningEffort:\s*null/);
  assert.doesNotMatch(provider, /max_tokens\s*:/);
});

ok('installable bundle requests the v2.4.4 full-page client runtime', () => {
  const manifest = createExtensionManifest('void 0;');
  assert.equal(manifest.runtime, 'client');
  assert.deepEqual(manifest.capabilities, ['full_page_access']);
  assert.equal(manifest.css, '');
  assert.equal(manifest.js, 'void 0;');
});


ok('Draft Reply composer resolution is mode-aware across roleplay, conversation, and game', () => {
  const rect = { left: 10, top: 20, right: 410, bottom: 80, width: 400, height: 60 };
  const makeRoot = (mode) => ({
    mode,
    tagName: 'DIV',
    getAttribute: (name) => name === 'data-chat-mode' ? mode : null,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 900, bottom: 700, width: 900, height: 700 }),
    contains(element) { return element?.root === this || element === this; },
    querySelectorAll() { return []; },
  });
  const makeComposer = ({ root, marked = true, resourceShell, parent }) => ({
    tagName: 'TEXTAREA',
    root,
    parentElement: parent,
    getBoundingClientRect: () => rect,
    closest(selector) {
      if (selector === '[data-chat-mode]') return root;
      if (selector === '[data-chat-resource-drop-exclude]') return resourceShell || null;
      if (selector === '[data-message-id]') return null;
      return null;
    },
    matches(selector) {
      return marked && (selector === '[data-chat-composer="true"]' || selector === '[data-chat-composer]');
    },
  });
  const makeDoc = ({ marked = [], gameRoots = [], roleplayRoot = null, conversationRoot = null }) => ({
    querySelectorAll(selector) {
      if (selector.includes('data-chat-composer')) return marked;
      if (selector === '[data-chat-mode="game"]') return gameRoots;
      return [];
    },
    querySelector(selector) {
      if (selector === '[data-component="ChatArea.Roleplay"]') return roleplayRoot;
      if (selector === '[data-component="ChatArea.Conversation"]') return conversationRoot;
      if (selector === '[data-chat-mode="game"]') return gameRoots[0] || null;
      return null;
    },
  });

  for (const mode of ['roleplay', 'conversation']) {
    const root = makeRoot(mode);
    const shell = {
      getBoundingClientRect: () => rect,
      contains: (element) => element === shell,
    };
    const composer = makeComposer({ root, resourceShell: shell, parent: shell });
    const doc = makeDoc({
      marked: [composer],
      roleplayRoot: mode === 'roleplay' ? root : null,
      conversationRoot: mode === 'conversation' ? root : null,
    });
    assert.equal(resolveMarinaraChatComposer(doc), composer);
    assert.equal(detectMarinaraChatMode(doc, composer).mode, mode);
    const anchor = resolveMarinaraChatComposerAnchor(doc);
    assert.equal(anchor.mode, mode);
    assert.equal(anchor.shell, shell);
    assert.equal(anchor.resourceShell, shell);
  }

  const gameRoot = makeRoot('game');
  const gameResourceShell = {
    getBoundingClientRect: () => ({ left: 0, top: 500, right: 900, bottom: 700, width: 900, height: 200 }),
    contains: (element) => element === gameInputBar,
    querySelectorAll: (selector) => selector === 'textarea' ? [gameComposer] : [],
  };
  const gameInputBar = {
    getBoundingClientRect: () => rect,
  };
  const gameComposer = makeComposer({
    root: gameRoot,
    marked: false,
    resourceShell: gameResourceShell,
    parent: gameInputBar,
  });
  gameRoot.querySelectorAll = (selector) => selector === '[data-chat-resource-drop-exclude]' ? [gameResourceShell] : [];
  const gameDoc = makeDoc({ gameRoots: [gameRoot] });

  assert.equal(resolveMarinaraChatComposer(gameDoc), gameComposer);
  const gameAnchor = resolveMarinaraChatComposerAnchor(gameDoc);
  assert.equal(gameAnchor.mode, 'game');
  assert.equal(gameAnchor.shell, gameInputBar);
  assert.equal(gameAnchor.resourceShell, gameResourceShell);

  const hiddenGameComposer = {
    ...gameComposer,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  };
  gameResourceShell.querySelectorAll = (selector) => selector === 'textarea' ? [hiddenGameComposer] : [];
  assert.equal(resolveMarinaraChatComposer(gameDoc), null);
});

ok('Marinara v2.4.4 composer is never mistaken for a sent-message editor', () => {
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  assert.match(dom, /data-chat-composer/);
  assert.match(dom, /closest\?\.\('\[data-message-id\]'\)/);
});

ok('modeless Draft Reply geometry stays inside the visual viewport', () => {
  const bounds = getVisualViewportBounds({
    innerWidth: 1200,
    innerHeight: 800,
    visualViewport: { offsetLeft: 40, offsetTop: 20, width: 900, height: 640 },
  });
  assert.deepEqual(bounds, { left: 40, top: 20, right: 940, bottom: 660, width: 900, height: 640 });

  const clamped = clampFloatingPanelPosition(
    { left: 900, top: 640 },
    { width: 620, height: 420 },
    bounds,
  );
  assert.deepEqual(clamped, { left: 312, top: 232 });

  const initial = defaultFloatingPanelPosition(
    { width: 620, height: 420 },
    bounds,
  );
  assert.equal(initial.left, 180);
  assert.ok(initial.top >= 28 && initial.top <= 68);

  const contextual = defaultDraftReplyPanelPosition(
    { width: 620, height: 420 },
    bounds,
    {
      root: {
        getBoundingClientRect: () => ({ left: 100, top: 20, right: 900, bottom: 660, width: 800, height: 640 }),
      },
      shell: {
        getBoundingClientRect: () => ({ left: 100, top: 700, right: 900, bottom: 760, width: 800, height: 60 }),
      },
    },
  );
  assert.equal(contextual.left, 190);
  assert.ok(contextual.top >= 100 && contextual.top <= 130);
});

ok('Draft Reply is preview-first, Persona-scoped, cancellable, and never auto-sends', () => {
  const app = readFileSync('./src/App.jsx', 'utf8');
  const service = readFileSync('./src/services/draftReplyService.js', 'utf8');
  const session = readFileSync('./src/hooks/useDraftReplySession.js', 'utf8');
  const launcher = readFileSync('./src/components/draft/DraftReplyLauncher.jsx', 'utf8');
  const dragHook = readFileSync('./src/hooks/useFloatingPanelDrag.js', 'utf8');
  const modal = readFileSync('./src/components/draft/DraftReplyModal.jsx', 'utf8');
  const draftStyles = readFileSync('./src/styles-draft-reply.js', 'utf8');
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  const main = readFileSync('./src/main.jsx', 'utf8');

  assert.match(app, /<DraftReplyLauncher/);
  assert.match(app, /<DraftReplyModal/);
  assert.match(app, /draftUiOpen \|\| !!popupPosition/);
  assert.match(service, /CURRENT USER PERSONA/);
  assert.match(service, /Never write, invent, or continue dialogue/);
  assert.match(service, /ProviderService\.runInference/);
  assert.match(service, /draftReplyHistoryDepth/);
  assert.match(service, /validatePersonaOnlyDraft/);
  assert.match(service, /resolveActivePersonaIdentity/);
  assert.match(service, /expectedPersonaFingerprint/);
  assert.match(service, /personaSourceFingerprint/);
  assert.match(service, /active Persona changed while Draft Reply was generating/i);
  assert.match(service, /Persona card changed while Draft Reply was generating/i);
  assert.match(session, /controller\.abort/);
  assert.match(session, /setChatComposerValue\(current\.result\)/);
  assert.doesNotMatch(session, /mari-chat-send-btn|\.click\(\)/);
  assert.match(launcher, /DOMUtils\.getChatComposerAnchor/);
  assert.match(launcher, /data-rwa-feature="draft-reply"/);
  assert.match(launcher, /data-rwa-chat-mode/);
  assert.match(launcher, /draftReplyLauncherPlacement/);
  assert.match(launcher, /draftReplyLauncherPositions/);
  assert.match(launcher, /SUPPORTED_MODES/);
  assert.match(launcher, /allowInteractiveRoot:\s*true/);
  assert.match(launcher, /suppressClickRef/);
  assert.match(dragHook, /Math\.hypot\(dx, dy\) >= 3/);
  assert.match(dragHook, /allowInteractiveRoot/);
  assert.match(dragHook, /panel\.style\.left =/);
  assert.match(dragHook, /panel\.style\.top =/);
  assert.match(dragHook, /panel\.dataset\.rwaDragging = 'true'/);
  assert.match(dragHook, /delete panel\.dataset\.rwaDragging/);
  assert.match(dom, /resolveMarinaraChatComposer/);
  assert.match(dom, /resolveMarinaraChatComposerAnchor/);
  assert.match(launcher, /Trả lời theo Persona|Persona Reply/);
  const rewriteSection = readFileSync('./src/components/popup/RewriteSection.jsx', 'utf8');
  const popupFooter = readFileSync('./src/components/popup/PopupFooter.jsx', 'utf8');
  const localizationGuide = readFileSync('./docs/LOCALIZATION-VI.md', 'utf8');
  assert.match(rewriteSection, /Thiết lập sẵn/);
  assert.doesNotMatch(rewriteSection, /Chọn kiểu viết/);
  assert.match(popupFooter, /Yêu cầu tùy chỉnh/);
  assert.match(modal, /Soạn trả lời/);
  assert.match(modal, /Hồ sơ giọng/);
  assert.match(localizationGuide, /Style preset \/ preset \| Thiết lập sẵn/);
  assert.match(localizationGuide, /Persona Reply \| Trả lời theo Persona/);
  assert.match(session, /chatMode/);
  assert.match(session, /MutationObserver/);
  assert.match(session, /activeAnchor\?\.mode !== current\.chatMode/);
  assert.match(session, /verifiedAnchor\?\.mode !== current\.chatMode/);
  assert.match(session, /activeChatId !== current\.chatId/);
  assert.match(session, /DraftReplyService\.resolveActivePersona\(chatId/);
  assert.match(session, /personaResolving: true/);
  assert.match(session, /expectedPersonaKey: current\.persona\.key/);
  assert.match(session, /expectedPersonaFingerprint: current\.personaSourceFingerprint/);
  assert.match(session, /resolved\.identity\.key !== current\.persona\.key/);
  assert.match(session, /resolved\.sourceFingerprint !== current\.personaSourceFingerprint/);
  assert.match(modal, /Resolving Persona/);
  assert.match(modal, /disabled=\{isPersonaResolving \|\| !state\.persona\?\.key\}/);
  assert.match(modal, /useFloatingPanelDrag/);
  assert.match(modal, /sessionPanelPositions/);
  assert.match(modal, /defaultDraftReplyPanelPosition/);
  assert.match(modal, /panel\.dataset\.rwaDragging === 'true'/);
  assert.match(modal, /aria-modal="false"/);
  assert.match(modal, /data-rwa-feature="draft-reply-window"/);
  assert.match(modal, /rwa-draft-header/);
  assert.match(modal, /rwa-draft-footer/);
  assert.match(modal, /rwa-draft-brand-eyebrow[^\n]*Rewrite Assistant/);
  assert.match(modal, /rwa-draft-guidance-row/);
  assert.match(modal, /rwa-draft-guidance-question/);
  assert.match(modal, /rwa-draft-guidance-source/);
  assert.match(modal, /rwa-draft-compose/);
  assert.doesNotMatch(modal, /rwa-draft-profile-note/);
  assert.doesNotMatch(modal, /<Modal\b/);
  assert.ok(modal.indexOf('rwa-draft-persona-chip') > modal.indexOf('rwa-draft-header'));
  assert.match(draftStyles, /\.rwa-draft-header,\s*\n\.rwa-draft-footer\s*\{[\s\S]*height:\s*36px/s);
  assert.match(draftStyles, /\.rwa-draft-guidance-row\s*\{[\s\S]*display:\s*flex/s);
  assert.match(draftStyles, /--rwa-draft-gutter:\s*12px/);
  assert.match(draftStyles, /--rwa-draft-gap:\s*8px/);
  assert.match(draftStyles, /\.rwa-draft-header\s*\{[\s\S]*padding:\s*0 var\(--rwa-draft-gutter\)/s);
  assert.match(draftStyles, /\.rwa-draft-body\s*\{[\s\S]*padding:\s*11px var\(--rwa-draft-gutter\)/s);
  assert.match(draftStyles, /\.rwa-draft-footer\s*\{[\s\S]*padding:\s*0 var\(--rwa-draft-gutter\)/s);
  assert.match(draftStyles, /\.rwa-draft-compose\s*\{[\s\S]*gap:\s*var\(--rwa-draft-gap\)/s);
  assert.match(draftStyles, /\.rwa-draft-mode-row\s*\{[\s\S]*gap:\s*var\(--rwa-draft-gap\)/s);
  assert.match(draftStyles, /scrollbar-gutter:\s*auto/);
  assert.match(draftStyles, /\.rwa-draft-footer \.rwa-btn\s*\{[\s\S]*height:\s*30px;[\s\S]*font-size:\s*11\.2px/s);
  assert.match(draftStyles, /var\(--rwa2-bg/);
  assert.match(modal, /Insert into composer/);
  assert.match(modal, /Another/);
  assert.match(modal, /Shorter/);
  assert.match(modal, /Longer/);
  assert.doesNotMatch(modal, /mari-chat-send-btn/);
  assert.match(dom, /dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/);
  assert.match(main, /RWA_DRAFT_REPLY_CSS/);
});


ok('edit-textarea detection is behaviorally fail-closed', () => {
  const rect = { width: 300, height: 80 };
  const makeTextarea = ({ composer = false, inMessage = false, id = '', className = '' } = {}) => ({
    tagName: 'TEXTAREA',
    id,
    className,
    matches: (selector) => selector === '[data-chat-composer="true"]' && composer,
    closest: (selector) => {
      if (selector === '[data-chat-composer="true"]') return composer ? {} : null;
      if (selector === '[data-message-id]') return inMessage ? {} : null;
      return null;
    },
    getBoundingClientRect: () => rect,
  });

  assert.equal(DOMUtils.isEditTextarea(makeTextarea({ composer: true, inMessage: true })), false);
  assert.equal(DOMUtils.isEditTextarea(makeTextarea({ inMessage: false })), false);
  assert.equal(DOMUtils.isEditTextarea(makeTextarea({ inMessage: true })), true);
  assert.equal(DOMUtils.isEditTextarea(makeTextarea({ inMessage: true, id: 'chat-input' })), false);
});

ok('v2.4.4 sidecar prompt cap is enforced before request', () => {
  const prompt = readFileSync('./src/services/prompt/promptService.js', 'utf8');
  assert.match(prompt, /config\.connMode === 'sidecar' \? Math\.min\(16000, configuredMax\)/);
});

ok('persisted profile collection is bounded for Marinara private storage', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  assert.match(schema, /\.slice\(0, 64\)/);
  assert.match(schema, /name:\s*profile\.name\.trim\(\)\.slice\(0, 80\)/);
  assert.match(schema, /const rawPrompt = profile\.prompt\.trim\(\)\.slice\(0, 5000\)/);
  assert.match(schema, /let byteBudget = 500_000/);
  assert.match(schema, /truncateUtf8\(rawPrompt, byteBudget - baseBytes\)/);
});


ok('async private-storage hydration completes before React mount', () => {
  const main = readFileSync('./src/main.jsx', 'utf8');
  const hydrate = main.indexOf('await usePersistentStore.persist.rehydrate()');
  const mount = main.indexOf('ReactDOM.createRoot');
  assert.ok(hydrate >= 0 && mount > hydrate);
});

ok('direct API preserves an explicit temperature of zero', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  assert.doesNotMatch(provider, /Number\(config\.directTemp\)\s*\|\|\s*0\.7/);
  assert.match(provider, /Number\.isFinite\(Number\(config\.directTemp\)\)/);
});

ok('prompt fencing neutralizes every reserved context tag', () => {
  const prompt = readFileSync('./src/services/prompt/promptService.js', 'utf8');
  assert.match(prompt, /\['rewrite_this', 'context', 'character', 'persona', 'lore', 'memory', 'speaker'\]/);
  assert.match(prompt, /for \(const reservedTag of reserved\)/);
});

ok('sidecar limit is enforced at the provider boundary too', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  assert.match(provider, /systemPrompt\.length > 16000 \|\| userPrompt\.length > 16000/);
});

ok('settings remains mounted and inert behind child dialogs to avoid compositor flashing', () => {
  const app = readFileSync('./src/App.jsx', 'utf8');
  const settings = readFileSync('./src/components/modals/SettingsModal.jsx', 'utf8');
  assert.match(app, /\['settings', 'editProfile', 'aiArchitect'\]\.includes\(activeModal\)/);
  assert.match(app, /suspended=\{activeModal !== 'settings'\}/);
  assert.match(settings, /useDialogFocusTrap\(dialogRef, onClose, !suspended\)/);
  assert.match(settings, /inert=\{suspended \? true : undefined\}/);
});

ok('clipboard fallback always removes its temporary textarea', () => {
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  assert.match(dom, /finally \{\s*temp\?\.remove\(\);\s*\}/s);
});


ok('modern Marinara API fetch fails closed on HTTP errors', () => {
  const host = readFileSync('./src/services/marinaraHost.js', 'utf8');
  assert.match(host, /if \(!response\.ok\) throw httpError\(response\.status, response\.statusText, data\)/);
  assert.match(host, /const normalizedPath = path\.startsWith\('\/api\/'\) \? path\.slice\(4\) : path/);
});

ok('Marinara routing is explicit, fail-closed, and never silently switches providers', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  const tab = readFileSync('./src/components/modals/settings/TabAPI.jsx', 'utf8');
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  assert.match(schema, /marinaraRouting:\s*'chat'/);
  assert.match(provider, /config\.marinaraRouting === 'fixed' \? 'fixed' : 'chat'/);
  assert.match(provider, /source: 'fixed'/);
  assert.match(provider, /source: 'chat'/);
  assert.doesNotMatch(provider, /const first = list\[0\]\.id/);
  assert.match(tab, /Follow current chat \(default\)/);
  assert.match(tab, /Use a specific Marinara connection/);
  assert.match(tab, /value=\{config\.connectionId \|\| ''\}/);
});

ok('temperature zero is preserved in settings and provider payload', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  const tab = readFileSync('./src/components/modals/settings/TabAPI.jsx', 'utf8');
  assert.doesNotMatch(tab, /Number\(e\.target\.value\)\s*\|\|\s*0\.7/);
  assert.match(tab, /Number\.isFinite\(value\)/);
  assert.doesNotMatch(provider, /Number\(config\.directTemp\)\s*\|\|\s*0\.7/);
});


ok('host cleanup is registered before async hydration can mount late', () => {
  const main = readFileSync('./src/main.jsx', 'utf8');
  const cleanup = main.indexOf('currentMarinara.onCleanup(destroyInstance)');
  const hydrate = main.indexOf('await usePersistentStore.persist.rehydrate()');
  const guard = main.indexOf('if (destroyed) return;', hydrate);
  assert.ok(cleanup >= 0 && hydrate > cleanup && guard > hydrate);
  assert.doesNotMatch(main, /currentMarinara\.destroy\s*=/);
});

ok('dialog focus trap is stable across onClose callback identity changes', () => {
  const hook = readFileSync('./src/hooks/useDialogFocusTrap.js', 'utf8');
  assert.match(hook, /const onCloseRef = useRef\(onClose\)/);
  assert.match(hook, /onCloseRef\.current = onClose/);
  assert.doesNotMatch(hook, /\}, \[dialogRef, onClose\]\);/);
});

ok('App avoids whole persistent-store subscriptions during pointer/modal work', () => {
  const app = readFileSync('./src/App.jsx', 'utf8');
  const hook = readFileSync('./src/hooks/useRewriteSession.js', 'utf8');
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  assert.ok(app.split(/\r?\n/).length < 160);
  assert.doesNotMatch(app, /usePersistentStore/);
  assert.match(hook, /createRewriteSessionController/);
  assert.match(controller, /usePersistentStore\.getState\(\)\.config/);
  assert.match(controller, /usePersistentStore\.getState\(\)\.history/);
});

ok('legacy direct apiFetch use is centralized in host adapter only', () => {
  const architect = readFileSync('./src/components/modals/AIArchitectModal.jsx', 'utf8');
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  assert.doesNotMatch(architect, /marinara\.apiFetch/);
  assert.doesNotMatch(popup, /marinara\.apiFetch/);
});


ok('persisted JSON cannot overwrite Zustand store actions', () => {
  const store = readFileSync('./src/store/usePersistentStore.js', 'utf8');
  const mergeStart = store.indexOf('merge: (persisted, current)');
  const mergeEnd = store.indexOf('}),', mergeStart);
  const mergeBlock = store.slice(mergeStart, mergeEnd + 3);
  assert.doesNotMatch(mergeBlock, /\.\.\.\(persisted/);
  assert.match(mergeBlock, /profiles:\s*sanitizeProfiles/);
  assert.match(mergeBlock, /config:\s*sanitizeConfig/);
});

ok('refine output unwraps only a matching outer quote pair', () => {
  assert.equal(unwrapMatchingOuterQuotes('“Rewrite this.”'), 'Rewrite this.');
  assert.equal(unwrapMatchingOuterQuotes('“Quoted words” remain here.'), '“Quoted words” remain here.');
  assert.equal(unwrapMatchingOuterQuotes('Say "hello"'), 'Say "hello"');
});

ok('role radar follows Marinara v2.4.4 message-role DOM contract', () => {
  const radar = readFileSync('./src/hooks/useRoleRadar.js', 'utf8');
  assert.match(radar, /getAttribute\('data-message-role'\)/);
  assert.match(radar, /mari-message-user/);
  assert.doesNotMatch(radar, /querySelector\('\.user-avatar'\)/);
});


ok('bundle manifest version is sourced from package.json', () => {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const manifest = createExtensionManifest('void 0;');
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.version, '3.0.3');
});

ok('cancelled Settings connection tests do not emit false abort/failure toasts', () => {
  const tab = readFileSync('./src/components/modals/settings/TabAPI.jsx', 'utf8');
  assert.match(tab, /if \(controller\.signal\.aborted\) return;\s*if \(response\?\.aborted\)/s);
  assert.match(tab, /!controller\.signal\.aborted && !MarinaraHost\.isAbortError\(err\)/);
});

ok('nested confirmation dialogs own keyboard focus handling', () => {
  const hook = readFileSync('./src/hooks/useDialogFocusTrap.js', 'utf8');
  assert.match(hook, /closest\?\.\('\[role=\"dialog\"\], \[role=\"alertdialog\"\]'\)/);
  assert.match(hook, /nearestDialog && nearestDialog !== dialog/);
});

ok('history context respects Marinara hidden-from-AI flags', () => {
  const messages = [
    { role: 'user', content: 'visible old', extra: {} },
    { role: 'assistant', content: 'globally hidden', extra: { hiddenFromAI: true } },
    { role: 'assistant', content: 'hidden from char-a', extra: { hiddenFromAICharacterIds: ['char-a'] } },
    { role: 'narrator', content: 'visible narrator', extra: {} },
    { role: 'assistant', characterId: 'char-a', content: 'target', extra: {} },
  ];
  const context = buildHistoryContext(messages, 4, 3, 'char-a');
  assert.equal(context, 'User: visible old\n\nNarrator: visible narrator');
  assert.equal(isMessageHiddenFromRewriteContext(messages[1], 'char-a'), true);
  assert.equal(isMessageHiddenFromRewriteContext(messages[2], 'char-a'), true);
  assert.equal(isMessageHiddenFromRewriteContext(messages[2], 'char-b'), false);
  assert.equal(isMessageHiddenFromRewriteContext(messages[2], null), true);
});

ok('history context never crosses Marinara conversation-start boundaries', () => {
  const globalStart = [
    { role: 'user', content: 'before global start', extra: {} },
    { role: 'assistant', content: 'hidden start marker', extra: { isConversationStart: true, hiddenFromAI: true } },
    { role: 'user', content: 'after global start', extra: {} },
    { role: 'assistant', characterId: 'char-a', content: 'target', extra: {} },
  ];
  assert.equal(buildHistoryContext(globalStart, 3, 10, 'char-a'), 'User: after global start');
  assert.equal(isRewriteContextStartBoundary(globalStart[1], 'char-a'), true);

  const characterStart = [
    { role: 'user', content: 'before char start', extra: {} },
    { role: 'assistant', content: 'char-a starts here', extra: { conversationStartForCharacterIds: ['char-a'] } },
    { role: 'user', content: 'after char start', extra: {} },
    { role: 'assistant', characterId: 'char-a', content: 'target', extra: {} },
  ];
  assert.equal(
    buildHistoryContext(characterStart, 3, 10, 'char-a'),
    'Character: char-a starts here\n\nUser: after char start',
  );
  assert.match(buildHistoryContext(characterStart, 3, 10, 'char-b'), /before char start/);
  assert.equal(isRewriteContextStartBoundary(characterStart[1], null), true);
  assert.doesNotMatch(buildHistoryContext(characterStart, 3, 10, null), /before char start/);
});

ok('Character context uses authoritative assistant identity with explicit fallback only when needed', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /const authoritativeCharacterId = role === 'assistant'[\s\S]*domIdentity\?\.id \|\| info\.message\?\.characterId/s);
  assert.match(context, /const authoritativeSender = authoritativeCharacterId[\s\S]*normalizeIdList\(authoritativeCharacterId\)/s);
  assert.match(context, /const characterIds = authoritativeSender\.length \? authoritativeSender : explicitCharacterIds/);
  assert.match(context, /wantsCharacter && characterIds\.length > 0/);
});

ok('server message role outranks DOM role heuristics', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /const role = info\.message\?\.role \|\| savedSel\.detectedRole \|\| null/);
  assert.doesNotMatch(context, /const role = savedSel\.detectedRole \|\| info\.message\?\.role/);
});

ok('Marinara raw-generation aborted responses propagate as cancellation', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  const tab = readFileSync('./src/components/modals/settings/TabAPI.jsx', 'utf8');
  assert.match(provider, /if \(result\.aborted === true\) return \{ aborted: true \}/);
  assert.match(controller, /if \(resp\?\.aborted\) \{[\s\S]{0,120}setState\(null\)/s);
  assert.match(tab, /if \(response\?\.aborted\)/);
});

ok('historical user messages preserve their persona identity', () => {
  assert.deepEqual(
    getMessagePersonaSnapshot({ extra: { personaSnapshot: { personaId: ' persona-old ', name: ' Past User ' } } }),
    { personaId: 'persona-old', name: 'Past User' },
  );
  assert.deepEqual(
    getMessagePersonaSnapshot({ extra: JSON.stringify({ personaSnapshot: { personaId: 'persona-json', name: 'JSON User' } }) }),
    { personaId: 'persona-json', name: 'JSON User' },
  );
  assert.deepEqual(
    getMessagePersonaSnapshot({ extra: { personaSnapshot: { personaId: 'char-user', name: 'Character User', source: 'character' } } }),
    { personaId: 'char-user', name: 'Character User', source: 'character' },
  );
  assert.equal(getMessagePersonaSnapshot({ extra: {} }), null);

  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /fetchUserPersona\(savedSel\.cid, signal, getMessagePersonaSnapshot\(info\.message\)\)/);
  assert.match(context, /personaCharacterId/);
  assert.match(context, /identitySource === 'character'/);
  assert.match(context, /if \(snapshot\?\.personaId\) return snapshot\?\.name/);
});

ok('assistant rewrites never let a stale manual Character override the selected sender', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  const domIdentity = readFileSync('./src/utils/messageDomIdentity.js', 'utf8');
  const identity = readFileSync('./src/services/voiceProfileIdentity.js', 'utf8');
  assert.match(context, /domIdentity\?\.id \|\| info\.message\?\.characterId/);
  assert.match(context, /const characterIds = authoritativeSender\.length \? authoritativeSender : explicitCharacterIds/);
  assert.match(context, /fetchCharCard\(savedSel\.cid, signal, characterIds\)/);
  assert.match(dom, /readMessageDomIdentity/);
  assert.match(domIdentity, /data-card-css/);
  assert.match(domIdentity, /mari-message-name/);
  assert.match(identity, /resolveVoiceIdentity/);
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  assert.match(popup, /voiceIdentityFromSelection\(selection\) \|\| tokenInfo\.voiceIdentity/);
});

ok('message-info aborts are not downgraded into missing metadata', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /if \(signal\?\.aborted \|\| MarinaraHost\.isAbortError\(err\)\) return \{ aborted: true \}/);
  assert.doesNotMatch(context, /getMessageInfo\([^\n]+\)\.catch\(\(\) => \(\{ messages:/);
});

ok('message-aware context fails closed while DOM Character metadata can avoid unnecessary message refetches', () => {
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /const needsMessageInfo = wantsHistory \|\| wantsPersona \|\| wantsSpeaker \|\| \(wantsCharacter && !explicitCharacterIds\.length\)/);
  assert.match(context, /const domIdentity = voiceIdentityFromSelection\(savedSel\)/);
  assert.match(api, /Could not assemble the enabled context/);
  assert.match(context, /The selected message is no longer available from Marinara/);
});

ok('failed commits keep the generated result recoverable in preview', () => {
  const app = readFileSync('./src/App.jsx', 'utf8');
  const apply = readFileSync('./src/controllers/applySessionController.js', 'utf8');
  const preview = readFileSync('./src/components/modals/PreviewModal.jsx', 'utf8');
  const editor = readFileSync('./src/services/textEditorService.js', 'utf8');
  assert.match(apply, /status: 'applying'/);
  assert.match(apply, /let commitInFlight = false/);
  assert.match(apply, /if \(!targetState \|\| commitInFlight\) return/);
  assert.match(apply, /if \(!applied\) \{[\s\S]*status: 'success'/s);
  assert.match(app, /\['loading', 'success', 'applying'\]/);
  assert.match(preview, /const isApplying = status === 'applying'/);
  assert.match(preview, /onClose=\{isApplying \? \(\) => \{\} : onClose\}/);
  assert.match(editor, /Clipboard recovery also failed; preview remains open so you can copy the result manually/);
});

ok('private storage read cleans stale legacy origin duplicate', () => {
  const storage = readFileSync('./src/store/persistence/storageAdapter.js', 'utf8');
  assert.match(storage, /if \(typeof privateValue === 'string'\) \{[\s\S]{0,400}safeLocalStorage\.removeItem\(name\);[\s\S]{0,120}return privateValue;/);
});

ok('role radar does not default unknown messages to assistant', () => {
  const radar = readFileSync('./src/hooks/useRoleRadar.js', 'utf8');
  const presentation = readFileSync('./src/hooks/useContextPresentation.js', 'utf8');
  assert.match(radar, /return radarRole \|\| domRole \|\| null/);
  assert.doesNotMatch(radar, /isUserDOM \? 'user' : 'assistant'/);
  assert.match(presentation, /if \(activeRole === 'assistant'\)/);
  assert.match(presentation, /System Context/);
});

ok('parity foundation preserves Rewrite strengths while adding safe reference features', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  const contextPanel = readFileSync('./src/components/popup/ContextPanel.jsx', 'utf8');
  const preview = readFileSync('./src/components/modals/PreviewModal.jsx', 'utf8');
  const profiles = readFileSync('./src/components/modals/settings/TabProfiles.jsx', 'utf8');
  const custom = readFileSync('./src/components/modals/CustomPromptModal.jsx', 'utf8');
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  assert.match(schema, /conciseSysPrompt:\s*false/);
  assert.match(schema, /localContextEnabled:\s*false/);
  assert.match(schema, /localContextWords:\s*150/);
  assert.match(schema, /hidden:\s*profile\.hidden === true/);
  const contextPolicy = readFileSync('./src/services/policies/contextPolicy.js', 'utf8');
  assert.match(contextPolicy, /'history',[\s\S]{0,120}'memory',[\s\S]{0,120}'lore',[\s\S]{0,120}'character',[\s\S]{0,120}'persona',[\s\S]{0,120}'surrounding',[\s\S]{0,120}'ledger'/);
  assert.match(api, /droppedContext:\s*promptInfo\.dropped/);
  assert.match(api, /onContextTrim/);
  assert.match(popup, /contextExclusions/);
  assert.match(popup, /selection\?\.captureId/);
  assert.match(popup, /deriveTrimmedSelection/);
  assert.match(popup, /pinnedPos/);
  assert.match(contextPanel, /This rewrite:/);
  assert.match(contextPanel, /rwa2-context-applied/);
  const contextPresentation = readFileSync('./src/hooks/useContextPresentation.js', 'utf8');
  assert.match(contextPresentation, /Char: \$\{characterNameText\}/);
  assert.match(contextPresentation, /Persona: \$\{personaNameText\}/);
  assert.match(preview, /Rewrite again/);
  assert.match(preview, /Viết lại lần nữa/);
  assert.match(preview, /Copied result to clipboard/);
  assert.match(profiles, /Search profiles/);
  assert.match(profiles, /profile\.hidden/);
  assert.match(custom, /Save as Profile/);
  assert.match(dom, /captureId: nextSelectionCaptureId\(\)/);
});

ok('parity part 2 adds context management without weakening provider trust', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const settings = readFileSync('./src/components/modals/SettingsModal.jsx', 'utf8');
  const contextTab = readFileSync('./src/components/modals/settings/TabContext.jsx', 'utf8');
  const dataTab = readFileSync('./src/components/modals/settings/TabData.jsx', 'utf8');
  const portable = readFileSync('./src/services/portableDataService.js', 'utf8');
  const debug = readFileSync('./src/services/debugLogService.js', 'utf8');
  assert.match(schema, /speakerAware:\s*false/);
  assert.match(schema, /useExtenderMemory:\s*false/);
  assert.match(schema, /autoProfileEnabled:\s*false/);
  assert.match(schema, /charCardIds:\s*\[\]/);
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(provider, /mode === 'extender'/);
  assert.match(context, /\/api\/memory-block\?characterId=/);
  assert.match(api, /static inspectContext/);
  assert.match(api, /static generateAutoProfile/);
  assert.match(api, /VoiceProfileService\.generateAutoProfile/);
  assert.match(settings, /<TabContext \/>/);
  assert.match(settings, /<TabData \/>/);
  assert.match(contextTab, /CHARACTER CONTEXT PICKER/);
  assert.match(dataTab, /PORTABLE EXPORT \/ IMPORT/);
  assert.match(portable, /ROUTING_KEYS/);
  assert.match(portable, /'connMode'.*'marinaraRouting'.*'connectionId'.*'ollamaUrl'.*'ollamaModel'.*'extenderUrl'/s);
  assert.doesNotMatch(debug, /localStorage|storage\.patch|persist/);
});

ok('auto profiles persist but session debug and undo history do not', () => {
  const store = readFileSync('./src/store/usePersistentStore.js', 'utf8');
  const partialize = store.match(/partialize:[^\n]+/s)?.[0] || '';
  assert.match(store, /autoProfiles:\s*state\.autoProfiles/);
  assert.doesNotMatch(partialize, /history/);
  assert.doesNotMatch(store, /debugLog/);
});

ok('release pipeline runs dependency-free preflights before package-dependent build steps', () => {
  const build = readFileSync('./tools/build/build-extension.mjs', 'utf8');
  const sourceIndex = build.indexOf("await import('../quality/sourcecheck.mjs')");
  const manifestIndex = build.indexOf("await import('../quality/manifestcheck.mjs')");
  const viteIndex = build.indexOf("await import('vite')");
  assert.ok(sourceIndex >= 0 && manifestIndex > sourceIndex && viteIndex > manifestIndex);

  const ci = readFileSync('./.github/workflows/ci.yml', 'utf8');
  const ciSource = ci.indexOf('node tools/quality/sourcecheck.mjs');
  const ciSelf = ci.indexOf('node tools/quality/selfcheck.mjs');
  const ciFailure = ci.indexOf('node tools/quality/failuremodecheck.mjs');
  const ciManifest = ci.indexOf('node tools/quality/manifestcheck.mjs');
  const ciInstall = ci.indexOf('run: npm ci');
  assert.ok(ciSource >= 0 && ciSelf > ciSource && ciFailure > ciSelf && ciManifest > ciFailure && ciInstall > ciManifest);
  assert.doesNotMatch(ci, /npm ci --ignore-scripts/);
});

ok('store schema v6 keeps privacy-minimal defaults and identity-scoped Voice Profiles', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  const adapter = readFileSync('./src/store/persistence/storageAdapter.js', 'utf8');
  assert.match(schema, /export const STORE_VERSION = 6/);
  assert.match(adapter, /export const STORE_VERSION = 6/);
  assert.match(schema, /identityKind/);
  assert.match(schema, /identityKey/);
  assert.match(schema, /sourceFingerprint/);
  assert.match(schema, /legacy.*true/);
  assert.match(schema, /autoProfileEnabled:\s*false/);
  assert.match(schema, /debugEnabled:\s*false/);
  assert.match(schema, /speakerAware:\s*false/);
  assert.match(schema, /useExtenderMemory:\s*false/);
  assert.match(schema, /charCardIds:\s*\[\]/);
});

ok('auto-profile policy yields to manual rewrites and enforces a 60-second failure backoff', () => {
  assert.equal(AUTO_PROFILE_FAILURE_BACKOFF_MS, 60_000);
  assert.equal(shouldStartAutoProfile({ enabled: true, hasProfile: false, isProcessing: true, attempt: null, now: 100_000 }), false);
  assert.equal(shouldStartAutoProfile({ enabled: true, hasProfile: false, isProcessing: false, attempt: { state: 'failed', at: 50_000 }, now: 100_000 }), false);
  assert.equal(autoProfileBackoffRemaining({ state: 'failed', at: 50_000 }, 100_000), 10_000);
  assert.equal(shouldStartAutoProfile({ enabled: true, hasProfile: false, isProcessing: false, attempt: { state: 'failed', at: 40_000 }, now: 100_000 }), true);
  const app = readFileSync('./src/App.jsx', 'utf8');
  const coordinator = readFileSync('./src/hooks/useAutoVoiceProfileCoordinator.js', 'utf8');
  const hook = readFileSync('./src/hooks/useAutoProfileGeneration.js', 'utf8');
  assert.match(app, /useAutoVoiceProfileCoordinator/);
  assert.match(coordinator, /isProcessing = useRuntimeStore/);
  assert.match(coordinator, /voiceIdentityFromMessage/);
  assert.match(coordinator, /useAutoProfileGeneration/);
  assert.match(hook, /shouldStartAutoProfile/);
  assert.match(hook, /autoProfileBackoffRemaining/);
});

ok('Character loading failures remain distinct from a legitimate empty result', () => {
  const contextTab = readFileSync('./src/components/modals/settings/TabContext.jsx', 'utf8');
  assert.match(contextTab, /characterLoadError/);
  assert.match(contextTab, /Character loading failed:/);
  assert.match(contextTab, /!characterLoadError && filtered\.length === 0/);
});

ok('portable import requires explicit confirmation while preserving provider routing', () => {
  const dataTab = readFileSync('./src/components/modals/settings/TabData.jsx', 'utf8');
  const portable = readFileSync('./src/services/portableDataService.js', 'utf8');
  assert.match(dataTab, /setPendingImport\(\{ patch, name:/);
  assert.match(dataTab, /<ConfirmModal/);
  assert.match(dataTab, /Provider routing remains untouched/);
  assert.match(dataTab, /onConfirm=\{confirmImport\}/);
  assert.match(portable, /ROUTING_KEYS/);
});

ok('debug logging is opt-in, bounded, session-only, and metadata-owned by the service', () => {
  const debug = readFileSync('./src/services/debugLogService.js', 'utf8');
  const dataTab = readFileSync('./src/components/modals/settings/TabData.jsx', 'utf8');
  assert.match(debug, /let enabled = false/);
  assert.match(debug, /if \(!enabled\) return false/);
  assert.match(debug, /const MAX_ENTRIES = 200/);
  assert.match(debug, /when: new Date\(\)\.toISOString\(\)/);
  assert.match(debug, /event: String\(event \|\| 'event'\)/);
  assert.doesNotMatch(debug, /localStorage|storage\.patch|persist/);
  assert.match(dataTab, /Debug logging is opt-in/);
});

ok('token preview is explicitly labeled Selection + context and snapshots selection once', () => {
  const panel = readFileSync('./src/components/popup/ContextPanel.jsx', 'utf8');
  const hook = readFileSync('./src/hooks/useContextInspector.js', 'utf8');
  assert.match(panel, /Selection \+ context ≈/);
  assert.match(panel, /not a provider billing\/tokenizer count/);
  assert.match(hook, /const oneShot = rewriteSelection\(\)/);
  assert.match(hook, /APIService\.inspectContext\(oneShot/);
  assert.match(hook, /sameSelection \? current\.parts : null/);
  assert.match(hook, /sameSelection \? current\.identities : null/);
  assert.match(hook, /tokenInfo\.selectionKey !== selectionKey/);
  assert.match(panel, /tokenInfo\.loading && !tokenInfo\.parts/);
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /characterNames:\s*extractIdentityNames\(context\.character\)/);
  assert.match(context, /personaNames:\s*extractIdentityNames\(context\.persona\)/);
});

ok('stale v2.3 shell branding is removed', () => {
  const html = readFileSync('./index.html', 'utf8');
  assert.match(html, /<title>Rewrite Assistant<\/title>/);
  assert.doesNotMatch(html, /v2[-.]?3|r-w-a-v2-3/i);
});

ok('CI keeps Node 24 security, pinned Engine, real artifact validation, and upload gates', () => {
  const ci = readFileSync('./.github/workflows/ci.yml', 'utf8');
  assert.match(ci, /node-version: '24'/);
  assert.match(ci, /npm audit --omit=dev --audit-level=high/);
  assert.match(ci, /npm audit --audit-level=moderate/);
  assert.match(ci, /ref: 1a299369ac7025028c3ce1b80cc59f47b7b0691b/);
  assert.match(ci, /node tools\/quality\/engine-compatcheck\.mjs vendor\/marinara-engine/);
  assert.match(ci, /Verify real installable artifact/);
  assert.match(ci, /actions\/upload-artifact@v4/);
});



ok('cross-message selection model preserves ordered message segments', () => {
  const segments = normalizeSelectionSegments({
    cid: 'chat-1',
    segments: [
      { mid: 'm1', text: ' alpha ', occ: 1, fp: { before: 'x' } },
      { mid: 'm2', text: 'beta', occ: 0, fp: { after: 'y' } },
    ],
  });
  assert.equal(segments.length, 2);
  assert.equal(segments[0].mid, 'm1');
  assert.equal(segments[1].mid, 'm2');
  assert.equal(segments[0].cid, 'chat-1');
  assert.equal(segments[0].occ, 1);
});

ok('merged rewrite markers are capture-bound and validated exactly', () => {
  const segments = [{ mid: 'm1', text: 'one' }, { mid: 'm2', text: 'two' }, { mid: 'm3', text: 'three' }];
  const merged = buildMergedPayload(segments, 'capture-9');
  assert.equal(merged.markers.length, 3);
  assert.match(merged.markers[0], /^\[\[RWA_SECTION_1_/);
  const good = `${merged.markers[0]}\nONE\n${merged.markers[1]}\nTWO\n${merged.markers[2]}\nTHREE`;
  assert.deepEqual(splitMergedResult(good, merged.markers), { ok: true, pieces: ['ONE', 'TWO', 'THREE'], reason: null });
  const reordered = `${merged.markers[0]}\nONE\n${merged.markers[2]}\nTHREE\n${merged.markers[1]}\nTWO`;
  assert.equal(splitMergedResult(reordered, merged.markers).ok, false);
  assert.equal(splitMergedResult(good.replace(merged.markers[1], '[[RWA_SECTION_2_TAMPERED]]'), merged.markers).ok, false);
});

ok('large-selection ledger splitter is lossless across Unicode and whitespace', () => {
  const original = `  Đầu 👋\n\n${'Một câu khá dài. '.repeat(500)}\nKết thúc.  `;
  const slices = splitTextToLedgerSlices(original, 1400);
  assert.ok(slices.length > 2);
  assert.equal(slices.map((slice) => slice.prefix + slice.text + slice.suffix).join(''), original);
  assert.ok(slices.every((slice) => slice.text.length <= 1400));
});

ok('ledger assembly keeps skipped originals and rewritten slices without losing separators', () => {
  const original = 'Alpha.  Beta.\n\nGamma.';
  const slices = splitTextToLedgerSlices(original, 8);
  slices[0].status = 'done';
  slices[0].result = 'A.';
  if (slices[1]) slices[1].status = 'skipped';
  const assembled = assembleLedgerText(slices);
  assert.match(assembled, /^A\./);
  assert.ok(assembled.includes(slices[1]?.text || ''));
  assert.ok(assembled.endsWith(slices.at(-1).suffix));
});

ok('provider-aware ledger budget leaves prompt headroom instead of truncating target text', () => {
  const sidecar = ledgerSliceBudgetChars({ connMode: 'sidecar', maxPromptChars: 32000 }, { prompt: 'x'.repeat(500) });
  const direct = ledgerSliceBudgetChars({ connMode: 'direct', maxPromptChars: 32000 }, { prompt: 'x'.repeat(500) });
  assert.ok(sidecar < 16000);
  assert.ok(direct > sidecar);
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const prompt = readFileSync('./src/services/prompt/promptService.js', 'utf8');
  assert.doesNotMatch(api, /savedSel\.text\.slice\(0,\s*10000\)/);
  assert.match(prompt, /RWA_TARGET_TOO_LARGE/);
});

ok('multi-message default is sequential and merged mode is explicit opt-in', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  assert.match(schema, /mergeMultiMsg:\s*false/);
  assert.match(schema, /mergeMultiMsg:\s*cleanBoolean/);
  assert.match(controller, /config\.mergeMultiMsg/);
  assert.match(controller, /runSequential/);
  assert.match(controller, /splitMergedResult/);
});

ok('manual-save mode prepares native editor without invoking an automatic PATCH', () => {
  const editor = readFileSync('./src/services/textEditorService.js', 'utf8');
  const start = editor.indexOf('static async prepareNativeEditor');
  const end = editor.indexOf('static async doUndoRedo', start);
  const block = editor.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.doesNotMatch(block, /patchMessage\(|guardedPatch\(|apiJSON\(/);
  assert.match(block, /did NOT save|press Marinara Save/i);
});

ok('manual-save uses Marinara edit event with localized Pencil fallback', () => {
  const editor = readFileSync('./src/services/textEditorService.js', 'utf8');
  assert.match(editor, /marinara:start-edit-message/);
  assert.match(editor, /lucide-pencil/);
  const native = readFileSync('./src/hooks/useNativeEvents.js', 'utf8');
  assert.match(native, /lucide-check/);
  assert.match(native, /lucide-x/);
});

ok('result recovery exposes selectable raw output, robust copy, and txt download', () => {
  const preview = readFileSync('./src/components/modals/PreviewModal.jsx', 'utf8');
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  assert.match(preview, /Raw result — always selectable for manual recovery/);
  assert.match(preview, /Save \.txt/);
  assert.match(preview, /Open native editor/);
  assert.match(dom, /document\.execCommand\('copy'\)/);
  assert.match(dom, /saveTextFile/);
});

ok('adaptive ledger subdivision preserves exact CRLF text and cleanup clears session prose', () => {
  const original = `  A\r\nB\r\n\r\n${'chunk '.repeat(120)}  `;
  const slices = splitTextToLedgerSlices(original, 320);
  assert.equal(slices.map((slice) => `${slice.prefix}${slice.text}${slice.suffix}`).join(''), original);
  const target = slices.find((slice) => slice.text.length > 256);
  const smaller = subdivideLedgerSlice(target, 256);
  assert.ok(smaller?.length > 1);
  assert.equal(smaller.map((slice) => `${slice.prefix}${slice.text}${slice.suffix}`).join(''), `${target.prefix}${target.text}${target.suffix}`);
  const main = readFileSync('./src/main.jsx', 'utf8');
  assert.match(main, /sessionLedgerStore\.clear\(\)/);
});

ok('partial-commit reporting never claims fake multi-message atomicity', () => {
  assert.equal(partialApplySummary([{ applied: true }, { applied: false }], 3), 'Partial apply: 1/3 applied (Message 1). Not applied: Message 2, Message 3.');
  const apply = readFileSync('./src/controllers/applySessionController.js', 'utf8');
  assert.match(apply, /if \(!applied\) break/);
  assert.match(apply, /partialApplySummary/);
});


ok('ledger resume identity changes with inference semantics but ignores unrelated UI layout', () => {
  const profile = { id: 'expand', name: 'Expand', prompt: 'Expand precisely.' };
  const selection = { source: 'message', cid: 'c1', mid: 'm1', text: ' hello ', occ: 0, fp: { before: 'a', after: 'b' }, renderedAtSelection: 'x hello y' };
  const base = { connMode: 'marinara', connectionId: 'conn-a', maxPromptChars: 32000, contextDepth: 4, conciseSysPrompt: false, cols: 3 };
  const signature = ledgerExecutionSignature(profile, selection, base);
  assert.equal(signature, ledgerExecutionSignature(profile, selection, { ...base, cols: 6 }));
  assert.notEqual(signature, ledgerExecutionSignature({ ...profile, prompt: 'Compress precisely.' }, selection, base));
  assert.notEqual(signature, ledgerExecutionSignature(profile, selection, { ...base, connectionId: 'conn-b' }));
  assert.notEqual(signature, ledgerExecutionSignature(profile, selection, { ...base, marinaraRouting: 'fixed' }));
  assert.notEqual(signature, ledgerExecutionSignature(profile, selection, { ...base, fastRewrite: true }));
  assert.notEqual(signature, ledgerExecutionSignature(profile, selection, { ...base, conciseSysPrompt: true }));
  assert.notEqual(signature, ledgerExecutionSignature(profile, { ...selection, fp: { before: 'changed' } }, base));
});

ok('ledger final output does not duplicate message-selection boundary whitespace', () => {
  const original = `  ${'Alpha beta. '.repeat(80)}\n`;
  const slices = splitTextToLedgerSlices(original, 256);
  assert.ok(slices.length > 1);
  for (const slice of slices) {
    slice.status = 'done';
    slice.result = slice.text.toUpperCase();
  }
  const assembled = assembleLedgerText(slices);
  assert.ok(assembled.startsWith('  '));
  assert.ok(assembled.endsWith('\n'));
  const stripped = stripMessageSelectionEdgeWhitespace({ source: 'message', text: original }, assembled);
  assert.ok(!stripped.startsWith('  '));
  assert.ok(!stripped.endsWith('\n'));
  assert.equal(stripMessageSelectionEdgeWhitespace({ source: 'textarea', text: original }, assembled), assembled);
});

ok('merged partial apply planner resumes only uncommitted messages', () => {
  assert.deepEqual(pendingApplyIndexes([{ applied: true }, { applied: false }, null, { applied: true }], 5), [1, 2, 4]);
  const apply = readFileSync('./src/controllers/applySessionController.js', 'utf8');
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  assert.match(apply, /pendingApplyIndexes\(results, targetState\.segments\.length\)/);
  assert.match(controller, /already partially committed/);
  assert.match(apply, /Press Accept All again to retry only the remaining messages/);
});

ok('ledger freezes prompt context for retries without retaining full messageInfo history', () => {
  const ledger = readFileSync('./src/controllers/ledgerSessionController.js', 'utf8');
  assert.match(ledger, /if \(!ledger\.context\)/);
  assert.match(ledger, /delete promptContext\.messageInfo/);
  assert.match(ledger, /ledger\.context = promptContext/);
  assert.match(ledger, /context = ledger\.context/);
});

ok('destructive message writes stop when the active chat changes', () => {
  const editor = readFileSync('./src/services/textEditorService.js', 'utf8');
  assert.match(editor, /function assertActiveChat/);
  assert.match(editor, /active chat changed after this rewrite started/i);
  assert.match(editor, /guardedPatch\(cid, mid, expected, content\)[\s\S]{0,100}assertActiveChat\(cid\)/);
});


ok('Persistence facade stays small while storage and schema domains are isolated', () => {
  const store = readFileSync('./src/store/usePersistentStore.js', 'utf8');
  const storage = readFileSync('./src/store/persistence/storageAdapter.js', 'utf8');
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  assert.ok(store.split(/\r?\n/).length < 180);
  assert.match(store, /createJSONStorage\(\(\) => extensionStorage\)/);
  assert.match(storage, /MarinaraHost/);
  assert.match(storage, /LEGACY_BACKUP_KEY/);
  assert.match(schema, /migratePersistedState/);
  assert.match(schema, /sanitizeConfig/);
});

ok('API facade stays small while prompt, context, and provider domains are isolated', () => {
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  const prompt = readFileSync('./src/services/prompt/promptService.js', 'utf8');
  assert.ok(api.split(/\r?\n/).length < 250);
  assert.match(api, /ContextService/);
  assert.match(api, /ProviderService/);
  assert.match(api, /promptService/);
  assert.match(context, /collectContext/);
  assert.match(provider, /runInference/);
  assert.match(prompt, /composePromptDetailed/);
});

ok('canonical context policy preserves local prose and ledger continuity longest', () => {
  const policy = readFileSync('./src/services/policies/contextPolicy.js', 'utf8');
  const prompt = readFileSync('./src/services/prompt/promptService.js', 'utf8');
  assert.match(policy, /CONTEXT_DROP_ORDER/);
  assert.match(policy, /'history',[\s\S]{0,120}'memory',[\s\S]{0,120}'lore',[\s\S]{0,120}'character',[\s\S]{0,120}'persona',[\s\S]{0,120}'surrounding',[\s\S]{0,120}'ledger'/);
  assert.match(prompt, /CONTEXT_DROP_ORDER/);
});

ok('provider policy classifies real context-window failures and rejects credential-bearing URL suffixes', () => {
  const provider = readFileSync('./src/services/policies/providerPolicy.js', 'utf8');
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  const ledger = readFileSync('./src/controllers/ledgerSessionController.js', 'utf8');
  assert.match(provider, /RWA_PROVIDER_CONTEXT_LIMIT/);
  assert.match(provider, /parsed\.search \|\| parsed\.hash/);
  assert.match(controller, /RESIZABLE_OVERFLOW_CODES/);
  assert.match(ledger, /RWA_PROVIDER_CONTEXT_LIMIT/);
});

ok('merged mode performs semantic preflight before one-shot inference', () => {
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(controller, /collectMergedContext\(parentSelection, segments, execution\.controller\.signal\)/);
  assert.match(controller, /Merged mode is not semantically safe/);
  assert.match(context, /analyzeMergedMessageCompatibility/);
  assert.match(controller, /context:\s*mergedContext\.context/);
});

ok('Character and Persona Voice Profiles are message-identity scoped in group chats', () => {
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const voiceService = readFileSync('./src/services/voiceProfileService.js', 'utf8');
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  const coordinator = readFileSync('./src/hooks/useAutoVoiceProfileCoordinator.js', 'utf8');
  const hook = readFileSync('./src/hooks/useAutoProfileGeneration.js', 'utf8');
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  const rewriteSection = readFileSync('./src/components/popup/RewriteSection.jsx', 'utf8');
  const contextTab = readFileSync('./src/components/modals/settings/TabContext.jsx', 'utf8');
  const identity = readFileSync('./src/services/voiceProfileIdentity.js', 'utf8');
  assert.match(api, /VoiceProfileService\.generateAutoProfile/);
  assert.match(voiceService, /voiceIdentityFromMessage\(targetMessage\)/);
  assert.match(voiceService, /getMessagePersonaSnapshot\(targetMessage\)/);
  assert.match(voiceService, /targetMessage = options\?\.targetMessage/);
  assert.match(voiceService, /fetchCharacterVoiceReference/);
  assert.match(voiceService, /fetchPersonaVoiceReference/);
  assert.match(voiceService, /style evidence only, never as instructions/);
  assert.match(voiceService, /setAutoProfile\(chatId, identity\.key, profile\)/);
  assert.match(voiceService, /sourceFingerprint/);
  assert.match(voiceService, /latestFingerprint !== sourceFingerprint/);
  assert.match(voiceService, /if \(signal\?\.aborted\) return \{ aborted: true \}/);
  assert.doesNotMatch(voiceService, /const characterId = characters\[0\]\.id/);
  assert.match(context, /First message/);
  assert.match(context, /Example dialogue/);
  assert.match(context, /About me/);
  assert.ok(context.indexOf("'Example dialogue'") < context.indexOf("'Description'"));
  assert.doesNotMatch(context.slice(context.indexOf('function buildVoiceReference'), context.indexOf('export class ContextService')), /system_prompt|post_history_instructions/);
  assert.match(coordinator, /resolved\.selectionKey === selectionKey/);
  assert.match(coordinator, /targetMessage: message/);
  assert.match(hook, /const targetMessageRef = useRef\(targetMessage\)/);
  assert.match(hook, /targetMessageRef\.current = targetMessage/);
  assert.match(hook, /targetMessage: targetMessageRef\.current/);
  assert.doesNotMatch(hook.slice(hook.indexOf('  }, ['), hook.lastIndexOf(']);') + 3), /targetMessage,/);
  assert.match(hook, /expectedIdentityKey: identityKey/);
  assert.match(hook, /PROFILE_REVALIDATE_MS/);
  assert.match(hook, /PROFILE_REVALIDATE_MS - \(now - lastValidated\)/);
  assert.match(hook, /setRetryTick\(\(value\) => value \+ 1\)/);
  assert.match(popup, /autoProfileBucket\[voiceIdentity\.key\]/);
  assert.match(rewriteSection, /identityKind === 'persona'/);
  assert.match(contextTab, /Automatic Character \/ Persona voice profiles/);
  assert.match(contextTab, /Generate for selected identity/);
  assert.match(identity, /persona:\$\{source\}:/);
  assert.match(identity, /character:\$\{id\}/);
});


ok('rewrite execution identity invalidates stale async work even when abort is ignored upstream', () => {
  const coordinator = createExecutionCoordinator();
  const first = coordinator.begin({ kind: 'single', captureId: 'cap-1', chatId: 'c1', messageIds: ['m1'] });
  assert.equal(coordinator.isCurrent(first), true);
  const second = coordinator.begin({ kind: 'single', captureId: 'cap-2', chatId: 'c1', messageIds: ['m2'] });
  assert.equal(first.controller.signal.aborted, true);
  assert.equal(coordinator.isCurrent(first), false);
  assert.equal(coordinator.isCurrent(second), true);
  assert.equal(second.identity.captureId, 'cap-2');
  assert.deepEqual(second.identity.messageIds, ['m2']);
  coordinator.abort(second);
  assert.equal(coordinator.isCurrent(second), false);
});

ok('workflow and popup responsibilities are split into focused modules', () => {
  const app = readFileSync('./src/App.jsx', 'utf8');
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  const controller = readFileSync('./src/controllers/rewriteSessionController.js', 'utf8');
  const ledger = readFileSync('./src/controllers/ledgerSessionController.js', 'utf8');
  const apply = readFileSync('./src/controllers/applySessionController.js', 'utf8');
  const runtime = readFileSync('./src/store/useRuntimeStore.js', 'utf8');
  assert.ok(app.split(/\r?\n/).length < 160);
  assert.ok(popup.split(/\r?\n/).length < 320);
  assert.match(controller, /createExecutionCoordinator/);
  assert.match(ledger, /createExecutionCoordinator/);
  assert.ok(controller.split(/\r?\n/).length < 340);
  assert.ok(apply.split(/\r?\n/).length < 160);
  assert.match(runtime, /isProcessing: newControllers\.size > 0/);
  assert.match(runtime, /isProcessing: next\.size > 0/);
  assert.doesNotMatch(runtime, /setProcessing:/);
});



ok('popup history and Voice Profile subscriptions stay scoped to the active chat and exact identity', () => {
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  assert.match(popup, /state\.history\[historyKey\]/);
  assert.match(popup, /state\.autoProfiles\?\.\[selection\.cid\]/);
  assert.match(popup, /autoProfileBucket\[voiceIdentity\.key\]/);
  assert.doesNotMatch(popup, /const history = usePersistentStore\(\(state\) => state\.history\)/);
  assert.doesNotMatch(popup, /const autoProfiles = usePersistentStore\(\(state\) => state\.autoProfiles\)/);
});

ok('package manifests pin exact resolved dependency versions', () => {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('./package-lock.json', 'utf8'));
  for (const group of ['dependencies', 'devDependencies']) {
    for (const [name, spec] of Object.entries(pkg[group] || {})) {
      assert.doesNotMatch(spec, /^[~^]/);
      assert.equal(spec, lock.packages[`node_modules/${name}`]?.version);
      assert.equal(lock.packages[''][group][name], spec);
    }
  }
});


ok('ledger source capacity is explicit and never silently truncates over-ceiling selections', () => {
  const advanced = readFileSync('./src/services/advancedRewriteService.js', 'utf8');
  const ledgerController = readFileSync('./src/controllers/ledgerSessionController.js', 'utf8');
  assert.match(advanced, /MAX_LEDGER_SOURCE_CHARS = 2_000_000/);
  assert.match(advanced, /RWA_LEDGER_CAPACITY/);
  assert.match(advanced, /nothing was truncated or sent/);
  assert.match(advanced, /MAX_SESSION_LEDGER_SOURCE_CHARS/);
  assert.match(advanced, /RWA_LEDGER_GRAPHEME_LIMIT/);
  assert.match(advanced, /safeUnicodeCut/);
  assert.match(ledgerController, /RWA_LEDGER_CAPACITY.*RWA_LEDGER_GRAPHEME_LIMIT/);
  assert.match(ledgerController, /status: 'error'/);
});

ok('diff worker has bounded response time and synchronous fallback', () => {
  const diff = readFileSync('./src/services/diffWorkerService.js', 'utf8');
  assert.match(diff, /DIFF_WORKER_TIMEOUT_MS = 1500/);
  assert.match(diff, /fallbackAllPending\(\)/);
  assert.match(diff, /clearTimeout\(pending\.timeoutId\)/);
  assert.match(diff, /resolve\(computeSync\(oldStr, newStr\)\)/);
});

ok('native editor targeting scans every wrapper for the exact message id', () => {
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  const editor = readFileSync('./src/services/textEditorService.js', 'utf8');
  assert.match(dom, /messageElementsForMid\(mid\)/);
  assert.match(editor, /for \(const root of messageRoots\(mid\)\)/);
  assert.match(editor, /DOMUtils\.messageElementsForMid\?\.\(mid\)/);
});

ok('property fuzzing is a first-class dependency-free CI gate', () => {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const ci = readFileSync('./.github/workflows/ci.yml', 'utf8');
  assert.match(pkg.scripts.test, /tools\/quality\/propertycheck\.mjs/);
  assert.equal(pkg.scripts['test:properties'], 'node tools/quality/propertycheck.mjs');
  assert.match(ci, /Dependency-free property\/fuzz gate/);
  assert.match(ci, /node tools\/quality\/propertycheck\.mjs/);
});

console.log(`\nselfcheck: ${passed}/${passed} assertions passed`);
