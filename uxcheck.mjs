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

ok('Marinara routing makes chat-following and fixed connection selection explicit', () => {
  const source = read('./src/services/providers/providerService.js');
  const settings = read('./src/components/modals/settings/TabAPI.jsx');
  assert.match(source, /config\.marinaraRouting === 'fixed' \? 'fixed' : 'chat'/);
  assert.match(source, /source: 'fixed'/);
  assert.match(source, /ENDPOINTS\.chats/);
  assert.match(source, /current chat references a Marinara connection that is no longer available/i);
  assert.match(settings, /Follow current chat \(default\)/);
  assert.match(settings, /Use a specific Marinara connection/);
});

ok('Marinara streaming preserves empty-output recovery without duplicating fast rewrites', () => {
  const source = read('./src/services/providers/providerService.js');
  assert.match(source, /const requestRaw = async \(parameters = null\) =>/);
  assert.match(source, /streaming:\s*true/);
  assert.match(source, /runId,/);
  assert.match(source, /readRawStream\(response, signal, override\.onProgress, override\.onStreamStatus\)/);
  assert.match(source, /requestRaw\(\{ reasoningEffort: null \}\)/);
  assert.match(source, /if \(!content\.trim\(\) && !fastRewrite\)/);
  assert.match(source, /inference\.empty_response/);
  assert.match(source, /RWA_PROVIDER_EMPTY_RESPONSE/);
});

ok('rewrite and auto-profile inference carry chat identity to the provider', () => {
  const source = read('./src/services/apiService.js');
  assert.match(source, /chatId: savedSel\?\.cid \|\| ''/);
  assert.match(source, /onProgress: hooks\?\.onProgress/);
  assert.match(source, /onStreamStatus: hooks\?\.onStreamStatus/);
  assert.match(source, /\{ chatId \}/);
});

ok('normal Marinara rewrites stream without a client deadline while explicit tests may stay bounded', () => {
  const source = read('./src/services/providers/providerService.js');
  const settings = read('./src/components/modals/settings/TabAPI.jsx');
  assert.match(source, /marinaraTimeoutMs/);
  assert.match(source, /Number\(override\.marinaraTimeoutMs\) \|\| 0/);
  assert.match(source, /MarinaraHost\.fetch\(\`\/api\$\{ENDPOINTS\.generateRaw\}\`/);
  assert.match(source, /\$\{ENDPOINTS\.generateRaw\}\/abort/);
  assert.doesNotMatch(source, /Math\.max\(90000, configuredTimeout\)/);
  assert.match(settings, /marinaraTimeoutMs:/);
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
  assert.match(source, /rwa2-source-grid/);
  assert.match(source, /rwa2-context-applied/);
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

ok('popup geometry is delegated to the rebalanced 620px isolated visual contract', () => {
  const popup = read('./src/components/PopupMain.jsx');
  const position = read('./src/hooks/usePopupPosition.js');
  const geometry = read('./src/popupGeometry.js');
  const css = read('./src/styles-popup-base.js');
  assert.match(popup, /className="rwa2-popup"/);
  assert.match(popup, /rwa2-workbench/);
  assert.match(position, /POPUP_DESKTOP_WIDTH/);
  assert.match(geometry, /POPUP_DESKTOP_WIDTH = 620/);
  assert.match(geometry, /POPUP_GRID_COLUMNS = 12/);
  assert.match(css, /POPUP_DESKTOP_WIDTH/);
});

ok('new selections carry an explicit pointer anchor and clear dragged placement', () => {
  const native = read('./src/hooks/useNativeEvents.js');
  const position = read('./src/hooks/usePopupPosition.js');
  assert.match(native, /anchorX:\s*x/);
  assert.match(native, /anchorY:\s*y/);
  assert.match(native, /isDragged:\s*false/);
  assert.match(position, /rightCandidate/);
  assert.match(position, /leftCandidate/);
  assert.match(position, /belowCandidate/);
  assert.match(position, /aboveCandidate/);
});

ok('popup visual layer is loaded after the performance layer', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /RWA_PERFORMANCE_CSS/);
  assert.match(main, /RWA_POPUP_CSS/);
  assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}/);
});

ok('popup visual system uses subdued amber and no blur paint tax', () => {
  const base = read('./src/styles-popup-base.js');
  const context = read('./src/styles-popup-context.js');
  assert.match(base, /--rwa2-brand:\s*#d19a45/);
  assert.doesNotMatch(`${base}\n${context}`, /backdrop-filter|filter:\s*blur/);
  assert.doesNotMatch(`${base}\n${context}`, /#ffb020/i);
});

ok('settings and presets retain low-paint dense surfaces', () => {
  const css = read('./src/styles-performance.js');
  assert.match(css, /\.rwa-settings-win[\s\S]*backdrop-filter:\s*none/);
  assert.match(css, /\.rwa-profile-row[\s\S]*min-height:\s*42px/);
  assert.match(css, /\.rwa-profile-search[\s\S]*min-height:\s*38px/);
});

ok('settings confirmation actions stay right aligned', () => {
  const css = read('./src/styles-performance.js');
  assert.match(css, /\.rwa-settings-foot-trailing \{ margin-left: auto !important; \}/);
});

ok('main-popup buttons opt out of cursor-following glow layout reads', () => {
  const button = read('./src/components/ui/Button.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const footer = read('./src/components/popup/PopupFooter.jsx');
  assert.match(button, /if \(glow && btnRef\.current/);
  assert.match(rewrite, /glow=\{false\}/);
  assert.match(grid, /glow=\{false\}/);
  assert.equal((footer.match(/glow=\{false\}/g) || []).length, 4);
});

ok('cursor-following global glow hook no longer performs layout reads on pointermove', () => {
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
