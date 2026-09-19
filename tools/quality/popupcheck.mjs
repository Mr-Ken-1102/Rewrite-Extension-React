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
  assert.match(source, /POPUP_FIXED_HEIGHT = 145/);
  assert.match(source, /POPUP_LIVE_RAIL_HEIGHT = 34/);
  assert.match(source, /POPUP_RECIPE_BAR_HEIGHT = 42/);
  assert.match(source, /POPUP_INSPECTOR_HEIGHT = 178/);
});

ok('popup geometry accounts for the live rail, recipe, inspector, and narrow controls', () => {
  const source = read('./src/popupGeometry.js');
  assert.match(source, /POPUP_NARROW_CONTROL_EXTRA = 42/);
  assert.match(source, /POPUP_WRAPPED_ACTIONBAR_EXTRA = 36/);
  assert.match(source, /getResponsivePopupExtra/);
  assert.match(source, /width <= 459 \? POPUP_NARROW_CONTROL_EXTRA : 0/);
  assert.match(source, /width <= 419 \? POPUP_WRAPPED_ACTIONBAR_EXTRA : 0/);
  assert.match(source, /inspectorOpen = false/);
  assert.match(source, /inspectorOpen \? POPUP_INSPECTOR_HEIGHT : 0/);
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

ok('popup context architecture separates live controls, recipe, and progressive inspector', () => {
  const css = read('./src/styles-popup-context.js');
  const main = read('./src/components/PopupMain.jsx');
  const live = read('./src/components/popup/LiveRail.jsx');
  const recipe = read('./src/components/popup/RecipeBar.jsx');
  const inspector = read('./src/components/popup/RequestInspector.jsx');
  assert.match(main, /<LiveRail/);
  assert.match(main, /<RecipeBar/);
  assert.match(main, /<RequestInspector/);
  assert.match(live, /rwa2-live-rail/);
  assert.match(recipe, /rwa2-recipe/);
  assert.match(inspector, /rwa2-inspector/);
  assert.match(css, /\.rwa2-live-rail\s*\{/);
  assert.match(css, /\.rwa2-recipe\s*\{/);
  assert.match(css, /\.rwa2-inspector\s*\{[\s\S]*grid-template-rows:\s*0fr/);
  assert.match(css, /\.rwa2-inspector-open\s*\{[\s\S]*grid-template-rows:\s*1fr/);
});

ok('profile grid derives viewport height from shared geometry and exposes deterministic column classes', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(source, /getProfileViewportHeight/);
  assert.match(source, /rwa2-cols-\$\{effectiveCols\}/);
  assert.match(source, /rwa2-profile-grid-compact/);
  assert.doesNotMatch(source, /gridTemplateColumns:/);
});

ok('profile prompts use a prominent floating hover/focus preview without consuming popup space', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  const popup = read('./src/components/PopupMain.jsx');
  const base = read('./src/styles-popup-base.js');
  assert.match(source, /onMouseEnter=\{\(event\) => onTooltip\(event, \{/);
  assert.match(source, /kind:\s*'preset'/);
  assert.match(source, /title:\s*displayName/);
  assert.match(source, /prompt:\s*profile\.prompt/);
  assert.match(source, /onMouseLeave=\{onTooltipLeave\}/);
  assert.doesNotMatch(source, /rwa2-preset-inspector/);
  assert.match(popup, /rwa2-tooltip-preset/);
  assert.match(popup, /rwa2-tooltip-preset-name/);
  assert.match(popup, /rwa2-tooltip-preset-copy/);
  assert.match(base, /\.rwa2-tooltip-preset\s*\{/);
  assert.match(base, /\.rwa2-tooltip-preset-copy\s*\{[\s\S]*font-size:\s*11\.5px/s);
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
  assert.match(geometry, /POPUP_LIVE_RAIL_HEIGHT\s*=\s*34/);
  assert.match(geometry, /POPUP_RECIPE_BAR_HEIGHT\s*=\s*42/);
  assert.match(geometry, /POPUP_INSPECTOR_HEIGHT\s*=\s*178/);
  assert.match(geometry, /\+ POPUP_LIVE_RAIL_HEIGHT/);
  assert.match(geometry, /\+ POPUP_RECIPE_BAR_HEIGHT/);
  assert.match(geometry, /inspectorOpen \? POPUP_INSPECTOR_HEIGHT : 0/);
});

ok('popup main passes geometry-relevant state without changing rewrite semantics', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /compact:\s*config\.compact/);
  assert.match(source, /voiceIdentity=\{voiceIdentity\}/);
  assert.match(source, /identityProfile=\{autoProfile\}/);
  assert.match(source, /<RewriteSection/);
  assert.match(source, /<LiveRail/);
  assert.match(source, /<RecipeBar/);
  assert.match(source, /<RequestInspector/);
  assert.match(source, /inspectorOpen/);
  assert.match(source, /<PopupFooter/);
});

ok('active Character or Persona profile lives in the right side of the popup header', () => {
  const main = read('./src/components/PopupMain.jsx');
  const header = read('./src/components/popup/PopupHeader.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  const base = read('./src/styles-popup-base.js');
  const responsive = read('./src/styles-popup-responsive.js');
  assert.match(main, /voiceIdentity=\{voiceIdentity\}/);
  assert.match(main, /identityProfile=\{autoProfile\}/);
  assert.match(main, /onRunIdentityProfile=\{runProfile\}/);
  assert.match(header, /rwa2-toolbar-actions/);
  assert.match(header, /rwa2-identity-chip/);
  assert.match(header, /voiceIdentity\?\.kind/);
  assert.match(header, /identityKind === 'persona'/);
  assert.match(header, /rwa2-identity-chip-static/);
  assert.match(header, /onRunIdentityProfile\?\.\(identityProfile\)/);
  assert.doesNotMatch(rewrite, /rwa2-auto-profile|autoProfile/);
  assert.match(base, /\.rwa2-toolbar-actions\s*\{[\s\S]*justify-content:\s*flex-end/s);
  assert.match(base, /\.rwa2-identity-chip\s*\{/);
  assert.match(base, /text-overflow:\s*ellipsis/);
  assert.match(responsive, /\.rwa2-identity-chip\s*\{\s*max-width:\s*128px/);
});

ok('responsive control deck stacks the inspector and live rail deliberately on narrow viewports', () => {
  const css = read('./src/styles-popup-responsive.js');
  assert.match(css, /@media \(max-width: 559px\)/);
  assert.match(css, /\.rwa2-token-grid\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.rwa2-inspector-controls\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 459px\)/);
  assert.match(css, /\.rwa2-live-rail\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
});

ok('live rail makes Free, Fast Rewrite, Streaming, and request size directly actionable', () => {
  const main = read('./src/components/PopupMain.jsx');
  const live = read('./src/components/popup/LiveRail.jsx');
  const contextCss = read('./src/styles-popup-context.js');
  assert.match(main, /<LiveRail/);
  assert.match(live, /getProviderCapabilities/);
  assert.match(live, /key:\s*'FREE'/);
  assert.match(live, /key:\s*'FAST'/);
  assert.match(live, /key:\s*'STREAM'/);
  assert.match(live, /updateConfig\(\{ freeMode: !config\.freeMode \}\)/);
  assert.match(live, /updateConfig\(\{ fastRewrite: config\.fastRewrite === false \}\)/);
  assert.match(live, /updateConfig\(\{ liveStreaming: config\.liveStreaming === false \}\)/);
  assert.match(live, /aria-expanded=\{inspectorOpen\}/);
  assert.match(contextCss, /\.rwa2-live-rail\s*\{/);
  assert.match(contextCss, /\.rwa2-live-control-on \.rwa2-live-dot/);
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

ok('request inspector keeps advanced controls compact and recipe identity-free', () => {
  const css = read('./src/styles-popup-context.js');
  const inspector = read('./src/components/popup/RequestInspector.jsx');
  const recipe = read('./src/components/popup/RecipeBar.jsx');
  const presentation = read('./src/hooks/useContextPresentation.js');
  assert.match(css, /\.rwa2-inspector-source-grid\s*\{[\s\S]*repeat\(2, minmax\(0,1fr\)\)/);
  assert.match(inspector, /History depth/);
  assert.match(inspector, /Rewrite length adjustment/);
  assert.match(recipe, /source\.label/);
  assert.doesNotMatch(recipe, /identityName|characterNames|personaNames/);
  assert.match(presentation, /label:\s*text\('Character', 'Nhân vật'\), detail:\s*characterLabel/);
  assert.match(presentation, /label:\s*'Persona', detail:\s*personaLabel/);
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
  assert.doesNotMatch(rewrite, /<Button|glow=/);
  assert.match(grid, /glow=\{false\}/);
  assert.equal((footer.match(/glow=\{false\}/g) || []).length, 4);
});

console.log(`\npopupcheck: ${passed}/${passed} assertions passed`);
