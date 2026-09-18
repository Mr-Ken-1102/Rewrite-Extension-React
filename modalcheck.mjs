import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const files = [
  './src/components/modals/AIArchitectModal.jsx',
  './src/components/modals/ConfirmModal.jsx',
  './src/components/modals/CustomPromptModal.jsx',
  './src/components/modals/EditProfileModal.jsx',
  './src/components/modals/ErrorModal.jsx',
  './src/components/modals/LedgerModal.jsx',
  './src/components/modals/PreviewModal.jsx',
  './src/components/modals/SettingsModal.jsx',
];

const source = files.map((path) => `${path}\n${read(path)}`).join('\n');

assert.doesNotMatch(source, /useGlowPointer/);
assert.doesNotMatch(source, /rwa-glow-button/);
assert.doesNotMatch(source, /on(?:Mouse|Pointer)Move=\{[^}]*Glow/i);
assert.doesNotMatch(source, /getBoundingClientRect\(\)/);

for (const path of files) {
  const file = read(path);
  const buttonCount = (file.match(/<Button\b/g) || []).length;
  const noGlowCount = (file.match(/<Button\b[^>]*\bglow=\{false\}/g) || []).length;
  assert.equal(noGlowCount, buttonCount, `${path} must opt every Button out of cursor-following glow work`);
}

const edit = read('./src/components/modals/EditProfileModal.jsx');
assert.match(edit, /aria-label="Style accent color"/);
assert.match(edit, /disabled=\{!name\.trim\(\) \|\| !prompt\.trim\(\)\}/);

const ledger = read('./src/components/modals/LedgerModal.jsx');
assert.match(ledger, /role="status" aria-live="polite"/);

const preview = read('./src/components/modals/PreviewModal.jsx');
assert.match(preview, /partialResult/);
assert.match(preview, /Live result/);
assert.match(preview, /Receiving result/);
assert.match(preview, /SSE · streaming/);
assert.match(preview, /streamStatus/);
assert.match(preview, /nativeEditorPrepared/);
assert.match(preview, /disabled=\{isApplying \|\| nativeEditorPrepared\}/);
assert.match(preview, /config\.typewriter && !streamed/);

const confirm = read('./src/components/modals/ConfirmModal.jsx');
assert.match(confirm, /role="alertdialog"/);
assert.match(confirm, /aria-hidden="true"/);

console.log(`modalcheck: ${files.length} modal surfaces use static low-paint actions and guarded semantics`);
