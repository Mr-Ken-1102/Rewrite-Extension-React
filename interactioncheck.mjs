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
  assert.match(source, /ArrowRight/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowDown/);
  assert.match(source, /ArrowUp/);
  assert.match(source, /event\.key === 'Home'/);
  assert.match(source, /event\.key === 'End'/);
  assert.match(source, /getComputedStyle\(gridRef\.current\)\.gridTemplateColumns/);
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

ok('Escape dismisses the non-modal selection popup but never preempts an active dialog', () => {
  const source = read('./src/hooks/useNativeEvents.js');
  assert.match(source, /event\.key === 'Escape' && runtime\.popupPosition/);
  assert.match(source, /runtime\.shadowRoot\?\.querySelector\?\.\('\[role="dialog"\], \[role="alertdialog"\]'\)/);
  assert.match(source, /if \(!activeDialog\) \{[\s\S]*runtime\.reset\(\)/);
});

console.log(`\ninteractioncheck: ${passed}/${passed} assertions passed`);
