# Rewrite Assistant parity design guardrails

Baseline: Rewrite Assistant React v3.0.0 RC4
Reference: Marinara-Rewrite v6.1.0
Engine authority: Marinara Engine v2.4.4

## Decision order

1. Marinara Engine v2.4.4 API/runtime contract is authoritative.
2. Preserve Rewrite Assistant product behavior when it is safer, clearer, or more capable.
3. Merge reference behavior only when it improves the product without weakening privacy, destructive-write safety, or provider trust.
4. Port missing reference features into the existing React/Zustand/service architecture; do not transplant the reference architecture.
5. Do not port behavior that stores credentials insecurely, bypasses attributed host APIs, silently switches providers, broadens data collection by default, or weakens fail-closed writes.

## Part 1 classification

| Feature | Classification | Decision |
|---|---|---|
| React component architecture / Preview / AI Architect | KEEP | Preserve current architecture and workflows. |
| Private storage, explicit provider trust, guarded commits | KEEP | Reference must not weaken these controls. |
| Prompt budget priority | MERGE | Keep current configurable budgets; adopt explicit reference priority instead of insertion-order trimming. |
| Context-drop notification | PORT | Surface automatic context removal to the user. |
| Copy result | PORT | Add explicit safe clipboard action to Preview. |
| Custom Prompt → Save as Profile | MERGE | Reuse the existing React profile editor instead of duplicating reference editor code. |
| Hidden profiles + profile search | PORT | Add bounded persisted hidden flag and local settings search. |
| Concise system prompt | PORT | Add a sanitized boolean toggle and a shorter prompt variant. |
| Surrounding prose | MERGE | Use captured selection snapshots, not a fresh broad DOM scrape. |
| One-shot context exclusions | PORT | Keep exclusions session-only; never persist them. |
| Trim before send | UPGRADE | Allow only an unambiguous subspan of the captured selection and recompute commit guards. |
| Popup pinning | MERGE | Persist only viewport coordinates; preserve current drag UX. |
| Token-cost panel | DEFER | Part 2/management UX; not required for Part 1 foundation. |
| Direct API key storage | DO NOT PORT | Continue requiring Marinara connections for credentialed remote providers. |

## Part 1 completion state

Implemented and regression-locked: prompt priority, pre-inference drop transparency, Copy, Save as Profile, profile hide/search, concise prompt, captured-snapshot surrounding context, one-shot exclusions, safe trim, and popup pinning.

Part 2 remains responsible for management/context features such as token-cost UX, character picker/search, speaker-aware controls, selective export/import/debug tooling, auto-profile, and any Extender integration that can be added without weakening the current trust model. Advanced multi-message/Ledger/manual-save workflows remain Part 3.
## Part 2 classifications

- **PORT — Extender inference:** local OpenAI-compatible Extender path, but no credential or model persistence is introduced.
- **MERGE — Extender memory:** use live Extender memory when enabled, with bounded Marinara lorebook fallback and prompt-data fencing.
- **MERGE — Character picker/search:** explicit user selection overrides sender fallback; otherwise Engine-authoritative sender metadata remains preferred.
- **PORT — Speaker-aware note:** role comes from Engine message metadata when available and is reference data, never an instruction authority.
- **PORT — Token/context cost:** approximate only; the preview and actual rewrite share the same context collector to avoid semantic drift.
- **PORT with safer default — Auto-profile:** feature exists, but automatic generation is OFF by default and bounded before persistence.
- **PORT with routing isolation — Export/import:** provider routing/endpoints/connection IDs are never portable.
- **PORT with reduced retention — Debug log:** session-only, bounded, credential-key redacted, and no prompt/reply bodies.
## Advanced editing classification (Merge Part 2/3)

| Feature | Classification | Decision |
|---|---|---|
| Cross-message selection | UPGRADE | Preserve ordered per-message targeting/fingerprints rather than flattening selection identity. |
| Sequential multi-message rewrite | MERGE | Safe default; each commit is independently guarded and partial success is explicit. |
| Merged multi-message pass | UPGRADE | Keep reference convenience but replace generic section markers with capture-bound nonce markers and exact validation. |
| Large-selection Ledger | UPGRADE | Adopt split/retry/skip/resume idea, keep selected prose/results in session RAM only, hard-bound retained source prose, fail closed above the ceiling, and make splitting lossless at Unicode scalar/grapheme boundaries. |
| Provider overflow handling | UPGRADE | Never silently truncate target text; automatically enter Ledger and adaptively subdivide slices if necessary. |
| Manual/native editor | MERGE | Prepare the exact native editor after verification, but never auto-save from manual mode. |
| Clipboard-only recovery | DO NOT PORT | Clipboard is only one recovery path; keep full selectable output and `.txt` export as independent fallbacks. |
| Fake multi-message atomicity | DO NOT PORT | Never claim rollback/atomicity the Engine cannot provide. |

The reference's practical long-text limitations are not product limits for Rewrite Assistant. Final automatic writes remain governed by Rewrite Assistant's stronger stale-content, span-mapping, provider-trust, and privacy contracts.


## Optimization verification guardrail

Deterministic property/fuzz tests are a first-class dependency-free gate. They stress rendered-to-stored span mapping, context fingerprints, Unicode/grapheme-safe Ledger split/assemble/subdivide invariants, session source-cap enforcement, and merged-marker integrity. A green example-based regression suite does not replace these invariant checks.
