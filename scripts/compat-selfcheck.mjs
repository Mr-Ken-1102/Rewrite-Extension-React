import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const sourceRoot = join(root, 'src');

function collectFiles(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else if (/\.(?:js|jsx)$/u.test(name)) files.push(path);
  }
  return files;
}

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

const sourceFiles = collectFiles(sourceRoot);
const source = sourceFiles.map((path) => `\n/* ${relative(root, path)} */\n${readFileSync(path, 'utf8')}`).join('\n');
const main = read('src/main.jsx');
const bridge = read('src/services/marinaraBridge.js');
const apiService = read('src/services/apiService.js');
const domUtils = read('src/utils/domUtils.js');
const textEditor = read('src/services/textEditorService.js');
const persistentStore = read('src/store/usePersistentStore.js');
const manifest = JSON.parse(read('public/manifest.json'));

const checks = [
  ['legacy apiFetch removed', () => assert.doesNotMatch(source, /\.apiFetch\s*\(/u)],
  ['frozen Marinara API is not mutated', () => assert.doesNotMatch(source, /(?:currentMarinara|marinara)\.destroy\s*=/u)],
  ['host cleanup uses onCleanup', () => assert.match(main, /currentMarinara\.onCleanup/u)],
  ['full-page identity uses extension.id', () => assert.match(main, /currentMarinara\.extension\?\.id/u)],
  ['attributed host fetch is preferred', () => assert.match(bridge, /marinara\.fetch\.bind\(marinara\)/u)],
  ['unsafe API calls set Marinara CSRF header', () => {
    assert.match(bridge, /x-marinara-csrf/u);
    assert.match(bridge, /MARINARA_CSRF_VALUE = '1'/u);
    assert.match(bridge, /UNSAFE_METHODS/u);
  }],
  ['Persona route matches v2.4.4 mount', () => assert.match(apiService, /personas:\s*'\/characters\/personas'/u)],
  ['group Character context is bounded', () => assert.match(apiService, /MAX_CHARACTER_CONTEXT = 8/u)],
  ['message history uses chat messages API', () => assert.match(apiService, /\/messages/u)],
  ['Sidecar prompt boundary is 16000', () => {
    assert.match(bridge, /SIDECAR_PROMPT_MAX_CHARS = 16_000/u);
    assert.match(apiService, /SIDECAR_PROMPT_MAX_CHARS/u);
  }],
  ['main composer is explicitly excluded', () => assert.match(domUtils, /data-chat-composer/u)],
  ['message editor must be scoped to a message', () => assert.match(domUtils, /data-message-id/u)],
  ['stale editor pre-image is verified', () => assert.match(textEditor, /selectedRangeIsCurrent/u)],
  ['undo history is excluded from persistence', () => {
    const partializeStart = persistentStore.indexOf('partialize:');
    const mergeStart = persistentStore.indexOf('merge:', partializeStart);
    assert.ok(partializeStart >= 0 && mergeStart > partializeStart, 'persist partialize/merge block not found');
    assert.doesNotMatch(persistentStore.slice(partializeStart, mergeStart), /history/u);
  }],
  ['private extension storage is used', () => {
    assert.match(persistentStore, /marinara\.storage/u);
    assert.match(persistentStore, /storage\.patch/u);
  }],
  ['manifest requests exact full-page capability', () => {
    assert.equal(manifest.kind, 'marinara.personal-extension');
    assert.equal(manifest.version, 1);
    assert.equal(manifest.config.runtime, 'client');
    assert.deepEqual(manifest.config.capabilities, ['full_page_access']);
    assert.equal(manifest.config.jsPath, 'r-w-a-v2-3_react.js');
  }],
];

let passed = 0;
for (const [name, check] of checks) {
  check();
  passed += 1;
  console.log(`✓ ${name}`);
}

console.log(`\ncompat-selfcheck: ${passed}/${checks.length} checks passed across ${sourceFiles.length} source files`);
