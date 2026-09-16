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

ok('popup drag stays on compositor path and paints the first move immediately', () => {
  const source = read('./src/hooks/usePopupDrag.js');
  assert.match(source, /setPointerCapture/);
  assert.match(source, /translate3d\(/);
  assert.match(source, /paintedMove/);
  assert.match(source, /if \(!paintedMove\)[\s\S]*applyPosition\(\)/);
  assert.doesNotMatch(source, /window\.addEventListener\('pointermove'/);
});

ok('popup header uses pointer drag instead of mouse-only drag', () => {
  const source = read('./src/components/popup/PopupHeader.jsx');
  assert.match(source, /onPointerDown=\{onDragStart\}/);
  assert.doesNotMatch(source, /onMouseDown=\{onDragStart\}/);
});

ok('preset reorder avoids native HTML5 drag and owns cancellation cleanup', () => {
  const source = read('./src/components/modals/settings/TabProfiles.jsx');
  assert.doesNotMatch(source, /draggable=/);
  assert.doesNotMatch(source, /onDrag(Start|Over|Enter|End|Drop)/);
  assert.match(source, /onPointerDown=\{\(event\) => beginPointerDrag/);
  assert.match(source, /lostpointercapture/);
  assert.match(source, /visibilitychange/);
});

ok('preset reorder caches row geometry instead of measuring the whole list per frame', () => {
  const source = read('./src/components/modals/settings/TabProfiles.jsx');
  assert.match(source, /const itemCenters = visibleProfiles\.map/);
  assert.match(source, /scrollStart:/);
  assert.match(source, /const scrollDelta =/);
  assert.match(source, /current\.itemCenters/);
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
