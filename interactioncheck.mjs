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

ok('profile toolbar supports low-chrome typeahead discovery', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  assert.match(grid, /TYPEAHEAD_RESET_MS = 650/);
  assert.match(grid, /data-profile-name=\{profile\.name\}/);
  assert.match(grid, /findTypeaheadMatch/);
  assert.match(grid, /typeaheadRef\.current/);
  assert.match(rewrite, /type to jump/);
});

ok('profile and auto-profile explanations are available from keyboard focus', () => {
  const grid = read('./src/components/popup/ProfileGrid.jsx');
  const rewrite = read('./src/components/popup/RewriteSection.jsx');
  assert.match(grid, /aria-description=\{profile\.prompt\}/);
  assert.match(grid, /onFocus=\{\(event\) => \{/);
  assert.match(grid, /onBlur=\{onTooltipLeave\}/);
  assert.match(rewrite, /aria-description=\{autoProfile\.prompt\}/);
  assert.match(rewrite, /onFocus=\{\(event\) => onTooltip/);
  assert.match(rewrite, /onBlur=\{onTooltipLeave\}/);
});

ok('context help tooltip is keyboard reachable and exposes an accessible description', () => {
  const source = read('./src/components/popup/ContextPanel.jsx');
  assert.match(source, /CONTEXT_MODE_HELP/);
  assert.match(source, /aria-description=\{CONTEXT_MODE_HELP\}/);
  assert.match(source, /onFocus=\{\(event\) => onTooltip\(event, CONTEXT_MODE_HELP\)\}/);
  assert.match(source, /onBlur=\{onTooltipLeave\}/);
});

ok('popup switches have switch semantics and every icon-only switch is named', () => {
  const toggle = read('./src/components/ui/ToggleSwitch.jsx');
  const context = read('./src/components/popup/ContextPanel.jsx');
  assert.match(toggle, /role="switch"/);
  assert.match(toggle, /aria-label=\{ariaLabel\}/);
  assert.match(context, /ariaLabel="Enable rewrite length adjustment"/);
  assert.match(context, /role="group" aria-label="Persistent context sources"/);
  assert.match(context, /role="group" aria-label="Sources for this rewrite only"/);
});

ok('Escape dismisses the non-modal selection popup but never preempts an active dialog', () => {
  const source = read('./src/hooks/useNativeEvents.js');
  assert.match(source, /event\.key === 'Escape' && runtime\.popupPosition/);
  assert.match(source, /runtime\.shadowRoot\?\.querySelector\?\.\('\[role="dialog"\], \[role="alertdialog"\]'\)/);
  assert.match(source, /if \(!activeDialog\) \{[\s\S]*runtime\.reset\(\)/);
});

console.log(`\ninteractioncheck: ${passed}/${passed} assertions passed`);
