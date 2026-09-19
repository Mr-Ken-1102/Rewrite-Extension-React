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

const custom = read('./src/components/modals/CustomPromptModal.jsx');
assert.match(custom, /DOMUtils\.getChatId\(\) \|\| useRuntimeStore\.getState\(\)\.selection\?\.cid \|\| ''/);
assert.match(custom, /APIService\.runInference\([\s\S]*\{ chatId \},/s);
assert.match(custom, /rwa-refine-status/);
assert.match(custom, /rwa-activity-rail/);
assert.match(custom, /Refining the instruction with the current model/);

const architect = read('./src/components/modals/AIArchitectModal.jsx');
assert.match(architect, /rwa-architect-status/);
assert.match(architect, /isGenerating && \(/);
assert.match(architect, /rwa-activity-rail/);
assert.match(architect, /rwa-activity-runner/);
assert.match(architect, /Analyzing structure and drafting the preset/);
assert.match(architect, /Working…/);

const preview = read('./src/components/modals/PreviewModal.jsx');
assert.match(preview, /partialResult/);
assert.match(preview, /Live result/);
assert.match(preview, /Receiving result/);
assert.match(preview, /SSE · streaming/);
assert.match(preview, /streamStatus/);
assert.match(preview, /nativeEditorPrepared/);
assert.match(preview, /disabled=\{isApplying \|\| nativeEditorPrepared\}/);
assert.match(preview, /Rewrite again/);
assert.match(preview, /Viết lại lần nữa/);
assert.match(preview, /rwar-rewrite-again/);
assert.match(preview, /rwar-ready-rail/);
assert.match(preview, /rwar-working-rail/);
assert.doesNotMatch(preview, /className="rwa-pulse"/);
assert.ok(preview.indexOf('className="rwar-rewrite-again"') < preview.indexOf('className="rwar-native-editor"'));
assert.match(preview, /config\.typewriter && !streamed/);

const resultCss = read('./src/styles-result.js');
assert.match(resultCss, /height:\s*46px !important/);
assert.match(resultCss, /\.rwar-actions-primary,[\s\S]*display:\s*contents/);
assert.match(resultCss, /\.rwar-actions \.rwar-native-editor \{ flex-grow:\s*1\.72/);
assert.match(resultCss, /@keyframes rwar-result-arrive/);
assert.match(resultCss, /@keyframes rwar-ready-sweep/);
assert.match(resultCss, /@keyframes rwar-working-sweep/);
assert.match(resultCss, /\.rwar-working-rail > span[\s\S]*animation:\s*rwar-working-sweep 1\.35s/s);
assert.match(resultCss, /\.rwar-window-ready \.rwar-section/);
assert.match(resultCss, /\.rwar-actions \.rwar-rewrite-again\s*\{[\s\S]*border-color:\s*rgba\(209,154,69,.28\)/s);

const confirm = read('./src/components/modals/ConfirmModal.jsx');
assert.match(confirm, /role="alertdialog"/);
assert.match(confirm, /aria-hidden="true"/);

console.log(`modalcheck: ${files.length} modal surfaces use static low-paint actions and guarded semantics`);
