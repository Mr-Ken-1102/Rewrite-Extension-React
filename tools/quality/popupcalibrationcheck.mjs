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

assert.match(a11y, /\.rwa2-live-token,[\s\S]*font-size:\s*11px !important/);
assert.match(a11y, /\.rwa2-profile-name\s*\{[\s\S]*font-size:\s*13px/);
assert.match(a11y, /\.rwa2-recipe-chip\s*\{[\s\S]*min-height:\s*27px/);
assert.match(context, /\.rwa2-live-control,[\s\S]*min-height:\s*25px/);
assert.match(context, /\.rwa2-inspector-close\s*\{[\s\S]*width:\s*26px;[\s\S]*height:\s*26px/);
assert.match(a11y, /:focus-visible/);
assert.match(a11y, /prefers-contrast:\s*more/);
assert.doesNotMatch(a11y, /font-size:\s*(?:[0-9](?:\.[0-9]+)?)px/);
assert.match(a11y, /\.rwa2-section-title\s*\{\s*font-size:\s*12\.5px/);
assert.match(a11y, /\.rwa2-popup \.rwa2-action\s*\{\s*font-size:\s*11\.5px !important/);
assert.match(base, /\.rwa2-brand-title\s*\{[\s\S]*font-weight:\s*760;[\s\S]*letter-spacing:\s*\.055em/);
assert.match(base, /\.rwa2-profile-name\s*\{[\s\S]*font-weight:\s*650;[\s\S]*letter-spacing:\s*\.005em/);
assert.match(base, /\.rwa2-popup \.rwa2-action\s*\{[\s\S]*font-weight:\s*600 !important/);

console.log('popupcalibrationcheck: readability/target/focus contract passed');
