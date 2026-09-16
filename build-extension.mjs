import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createExtensionManifest, validateExtensionManifest } from './extension-manifest.mjs';

await import('./sourcecheck.mjs');
await import('./selfcheck.mjs');
await import('./failuremodecheck.mjs');
await import('./manifestcheck.mjs');
const { build } = await import('vite');
await build();

const js = readFileSync('./dist/rewrite-assistant-react.js', 'utf8');
const manifest = createExtensionManifest(js);
const output = JSON.stringify(manifest, null, 2);
writeFileSync('./rewrite-assistant-react.json', output, 'utf8');
mkdirSync('./dist', { recursive: true });
writeFileSync('./dist/rewrite-assistant-react.json', output, 'utf8');

const roundTrip = JSON.parse(readFileSync('./rewrite-assistant-react.json', 'utf8'));
validateExtensionManifest(roundTrip, js);
console.log(`bundle: wrote rewrite-assistant-react.json (${js.length.toLocaleString()} JS chars)`);
