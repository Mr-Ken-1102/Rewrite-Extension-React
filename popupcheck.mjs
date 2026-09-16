import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;

const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('popup geometry constants encode the 688px / 12-column contract', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH = 688/);
  assert.match(source, /POPUP_OUTER_PADDING_X = 12/);
  assert.match(source, /POPUP_GRID_COLUMNS = 12/);
  assert.match(source, /POPUP_GRID_GAP = 8/);
  assert.match(source, /POPUP_NORMAL_MIN_CELL = 156/);
  assert.match(source, /POPUP_PROFILE_ROW_HEIGHT = 32/);
  assert.match(source, /POPUP_PROFILE_ROW_GAP = 6/);
});

ok('popup geometry stylesheet is loaded after legacy visual layers', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /import \{ RWA_POPUP_CSS \} from '\.\/styles-popup\.js';/);
  assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}/);
});

ok('popup geometry stylesheet owns desktop width and neutralizes the old two-pane workbench', () => {
  const css = read('./src/styles-popup.js');
  assert.match(css, /POPUP_DESKTOP_WIDTH/);
  assert.match(css, /\.rwa-popup-workbench\s*\{[\s\S]*display:\s*contents\s*!important/);
  assert.match(css, /\.rwa-popup-main\s*\{[\s\S]*width:\s*min\(\$\{POPUP_DESKTOP_WIDTH\}px/);
});

ok('context rail uses an explicit 12-column 4-5-3 layout', () => {
  const css = read('./src/styles-popup.js');
  const context = read('./src/components/popup/ContextPanel.jsx');
  assert.match(css, /grid-template-columns:\s*repeat\(\$\{POPUP_GRID_COLUMNS\}, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.rwa-context-identity\s*\{[\s\S]*grid-column:\s*span 4/);
  assert.match(css, /\.rwa-context-sources\s*\{[\s\S]*grid-column:\s*span 5/);
  assert.match(css, /\.rwa-context-modifiers\s*\{[\s\S]*grid-column:\s*span 3/);
  assert.match(context, /rwa-context-region rwa-context-identity/);
  assert.match(context, /rwa-context-region rwa-context-sources/);
  assert.match(context, /rwa-context-region rwa-context-modifiers/);
});

ok('profile grid derives viewport height from shared geometry and exposes deterministic column classes', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(source, /getProfileViewportHeight/);
  assert.match(source, /rwa-profile-cols-\$\{effectiveCols\}/);
  assert.match(source, /rwa-profile-grid-compact/);
  assert.doesNotMatch(source, /gridTemplateColumns:/);
});

ok('normal profile grid degrades before cells become narrower than the 156px contract', () => {
  const css = read('./src/styles-popup.js');
  assert.match(css, /POPUP_NORMAL_MIN_CELL/);
  assert.match(css, /POPUP_NORMAL_BREAKPOINTS\.fourToThree - 1/);
  assert.match(css, /POPUP_NORMAL_BREAKPOINTS\.threeToTwo - 1/);
  assert.match(css, /POPUP_NORMAL_BREAKPOINTS\.twoToOne - 1/);
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
  const css = read('./src/styles-popup.js');
  assert.match(css, /@media \(max-width: 559px\)/);
  assert.match(css, /\.rwa-context-identity \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /@media \(max-width: 419px\)/);
});

console.log(`\npopupcheck: ${passed}/${passed} assertions passed`);
