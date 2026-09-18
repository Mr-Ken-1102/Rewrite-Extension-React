import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapRenderedSpanToRaw, spanIsBalanced, ctxFingerprint, fingerprintOk } from './src/services/spanMapper.js';
import { computeWordDiffSync, DIFF_TOKEN_CAP } from './src/services/diffWorkerService.js';
import { makeHistoryKey } from './src/utils/historyKey.js';
import { unwrapMatchingOuterQuotes } from './src/utils/textSanitizers.js';
import { DOMUtils } from './src/utils/domUtils.js';
import { AUTO_PROFILE_FAILURE_BACKOFF_MS, autoProfileBackoffRemaining, shouldStartAutoProfile } from './src/services/autoProfilePolicy.js';
import { createExecutionCoordinator } from './src/controllers/rewriteExecution.js';
import { createExtensionManifest } from './extension-manifest.mjs';
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
} from './src/services/advancedRewriteService.js';
import {
  buildHistoryContext,
  getMessagePersonaSnapshot,
  isMessageHiddenFromRewriteContext,
  isRewriteContextStartBoundary,
} from './src/utils/messageContext.js';

let passed = 0;
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

function spliceMapped(rendered, raw, start, end, replacement) {
  const span = mapRenderedSpanToRaw(rendered, raw, start, end);
  return span ? raw.slice(0, span.as) + replacement + raw.slice(span.ae) : null;
}

ok('history is scoped by chat + message', () => {
  assert.equal(makeHistoryKey('chat-a', '7'), 'chat-a::7');
  assert.notEqual(makeHistoryKey('chat-a', '7'), makeHistoryKey('chat-b', '7'));
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


ok('new installs are privacy-minimal by default', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  assert.match(schema, /injectChar:\s*false/);
  assert.match(schema, /injectUser:\s*false/);
  assert.match(schema, /injectLorebook:\s*false/);
  assert.match(schema, /contextDepth:\s*0/);
  assert.match(schema, /useExtenderMemory:\s*false/);
  assert.match(schema, /autoProfileEnabled:\s*false/);
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
  assert.match(provider, /generateRawAbort:\s*['"]\/generate\/raw\/abort['"]/);
  assert.doesNotMatch(provider, /max_tokens\s*:/);
});

ok('installable bundle requests the v2.4.4 full-page client runtime', () => {
  const manifest = createExtensionManifest('void 0;');
  assert.equal(manifest.runtime, 'client');
  assert.deepEqual(manifest.capabilities, ['full_page_access']);
  assert.equal(manifest.css, '');
  assert.equal(manifest.js, 'void 0;');
});


ok('Marinara v2.4.4 composer is never mistaken for a sent-message editor', () => {
  const dom = readFileSync('./src/utils/domUtils.js', 'utf8');
  assert.match(dom, /data-chat-composer/);
  assert.match(dom, /closest\?\.\('\[data-message-id\]'\)/);
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

ok('only the active settings layer is rendered as a modal', () => {
  const app = readFileSync('./src/App.jsx', 'utf8');
  assert.match(app, /activeModal === 'settings'/);
  assert.doesNotMatch(app, /\['settings', 'editProfile', 'aiArchitect'\]\.includes\(activeModal\)/);
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

ok('Marinara connection ids are revalidated without silent provider switching', () => {
  const provider = readFileSync('./src/services/providers/providerService.js', 'utf8');
  const tab = readFileSync('./src/components/modals/settings/TabAPI.jsx', 'utf8');
  assert.match(provider, /list\.some\(\(item\) => item\.id === config\.connectionId\)/);
  assert.match(provider, /if \(config\.connectionId\) usePersistentStore\.getState\(\)\.updateConfig\(\{ connectionId: '' \}\)/);
  assert.doesNotMatch(provider, /const first = list\[0\]\.id/);
  assert.match(tab, /if \(config\.connectionId && !stillExists\) updateConfig\(\{ connectionId: '' \}\)/);
  assert.doesNotMatch(tab, /connectionId: list\[0\]\?\.id/);
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
  assert.equal(manifest.version, '3.0.1');
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
});

ok('unknown or non-character roles never trigger character-card injection', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /wantsCharacter && \(explicitCharacterIds\.length > 0 \|\| role === 'assistant'\)/);
  assert.doesNotMatch(context, /role !== 'user' && (?:config\.injectChar|wantsCharacter)/);
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
  assert.match(provider, /if \(result\?\.aborted === true\) return \{ \.\.\.result, connectionSource: resolved\.source, connectionId \}/);
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
  assert.match(context, /const personaSnapshot = getMessagePersonaSnapshot\(info\.message\)/);
  assert.match(context, /fetchUserPersona\(savedSel\.cid, signal, personaSnapshot\)/);
  assert.match(context, /personaCharacterId/);
  assert.match(context, /identitySource === 'character'/);
  assert.match(context, /if \(snapshot\?\.personaId\) return snapshot\?\.name/);
});

ok('assistant rewrites prefer the message sender character card', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /const authoritativeSender = role === 'assistant' \? normalizeIdList\(info\.message\?\.characterId\) : \[\]/);
  assert.match(context, /const characterIds = explicitCharacterIds\.length \? explicitCharacterIds : authoritativeSender/);
  assert.match(context, /fetchCharCard\(savedSel\.cid, signal, characterIds\)/);
});

ok('message-info aborts are not downgraded into missing metadata', () => {
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /if \(signal\?\.aborted \|\| MarinaraHost\.isAbortError\(err\)\) return \{ aborted: true \}/);
  assert.doesNotMatch(context, /getMessageInfo\([^\n]+\)\.catch\(\(\) => \(\{ messages:/);
});

ok('enabled message context fails closed instead of silently degrading', () => {
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const context = readFileSync('./src/services/context/contextService.js', 'utf8');
  assert.match(context, /const needsMessageInfo = wantsHistory \|\| wantsPersona \|\| wantsSpeaker \|\| \(wantsCharacter && !explicitCharacterIds\.length\)/);
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
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  assert.match(radar, /return radarRole \|\| domRole \|\| null/);
  assert.doesNotMatch(radar, /isUserDOM \? 'user' : 'assistant'/);
  assert.match(popup, /if \(activeRole === 'assistant'\)/);
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
  assert.match(api, /static async generateAutoProfile/);
  assert.match(settings, /<TabContext \/>/);
  assert.match(settings, /<TabData \/>/);
  assert.match(contextTab, /CHARACTER CONTEXT PICKER/);
  assert.match(dataTab, /PORTABLE EXPORT \/ IMPORT/);
  assert.match(portable, /ROUTING_KEYS/);
  assert.match(portable, /'connMode'.*'connectionId'.*'ollamaUrl'.*'ollamaModel'.*'extenderUrl'/s);
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
  const build = readFileSync('./build-extension.mjs', 'utf8');
  const sourceIndex = build.indexOf("await import('./sourcecheck.mjs')");
  const manifestIndex = build.indexOf("await import('./manifestcheck.mjs')");
  const viteIndex = build.indexOf("await import('vite')");
  assert.ok(sourceIndex >= 0 && manifestIndex > sourceIndex && viteIndex > manifestIndex);

  const ci = readFileSync('./.github/workflows/ci.yml', 'utf8');
  const ciSource = ci.indexOf('node sourcecheck.mjs');
  const ciSelf = ci.indexOf('node selfcheck.mjs');
  const ciFailure = ci.indexOf('node failuremodecheck.mjs');
  const ciManifest = ci.indexOf('node manifestcheck.mjs');
  const ciInstall = ci.indexOf('run: npm ci');
  assert.ok(ciSource >= 0 && ciSelf > ciSource && ciFailure > ciSelf && ciManifest > ciFailure && ciInstall > ciManifest);
  assert.doesNotMatch(ci, /npm ci --ignore-scripts/);
});

ok('store schema is v6 with privacy-minimal defaults and explicit streaming controls', () => {
  const schema = readFileSync('./src/store/persistence/schema.js', 'utf8');
  assert.match(schema, /export const STORE_VERSION = 6/);
  assert.match(schema, /fastRewrite:\s*false/);
  assert.match(schema, /marinaraTimeoutMs:\s*0/);
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
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  const hook = readFileSync('./src/hooks/useAutoProfileGeneration.js', 'utf8');
  assert.match(popup, /isProcessing = useRuntimeStore/);
  assert.match(popup, /useAutoProfileGeneration/);
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
  assert.match(ci, /npm audit --audit-level=critical/);
  assert.match(ci, /ref: 1a299369ac7025028c3ce1b80cc59f47b7b0691b/);
  assert.match(ci, /node engine-compatcheck\.mjs vendor\/marinara-engine/);
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

ok('group-chat auto-profile targeting uses explicit or authoritative character identity', () => {
  const api = readFileSync('./src/services/apiService.js', 'utf8');
  const hook = readFileSync('./src/hooks/useAutoProfileGeneration.js', 'utf8');
  const contextTab = readFileSync('./src/components/modals/settings/TabContext.jsx', 'utf8');
  assert.match(api, /resolveAutoProfileCharacter/);
  assert.doesNotMatch(api, /const characterId = characters\[0\]\.id/);
  assert.match(hook, /messageId: selection\?\.mid/);
  assert.match(contextTab, /preferredCharacterIds: config\.charCardIds/);
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



ok('popup history and auto-profile subscriptions are scoped to the active selection', () => {
  const popup = readFileSync('./src/components/PopupMain.jsx', 'utf8');
  assert.match(popup, /state\.history\[historyKey\]/);
  assert.match(popup, /state\.autoProfiles\?\.\[selection\.cid\]/);
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
  assert.match(pkg.scripts.test, /propertycheck\.mjs/);
  assert.equal(pkg.scripts['test:properties'], 'node propertycheck.mjs');
  assert.match(ci, /Dependency-free property\/fuzz gate/);
  assert.match(ci, /node propertycheck\.mjs/);
});

console.log(`\nselfcheck: ${passed}/${passed} assertions passed`);
