import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;

const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('popup geometry constants encode the balanced 488px / three-column-first contract', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH = 488/);
  assert.match(source, /POPUP_OUTER_PADDING_X = 12/);
  assert.match(source, /POPUP_GRID_COLUMNS = 12/);
  assert.match(source, /POPUP_GRID_GAP = 8/);
  assert.match(source, /POPUP_NORMAL_MIN_CELL = 110/);
  assert.match(source, /POPUP_PROFILE_ROW_HEIGHT = 54/);
  assert.match(source, /POPUP_PROFILE_ROW_GAP = 7/);
  assert.match(source, /POPUP_FIXED_HEIGHT = 148/);
  assert.match(source, /POPUP_PERFORMANCE_STRIP_HEIGHT = 42/);
  assert.match(source, /POPUP_CONTEXT_SUMMARY_HEIGHT = 47/);
  assert.match(source, /POPUP_CONTEXT_WRAP_EXTRA = 38/);
  assert.match(source, /POPUP_CONTEXT_DETAIL_HEIGHT = 66/);
});

ok('popup geometry accounts for collapsed context, optional detail, and narrow stacking', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_NARROW_CONTEXT_EXTRA = 54/);
  assert.match(source, /POPUP_WRAPPED_ACTIONBAR_EXTRA = 34/);
  assert.match(source, /getResponsivePopupExtra/);
  assert.match(source, /contextOpen && width <= 459 \? POPUP_NARROW_CONTEXT_EXTRA : 0/);
  assert.match(source, /width <= 419 \? POPUP_WRAPPED_ACTIONBAR_EXTRA : 0/);
  assert.match(source, /contextOpen = false/);
  assert.match(source, /contextSummaryCount = 0/);
  assert.match(source, /contextSummaryCount > 5 \? POPUP_CONTEXT_WRAP_EXTRA : 0/);
  assert.match(source, /contextOpen \? POPUP_CONTEXT_DETAIL_HEIGHT : 0/);
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

ok('preset card removes redundant Choose-a-style and style-count chrome', () => {
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  assert.doesNotMatch(rewrite, /rwa2-section-head|rwa2-section-title|rwa2-section-meta/);
  assert.doesNotMatch(rewrite, /Choose a style|styles · scroll or type|kiểu · cuộn hoặc gõ để tìm/);
  assert.match(rewrite, /<PerformanceStrip/);
  assert.match(rewrite, /<ProfileGrid/);
});

ok('popup architecture follows the approved status → modes → presets → context → footer stack', () => {
  const base = read('./src/styles-popup-base.js');
  const main = read('./src/components/PopupMain.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const performance = read('./src/components/popup/PerformanceStrip.jsx');
  const status = read('./src/components/popup/IdentityStatusRow.jsx');
  const context = read('./src/components/popup/ContextDeck.jsx');
  assert.match(main, /<IdentityStatusRow/);
  assert.match(main, /<RewriteSection/);
  assert.match(main, /<ContextDeck/);
  assert.match(main, /<PopupFooter/);
  assert.match(status, /rwa2-status-row/);
  assert.match(status, /rwa2-token-trigger/);
  assert.match(rewrite, /<PerformanceStrip/);
  assert.match(performance, /rwa2-performance-strip/);
  assert.match(context, /rwa2-context-deck/);
  assert.match(context, /rwa2-context-adjust-row/);
  assert.match(base, /\.rwa2-status-row\s*\{/);
  assert.doesNotMatch(main, /<LiveRail|<RecipeBar|<RequestInspector/);
});

ok('profile grid derives viewport height from shared geometry and exposes deterministic column classes', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(source, /getProfileViewportHeight/);
  assert.match(source, /'rwa2-cols-' \+ effectiveCols/);
  assert.match(source, /rwa2-profile-grid-compact/);
  assert.doesNotMatch(source, /gridTemplateColumns:/);
});

ok('profile prompts use a prominent floating hover/focus preview without consuming popup space', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  const popup = read('./src/components/PopupMain.jsx');
  const tooltip = read('./src/components/popup/PopupTooltip.jsx');
  const base = read('./src/styles-popup-base.js');
  assert.match(source, /onMouseEnter=\{\(event\) => onTooltip\(event, \{/);
  assert.match(source, /kind:\s*'preset'/);
  assert.match(source, /title:\s*displayName/);
  assert.match(source, /prompt:\s*profile\.prompt/);
  assert.match(source, /onMouseLeave=\{onTooltipLeave\}/);
  assert.doesNotMatch(source, /rwa2-preset-inspector/);
  assert.match(popup, /<PopupTooltip ref=\{tooltipRef\}/);
  assert.match(tooltip, /rwa2-tooltip-preset/);
  assert.match(tooltip, /rwa2-tooltip-preset-name/);
  assert.match(tooltip, /rwa2-tooltip-preset-copy/);
  assert.match(base, /\.rwa2-tooltip-preset\s*\{/);
  assert.match(base, /\.rwa2-tooltip-preset-copy\s*\{[\s\S]*font-size:\s*11\.5px/s);
});

ok('normal profile grid degrades before cells become narrower than the compact 116px contract', () => {
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

ok('popup positioning consumes shared geometry and reserves stable visual rows', () => {
  const source = read('./src/hooks/usePopupPosition.js');
  const geometry = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_DESKTOP_WIDTH/);
  assert.match(source, /POPUP_VIEWPORT_GUTTER/);
  assert.match(source, /estimatePopupHeight/);
  assert.doesNotMatch(source, /hasAutoProfile/);
  assert.match(source, /multiMessage/);
  assert.match(source, /compact/);
  assert.doesNotMatch(source, /fastRewrite/);
  assert.match(geometry, /POPUP_PERFORMANCE_STRIP_HEIGHT\s*=\s*42/);
  assert.match(geometry, /POPUP_CONTEXT_SUMMARY_HEIGHT\s*=\s*47/);
  assert.match(geometry, /POPUP_CONTEXT_WRAP_EXTRA\s*=\s*38/);
  assert.match(geometry, /POPUP_CONTEXT_DETAIL_HEIGHT\s*=\s*66/);
  assert.match(geometry, /\+ POPUP_PERFORMANCE_STRIP_HEIGHT/);
  assert.match(geometry, /\+ POPUP_CONTEXT_SUMMARY_HEIGHT/);
  assert.match(geometry, /contextSummaryCount > 5 \? POPUP_CONTEXT_WRAP_EXTRA : 0/);
  assert.match(geometry, /contextOpen \? POPUP_CONTEXT_DETAIL_HEIGHT : 0/);
});

ok('popup main passes geometry-relevant state without changing rewrite semantics', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /compact:\s*config\.compact/);
  assert.match(source, /voiceIdentity=\{voiceIdentity\}/);
  assert.match(source, /identityProfile=\{autoProfile\}/);
  assert.match(source, /<RewriteSection/);
  assert.match(source, /<ContextDeck/);
  assert.match(source, /contextOpen:\s*true/);
  assert.match(source, /contextSummaryCount:\s*contextSources\.length/);
  assert.doesNotMatch(source, /<LiveRail|<RecipeBar|<RequestInspector/);
  assert.match(source, /<PopupFooter/);
});

ok('Character or Persona identity shares one compact status row with token count and Voice Profile state', () => {
  const main = read('./src/components/PopupMain.jsx');
  const header = read('./src/components/popup/PopupHeader.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const status = read('./src/components/popup/IdentityStatusRow.jsx');
  assert.match(main, /<IdentityStatusRow/);
  assert.match(main, /identityProfile=\{autoProfile\}/);
  assert.match(main, /voiceIdentity=\{voiceIdentity\}/);
  assert.doesNotMatch(header, /identityProfile|voiceIdentity|rwa2-identity-chip|onRunIdentityProfile/);
  assert.doesNotMatch(rewrite, /featuredProfile|featuredLabel/);
  assert.doesNotMatch(grid, /featuredProfile|rwa2-profile-btn-voice|__featured/);
  assert.match(status, /rwa2-identity-profile-ready/);
  assert.match(status, /identityKind === 'persona'/);
  assert.match(status, /kind: 'token'/);
});

ok('responsive context detail stacks controls without turning token details into layout rows', () => {
  const css = read('./src/styles-popup-responsive.js');
  assert.match(css, /@media \(max-width: 459px\)/);
  assert.match(css, /\.rwa2-context-adjust-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.doesNotMatch(css, /\.rwa2-token-popover/);
  assert.match(css, /@media \(max-width: 419px\)/);
  assert.doesNotMatch(css, /\.rwa2-token-detail-grid/);
});

ok('three-mode performance strip makes Free, Fast Rewrite, and Streaming directly actionable', () => {
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const strip = read('./src/components/popup/PerformanceStrip.jsx');
  const contextCss = read('./src/styles-popup-context.js');
  assert.match(rewrite, /<PerformanceStrip/);
  assert.match(strip, /getProviderCapabilities/);
  assert.match(strip, /key:\s*'FREE MODE'/);
  assert.match(strip, /key:\s*'FAST REWRITE'/);
  assert.match(strip, /key:\s*'STREAM'/);
  assert.match(strip, /updateConfig\(\{ freeMode: !config\.freeMode \}\)/);
  assert.match(strip, /updateConfig\(\{ fastRewrite: config\.fastRewrite === false \}\)/);
  assert.match(strip, /updateConfig\(\{ liveStreaming: config\.liveStreaming === false \}\)/);
  assert.match(strip, /aria-pressed=\{item\.active\}/);
  assert.match(contextCss, /\.rwa2-performance-strip\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(contextCss, /\.rwa2-performance-item \+ \.rwa2-performance-item/);
  assert.match(contextCss, /\.rwa2-performance-dot\s*\{/);
});

ok('popup visual layer is low-paint and uses subdued amber', () => {
  const base = read('./src/styles-popup-base.js');
  const context = read('./src/styles-popup-context.js');
  assert.match(base, /--rwa2-brand:\s*#e2a13b/);
  assert.doesNotMatch(`${base}\n${context}`, /backdrop-filter|filter:\s*blur/);
  assert.doesNotMatch(`${base}\n${context}`, /#ffb020/i);
});

ok('approved popup density uses full icon cards and readable toolbar controls', () => {
  const base = read('./src/styles-popup-base.js');
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(base, /\.rwa2-toolbar\s*\{[\s\S]*min-height:\s*45px/);
  assert.match(base, /rwa2-profile-btn,[\s\S]*min-height:\s*54px !important;[\s\S]*height:\s*54px !important/);
  assert.match(base, /rwa2-action\s*\{[\s\S]*min-height:\s*39px !important;[\s\S]*height:\s*39px !important/);
  assert.match(grid, /rwa2-profile-icon/);
  assert.match(grid, /rwa2-profile-placeholder/);
});

ok('context deck uses five persistent icon toggles and always-visible History/Length controls', () => {
  const css = read('./src/styles-popup-context.js');
  const context = read('./src/components/popup/ContextDeck.jsx');
  const status = read('./src/components/popup/IdentityStatusRow.jsx');
  const presentation = read('./src/hooks/useContextPresentation.js');
  assert.match(css, /\.rwa2-context-chips\s*\{[\s\S]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css, /\.rwa2-context-adjust-row\s*\{[\s\S]*grid-template-columns:minmax\(0,\.78fr\) 1px minmax\(0,1\.22fr\)/);
  assert.match(status, /kind: 'token'/);
  assert.match(status, /onMouseEnter=\{\(event\) => onTooltip\?\.\(event, tokenTooltip\)\}/);
  assert.match(context, /aria-pressed=\{source\.enabled\}/);
  assert.match(context, /onToggleContext\(source\.key, !source\.enabled\)/);
  assert.match(context, /History depth/);
  assert.match(context, /Rewrite length adjustment/);
  assert.match(context, /rwa2-context-chip-icon/);
  assert.doesNotMatch(context, /rwa2-context-toggle|rwa2-context-collapse|rwa2-token-popover/);
  assert.match(presentation, /source\('character'/);
  assert.match(presentation, /source\('persona'/);
  assert.doesNotMatch(presentation, /contextOverrides|effectiveSource|hasOverride/);
});

ok('footer matches the approved Undo / Redo / Custom Prompt / Settings composition', () => {
  const base = read('./src/styles-popup-base.js');
  const footer = read('./src/components/popup/PopupFooter.jsx');
  assert.match(base, /\.rwa2-actionbar\s*\{[\s\S]*display:grid;[\s\S]*grid-template-columns:72px 72px minmax\(0,1fr\) 44px/);
  assert.match(base, /\.rwa2-popup \.rwa2-custom\s*\{[\s\S]*border-color:rgba\(226,161,59,\.48\)/);
  assert.match(footer, />\{text\('Undo', 'Hoàn tác'\)\}<\/span>/);
  assert.match(footer, />\{text\('Redo', 'Làm lại'\)\}<\/span>/);
  assert.match(footer, /SparklesIcon/);
  assert.match(footer, /aria-label=\{text\('Settings', 'Cài đặt'\)\}/);
  assert.match(footer, /<svg width="19" height="19"/);
});

ok('main-popup buttons disable cursor-following glow work', () => {
  const button = read('./src/components/ui/Button.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const footer = read('./src/components/popup/PopupFooter.jsx');
  assert.match(button, /glow = true/);
  assert.match(button, /if \(glow && btnRef\.current/);
  assert.doesNotMatch(rewrite, /<Button|glow=/);
  assert.match(grid, /glow=\{false\}/);
  assert.equal((footer.match(/glow=\{false\}/g) || []).length, 4);
});

console.log(`\npopupcheck: ${passed}/${passed} assertions passed`);
