// Selection mapping logic adapted from Marinara-Rewrite v6.1.
// It maps rendered text back to raw stored message content without bisecting markdown, macros, links, or tags.
var OPAQUE_RE = /\{\{[\s\S]*?\}\}|```[\s\S]*?```|`[^`\n]*`|!\[[^\]\n]*\]\([^)\s]*\)|\\[\s\S]|<[A-Za-z][^<>]*\/>/g;
var EMPH_RE   = /(\*\*\*|\*\*|~~|==|__|\*|_)(?!\1)([\s\S]*?)\1/g;
var LINK_RE   = /\[([^\]\n]*)\]\(([^)\s]*)\)/g;
// Tags and block macros pair by NAME with proper LIFO nesting. A lazy
// open-to-close regex pairs an outer opener with an inner closer on
// same-named nesting, leaving the TRUE outer closer in no pair at all —
// a span could then take it, or everything before it, and orphan it.
// One linear scan, no backtracking ambiguity (boundary lookaheads: without
// them the name atom and the attribute atom match the same run, so an
// unclosed "<" or "{{#" plus a long word run re-partitions quadratically).
var PAIR_TOK_RE = /<(\/?)([A-Za-z][A-Za-z0-9]*)(?![A-Za-z0-9])[^<>]*>|\{\{(#|\/)([A-Za-z_][\w-]*)(?![\w-])[^{}]*\}\}/g;
function spanIsBalanced(A, as, ae) {
  var t, m, i, pairs = [], ov = function (s, e) { return as < e && ae > s; };
  OPAQUE_RE.lastIndex = 0;
  while ((t = OPAQUE_RE.exec(A))) {
    var os = t.index, oe = os + t[0].length;
    if (ov(os, oe) && !(as <= os && ae >= oe)) return false;
  }
  EMPH_RE.lastIndex = 0;
  while ((m = EMPH_RE.exec(A))) {
    var d = m[1].length, s0 = m.index, e0 = s0 + m[0].length;
    pairs.push([s0, s0 + d, e0 - d, e0]);
    // Rescan from just past the OPENING delimiter, not past the whole match: a
    // /g/ scan leaves lastIndex after the close, so a pair nested in the content
    // never registers, and a pair that never registers can never be checked.
    // The engine recurses emphasis six deep, so **bold with *inner* italic** is a
    // live construct — cutting through it used to orphan the inner delimiter.
    // s0 + d strictly advances, so this cannot loop.
    EMPH_RE.lastIndex = s0 + d;
  }
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(A))) {
    var ls = m.index;
    pairs.push([ls, ls + 1, ls + 1 + m[1].length, ls + m[0].length]);
  }
  // Nesting is the whole point here: the engine renders <speaker="…">…</speaker>
  // as a wrapper, so in any multi-character chat every inner <b>/<i> is a nested
  // pair, and blocks nest by name too. A stack per name closes each opener with
  // its OWN closer, so all of them register — including the outermost.
  var stacks = {};
  PAIR_TOK_RE.lastIndex = 0;
  while ((m = PAIR_TOK_RE.exec(A))) {
    // A self-closing tag (<x/>) is atomic — OPAQUE_RE already protects it
    // whole. It must NOT enter the stack: pushed as a phantom opener it
    // hijacks the real pair's LIFO slot, and the real opener never pairs.
    if (m[2] !== undefined && /\/\s*>$/.test(m[0])) continue;
    // Key by kind + name so a <if> tag can never pair a {{/if}} macro.
    var isClose = m[1] === "/" || m[3] === "/";
    var key = (m[2] !== undefined ? "t:" + m[2] : "m:" + m[4]);
    if (!isClose) {
      (stacks[key] || (stacks[key] = [])).push([m.index, m.index + m[0].length]);
    } else {
      var open = stacks[key] && stacks[key].pop();
      // An unmatched closer (empty stack) or an unmatched opener (left on the
      // stack at the end) forms no pair — nothing to orphan, so nothing to refuse.
      if (open) pairs.push([open[0], open[1], m.index, m.index + m[0].length]);
    }
  }
  // Exactly one delimiter of a pair inside the cut orphans the other.
  for (i = 0; i < pairs.length; i++) {
    if (ov(pairs[i][0], pairs[i][1]) !== ov(pairs[i][2], pairs[i][3])) return false;
  }
  return true;
}
// Index of the n-th (0-based) non-overlapping occurrence of needle in haystack, or -1.
function nthIndexOf(hay, needle, n) {
  var idx = hay.indexOf(needle);
  for (var k = 0; k < n && idx !== -1; k++) idx = hay.indexOf(needle, idx + needle.length);
  return idx;
}

// ── B3: surrounding-context fingerprint ──────────────────────────────────
// nthIndexOf is a bare walk-forward with nothing to validate against. The
// occurrence index `occ` is captured at SELECTION time; if the phrase's
// occurrence count shifted since (an earlier instance added or removed by a
// swipe, a regenerate, or background autonomous messaging), the same index
// resolves to a DIFFERENT occurrence. The text still matches, so no error
// fires and the toast still reads "Applied" — the splice just lands in the
// wrong place. Long-running rewrites make this especially important: a
// session-only Ledger can outlive the original DOM selection while the window
// remains open, so a resumed apply must still prove it is the same location.
//
// So record what surrounds the selection at capture time and re-verify it at
// the resolved index before splicing. Whitespace-normalized (render
// whitespace is not stable), bounded to FP_LEN chars, and empty on whichever
// side the selection touches the edge of the message.
//
// This answers "is this the same PLACE in the rendered text?". The separate
// question "is the STORED content still the pre-image we assumed?" is
// answered in exactly one other place — guardedPatch. Neither substitutes
// for the other: the DOM can lag the store, and the store carries no
// position.
var FP_LEN = 24;
function fpNorm(s) { return s.replace(/\s+/g, " ").trim(); }
// Fingerprint the text either side of [idx, idx+len). Reads a wider raw window
// than FP_LEN so that collapsing whitespace cannot shorten the kept slice, then
// keeps the FP_LEN chars nearest the selection — the far edge of the window is
// what a mid-word cut would corrupt, and it is exactly what gets dropped.
function ctxFingerprintAt(fullText, idx, len) {
  if (idx == null || idx < 0) return null;
  var end = idx + len;
  return {
    b: fpNorm(fullText.slice(Math.max(0, idx - FP_LEN * 4), idx)).slice(-FP_LEN),
    a: fpNorm(fullText.slice(end, end + FP_LEN * 4)).slice(0, FP_LEN),
  };
}
// Capture-time: locate the occurrence the user picked, then fingerprint it.
// Normalizes the needle exactly as doCommit does, so both sides agree.
function ctxFingerprint(fullText, needle, occ) {
  var n = String(needle == null ? "" : needle).trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!n) return null;
  return ctxFingerprintAt(fullText, nthIndexOf(fullText, n, occ || 0), n.length);
}
// Commit-time: does the resolved splice site still look the way it did?
// No fingerprint recorded (a ledger written by an older build) means there is
// nothing to compare against — allow, rather than break every stored ledger.
function fingerprintOk(fp, fullText, idx, len) {
  if (!fp) return true;
  var now = ctxFingerprintAt(fullText, idx, len);
  return !!now && now.b === fp.b && now.a === fp.a;
}
// Map a [rs,re) span in the rendered text to a [as,ae) span in raw msg.content.
// The engine renders raw content through macro/quote/markdown transforms; this
// LCS-aligns the two strings so a selection captured from the DOM can be spliced
// back into raw content. Returns null over the size cap (caller copies instead).
//
// CORRECTNESS / NON-CORRUPTION: a naive LCS map orphans transform tokens when a
// selection boundary lands inside a transform-only region (e.g. selecting part of
// an expanded {{char}}). Incidental single-char matches inside such tokens (the
// 'c' shared by "Alice" and "{{char}}") defeat boundary detection, so they are
// demoted to non-anchors. Boundaries that touch a transform are snapped OUTWARD to
// cover whole token(s); if a clean span cannot be produced, null is returned and
// the caller shows the Copy fallback. Clean boundaries always splice exactly.
function alignExact(R, A, rs, re) {
  var n = R.length, m = A.length;
  if (!n || !m || n * m > 4000000) return null; // ponytail: ~2k×2k char cap; null -> caller windows or copy-falls-back
  if (rs < 0 || re > n || re < rs) return null;
  var i, j, k, c;
  var dp = [];
  for (i = 0; i <= n; i++) dp.push(new Int32Array(m + 1));
  for (i = n - 1; i >= 0; i--)
    for (j = m - 1; j >= 0; j--)
      dp[i][j] = (R.charCodeAt(i) === A.charCodeAt(j))
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
  // Backtrace the alignment. mr[i] = matched raw index for rendered char i, or -1
  // (rendered-only). matchedRaw[j] = 1 if raw char j is an LCS match (else it is a
  // raw-only / transform char).
  var mr = new Int32Array(n);
  for (k = 0; k < n; k++) mr[k] = -1;
  var matchedRaw = new Uint8Array(m);
  var i2 = 0, j2 = 0;
  while (i2 < n || j2 < m) {
    if (i2 < n && j2 < m && R.charCodeAt(i2) === A.charCodeAt(j2)) {
      mr[i2] = j2; matchedRaw[j2] = 1; i2++; j2++;
    } else if (j2 >= m || (i2 < n && dp[i2 + 1][j2] >= dp[i2][j2 + 1])) {
      i2++; // rendered-only char
    } else {
      j2++; // raw-only char
    }
  }
  // Demote ISLAND matches: a matched raw char flanked by raw-only chars on BOTH
  // sides is an incidental match inside a transform token, not a real anchor.
  // Iterate to a fixpoint (demoting one island can expose another).
  var changed = true;
  while (changed) {
    changed = false;
    for (k = 0; k < n; k++) {
      var rj = mr[k];
      if (rj < 0) continue;
      var leftRO = (rj > 0) && !matchedRaw[rj - 1];
      var rightRO = (rj < m - 1) && !matchedRaw[rj + 1];
      if (leftRO && rightRO) { mr[k] = -1; matchedRaw[rj] = 0; changed = true; }
    }
  }
  // Compute raw cut points from the nearest real anchors.
  var as, ae, x, pm, nm;
  // START cut (before rendered char rs).
  if (rs >= n) { as = m; }
  else if (mr[rs] >= 0) { as = mr[rs]; }
  else { // rendered-only: just after the previous anchor's raw char
    pm = -1;
    for (x = rs - 1; x >= 0; x--) { if (mr[x] >= 0) { pm = x; break; } }
    as = (pm >= 0) ? mr[pm] + 1 : 0;
  }
  // END cut (after rendered char re-1).
  if (re <= 0) { ae = 0; }
  else if (mr[re - 1] >= 0) { ae = mr[re - 1] + 1; }
  else { // last selected char is rendered-only: extend to the next anchor's raw start
    nm = -1;
    for (x = re; x < n; x++) { if (mr[x] >= 0) { nm = x; break; } }
    ae = (nm >= 0) ? mr[nm] : m;
  }
  if (ae < as) return null;
  // If the selection touches a transform (it contains rendered-only chars, or the
  // raw span interior contains raw-only chars), snap each edge OUTWARD so no
  // raw-only token is bisected.
  var touchesTransform = false;
  for (k = rs; k < re; k++) { if (mr[k] < 0) { touchesTransform = true; break; } }
  if (!touchesTransform) {
    for (c = as; c < ae; c++) { if (!matchedRaw[c]) { touchesTransform = true; break; } }
  }
  if (touchesTransform) {
    // Start partway into a raw-only token -> pull cut to that token's start.
    while (as > 0 && !matchedRaw[as - 1] && !matchedRaw[as]) as--;
    // End partway through a raw-only token -> push cut to that token's end.
    while (ae < m && !matchedRaw[ae] && ae > 0 && !matchedRaw[ae - 1]) ae++;
    // Selection clearly covers a transform but mapped to an empty raw span:
    // expand to enclose the adjacent raw-only run.
    if (as === ae) {
      for (k = rs; k < re; k++) {
        if (mr[k] < 0) {
          while (ae < m && !matchedRaw[ae]) ae++;
          while (as > 0 && !matchedRaw[as - 1]) as--;
          break;
        }
      }
    }
  }
  if (ae < as) return null;
  // Final clean-edge check: neither cut may sit strictly inside a raw-only run.
  var dirtyStart = as > 0 && as < m && !matchedRaw[as - 1] && !matchedRaw[as];
  var dirtyEnd = ae > 0 && ae < m && !matchedRaw[ae - 1] && !matchedRaw[ae];
  if (dirtyStart || dirtyEnd) return null;
  if (!spanIsBalanced(A, as, ae)) return null;
  return { as: as, ae: ae };
}
// Find a "clean anchor": a verbatim run of rendered text near `pos` that occurs
// exactly once in raw A, giving an unambiguous coordinate peg. side<0 searches runs
// ending at/before pos (leftward); side>0 searches runs starting at/after pos
// (rightward). Steps past transforms (which break the verbatim match) and repetition
// (which breaks uniqueness). Returns {rPos, aPos} (R[rPos..rPos+LEN] === A[aPos..]) or null.
function findCleanAnchor(R, A, pos, side, LEN, MAXSPAN) {
  var step = 8, t, p, cand, idx;
  for (t = 0; t * step <= MAXSPAN; t++) {
    p = side < 0 ? (pos - t * step - LEN) : (pos + t * step);
    if (p < 0 || p + LEN > R.length) continue;
    cand = R.substring(p, p + LEN);
    idx = A.indexOf(cand);
    if (idx < 0) continue;                       // transform inside cand: not verbatim in raw
    if (A.indexOf(cand, idx + 1) >= 0) continue; // not unique: ambiguous peg
    return { rPos: p, aPos: idx };
  }
  return null;
}
// Curly quotes/apostrophes are the engine's most common length-PRESERVING transform
// (straight " -> “ ”, ' -> ’). They break verbatim anchor matching but not positions,
// so we normalize them straight for the anchor SEARCH only — pegs stay valid in the
// original coords, and the splice still aligns the original (un-normalized) window.
function normForAnchor(s) {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}
// Window the alignment of [rs,re): peg clean anchors just outside the selection on
// both sides and run alignExact on only that bounded slice, then translate the cut
// back to global raw coords. The window must CONTAIN the whole selection, so this
// returns null when the selection itself is too big (its own size blows the cap) —
// mapRenderedSpanToRaw handles that case by mapping the two edges separately.
function windowMap(R, A, rs, re) {
  var n = R.length, m = A.length;
  var LEN = 40, MAXSPAN = 800;
  var Rn = normForAnchor(R), An = normForAnchor(A);
  var left = findCleanAnchor(Rn, An, rs, -1, LEN, MAXSPAN);
  var right = findCleanAnchor(Rn, An, re, 1, LEN, MAXSPAN);
  var wlo = left ? left.rPos : 0;
  var lo = left ? left.aPos : 0;
  var whi = right ? right.rPos + LEN : n;
  var hi = right ? right.aPos + LEN : m;
  if (wlo > rs || whi < re || lo >= hi || wlo >= whi) return null; // anchors must bracket & stay ordered
  if ((whi - wlo) * (hi - lo) > 4000000) return null;             // window (incl. whole selection) too big
  var loc = alignExact(R.slice(wlo, whi), A.slice(lo, hi), rs - wlo, re - wlo);
  if (!loc) return null;
  // alignExact validated the WINDOW SLICE. Window edges are 40-char verbatim
  // anchors, and inside a long emphasised run the content is verbatim in raw — so
  // an anchor can legally land BETWEEN a pair's opening and closing delimiter. The
  // slice then holds one lone delimiter, which yields no pair, and the check waves
  // through exactly the orphaning it exists to stop. Re-check against the whole
  // document, the way the per-edge path below already does.
  if (!spanIsBalanced(A, lo + loc.as, lo + loc.ae)) return null;
  return { as: lo + loc.as, ae: lo + loc.ae };
}
// Map a rendered span [rs,re) into raw msg.content coords. Small message: exact
// full-message LCS. Large message: the O(n*m) matrix would blow the ~4M-cell cap
// (the v5.1 bug), so window it. A SMALL selection windows whole in one slice. A LARGE
// selection (>~1.9k chars) can't — its own size exceeds the cap — but its interior is
// replaced wholesale, so only the two cut points matter: map each edge with its own
// tiny window. Falls back to null (copy) only when the message can't be anchored.
function mapRenderedSpanToRaw(R, A, rs, re) {
  var n = R.length, m = A.length;
  if (!n || !m) return null;
  if (rs < 0 || re > n || re < rs) return null;
  // Rendered text identical to stored text means the engine transformed
  // NOTHING in this message: no macro expanded, no marker stripped, no quote
  // curled. Every "*" or "_" the user sees is a literal character, not
  // formatting — orphaning is impossible, and the splice replaces exactly
  // what was on screen. The balance heuristic exists to protect transforms;
  // with none present it can only false-refuse. Identity-map and skip it.
  // NOTE: sound only as a WHOLE-MESSAGE check. A per-window version in
  // windowMap below cannot skip spanIsBalanced — its re-check runs against
  // the FULL document precisely to catch pairs straddling the window edge.
  if (R === A) return { as: rs, ae: re };
  if (n * m <= 4000000) return alignExact(R, A, rs, re);
  var whole = windowMap(R, A, rs, re);
  if (whole) return whole;
  // Selection too large to align as one window — map the START and END edges
  // independently (1-char windows), then splice everything between them.
  if (re - rs < 1) return null;
  var startSpan = windowMap(R, A, rs, rs + 1);
  var endSpan = windowMap(R, A, re - 1, re);
  if (!startSpan || !endSpan || endSpan.ae < startSpan.as) return null;
  // Each edge was validated against its own window; the span BETWEEN them never
  // was, and that interior is what gets replaced. Re-check the composed span.
  if (!spanIsBalanced(A, startSpan.as, endSpan.ae)) return null;
  return { as: startSpan.as, ae: endSpan.ae };
}

function normalizeLineEndings(value) {
  return String(value == null ? '' : value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export {
  normalizeLineEndings,
  nthIndexOf,
  ctxFingerprint,
  fingerprintOk,
  mapRenderedSpanToRaw,
  spanIsBalanced,
};
