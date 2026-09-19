import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('profile grid supports roving keyboard navigation without adding a tab stop per style', () => {
  const source = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(source, /useEffect, useRef, useState/);
  assert.match(source, /tabIndex=\{index === activeIndex \? 0 : -1\}/);
  assert.match(source, /onKeyDown=\{moveFocus\}/);
  assert.match(source, /role="toolbar"/);
  assert.match(source, /aria-orientation="horizontal"/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowDown/);
  assert.match(source, /ArrowUp/);
  assert.match(source, /event\.key === 'Home'/);
  assert.match(source, /event\.key === 'End'/);
  assert.match(source, /getComputedStyle\(gridRef\.current\)\.gridTemplateColumns/);
});

ok('profile toolbar supports keyboard typeahead and overflow discovery without instructional chrome', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  assert.match(grid, /TYPEAHEAD_RESET_MS = 650/);
  assert.match(grid, /data-profile-name=\{displayName\}/);
  assert.match(grid, /findTypeaheadMatch/);
  assert.match(grid, /typeaheadRef\.current/);
  assert.doesNotMatch(rewrite, /scroll or type|13 styles/);
});

ok('default style labels can localize without mutating profile prompts or ids', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(grid, /PROFILE_LABELS_VI/);
  assert.match(grid, /expand:\s*'Làm giàu'/);
  assert.match(grid, /grammar:\s*'Trau chuốt'/);
  assert.match(grid, /profileDisplayName\(profile, language\)/);
  assert.match(grid, /onRun\(profile\)/);
});

ok('profile and identity-profile explanations are available from keyboard focus', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const header = read('./src/components/popup/PopupHeader.jsx');
  assert.match(grid, /aria-description=\{profile\.prompt\}/);
  assert.match(grid, /onFocus=\{\(event\) => \{/);
  assert.match(grid, /onTooltip\(event, \{[\s\S]*kind:\s*'preset'/s);
  assert.match(grid, /onBlur=\{onTooltipLeave\}/);
  assert.match(header, /aria-description=\{identityProfile\.prompt\}/);
  assert.match(header, /onFocus=\{\(event\) => onTooltip\?\.\(event, identityTooltip\)\}/);
  assert.match(header, /onBlur=\{onTooltipLeave\}/);
});

ok('popup header keeps drag ownership except on explicit interactive controls', () => {
  const header = read('./src/components/popup/PopupHeader.jsx');
  const drag = read('./src/hooks/usePopupDrag.js');
  const css = read('./src/styles-popup-base.js');
  assert.match(header, /<header className="rwa2-toolbar" onPointerDown=\{onDragStart\}>/);
  assert.doesNotMatch(header, /rwa2-toolbar-actions" onPointerDown=/);
  assert.ok((header.match(/data-rwa-no-drag="true"/g) || []).length >= 3);
  assert.match(drag, /closest\?\.\('\[data-rwa-no-drag="true"\], button, input, textarea, select, a, \[role="button"\]'\)/);
  assert.match(css, /\.rwa2-toolbar-actions\s*\{[\s\S]*flex:\s*0 1 auto/s);
});

ok('three-mode strip help is keyboard reachable and bilingual', () => {
  const source = read('./src/components/popup/PerformanceStrip.jsx');
  assert.match(source, /FREE_MODE_HELP/);
  assert.match(source, /FREE_MODE_HELP_VI/);
  assert.match(source, /fastRewriteHelp\(mode, vi\)/);
  assert.match(source, /streamingHelp\(available, vi\)/);
  assert.match(source, /aria-description=\{item\.help\}/);
  assert.match(source, /onFocus=\{\(event\) => onTooltip\?\.\(event, item\.help\)\}/);
  assert.match(source, /onBlur=\{onTooltipLeave\}/);
});

ok('popup tooltip is collision-aware across visual viewport edges', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /useLayoutEffect/);
  assert.match(source, /TOOLTIP_VIEWPORT_GUTTER = 8/);
  assert.match(source, /window\.visualViewport/);
  assert.match(source, /tooltipRef\.current\.getBoundingClientRect\(\)/);
  assert.match(source, /rect\.right > maxX/);
  assert.match(source, /rect\.bottom > maxY/);
  const tooltip = read('./src/components/popup/PopupTooltip.jsx');
  assert.match(source, /<PopupTooltip ref=\{tooltipRef\}/);
  assert.match(tooltip, /role="tooltip"/);
});

ok('non-modal popup exposes a localized named region without interfering with dialog Escape ownership', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /className="rwa2-popup"[\s\S]*role="region"[\s\S]*aria-label=\{text\('Rewrite selected text', 'Viết lại văn bản đã chọn'\)\}/);
  assert.doesNotMatch(source, /className="rwa2-popup"[\s\S]*role="dialog"/);
});

ok('popup controls preserve switch semantics and named compact groups', () => {
  const toggle = read('./src/components/ui/ToggleSwitch.jsx');
  const context = read('./src/components/popup/ContextDeck.jsx');
  const performance = read('./src/components/popup/PerformanceStrip.jsx');
  assert.match(toggle, /role="switch"/);
  assert.match(toggle, /aria-label=\{ariaLabel\}/);
  assert.match(context, /role="group" aria-label=\{text\('Persistent context sources', 'Nguồn ngữ cảnh mặc định'\)\}/);
  assert.match(context, /role="group" aria-label=\{text\('Sources and parameters for this rewrite', 'Nguồn và tham số cho lần viết lại này'\)\}/);
  assert.match(context, /aria-pressed=\{!excluded\}/);
  assert.match(context, /aria-expanded=\{tokenOpen\}/);
  assert.match(context, /aria-expanded=\{open\}/);
  assert.match(context, /role="region" aria-label=\{text\('Token details', 'Chi tiết token'\)\}/);
  assert.match(performance, /aria-pressed=\{item\.active\}/);
  assert.match(performance, /key:\s*'FREE MODE'/);
  assert.match(performance, /key:\s*'FAST REWRITE'/);
});

ok('trim-selection dialog is isolated and opts out of cursor-following glow work', () => {
  const source = read('./src/components/PopupMain.jsx');
  const trim = read('./src/components/popup/TrimSelectionModal.jsx');
  assert.doesNotMatch(source, /rwa-glow-button/);
  assert.match(source, /<TrimSelectionModal/);
  assert.equal((trim.match(/<Button\b[^>]*glow=\{false\}/g) || []).length, 2);
  assert.doesNotMatch(trim, /rwa-glow-button/);
});

ok('waiting result surfaces show continuous activity without ignoring reduced-motion preferences', () => {
  const preview = read('./src/components/modals/PreviewModal.jsx');
  const draft = read('./src/components/draft/DraftReplyModal.jsx');
  const resultStyles = read('./src/styles-result.js');
  const draftStyles = read('./src/styles-draft-reply.js');
  assert.match(preview, /rwar-working-rail/);
  assert.match(preview, /rwa-waiting-dots/);
  assert.match(draft, /rwar-working-rail/);
  assert.match(draft, /rwa-waiting-dots/);
  assert.match(resultStyles, /@keyframes rwa-waiting-dot/);
  assert.match(resultStyles, /@keyframes rwar-selected-sheen/);
  assert.match(resultStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(draftStyles, /prefers-reduced-motion:\s*reduce/);
});

ok('toast feedback is top-center, stacked, accessible, and readable long enough', () => {
  const source = read('./src/components/ui/ToastContainer.jsx');
  const styles = read('./src/styles.js');
  assert.match(source, /variant === 'err'\) return 6000/);
  assert.match(source, /variant === 'warn'\) return 5000/);
  assert.match(source, /return 3500/);
  assert.match(source, /className="rwa-toast-stack"/);
  assert.match(source, /data-variant=\{toast\.variant \|\| 'warn'\}/);
  assert.match(source, /role=\{isError \? 'alert' : 'status'\}/);
  assert.match(source, /aria-live=\{isError \? 'assertive' : 'polite'\}/);
  assert.match(source, /aria-atomic="true"/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(styles, /\.rwa-toast-stack\s*\{[\s\S]*top:\s*max\(16px, env\(safe-area-inset-top\)\)[\s\S]*left:\s*50%/);
  assert.match(styles, /\.rwa-toast-container\[data-variant="ok"\]/);
  assert.match(styles, /\.rwa-toast-container\[data-variant="warn"\]/);
  assert.match(styles, /\.rwa-toast-container\[data-variant="err"\]/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  const customPrompt = read('./src/components/modals/CustomPromptModal.jsx');
  assert.doesNotMatch(customPrompt, /showToast\(['\"][✓✕⚠]/);
});

ok('Escape dismisses the non-modal selection popup but never preempts an active dialog', () => {
  const source = read('./src/hooks/useNativeEvents.js');
  assert.match(source, /event\.key === 'Escape' && runtime\.popupPosition/);
  assert.match(source, /runtime\.shadowRoot\?\.querySelector\?\.\('\[role="dialog"\], \[role="alertdialog"\]'\)/);
  assert.match(source, /if \(!activeDialog\) \{[\s\S]*runtime\.reset\(\)/);
});

console.log(`\ninteractioncheck: ${passed}/${passed} assertions passed`);
