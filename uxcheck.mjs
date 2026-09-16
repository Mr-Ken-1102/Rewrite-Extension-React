import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('popup drag has pointer cancel, blur and visibility fail-safe cleanup', () => {
  const source = read('./src/hooks/usePopupDrag.js');
  assert.match(source, /pointercancel/);
  assert.match(source, /window\.addEventListener\('blur'/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /setDragging\(false\)/);
});

ok('popup drag uses a minimal transform-only hot path', () => {
  const source = read('./src/hooks/usePopupDrag.js');
  assert.match(source, /setPointerCapture/);
  assert.match(source, /translate3d\(/);
  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /document\.body\.style/);
  assert.doesNotMatch(source, /classList\.add\('rwa-dragging-active'\)/);

  const moveMatch = source.match(/const onPointerMove = \(moveEvent\) => \{([\s\S]*?)\n    \};/);
  assert.ok(moveMatch, 'onPointerMove handler must be present');
  const moveBody = moveMatch[1];
  assert.doesNotMatch(moveBody, /getBoundingClientRect|offsetWidth|offsetHeight/);
  assert.doesNotMatch(moveBody, /setPopupPosition|updateConfig|setDragging/);
  assert.doesNotMatch(moveBody, /requestAnimationFrame|setTimeout/);
  assert.match(moveBody, /style\.transform = `translate3d/);
});

ok('popup drag CSS avoids descendant-wide drag invalidation', () => {
  const css = read('./src/styles-performance.js');
  assert.doesNotMatch(css, /\.rwa-popup-main\.rwa-dragging-active\s*\*/);
});

ok('popup header uses pointer drag instead of mouse-only drag', () => {
  const source = read('./src/components/popup/PopupHeader.jsx');
  assert.match(source, /onPointerDown=\{onDragStart\}/);
  assert.doesNotMatch(source, /onMouseDown=\{onDragStart\}/);
});

ok('preset reorder delegates gesture work to an isolated pointer hook', () => {
  const component = read('./src/components/modals/settings/TabProfiles.jsx');
  const source = read('./src/hooks/useProfileReorder.js');
  assert.doesNotMatch(component, /draggable=/);
  assert.doesNotMatch(component, /onDrag(Start|Over|Enter|End|Drop)/);
  assert.match(component, /useProfileReorder/);
  assert.match(component, /onPointerDown=\{\(event\) => beginPointerDrag/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /lostpointercapture/);
  assert.match(source, /visibilitychange/);
  assert.doesNotMatch(source, /document\.body\.style/);
});

ok('preset reorder caches geometry once and uses insertion slots', () => {
  const source = read('./src/hooks/useProfileReorder.js');
  assert.match(source, /const itemCenters = orderedProfiles/);
  assert.match(source, /scrollStart:/);
  assert.match(source, /const scrollDelta =/);
  assert.match(source, /current\.itemCenters/);
  assert.match(source, /insertionIndex/);
  assert.match(source, /remainingIds\.splice\(slot, 0, current\.draggedId\)/);
});

ok('preset reorder pointermove stays DOM-only and store commits once on drop', () => {
  const component = read('./src/components/modals/settings/TabProfiles.jsx');
  const source = read('./src/hooks/useProfileReorder.js');
  assert.doesNotMatch(component, /setDraggedId|setDragOverId/);

  const moveMatch = source.match(/const onPointerMove = \(moveEvent\) => \{([\s\S]*?)\n    \};/);
  assert.ok(moveMatch, 'preset onPointerMove handler must be present');
  const moveBody = moveMatch[1];
  assert.doesNotMatch(moveBody, /getBoundingClientRect|offsetWidth|offsetHeight/);
  assert.doesNotMatch(moveBody, /requestAnimationFrame|setTimeout/);
  assert.doesNotMatch(moveBody, /onCommit|setState|updateProfiles/);
  assert.match(moveBody, /updateVisual\(latest\.clientY\)/);

  assert.match(source, /draggedNode\.style\.transform = `translate3d/);
  assert.equal((source.match(/onCommit\(/g) || []).length, 1);
});

ok('preset reorder reserves rAF for edge autoscroll only', () => {
  const source = read('./src/hooks/useProfileReorder.js');
  assert.match(source, /requestAnimationFrame\(scrollTick\)/);
  assert.doesNotMatch(source, /requestAnimationFrame\(updateVisual\)/);
  assert.doesNotMatch(source, /requestAnimationFrame\(onPointerMove\)/);
});

ok('global pointer tracker stays out of extension drag hot paths', () => {
  const source = read('./src/hooks/useNativeEvents.js');
  assert.match(source, /if \(runtime\.isDragging\) return;/);
  assert.match(source, /event\.composedPath\(\)\.includes\(runtime\.hostElement\)/);
});

ok('global runtime reset cannot preserve a stale dragging guard', () => {
  const source = read('./src/store/useRuntimeStore.js');
  assert.match(source, /reset:[\s\S]*isDragging:\s*false/);
});

ok('extension teardown clears host, Marinara handle and drag state', () => {
  const source = read('./src/main.jsx');
  assert.match(source, /setDragging\(false\)/);
  assert.match(source, /setHost\(null, null\)/);
  assert.match(source, /setMarinara\(null\)/);
});

ok('Marinara inference resolves the current chat connection before fallback', () => {
  const source = read('./src/services/providers/providerService.js');
  const chatLookup = source.indexOf('chatConnectionId');
  const fallbackLookup = source.indexOf('const fallbackId');
  assert.ok(chatLookup >= 0 && fallbackLookup > chatLookup);
  assert.match(source, /ENDPOINTS\.chats/);
  assert.match(source, /current chat references a Marinara connection that is no longer available/i);
});

ok('rewrite and auto-profile inference carry chat identity to the provider', () => {
  const source = read('./src/services/apiService.js');
  assert.match(source, /\{ chatId: savedSel\?\.cid \|\| '' \}/);
  assert.match(source, /\{ chatId \}/);
});

ok('Marinara timeout protects non-streaming cold-model requests', () => {
  const source = read('./src/services/providers/providerService.js');
  assert.match(source, /mode === 'marinara' \? Math\.max\(90000, configuredTimeout\)/);
});

ok('settings expose current-chat connection without duplicate model selection', () => {
  const api = read('./src/components/modals/settings/TabAPI.jsx');
  assert.match(api, /CURRENT CHAT CONNECTION/);
  assert.match(api, /No separate model selection is required/);
});

ok('popup keeps explicit one-shot and token-estimate copy contracts', () => {
  const source = read('./src/components/popup/ContextPanel.jsx');
  assert.match(source, /This rewrite:/);
  assert.match(source, /Selection \+ context ≈/);
  assert.match(source, /rwa-context-switch-grid/);
});

ok('profile columns are configurable beyond two on the wide popup', () => {
  const profileGrid = read('./src/components/popup/ProfileGrid.jsx');
  const popup = read('./src/components/PopupMain.jsx');
  const settings = read('./src/components/modals/settings/TabUI.jsx');
  assert.match(profileGrid, /compact \? Math\.min\(requestedCols, 6\) : Math\.min\(requestedCols, 4\)/);
  assert.match(popup, /compact \? Math\.min\(colCount, 6\) : Math\.min\(colCount, 4\)/);
  assert.match(settings, /profileColumnMax = config\.compact \? 6 : 4/);
  assert.doesNotMatch(settings, /Math\.min\(config\.cols \|\| 2, 2\)/);
});

ok('wide low popup uses a horizontal workbench and matching viewport math', () => {
  const popup = read('./src/components/PopupMain.jsx');
  const position = read('./src/hooks/usePopupPosition.js');
  const css = read('./src/styles-performance.js');
  assert.match(popup, /rwa-popup-workbench/);
  assert.match(position, /Math\.min\(620/);
  assert.match(css, /width:\s*min\(620px/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1\.28fr\)/);
});

ok('performance visual layer is loaded last', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /RWA_PERFORMANCE_CSS/);
  assert.match(main, /RWA_WORLDCLASS_CSS\}\\n\$\{RWA_PERFORMANCE_CSS\}/);
});

ok('muted amber palette avoids the previous fluorescent primary fill', () => {
  const css = read('./src/styles-performance.js');
  assert.match(css, /--rwa-brand:\s*#d6a04a/);
  assert.match(css, /--rwa-action:\s*#bd8435/);
  assert.match(css, /\.rwa-accept[\s\S]*var\(--rwa-action\)/);
});

ok('settings and presets use low-paint dense surfaces', () => {
  const css = read('./src/styles-performance.js');
  assert.match(css, /\.rwa-settings-win[\s\S]*backdrop-filter:\s*none/);
  assert.match(css, /\.rwa-profile-row[\s\S]*min-height:\s*42px/);
  assert.match(css, /\.rwa-profile-search[\s\S]*min-height:\s*38px/);
});

ok('cursor-following glow no longer performs layout reads on pointermove', () => {
  const source = read('./src/hooks/useGlowPointer.js');
  assert.doesNotMatch(source, /getBoundingClientRect/);
  assert.doesNotMatch(source, /requestAnimationFrame/);
});

ok('settings retain sidebar/workspace information architecture', () => {
  const settings = read('./src/components/modals/SettingsModal.jsx');
  assert.match(settings, /rwa-settings-sidebar/);
  assert.match(settings, /rwa-settings-workspace/);
  assert.match(settings, /SETTINGS_SECTIONS/);
});

ok('lint policy rejects warnings instead of treating them as clean', () => {
  const pkg = JSON.parse(read('./package.json'));
  assert.match(pkg.scripts.lint, /--max-warnings=0/);
});

ok('diagnostics match current-chat Marinara connection behavior', () => {
  const source = read('./src/components/modals/ErrorModal.jsx');
  assert.match(source, /follows the current chat connection automatically/i);
  assert.doesNotMatch(source, /select a configured Marinara connection/);
});

console.log(`\nuxcheck: ${passed}/${passed} assertions passed`);
