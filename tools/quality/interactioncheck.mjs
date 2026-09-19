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

ok('profile toolbar supports low-chrome typeahead and overflow discovery', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  assert.match(grid, /TYPEAHEAD_RESET_MS = 650/);
  assert.match(grid, /data-profile-name=\{displayName\}/);
  assert.match(grid, /findTypeaheadMatch/);
  assert.match(grid, /typeaheadRef\.current/);
  assert.match(rewrite, /scroll or type/);
});

ok('default style labels can localize without mutating profile prompts or ids', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  assert.match(grid, /PROFILE_LABELS_VI/);
  assert.match(grid, /expand:\s*'Mở rộng'/);
  assert.match(grid, /grammar:\s*'Sửa ngữ pháp'/);
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

ok('context help tooltip is keyboard reachable and bilingual', () => {
  const source = read('./src/components/popup/ContextPanel.jsx');
  assert.match(source, /CONTEXT_MODE_HELP/);
  assert.match(source, /CONTEXT_MODE_HELP_VI/);
  assert.match(source, /const contextHelp = vi \? CONTEXT_MODE_HELP_VI : CONTEXT_MODE_HELP/);
  assert.match(source, /aria-description=\{contextHelp\}/);
  assert.match(source, /onFocus=\{\(event\) => onTooltip\(event, contextHelp\)\}/);
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
  assert.match(source, /role="tooltip"/);
});

ok('non-modal popup exposes a localized named region without interfering with dialog Escape ownership', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.match(source, /className="rwa2-popup"[\s\S]*role="region"[\s\S]*aria-label=\{text\('Rewrite selected text', 'Viết lại văn bản đã chọn'\)\}/);
  assert.doesNotMatch(source, /className="rwa2-popup"[\s\S]*role="dialog"/);
});

ok('popup switches have switch semantics and every icon-only switch is named', () => {
  const toggle = read('./src/components/ui/ToggleSwitch.jsx');
  const context = read('./src/components/popup/ContextPanel.jsx');
  assert.match(toggle, /role="switch"/);
  assert.match(toggle, /aria-label=\{ariaLabel\}/);
  assert.match(context, /ariaLabel=\{text\('Enable rewrite length adjustment', 'Bật điều chỉnh độ dài viết lại'\)\}/);
  assert.match(context, /role="group" aria-label=\{text\('Persistent context sources', 'Nguồn ngữ cảnh'\)\}/);
  assert.match(context, /role="group" aria-label=\{text\('Sources for this rewrite only', 'Nguồn dùng riêng cho lần này'\)\}/);
});

ok('trim-selection dialog opts out of cursor-following glow work', () => {
  const source = read('./src/components/PopupMain.jsx');
  assert.doesNotMatch(source, /rwa-glow-button/);
  const trimBlock = source.match(/\{trimOpen && \([\s\S]*?<\/Modal>\s*\)\}/)?.[0] || '';
  assert.equal((trimBlock.match(/<Button\b[^>]*glow=\{false\}/g) || []).length, 2);
});

ok('toast feedback uses live-region semantics and readable dwell times', () => {
  const source = read('./src/components/ui/ToastContainer.jsx');
  assert.match(source, /variant === 'err'\) return 6000/);
  assert.match(source, /variant === 'warn'\) return 5000/);
  assert.match(source, /return 3500/);
  assert.match(source, /role=\{isError \? 'alert' : 'status'\}/);
  assert.match(source, /aria-live=\{isError \? 'assertive' : 'polite'\}/);
  assert.match(source, /aria-atomic="true"/);
  assert.match(source, /aria-hidden="true"/);
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
