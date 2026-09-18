import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const aggregator = read('./src/styles-popup.js');
const a11y = read('./src/styles-popup-a11y.js');
const context = read('./src/styles-popup-context.js');

assert.match(aggregator, /RWA_POPUP_A11Y_CSS/);
assert.match(
  aggregator,
  /RWA_POPUP_CONTEXT_CSS\}\\n\$\{RWA_POPUP_A11Y_CSS\}\\n\$\{RWA_POPUP_RESPONSIVE_CSS\}/,
);

assert.match(a11y, /\.rwa2-token-status\s*\{[\s\S]*font-size:\s*12px/);
assert.match(a11y, /\.rwa2-profile-name\s*\{[\s\S]*font-size:\s*13px/);
assert.match(a11y, /\.rwa2-chip\s*\{[\s\S]*min-height:\s*26px/);
assert.match(context, /\.rwa2-info\s*\{[\s\S]*width:\s*24px;[\s\S]*height:\s*24px/);
assert.match(context, /\.rwa2-target-chip\s*\{[\s\S]*min-height:\s*24px/);
assert.match(a11y, /:focus-visible/);
assert.match(a11y, /prefers-contrast:\s*more/);
assert.doesNotMatch(a11y, /font-size:\s*(?:[0-9](?:\.[0-9]+)?)px/);
assert.match(a11y, /\.rwa2-section-title\s*\{\s*font-size:\s*12\.5px/);
assert.match(a11y, /\.rwa2-popup \.rwa2-action\s*\{\s*font-size:\s*11\.5px !important/);

console.log('popupcalibrationcheck: readability/target/focus contract passed');
