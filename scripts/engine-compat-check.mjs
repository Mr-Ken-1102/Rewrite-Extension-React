import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const engineRoot = resolve(process.argv[2] || 'vendor/marinara-engine');

function read(path) {
  const fullPath = resolve(engineRoot, path);
  assert.ok(existsSync(fullPath), `Missing Marinara source file: ${path}`);
  return readFileSync(fullPath, 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const security = read('packages/shared/src/constants/security.ts');
const extensionTypes = read('packages/shared/src/types/personal-extension.ts');
const injector = read('packages/client/src/components/layout/PersonalExtensionInjector.tsx');
const characterRoutes = read('packages/server/src/routes/characters.routes.ts');
const sidecarRoutes = read('packages/server/src/routes/sidecar.routes.ts');
const chatRoutes = read('packages/server/src/routes/chats.routes.ts');
const chatInput = read('packages/client/src/components/chat/ChatInput.tsx');
const conversationInput = read('packages/client/src/components/chat/ConversationInput.tsx');
const chatMessage = read('packages/client/src/components/chat/ChatMessage.tsx');
const conversationMessage = read('packages/client/src/components/chat/ConversationMessage.tsx');
const extensionSchema = read('packages/shared/src/schemas/personal-extension.schema.ts');

const checks = [
  ['Engine version is exactly 2.4.4', () => assert.equal(packageJson.version, '2.4.4')],
  ['full_page_access capability exists', () => assert.match(extensionTypes, /PERSONAL_EXTENSION_FULL_PAGE_CAPABILITY = "full_page_access"/u)],
  ['client/server runtime schema remains valid', () => assert.match(extensionSchema, /z\.enum\(\["client", "server"\]\)/u)],
  ['CSRF contract matches Rewrite bridge', () => {
    assert.match(security, /CSRF_HEADER = "x-marinara-csrf"/u);
    assert.match(security, /CSRF_HEADER_VALUE = "1"/u);
  }],
  ['full-page API exposes attributed fetch', () => assert.match(injector, /fetch:\s*\(input, init\) => fetchForPersonalExtension/u)],
  ['full-page API exposes private storage clear', () => assert.match(injector, /async clear\(\)/u)],
  ['full-page API is immutable', () => assert.match(injector, /return Object\.freeze\(api\)/u)],
  ['full-page API exposes cleanup registration', () => assert.match(injector, /onCleanup\(cleanup\)/u)],
  ['Persona route remains under characters router', () => assert.match(characterRoutes, /"\/personas\/:id"/u)],
  ['Sidecar tracker route exists', () => assert.match(sidecarRoutes, /app\.post\("\/tracker"/u)],
  ['Sidecar tracker keeps 16000-character limits', () => {
    assert.match(sidecarRoutes, /systemPrompt:\s*z\.string\(\)\.max\(16000\)/u);
    assert.match(sidecarRoutes, /userPrompt:\s*z\.string\(\)\.max\(16000\)/u);
  }],
  ['Sidecar tracker returns result object', () => assert.match(sidecarRoutes, /return \{ result \};/u)],
  ['chat messages read route exists', () => assert.match(chatRoutes, /"\/:id\/messages"/u)],
  ['roleplay composer has stable marker', () => assert.match(chatInput, /data-chat-composer="true"/u)],
  ['conversation composer has stable marker', () => assert.match(conversationInput, /data-chat-composer="true"/u)],
  ['roleplay message exposes ID and role', () => {
    assert.match(chatMessage, /data-message-id=\{message\.id\}/u);
    assert.match(chatMessage, /data-message-role=\{message\.role\}/u);
  }],
  ['conversation message exposes ID and role', () => {
    assert.match(conversationMessage, /data-message-id=\{message\.id\}/u);
    assert.match(conversationMessage, /data-message-role=\{message\.role\}/u);
  }],
];

let passed = 0;
for (const [name, check] of checks) {
  check();
  passed += 1;
  console.log(`✓ ${name}`);
}

console.log(`\nengine-compat-check: ${passed}/${checks.length} Marinara v2.4.4 contract checks passed`);
