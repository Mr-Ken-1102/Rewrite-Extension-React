import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const aggregator = read('./src/styles-popup.js');
const base = read('./src/styles-popup-base.js');
const a11y = read('./src/styles-popup-a11y.js');
const context = read('./src/styles-popup-context.js');

assert.match(aggregator, /RWA_POPUP_A11Y_CSS/);
assert.match(
  aggregator,
  /RWA_POPUP_CONTEXT_CSS\}\\n\$\{RWA_POPUP_A11Y_CSS\}\\n\$\{RWA_POPUP_RESPONSIVE_CSS\}/,
);

assert.match(a11y, /\.rwa2-token-trigger,[\s\S]*font-size:\s*11px !important/);
assert.match(a11y, /\.rwa2-profile-name\s*\{[\s\S]*font-size:\s*10\.8px/);
assert.match(context, /\.rwa2-context-chip\s*\{[\s\S]*min-height:28px/);
assert.match(context, /\.rwa2-performance-item\s*\{[\s\S]*min-height:26px/);
assert.match(base, /\.rwa2-token-trigger\s*\{[\s\S]*min-height:25px/);
assert.match(base, /\.rwa2-status-row\s*\{[\s\S]*min-height:29px/);
assert.match(context, /\.rwa2-tooltip-token\s*\{[\s\S]*width:\s*min\(254px/);
assert.match(a11y, /:focus-visible/);
assert.match(a11y, /prefers-contrast:\s*more/);
assert.doesNotMatch(a11y, /font-size:\s*(?:[0-9](?:\.[0-9]+)?)px/);
assert.match(a11y, /\.rwa2-performance-key\s*\{\s*font-size:10px/);
assert.match(a11y, /\.rwa2-popup \.rwa2-action\s*\{\s*font-size:11px !important/);
assert.match(base, /\.rwa2-brand-title\s*\{[\s\S]*font-size:16px;[\s\S]*font-weight:740;[\s\S]*letter-spacing:-\.015em/);
assert.match(base, /\.rwa2-profile-name\s*\{[\s\S]*font-weight:560;[\s\S]*letter-spacing:-\.005em/);
assert.match(base, /\.rwa2-popup \.rwa2-action\s*\{[\s\S]*font-weight:560 !important/);

console.log('popupcalibrationcheck: readability/target/focus contract passed');
