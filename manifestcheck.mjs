import { createExtensionManifest, validateExtensionManifest } from './extension-manifest.mjs';

const sentinelJs = '"use strict";void 0;';
const manifest = createExtensionManifest(sentinelJs);
const serialized = JSON.stringify(manifest);
const roundTrip = JSON.parse(serialized);
validateExtensionManifest(roundTrip, sentinelJs);

if (Object.keys(roundTrip).sort().join(',') !== 'capabilities,css,description,js,name,runtime,version') {
  throw new Error('Installable manifest contains unexpected top-level fields.');
}

console.log('manifestcheck: Marinara Engine v2.4.4–v2.4.6 installable payload contract PASS');
