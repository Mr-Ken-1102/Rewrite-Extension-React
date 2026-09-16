import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(process.argv[2] || '');
const expectedVersion = String(process.argv[3] || '2.4.4');
if (!process.argv[2]) {
  console.error('Usage: node engine-compatcheck.mjs /path/to/Marinara-Engine [expected-version]');
  process.exit(2);
}
const read = (rel) => readFileSync(join(root, rel), 'utf8');
let passed = 0;
const ok = (name, fn) => { fn(); passed += 1; console.log(`✓ ${name}`); };

const pkg = JSON.parse(read('package.json'));
ok(`Engine version is ${expectedVersion}`, () => assert.equal(pkg.version, expectedVersion));

ok('Personal Extension client/full-page manifest contract exists', () => {
  const schema = read('packages/shared/src/schemas/personal-extension.schema.ts');
  const caps = read('packages/shared/src/types/personal-extension.ts');
  assert.match(schema, /z\.enum\(\["client", "server"\]\)/);
  assert.match(caps, /"full_page_access"/);
});

ok('Full-page host exposes private storage, attributed fetch, timers and cleanup', () => {
  const src = read('packages/client/src/components/layout/PersonalExtensionInjector.tsx');
  assert.match(src, /get:\s*\(\)\s*=>\s*Promise<Record<string, unknown>>/);
  assert.match(src, /patch:\s*\(value:\s*Record<string, unknown>\)/);
  assert.match(src, /clear:\s*\(\)\s*=>\s*Promise<void>/);
  assert.match(src, /fetch:\s*typeof window\.fetch/);
  assert.match(src, /onCleanup:\s*\(cleanup:/);
});

ok('Full-page host tracks timers and clears them during extension cleanup', () => {
  const src = read('packages/client/src/components/layout/PersonalExtensionInjector.tsx');
  assert.match(src, /timeoutIds:\s*new Set/);
  assert.match(src, /active\.timeoutIds\.add\(timerId\)/);
  assert.match(src, /for \(const timerId of fullPage\.timeoutIds\) window\.clearTimeout\(timerId\)/);
});

ok('Unsafe same-origin writes require Marinara CSRF header', () => {
  const sec = read('packages/shared/src/constants/security.ts');
  assert.match(sec, /x-marinara-csrf/);
  assert.match(sec, /CSRF_HEADER_VALUE\s*=\s*"1"/);
});

ok('Chat read and guarded-write routes match Rewrite Assistant', () => {
  const src = read('packages/server/src/routes/chats.routes.ts');
  assert.match(src, /"\/:id\/messages"/);
  assert.match(src, /"\/:chatId\/messages\/:messageId"/);
  assert.match(src, /const updated = await storage\.updateMessageContent/);
  assert.match(src, /if \(!updated\) return reply\.status\(404\)/);
  assert.match(src, /return updated;/);
});

ok('Persona route is nested under /characters', () => {
  const src = read('packages/server/src/routes/characters.routes.ts');
  assert.match(src, /"\/personas\/:id"/);
  const routes = read('packages/server/src/routes/index.ts');
  assert.match(routes, /charactersRoutes,\s*\{\s*prefix:\s*"\/api\/characters"/);
});

ok('Lorebook scan is GET and returns an entries envelope', () => {
  const src = read('packages/server/src/routes/lorebooks.routes.ts');
  assert.match(src, /app\.get<\{ Params: \{ chatId: string \} \}>\("\/scan\/:chatId"/);
  assert.match(src, /return \{\s*entries:/s);
  assert.match(src, /totalTokens:/);
});

ok('/generate/raw accepts connectionId + messages + streaming', () => {
  const src = read('packages/server/src/routes/generate/raw-route.ts');
  assert.match(src, /connectionId:\s*z\.string/);
  assert.match(src, /messages:\s*z\.array\(rawMessageSchema\)/);
  assert.match(src, /streaming:\s*z\.boolean\(\)\.optional\(\)/);
  assert.match(src, /app\.post\("\/raw"/);
  assert.match(src, /return reply\.send\(\{ aborted: true, runId \}\)/);
});

ok('/sidecar/tracker accepts two <=16k prompt strings', () => {
  const src = read('packages/server/src/routes/sidecar.routes.ts');
  assert.match(src, /systemPrompt:\s*z\.string\(\)\.max\(16000\)/);
  assert.match(src, /userPrompt:\s*z\.string\(\)\.max\(16000\)/);
  assert.match(src, /app\.post\("\/tracker"/);
});

ok('Native sent-message edit event used by manual-save mode exists', () => {
  const roleplay = read('packages/client/src/components/chat/ChatMessage.tsx');
  const conversation = read('packages/client/src/components/chat/ConversationMessage.tsx');
  assert.match(roleplay, /marinara:start-edit-message/);
  assert.match(conversation, /marinara:start-edit-message/);
});

ok('Current DOM hooks used by Rewrite Assistant exist', () => {
  const chat = read('packages/client/src/components/chat/ChatMessage.tsx');
  const input = read('packages/client/src/components/chat/ChatInput.tsx');
  const store = read('packages/client/src/stores/chat.store.ts');
  assert.match(chat, /data-message-id=\{message\.id\}/);
  assert.match(chat, /mari-message-content/);
  assert.match(input, /data-chat-composer="true"/);
  assert.match(store, /marinara-active-chat-id/);
});



ok('Personal Extension private storage quota is exactly 1,000,000 bytes', () => {
  const schema = read('packages/shared/src/schemas/personal-extension.schema.ts');
  assert.match(schema, /MAX_EXTENSION_STORAGE_BYTES\s*=\s*1_000_000/);
});

ok('Chat responses normalize characterIds for API consumers', () => {
  const src = read('packages/server/src/routes/chats.routes.ts');
  assert.match(src, /normalizeChatForResponse/);
  assert.match(src, /characterIds:\s*resolveChatCharacterIds\(chat\.characterIds\)/);
});

ok('Message privacy metadata exposes hidden-from-AI controls', () => {
  const chatTypes = read('packages/shared/src/types/chat.ts');
  const generateUtils = read('packages/server/src/routes/generate/generate-route-utils.ts');
  assert.match(chatTypes, /hiddenFromAI\?: boolean/);
  assert.match(chatTypes, /hiddenFromAICharacterIds\?: string\[\]/);
  assert.match(generateUtils, /parseExtra\(message\.extra\)\.hiddenFromAI === true/);
  assert.match(generateUtils, /getMessageHiddenFromAICharacterIds/);
});

ok('Message identity metadata supports historical persona and sender targeting', () => {
  const chatTypes = read('packages/shared/src/types/chat.ts');
  const chatRoutes = read('packages/server/src/routes/chats.routes.ts');
  assert.match(chatTypes, /characterId: string \| null/);
  assert.match(chatTypes, /personaSnapshot\?: \{/);
  assert.match(chatTypes, /personaId: string/);
  assert.match(chatRoutes, /updateMessageExtra\(created\.id, \{ personaSnapshot \}\)/);
});

ok('Conversation-start metadata defines Engine history boundaries', () => {
  const chatTypes = read('packages/shared/src/types/chat.ts');
  const generate = read('packages/server/src/routes/generate.routes.ts');
  const scope = read('packages/server/src/services/generation/prompt-message-scope.ts');
  assert.match(chatTypes, /isConversationStart\?: boolean/);
  assert.match(chatTypes, /conversationStartForCharacterIds\?: string\[\]/);
  assert.match(generate, /if \(extra\.isConversationStart\) \{\s*startIdx = i;/s);
  assert.match(scope, /conversationStartForCharacterIds\?\.includes\(audienceCharacterIds\[0\]!\)/);
});


ok('Flat JSON Personal Extension imports preserve runtime, capabilities and inline JS', () => {
  const importer = read('packages/client/src/lib/personal-extension-import.ts');
  const folder = read('packages/shared/src/features/folder-packages/manifest-package.ts');
  assert.match(folder, /return \[parsed\];/);
  assert.match(importer, /const runtime =/);
  assert.match(importer, /normalizePersonalExtensionCapabilities\(record\.capabilities\)/);
  assert.match(importer, /typeof record\.js === "string" \? record\.js : null/);
  assert.match(importer, /typeof record\.css === "string" \? record\.css : null/);
});

ok('full_page_access selects the full-page runtime endpoint', () => {
  const routes = read('packages/server/src/routes/personal-extensions.routes.ts');
  assert.match(routes, /executionMode:\s*hasFullPageAccess\(extension\) \? "full-page" : "sandboxed"/);
  assert.match(routes, /\/page-runtime\.js\?hash=/);
});

ok('Full-page runtime injects extension JavaScript with the host API bound as marinara', () => {
  const routes = read('packages/server/src/routes/personal-extensions.routes.ts');
  const injector = read('packages/client/src/components/layout/PersonalExtensionInjector.tsx');
  assert.match(routes, /run\(extension, async \(marinara\) => \{/);
  assert.match(routes, /\$\{extension\.js \?\? ""\}/);
  assert.match(injector, /main\(createFullPageExtensionApi\(active\)\)/);
});


if (expectedVersion === '2.4.6') {
  ok('Engine 2.4.6 supports character-backed chat user identity snapshots', () => {
    const chatTypes = read('packages/shared/src/types/chat.ts');
    const chatSchema = read('packages/shared/src/schemas/chat.schema.ts');
    const identity = read('packages/server/src/services/chat-user-identity.ts');
    const routes = read('packages/server/src/routes/chats.routes.ts');
    assert.match(chatTypes, /personaCharacterId: string \| null/);
    assert.match(chatSchema, /personaCharacterId: z\.string\(\)\.nullable\(\)\.default\(null\)/);
    assert.match(identity, /source: "persona" \| "character"/);
    assert.match(identity, /if \(chat\.personaCharacterId\)/);
    assert.match(routes, /source: identity\.source/);
  });

  ok('Engine 2.4.6 Personal Extension persona snapshots expose identity source', () => {
    const types = read('packages/shared/src/types/personal-extension.ts');
    const routes = read('packages/server/src/routes/personal-extensions.routes.ts');
    assert.match(types, /source\?: "persona" \| "character"/);
    assert.match(routes, /resolveChatUserIdentity/);
    assert.match(routes, /source: identity\.source/);
  });
}

console.log(`\nengine-compatcheck: ${passed}/${passed} Marinara Engine v${expectedVersion} contract checks passed`);
