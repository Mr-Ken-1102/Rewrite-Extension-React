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

ok('settings expose current-chat connection and balanced footer geometry', () => {
  const api = read('./src/components/modals/settings/TabAPI.jsx');
  const settings = read('./src/components/modals/SettingsModal.jsx');
  assert.match(api, /CURRENT CHAT CONNECTION/);
  assert.match(api, /No separate model selection is required/);
  assert.match(settings, /Version 3\.0\.1/);
  assert.match(settings, /rwa-settings-foot-four/);
  assert.match(settings, /rwa-settings-foot-two/);
});

ok('popup context controls use a symmetric four-switch grid', () => {
  const source = read('./src/components/popup/ContextPanel.jsx');
  const css = read('./src/styles-balance.js');
  assert.match(source, /rwa-context-switch-grid/);
  assert.match(css, /\.rwa-context-switch-grid[\s\S]*grid-template-columns:\s*repeat\(2/);
});

ok('diagnostics match current-chat Marinara connection behavior', () => {
  const source = read('./src/components/modals/ErrorModal.jsx');
  assert.match(source, /follows the current chat connection automatically/i);
  assert.doesNotMatch(source, /select a configured Marinara connection/);
});

console.log(`\nuxcheck: ${passed}/${passed} assertions passed`);
