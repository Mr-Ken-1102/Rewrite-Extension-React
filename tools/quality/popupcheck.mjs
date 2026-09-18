import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;

const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('popup geometry constants encode the rebalanced 620px / 12-column contract', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH = 620/);
  assert.match(source, /POPUP_OUTER_PADDING_X = 10/);
  assert.match(source, /POPUP_GRID_COLUMNS = 12/);
  assert.match(source, /POPUP_GRID_GAP = 6/);
  assert.match(source, /POPUP_NORMAL_MIN_CELL = 140/);
  assert.match(source, /POPUP_PROFILE_ROW_HEIGHT = 30/);
  assert.match(source, /POPUP_PROFILE_ROW_GAP = 5/);
  assert.match(source, /POPUP_FIXED_HEIGHT = 266/);
});

ok('popup geometry accounts for responsive context stacking and wrapped actions', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_STACKED_CONTEXT_EXTRA = 78/);
  assert.match(source, /POPUP_WRAPPED_ACTIONBAR_EXTRA = 36/);
  assert.match(source, /getResponsivePopupExtra/);
  assert.match(source, /width <= 459 \? POPUP_STACKED_CONTEXT_EXTRA : 0/);
  assert.match(source, /width <= 419 \? POPUP_WRAPPED_ACTIONBAR_EXTRA : 0/);
  assert.match(source, /viewportWidth = POPUP_DESKTOP_WIDTH/);
});

ok('popup visual system loads after legacy popup-affecting layers', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /import \{ RWA_POPUP_CSS \} from '\.\/styles-popup\.js';/);
  assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}/);
});

ok('popup stylesheet is modular instead of another monolithic override layer', () => {
  const source = read('./src/styles-popup.js');
  assert.match(source, /RWA_POPUP_BASE_CSS/);
  assert.match(source, /RWA_POPUP_CONTEXT_CSS/);
  assert.match(source, /RWA_POPUP_A11Y_CSS/);
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

ok('context rail uses a summary row above an 8-4 working split', () => {
  const css = read('./src/styles-popup-context.js');
  const context = read('./src/components/popup/ContextPanel.jsx');
  assert.match(css, /grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.rwa2-context-identity\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(css, /\.rwa2-context-sources\s*\{[\s\S]*grid-column:\s*span 8/);
  assert.match(css, /\.rwa2-context-modifiers\s*\{[\s\S]*grid-column:\s*span 4/);
  assert.match(css, /\.rwa2-context-applied\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(context, /rwa2-context-region rwa2-context-identity/);
  assert.match(context, /rwa2-context-region rwa2-context-sources/);
  assert.match(context, /rwa2-context-region rwa2-context-modifiers/);
  assert.match(context, /rwa2-context-region rwa2-context-applied/);
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

ok('auto placement avoids covering a connected textarea when its edge has room', () => {
  const source = read('./src/hooks/usePopupPosition.js');
  assert.match(source, /selection\?\.source !== 'textarea'/);
  assert.match(source, /selection\?\.el\?\.isConnected/);
  assert.match(source, /getBoundingClientRect/);
  assert.match(source, /sourceBelowCandidate = sourceRect \? sourceRect\.bottom \+ ANCHOR_GAP/);
  assert.match(source, /sourceAboveCandidate = sourceRect \? sourceRect\.top - estimatedHeight - ANCHOR_GAP/);
  assert.match(source, /sourceRect && sourceBelowCandidate <= maxTop/);
  assert.match(source, /sourceRect && sourceAboveCandidate >= POPUP_VIEWPORT_GUTTER/);
});

ok('popup placement reacts to viewport resizing and responsive height changes', () => {
  const source = read('./src/hooks/usePopupPosition.js');
  assert.match(source, /function useViewportSize\(\)/);
  assert.match(source, /window\.addEventListener\('resize', update/);
  assert.match(source, /visualViewport\?\.addEventListener\?\.\('resize', update/);
  assert.match(source, /viewportWidth:\s*viewport\.width/);
  assert.match(source, /viewport\.width/);
  assert.match(source, /viewport\.height/);
});

ok('popup positioning consumes shared geometry and accounts for transient rows', () => {
  const source = read('./src/hooks/usePopupPosition.js');
  const geometry = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH/);
  assert.match(source, /POPUP_VIEWPORT_GUTTER/);
  assert.match(source, /estimatePopupHeight/);
  assert.match(source, /hasAutoProfile/);
  assert.match(source, /multiMessage/);
  assert.match(source, /fastRewrite/);
  assert.match(source, /compact/);
  assert.match(geometry, /POPUP_FAST_REWRITE_HEIGHT\s*=\s*35/);
  assert.match(geometry, /fastRewrite \? POPUP_FAST_REWRITE_HEIGHT : 0/);
});

ok('popup main passes geometry-relevant state without changing rewrite semantics', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /compact:\s*config\.compact/);
  assert.match(source, /hasAutoProfile:\s*!!autoProfile/);
  assert.match(source, /<RewriteSection/);
  assert.match(source, /<ContextPanel/);
  assert.match(source, /<PopupFooter/);
});

ok('responsive context geometry stacks deliberately on narrow viewports', () => {
  const css = read('./src/styles-popup-responsive.js');
  assert.match(css, /@media \(max-width: 559px\)/);
  assert.match(css, /\.rwa2-source-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 459px\)/);
  assert.match(css, /\.rwa2-context-sources,[\s\S]*\.rwa2-context-modifiers\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
});

ok('Fast Rewrite is visible without changing rewrite semantics', () => {
  const main = read('./src/components/PopupMain.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const base = read('./src/styles-popup-base.js');
  const responsive = read('./src/styles-popup-responsive.js');
  assert.match(main, /fastRewrite=\{config\.fastRewrite !== false\}/);
  assert.match(rewrite, /rwa2-fast-strip/);
  assert.match(rewrite, /Reasoning bypass · SSE live/);
  assert.match(rewrite, /Bỏ qua reasoning · SSE trực tiếp/);
  assert.match(base, /@keyframes rwa2-fast-sweep/);
  assert.match(base, /\.rwa2-fast-rail/);
  assert.match(responsive, /\.rwa2-fast-rail > span/);
});

ok('popup visual layer is low-paint and uses subdued amber', () => {
  const base = read('./src/styles-popup-base.js');
  const context = read('./src/styles-popup-context.js');
  assert.match(base, /--rwa2-brand:\s*#d19a45/);
  assert.doesNotMatch(`${base}\n${context}`, /backdrop-filter|filter:\s*blur/);
  assert.doesNotMatch(`${base}\n${context}`, /#ffb020/i);
});

ok('popup density removes redundant hierarchy without shrinking core controls', () => {
  const base = read('./src/styles-popup-base.js');
  assert.match(base, /\.rwa2-toolbar\s*\{[\s\S]*min-height:\s*28px/);
  assert.match(base, /\.rwa2-kicker\s*\{\s*display:\s*none/);
  assert.match(base, /rwa2-profile-btn\s*\{[\s\S]*min-height:\s*30px !important;[\s\S]*height:\s*30px !important/);
  assert.match(base, /rwa2-action\s*\{[\s\S]*min-height:\s*32px !important;[\s\S]*height:\s*32px !important/);
});

ok('context controls avoid stretch-created dead space and preserve readable source labels', () => {
  const css = read('./src/styles-popup-context.js');
  assert.doesNotMatch(css, /\.rwa2-depth-row\s*\{[\s\S]*margin-top:\s*auto/);
  assert.match(css, /\.rwa2-depth-row\s*\{[\s\S]*margin-top:\s*0/);
  assert.match(css, /\.rwa2-source-grid\s*\{[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /\.rwa2-source-grid\s*\{[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/);
});

ok('footer fills available width without vacant grid columns', () => {
  const base = read('./src/styles-popup-base.js');
  assert.match(base, /\.rwa2-actionbar\s*\{[\s\S]*display:\s*flex/);
  assert.doesNotMatch(base, /\.rwa2-actionbar\s*\{[\s\S]*grid-template-columns:\s*repeat\(12/);
  assert.match(base, /\.rwa2-popup \.rwa2-custom\s*\{[\s\S]*flex:\s*1 1 auto/);
  assert.match(base, /\.rwa2-popup \.rwa2-custom\s*\{[\s\S]*margin-left:\s*4px !important/);
  assert.match(base, /\.rwa2-popup \.rwa2-undo,[\s\S]*flex:\s*0 0 32px/);
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
