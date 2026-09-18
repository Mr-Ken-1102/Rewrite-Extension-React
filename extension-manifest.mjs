import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export const EXTENSION_NAME = 'Rewrite Assistant React';
export const EXTENSION_DESCRIPTION = 'Rewrite Assistant v3.0.3 for Marinara Engine v2.4.4–v2.4.6. Includes exact selected-Character identity, mode-aware Persona Reply anchoring, a draggable modeless Draft Reply popup, safe per-mode launcher placement, guarded message updates, streaming/cancel support, privacy-safe context, and hardened storage/network lifecycle.';
export const EXTENSION_RUNTIME = 'client';
export const EXTENSION_CAPABILITIES = Object.freeze(['full_page_access']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateExtensionManifest(manifest, expectedJs = null) {
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Extension manifest must be an object.');
  assert(typeof manifest.name === 'string' && manifest.name.trim().length >= 1 && manifest.name.trim().length <= 200, 'Extension name violates the certified Marinara Personal Extension limits.');
  assert(typeof manifest.version === 'string' && manifest.version.trim().length >= 1 && manifest.version.trim().length <= 64, 'Extension version violates the certified Marinara Personal Extension limits.');
  assert(typeof manifest.description === 'string' && manifest.description.length <= 2000, 'Extension description violates the certified Marinara Personal Extension limits.');
  assert(manifest.runtime === EXTENSION_RUNTIME, 'Extension runtime must be client.');
  assert(Array.isArray(manifest.capabilities), 'Extension capabilities must be an array.');
  assert(manifest.capabilities.length === 1 && manifest.capabilities[0] === 'full_page_access', 'Extension must request only full_page_access.');
  assert(typeof manifest.css === 'string', 'Extension css must be a string.');
  assert(typeof manifest.js === 'string' && manifest.js.trim().length > 0, 'Browser Personal Extension requires JavaScript.');
  assert(!Object.prototype.hasOwnProperty.call(manifest, 'serverJs'), 'Client extension must not contain serverJs.');
  if (expectedJs !== null) assert(manifest.js === expectedJs, 'Manifest JavaScript changed during serialization.');
  return manifest;
}

export function createExtensionManifest(js) {
  const version = packageJson.version;
  assert(typeof version === 'string' && /^\d+\.\d+\.\d+(?:[-+].+)?$/.test(version), 'package.json contains an invalid extension version.');
  return validateExtensionManifest({
    name: EXTENSION_NAME,
    version,
    description: EXTENSION_DESCRIPTION,
    runtime: EXTENSION_RUNTIME,
    capabilities: [...EXTENSION_CAPABILITIES],
    css: '',
    js,
  }, js);
}
