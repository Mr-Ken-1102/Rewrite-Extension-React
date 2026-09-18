import assert from 'node:assert/strict';
import {
  ctxFingerprint,
  fingerprintOk,
  mapRenderedSpanToRaw,
  spanIsBalanced,
} from '../../src/services/spanMapper.js';
import {
  MAX_LEDGER_SOURCE_CHARS,
  assembleLedgerText,
  buildMergedPayload,
  createLedger,
  sessionLedgerStore,
  splitMergedResult,
  splitTextToLedgerSlices,
  subdivideLedgerSlice,
} from '../../src/services/advancedRewriteService.js';

const INITIAL_SEED = 0x5eed1234;
let seed = INITIAL_SEED >>> 0;
let assertions = 0;

function rng() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
}

function int(min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

const atoms = ['a', 'b', ' ', '\n', '\r\n', 'é', '中', '🙂', '—', '\t', 'word', '  ', '\n\n'];
function randomText(length) {
  let out = '';
  while (out.length < length) {
    const atom = atoms[int(0, atoms.length - 1)];
    if (out.length + atom.length <= length) out += atom;
    else out += 'a';
  }
  return out;
}

function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}

// Property 1: identity render/store mapping is exact for arbitrary UTF-16 text and spans.
for (let caseNo = 0; caseNo < 500; caseNo += 1) {
  const text = randomText(int(1, 500));
  const start = int(0, text.length - 1);
  const end = int(start, text.length);
  assert.deepEqual(mapRenderedSpanToRaw(text, text, start, end), { as: start, ae: end });
  assertions += 1;
}

// Property 2: any non-null transformed mapping must stay in range and may never
// bisect a protected markdown/macro/tag/link token pair.
const tokenFactories = [
  (text) => ({ raw: `**${text}**`, rendered: text }),
  (text) => ({ raw: `*${text}*`, rendered: text }),
  (text) => ({ raw: `<b>${text}</b>`, rendered: text }),
  (text) => ({ raw: `[${text}](https://example.invalid/x)`, rendered: text }),
  () => ({ raw: '{{char}}', rendered: 'Alice' }),
  (text) => ({ raw: `\`${text.replace(/`/g, '')}\``, rendered: text.replace(/`/g, '') }),
];
for (let caseNo = 0; caseNo < 700; caseNo += 1) {
  const chunks = [];
  for (let index = 0; index < int(2, 8); index += 1) {
    const plain = randomText(int(1, 18)).replace(/[\r\n]/g, ' ');
    chunks.push(rng() < 0.45
      ? { raw: plain, rendered: plain }
      : tokenFactories[int(0, tokenFactories.length - 1)](plain || 'x'));
  }
  const raw = chunks.map((chunk) => chunk.raw).join(' | ');
  const rendered = chunks.map((chunk) => chunk.rendered).join(' | ');
  if (!rendered.length) continue;
  const start = int(0, rendered.length - 1);
  const end = int(start + 1, rendered.length);
  const span = mapRenderedSpanToRaw(rendered, raw, start, end);
  if (span) {
    check(span.as >= 0 && span.ae >= span.as && span.ae <= raw.length, 'mapped span escaped raw bounds');
    check(spanIsBalanced(raw, span.as, span.ae), `mapped span orphaned a transform token: ${raw}`);
  }
}

// Property 2b: large-message window mapping must find exact unique anchors
// on both sides of a transform without falling back to an unsafe whole-message LCS.
function randomAscii(length) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  while (out.length < length) out += alphabet[int(0, alphabet.length - 1)];
  return out;
}
for (let caseNo = 0; caseNo < 60; caseNo += 1) {
  const left = randomAscii(3200);
  const right = randomAscii(3200);
  const target = `UNIQUE_TARGET_${caseNo}_${randomAscii(80)}`;
  const raw = `${left}{{char}}${right}${target}${randomAscii(120)}`;
  const rendered = `${left}Alice${right}${target}${randomAscii(120)}`;
  const start = rendered.indexOf(target);
  const span = mapRenderedSpanToRaw(rendered, raw, start, start + target.length);
  assert.deepEqual(span, { as: raw.indexOf(target), ae: raw.indexOf(target) + target.length });
  assertions += 1;
}

// Property 2c: a very large selected interior that crosses an expanded macro may
// use independent edge windows, but any accepted composed span must remain balanced.
for (let caseNo = 0; caseNo < 40; caseNo += 1) {
  const left = randomAscii(2800);
  const right = randomAscii(2800);
  const raw = `HEAD_${caseNo}_${left}{{char}}${right}_TAIL_${caseNo}`;
  const rendered = `HEAD_${caseNo}_${left}Alice${right}_TAIL_${caseNo}`;
  const start = 100;
  const end = rendered.length - 100;
  const span = mapRenderedSpanToRaw(rendered, raw, start, end);
  check(span !== null, 'large transformed selection could not map its independently anchored edges');
  check(spanIsBalanced(raw, span.as, span.ae), 'large transformed selection composed an unbalanced raw span');
}

// Property 3: a capture fingerprint accepts its original site and rejects a
// nearby-context mutation even if the target text itself is unchanged.
for (let caseNo = 0; caseNo < 150; caseNo += 1) {
  const needle = `TARGET_${caseNo}`;
  const full = `before-${randomText(40)}-${needle}-${randomText(40)}-after`;
  const fp = ctxFingerprint(full, needle, 0);
  const index = full.indexOf(needle);
  check(fingerprintOk(fp, full, index, needle.length), 'fingerprint rejected original capture site');
  const pivot = Math.max(0, index - 3);
  const changed = `${full.slice(0, pivot)}ZZZ${full.slice(pivot)}`;
  const movedIndex = changed.indexOf(needle);
  check(!fingerprintOk(fp, changed, movedIndex, needle.length), 'fingerprint accepted mutated surrounding context');
}

// Property 4: Ledger splitting/subdivision is lossless across Unicode, CRLF,
// tabs and separator-heavy text for a broad deterministic budget distribution.
for (let caseNo = 0; caseNo < 500; caseNo += 1) {
  const original = randomText(int(1, 6500));
  const budget = int(256, 1800);
  const slices = splitTextToLedgerSlices(original, budget);
  assert.equal(slices.map((slice) => `${slice.prefix}${slice.text}${slice.suffix}`).join(''), original);
  assert.equal(assembleLedgerText(slices), original);
  assertions += 2;
  for (let index = 0; index < slices.length; index += 1) {
    const slice = slices[index];
    assert.equal(slice.index, index);
    assert.equal(`${slice.prefix}${slice.text}${slice.suffix}`, slice.original);
    const fullSlice = `${slice.prefix}${slice.text}${slice.suffix}`;
    check(!/^[\uDC00-\uDFFF]/.test(fullSlice), 'Ledger slice started with a low surrogate');
    check(!/[\uD800-\uDBFF]$/.test(fullSlice), 'Ledger slice ended with a high surrogate');
    assertions += 2;
    if (slice.text.length > 600) {
      const sub = subdivideLedgerSlice(slice, Math.max(256, Math.floor(slice.text.length * 0.55)));
      if (sub) {
        assert.equal(sub.map((part) => `${part.prefix}${part.text}${part.suffix}`).join(''), slice.original);
        assertions += 1;
      }
    }
  }
}

// Property 4b: a boundary that lands in the middle of a surrogate pair must
// move to a valid Unicode scalar boundary before a slice is sent to a provider.
const emojiOnly = '🙂'.repeat(300);
const emojiSlices = splitTextToLedgerSlices(emojiOnly, 257);
assert.equal(emojiSlices.map((slice) => `${slice.prefix}${slice.text}${slice.suffix}`).join(''), emojiOnly);
assertions += 1;
for (const slice of emojiSlices) {
  const fullSlice = `${slice.prefix}${slice.text}${slice.suffix}`;
  check(!/^[\uDC00-\uDFFF]/.test(fullSlice), 'emoji-only Ledger slice started with a low surrogate');
  check(!/[\uD800-\uDBFF]$/.test(fullSlice), 'emoji-only Ledger slice ended with a high surrogate');
}

// Property 4c: when Intl.Segmenter is available, Ledger boundaries also stay
// on grapheme-cluster boundaries (ZWJ emoji, combining marks, family emoji).
if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const sample of ['👩‍💻'.repeat(200), 'e\u0301'.repeat(300), '👨‍👩‍👧‍👦'.repeat(100)]) {
    const boundaries = new Set([...segmenter.segment(sample)].map((entry) => entry.index));
    boundaries.add(sample.length);
    let offset = 0;
    for (const slice of splitTextToLedgerSlices(sample, 257)) {
      offset += `${slice.prefix}${slice.text}${slice.suffix}`.length;
      check(boundaries.has(offset), 'Ledger cut split a grapheme cluster');
    }
    assert.equal(offset, sample.length);
    assertions += 1;
  }
}

// Property 4d: if one grapheme is itself larger than the requested slice
// budget, splitting fails closed rather than slicing through that grapheme.
const pathologicalCluster = `a${'\u0301'.repeat(5000)}b`;
assert.throws(
  () => splitTextToLedgerSlices(pathologicalCluster, 257),
  (error) => error?.code === 'RWA_LEDGER_GRAPHEME_LIMIT' && /nothing was truncated or sent/i.test(error.message),
);
assertions += 1;

// Property 5: Merged marker parsing round-trips valid outputs and rejects an
// in-marker mutation for random 2..8 section batches.
for (let caseNo = 0; caseNo < 250; caseNo += 1) {
  const count = int(2, 8);
  const segments = Array.from({ length: count }, (_, index) => ({
    mid: `m${index}`,
    text: `segment-${caseNo}-${index} ${randomText(int(2, 40)).replace(/[\r\n]/g, ' ')}`,
  }));
  const merged = buildMergedPayload(segments, `capture-${caseNo}`);
  const outputPieces = segments.map((_, index) => `OUT_${caseNo}_${index}`);
  const valid = outputPieces.map((piece, index) => `${merged.markers[index]}\n${piece}`).join('\n');
  const parsed = splitMergedResult(valid, merged.markers);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.pieces, outputPieces);
  assertions += 2;
  const victim = int(0, count - 1);
  const tampered = valid.replace(merged.markers[victim], merged.markers[victim].replace('SECTION_', 'SECTION_X'));
  check(!splitMergedResult(tampered, merged.markers).ok, 'tampered merge marker was accepted');
}

// Property 6: the RAM-only Ledger refuses an over-ceiling source before it can
// be split/sent. This is an explicit failure, never silent truncation.
assert.throws(
  () => createLedger(
    { id: 'p', prompt: 'rewrite' },
    { source: 'message', cid: 'c', mid: 'm', text: 'x'.repeat(MAX_LEDGER_SOURCE_CHARS + 1) },
    { maxPromptChars: 120000 },
  ),
  (error) => error?.code === 'RWA_LEDGER_CAPACITY' && /nothing was truncated or sent/i.test(error.message),
);
assertions += 1;

assert.throws(
  () => sessionLedgerStore.put({ key: 'oversize-bypass', original: 'y'.repeat(MAX_LEDGER_SOURCE_CHARS + 1), slices: [], profile: {} }),
  (error) => error?.code === 'RWA_LEDGER_CAPACITY',
);
assertions += 1;

// Property 7: aggregate source prose held by the session store stays under the
// declared source ceiling by evicting the least-recent ledger first.
sessionLedgerStore.clear();
for (let index = 0; index < 4; index += 1) {
  const ledger = createLedger(
    { id: `p${index}`, prompt: 'rewrite' },
    { source: 'message', cid: 'c', mid: `m${index}`, text: String(index).repeat(700_000) },
    { maxPromptChars: 120000 },
  );
  sessionLedgerStore.put(ledger);
}
const retained = sessionLedgerStore.list();
check(retained.length <= 2, 'session Ledger source budget failed to evict old ledgers');
check(retained.reduce((sum, ledger) => sum + sessionLedgerStore.sourceFootprint(ledger), 0) <= MAX_LEDGER_SOURCE_CHARS,
  'session Ledger retained more source prose than the hard ceiling');
sessionLedgerStore.clear();

console.log(`propertycheck: ${assertions} deterministic assertions passed (seed 0x${INITIAL_SEED.toString(16)})`);
