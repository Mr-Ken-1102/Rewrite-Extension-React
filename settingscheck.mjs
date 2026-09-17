import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const modal = read('./src/components/modals/SettingsModal.jsx');
const css = read('./src/styles-settings.js');
const main = read('./src/main.jsx');

assert.match(modal, /className="rwa-win rwas-settings"/);
assert.match(modal, /rwas-shell/);
assert.match(modal, /rwas-sidebar/);
assert.match(modal, /rwas-workspace/);
assert.match(modal, /scrollPositionsRef/);
assert.match(modal, /Changes save automatically/);
assert.match(modal, />Done<\/Button>/);
assert.doesNotMatch(modal, />Cancel<\/Button>/);
assert.doesNotMatch(modal, />OK<\/Button>/);
assert.match(modal, /rwas-page-actions/);
assert.match(modal, /\+ Add Style/);
assert.match(modal, /AI Architect/);
assert.doesNotMatch(modal, /useGlowPointer/);

assert.match(css, /width:\s*min\(960px/);
assert.match(css, /height:\s*min\(720px/);
assert.match(css, /grid-template-columns:\s*224px minmax\(0, 1fr\)/);
assert.match(css, /\.rwas-statusbar/);
assert.match(css, /backdrop-filter:\s*none/);
assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(css, /transition:\s*all/);

assert.match(main, /import \{ RWA_SETTINGS_CSS \} from '\.\/styles-settings\.js';/);
assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}\\n\$\{RWA_SETTINGS_CSS\}/);
assert.doesNotMatch(css, /\.rwa2-/);

console.log('settingscheck: isolated settings shell/semantics contract passed');
