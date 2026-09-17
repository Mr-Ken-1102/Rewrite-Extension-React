import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isLikelyLocalNetworkUrl, normalizeProviderFailure } from './src/services/policies/providerPolicy.js';

const read = (path) => readFileSync(path, 'utf8');
let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
};

ok('RFC1918 and loopback Direct API URLs are recognized as local-network providers', () => {
  assert.equal(isLikelyLocalNetworkUrl('http://127.0.0.1:11434/v1'), true);
  assert.equal(isLikelyLocalNetworkUrl('http://localhost:11434/v1'), true);
  assert.equal(isLikelyLocalNetworkUrl('http://192.168.1.3:11434/v1'), true);
  assert.equal(isLikelyLocalNetworkUrl('http://10.20.30.40:11434/v1'), true);
  assert.equal(isLikelyLocalNetworkUrl('http://172.16.1.8:11434/v1'), true);
  assert.equal(isLikelyLocalNetworkUrl('http://172.31.255.1:11434/v1'), true);
  assert.equal(isLikelyLocalNetworkUrl('http://172.32.0.1:11434/v1'), false);
  assert.equal(isLikelyLocalNetworkUrl('https://api.example.com/v1'), false);
});

ok('provider failures distinguish timeout from browser/network failure', () => {
  const timeout = normalizeProviderFailure(Object.assign(new Error('Request timed out after 45000ms'), { name: 'TimeoutError' }));
  assert.equal(timeout.errorCode, 'RWA_PROVIDER_TIMEOUT');
  const network = normalizeProviderFailure(new TypeError('Failed to fetch'));
  assert.equal(network.errorCode, 'RWA_PROVIDER_NETWORK');
  assert.match(network.error, /listen address|firewall|allowed browser origins/i);
});

ok('Direct loopback and LAN inference has a 120-second minimum safety window', () => {
  const source = read('./src/services/providers/providerService.js');
  assert.match(source, /directLocalNetwork = mode === 'direct' && isLikelyLocalNetworkUrl\(config\.ollamaUrl\)/);
  assert.match(source, /directLocalNetwork[\s\S]*Math\.max\(120000, configuredTimeout\)/);
  assert.match(source, /timeoutMs:\s*timeout/);
});

ok('result modal uses an isolated balanced layout and no cursor-following glow path', () => {
  const modal = read('./src/components/modals/PreviewModal.jsx');
  const css = read('./src/styles-result.js');
  assert.match(modal, /className="rwar-window"/);
  assert.match(modal, /bodyClassName="rwar-body"/);
  assert.match(modal, /rwar-actions-primary/);
  assert.match(modal, /rwar-actions-tools/);
  assert.doesNotMatch(modal, /handleGlowMouseMove|getBoundingClientRect/);
  assert.ok((modal.match(/glow=\{false\}/g) || []).length >= 6);
  assert.match(css, /\.rwar-actions\s*\{/);
  assert.match(css, /\.rwar-section-head\s*\{/);
  assert.match(css, /\.rwar-raw\s*\{/);
});

ok('isolated visual namespaces load without reintroducing popup cascade coupling', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}\\n\$\{RWA_SETTINGS_CSS\}\\n\$\{RWA_RESULT_CSS\}/);
});

console.log(`\nlancheck: ${passed}/${passed} assertions passed`);
