import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;

const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('popup geometry constants encode the calibrated 640px / 12-column contract', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH = 640/);
  assert.match(source, /POPUP_OUTER_PADDING_X = 10/);
  assert.match(source, /POPUP_GRID_COLUMNS = 12/);
  assert.match(source, /POPUP_GRID_GAP = 8/);
  assert.match(source, /POPUP_NORMAL_MIN_CELL = 140/);
  assert.match(source, /POPUP_PROFILE_ROW_HEIGHT = 30/);
  assert.match(source, /POPUP_PROFILE_ROW_GAP = 5/);
});

ok('popup visual system is loaded last after legacy extension layers', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /import \{ RWA_POPUP_CSS \} from '\.\/styles-popup\.js';/);
  assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}/);
});

ok('popup stylesheet is modular instead of another monolithic override layer', () => {
  const source = read('./src/styles-popup.js');
  assert.match(source, /RWA_POPUP_BASE_CSS/);
  assert.match(source, /RWA_POPUP_CONTEXT_CSS/);
  assert.match(source, /RWA_POPUP_RESPONSIVE_CSS/);
});

ok('popup root uses the isolated rwa2 namespace and preserves geometry contract', () => {
  const popup = read('./src/components/PopupMain.jsx');
  const css = read('./src/styles-popup-base.js');
  assert.match(popup, /className="rwa2-popup"/);
  assert.doesNotMatch(popup, /className="rwa rwa-popup-main"/);
  assert.match(css, /POPUP_DESKTOP_WIDTH/);
  assert.match(css, /\.rwa2-popup\s*\{[\s\S]*width:\s*min\(\$\{POPUP_DESKTOP_WIDTH\}px/);
});

ok('context rail uses an explicit 12-column 4-5-3 layout', () => {
  const css = read('./src/styles-popup-context.js');
  const context = read('./src/components/popup/ContextPanel.jsx');
  assert.match(css, /grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.rwa2-context-identity \{ grid-column: span 4; \}/);
  assert.match(css, /\.rwa2-context-sources \{ grid-column: span 5; \}/);
  assert.match(css, /\.rwa2-context-modifiers \{ grid-column: span 3; \}/);
  assert.match(context, /rwa2-context-region rwa2-context-identity/);
  assert.match(context, /rwa2-context-region rwa2-context-sources/);
  assert.match(context, /rwa2-context-region rwa2-context-modifiers/);
});

ok('profile grid derives viewport height from shared geometry and exposes deterministic column classes', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(source, /getProfileViewportHeight/);
  assert.match(source, /rwa2-cols-\$\{effectiveCols\}/);
  assert.match(source, /rwa2-profile-grid-compact/);
  assert.doesNotMatch(source, /gridTemplateColumns:/);
});

ok('normal profile grid degrades before cells become narrower than the 140px contract', () => {
  const css = read('./src/styles-popup-responsive.js');
  assert.match(css, /POPUP_NORMAL_MIN_CELL/);
  assert.match(css, /POPUP_NORMAL_BREAKPOINTS\.fourToThree - 1/);
  assert.match(css, /POPUP_NORMAL_BREAKPOINTS\.threeToTwo - 1/);
  assert.match(css, /POPUP_NORMAL_BREAKPOINTS\.twoToOne - 1/);
});

ok('selection popup uses a release-point anchor with viewport flipping', () => {
  const native = read('./src/hooks/useNativeEvents.js');
  const position = read('./src/hooks/usePopupPosition.js');
  assert.match(native, /anchorX:\s*x/);
  assert.match(native, /anchorY:\s*y/);
  assert.match(native, /isDragged:\s*false/);
  assert.match(position, /const rightCandidate = anchorX \+ ANCHOR_GAP/);
  assert.match(position, /const leftCandidate = anchorX - panelWidth - ANCHOR_GAP/);
  assert.match(position, /const belowCandidate = anchorY \+ ANCHOR_GAP/);
  assert.match(position, /const aboveCandidate = anchorY - estimatedHeight - ANCHOR_GAP/);
});

ok('popup positioning consumes shared geometry and accounts for transient rows', () => {
  const source = read('./src/hooks/usePopupPosition.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH/);
  assert.match(source, /POPUP_VIEWPORT_GUTTER/);
  assert.match(source, /estimatePopupHeight/);
  assert.match(source, /hasAutoProfile/);
  assert.match(source, /multiMessage/);
  assert.match(source, /compact/);
});

ok('popup main passes geometry-relevant state without changing rewrite semantics', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /compact:\s*config\.compact/);
  assert.match(source, /hasAutoProfile:\s*!!autoProfile/);
  assert.match(source, /<RewriteSection/);
  assert.match(source, /<ContextPanel/);
  assert.match(source, /<PopupFooter/);
});

ok('responsive context geometry stacks before horizontal overflow', () => {
  const css = read('./src/styles-popup-responsive.js');
  assert.match(css, /@media \(max-width: 559px\)/);
  assert.match(css, /\.rwa2-context-identity \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /@media \(max-width: 419px\)/);
});

ok('popup visual layer is low-paint and uses subdued amber', () => {
  const base = read('./src/styles-popup-base.js');
  const context = read('./src/styles-popup-context.js');
  assert.match(base, /--rwa2-brand:\s*#d19a45/);
  assert.doesNotMatch(`${base}\n${context}`, /backdrop-filter|filter:\s*blur/);
  assert.doesNotMatch(`${base}\n${context}`, /#ffb020/i);
});

ok('D.1 density calibration lowers shell and control height without shrinking labels', () => {
  const css = read('./src/styles-popup-responsive.js');
  assert.match(css, /\.rwa2-toolbar \{ min-height: 32px; \}/);
  assert.match(css, /rwa2-profile-btn \{ min-height: 30px !important; height: 30px !important; \}/);
  assert.match(css, /rwa2-action \{ min-height: 34px !important; height: 34px !important; \}/);
  assert.match(css, /\.rwa2-free-note \{ display: none; \}/);
});

ok('main-popup buttons disable cursor-following glow work', () => {
  const button = read('./src/components/ui/Button.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const footer = read('./src/components/popup/PopupFooter.jsx');
  assert.match(button, /glow = true/);
  assert.match(button, /if \(glow && btnRef\.current/);
  assert.match(rewrite, /glow=\{false\}/);
  assert.match(grid, /glow=\{false\}/);
  assert.equal((footer.match(/glow=\{false\}/g) || []).length, 4);
});

console.log(`\npopupcheck: ${passed}/${passed} assertions passed`);
