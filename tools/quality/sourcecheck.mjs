import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';

const root = process.cwd();
const sourceExtensions = ['.js', '.jsx', '.mjs'];
const skipDirs = new Set(['.git', 'node_modules', 'dist']);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function resolveImportFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    ...sourceExtensions.map((ext) => `${base}${ext}`),
    ...sourceExtensions.map((ext) => join(base, `index${ext}`)),
  ];
  return candidates.find(existsSync) || null;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return true;
  return resolveImportFile(fromFile, specifier) !== null;
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const lockRoot = packageLock.packages?.[''];
if (!lockRoot) throw new Error('package-lock.json is missing packages[""].');
for (const key of ['name', 'version']) {
  if (lockRoot[key] !== packageJson[key]) throw new Error(`package-lock root ${key} does not match package.json.`);
}
for (const key of ['dependencies', 'devDependencies', 'engines']) {
  if (JSON.stringify(lockRoot[key] || {}) !== JSON.stringify(packageJson[key] || {})) {
    throw new Error(`package-lock root ${key} does not match package.json.`);
  }
}

const projectFiles = walk(root);
const sourceFiles = projectFiles.filter((file) => sourceExtensions.includes(extname(file)));
const srcPrefix = `${join(root, 'src')}${sep}`;
const runtimeSourceFiles = sourceFiles.filter((file) => file.startsWith(srcPrefix));
const importPattern = /(?:import\s+(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+|import\s*\()(['"])([^'"]+)\1/g;
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  let match;
  while ((match = importPattern.exec(source))) {
    if (!resolveImport(file, match[2])) throw new Error(`Unresolved relative import ${match[2]} in ${file}.`);
  }
}

// Runtime modules are intentionally acyclic. Cycles make initialization order
// implicit and are especially dangerous around stores/controllers that perform
// destructive writes. Keep the rule dependency-free so CI catches drift before npm ci.
const runtimeSet = new Set(runtimeSourceFiles.map((file) => resolve(file)));
const runtimeGraph = new Map([...runtimeSet].map((file) => [file, []]));
for (const file of runtimeSet) {
  const source = readFileSync(file, 'utf8');
  importPattern.lastIndex = 0;
  let match;
  while ((match = importPattern.exec(source))) {
    const target = resolveImportFile(file, match[2]);
    if (target && runtimeSet.has(resolve(target))) runtimeGraph.get(file).push(resolve(target));
  }
}
const visitState = new Map();
const visitStack = [];
function visitRuntime(file) {
  const state = visitState.get(file) || 0;
  if (state === 2) return;
  if (state === 1) {
    const start = visitStack.indexOf(file);
    const cycle = [...visitStack.slice(Math.max(0, start)), file].map((item) => item.replace(`${root}${sep}`, '')).join(' -> ');
    throw new Error(`Runtime import cycle detected: ${cycle}`);
  }
  visitState.set(file, 1);
  visitStack.push(file);
  for (const target of runtimeGraph.get(file) || []) visitRuntime(target);
  visitStack.pop();
  visitState.set(file, 2);
}
for (const file of runtimeSet) visitRuntime(file);

const runtimeJs = sourceFiles.filter((file) => !file.endsWith('.jsx'));
for (const file of runtimeJs) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });

const forbidden = [
  ['eval(', /\beval\s*\(/],
  ['new Function', /\bnew\s+Function\b/],
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['document.write', /document\.write\s*\(/],
  ['localStorage.clear', /localStorage\.clear\s*\(/],
];
for (const file of runtimeSourceFiles) {
  const source = readFileSync(file, 'utf8');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) throw new Error(`Forbidden ${label} pattern found in ${file}.`);
  }
}

const hostAdapterPath = join('services', 'marinaraHost.js');
const rawNetwork = runtimeSourceFiles.filter((file) => {
  if (file.endsWith(hostAdapterPath)) return false;
  const source = readFileSync(file, 'utf8');
  return /\b(?:window|globalThis)\.fetch\b/.test(source)
    || /(^|[^\w.])fetch\s*\(/m.test(source)
    || /\b(?:XMLHttpRequest|WebSocket|EventSource)\b/.test(source);
});
if (rawNetwork.length) throw new Error(`Raw network primitive found outside Marinara host adapter: ${rawNetwork.join(', ')}`);

const storageAdapterPath = join('store', 'persistence', 'storageAdapter.js');
const rawPageStorageWrites = runtimeSourceFiles.filter((file) => {
  if (file.endsWith(storageAdapterPath)) return false;
  return /\b(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(/.test(readFileSync(file, 'utf8'));
});
if (rawPageStorageWrites.length) throw new Error(`Page-storage write found outside guarded migration adapter: ${rawPageStorageWrites.join(', ')}`);

const obviousSecrets = runtimeSourceFiles.filter((file) => {
  const source = readFileSync(file, 'utf8');
  return /\bsk-[A-Za-z0-9_-]{20,}\b/.test(source)
    || /Bearer\s+[A-Za-z0-9._~-]{20,}/i.test(source)
    || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source);
});
if (obviousSecrets.length) throw new Error(`Credential-like literal found in runtime source: ${obviousSecrets.join(', ')}`);

console.log(`sourcecheck: ${sourceFiles.length} JS/JSX/MJS files, imports/lockfile/runtime syntax/high-risk patterns PASS`);
