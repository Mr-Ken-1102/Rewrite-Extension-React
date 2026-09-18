import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getProviderTargetAddressSpace,
  isLikelyLocalNetworkUrl,
  normalizeProviderFailure,
  withProviderNetworkHints,
} from '../../src/services/policies/providerPolicy.js';

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

ok('local provider address-space hints distinguish loopback from LAN', () => {
  assert.equal(getProviderTargetAddressSpace('http://127.0.0.1:11434/v1'), 'loopback');
  assert.equal(getProviderTargetAddressSpace('http://192.168.1.3:11434/v1'), 'local');
  assert.equal(getProviderTargetAddressSpace('https://api.example.com/v1'), null);
  const hinted = withProviderNetworkHints('http://192.168.1.3:11434/v1', { method: 'GET' });
  assert.equal(hinted.mode, 'cors');
  assert.equal(hinted.targetAddressSpace, 'local');
});

ok('provider failures distinguish timeout from browser/network failure', () => {
  const timeout = normalizeProviderFailure(Object.assign(new Error('Request timed out after 45000ms'), { name: 'TimeoutError' }));
  assert.equal(timeout.errorCode, 'RWA_PROVIDER_TIMEOUT');
  const network = normalizeProviderFailure(new TypeError('Failed to fetch'));
  assert.equal(network.errorCode, 'RWA_PROVIDER_NETWORK');
  assert.match(network.error, /listen address|firewall|browser origin|local network access/i);
});

ok('Direct loopback and LAN inference has a 120-second minimum safety window', () => {
  const source = read('./src/services/providers/providerService.js');
  assert.match(source, /directLocalNetwork = mode === 'direct' && isLikelyLocalNetworkUrl\(config\.ollamaUrl\)/);
  assert.match(source, /directLocalNetwork[\s\S]*Math\.max\(120000, configuredTimeout\)/);
  assert.match(source, /timeoutMs:\s*timeout/);
});

ok('Direct and Extender provider fetches carry local-network request hints', () => {
  const source = read('./src/services/providers/providerService.js');
  assert.ok((source.match(/withProviderNetworkHints\(/g) || []).length >= 6);
  assert.match(source, /targetAddressSpace/);
  assert.match(source, /loopback-network/);
  assert.match(source, /local-network/);
});

ok('LAN diagnosis separates browser permission, CORS, HTTP and transport failures', () => {
  const service = read('./src/services/providers/providerService.js');
  const ui = read('./src/components/modals/settings/TabAPI.jsx');
  assert.match(service, /static async diagnoseDirectApi/);
  assert.match(service, /mode: 'no-cors'/);
  assert.match(service, /issue: 'permission'/);
  assert.match(service, /issue: 'cors'/);
  assert.match(service, /issue: 'transport'/);
  assert.match(ui, /OLLAMA_HOST=0\.0\.0\.0:11434/);
  assert.match(ui, /OLLAMA_ORIGINS=\$\{browserOrigin\}/);
  assert.match(ui, /Diagnose LAN access/);
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

ok('result text surfaces use Original Text typography as the 13px baseline', () => {
  const css = read('./src/styles-result.js');
  assert.match(css, /\.rwar-original,[\s\S]*\.rwar-result-preview,[\s\S]*font-size:\s*13px !important/);
  assert.match(css, /\.rwar-message-text\s*\{[^}]*font-size:\s*13px/);
  assert.match(css, /\.rwar-raw\s*\{[\s\S]*font-size:\s*13px !important;[\s\S]*line-height:\s*1\.55 !important/);
  assert.doesNotMatch(css, /font-size:\s*11\.5px !important/);
  assert.doesNotMatch(css, /font-size:\s*12\.5px !important/);
});

ok('Replace All remains visually secondary to the primary Accept action', () => {
  const css = read('./src/styles-result.js');
  assert.match(css, /\.rwar-actions \.rwa-replace\s*\{[\s\S]*background:\s*rgba\(255,255,255,\.025\) !important/);
  assert.match(css, /\.rwar-actions \.rwa-replace:hover:not\(:disabled\)/);
  assert.doesNotMatch(css, /\.rwar-actions \.rwa-replace\s*\{[\s\S]*var\(--rwa-accent\)/);
});

ok('isolated visual namespaces load without reintroducing popup cascade coupling', () => {
  const main = read('./src/main.jsx');
  assert.match(main, /RWA_PERFORMANCE_CSS\}\\n\$\{RWA_POPUP_CSS\}\\n\$\{RWA_SETTINGS_CSS\}\\n\$\{RWA_RESULT_CSS\}/);
});

console.log(`\nlancheck: ${passed}/${passed} assertions passed`);
