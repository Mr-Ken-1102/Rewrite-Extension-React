# Rewrite Assistant v3.0.0 — Parity Part 1 Audit

## Baselines

- Product baseline: Rewrite Assistant React v3.0.0 RC4 Release-Gate Hardened.
- Feature reference: Marinara-Rewrite v6.1.0.
- Runtime/API authority: Marinara Engine v2.4.4.
- Rule: preserve Rewrite Assistant strengths; merge/port reference behavior only when it does not weaken safety, privacy, provider trust, or destructive-write guards.

## Implemented in Part 1

| Area | Decision | Result |
|---|---|---|
| React/Zustand/Preview architecture | KEEP | Preserved. No reference architecture transplant. |
| Prompt budget priority | MERGE | Explicit drop order: history → lore → character → persona → surrounding. |
| Context-drop transparency | PORT | Hook fires before inference with the exact dropped sources. |
| One-shot context exclusions | PORT | Session-only, never persisted; newly captured selections reset them. |
| Surrounding prose | MERGE | Derived only from captured message/textarea snapshots. |
| Trim before send | UPGRADE | Only one unambiguous captured subspan is accepted; targeting guards are recalculated. |
| Copy result | PORT | Explicit Preview action using existing hardened clipboard fallback. |
| Save as Profile | MERGE | Reuses the existing profile editor and bounded profile sanitizer. |
| Profile search + hide/show | PORT | Hidden profiles remain editable/searchable but disappear from the rewrite popup. |
| Concise system prompt | PORT | Explicit opt-in; retains rewrite scope and prompt-injection boundary language. |
| Popup pinning | MERGE | Persists only bounded viewport coordinates. |
| Direct API credential storage | DO NOT PORT | Credentialed remote providers remain a Marinara Connections responsibility. |

## Cross-check findings fixed during Part 1

1. RC4 context trimming was not aligned with the reference priority. Part 1 now drops previous-message history before higher-priority context.
2. Dropped context was originally reported only after inference. Part 1 now reports it immediately after prompt assembly and before `runInference`.
3. One-shot exclusions could theoretically survive a new Alt+R capture at the same location. Each fresh DOM capture now gets a session-only `captureId`; trim preserves that ID.
4. The reference exposes Character and Persona sources independently. Part 1 likewise exposes both enabled sources for one-shot exclusion rather than relying on popup role heuristics; the Engine-authoritative role still determines which source is actually injected.

## Verification

- `sourcecheck.mjs`: PASS — 43 JS/JSX/MJS files.
- `selfcheck.mjs`: **53/53 PASS**.
- `failuremodecheck.mjs`: **21/21 PASS**. New executable checks cover context priority, source exclusions, captured surrounding prose, safe trim, concise prompt, pre-inference drop notification, and message-trim capture identity.
- `manifestcheck.mjs`: PASS.
- `engine-compatcheck.mjs`: **18/18 PASS** against supplied Marinara Engine v2.4.4 source.
- Supplemental TypeScript transpile parse: **43 files / 0 errors**.
- `node --check` for JS/MJS: PASS.
- Newly added-line trailing-whitespace check versus RC4: PASS.

## Deferred by design

Part 1 is not a full reference port. Token-cost panel, auto-profile, Extender memory/inference, character picker/search, speaker-aware management controls, selective export/import, debug-log export, advanced multi-message rewrite/merge, Ledger Pattern, and manual-save workflows remain for later parity parts after separate design/safety review.

## Build limitation

The sandbox still cannot resolve `registry.npmjs.org`, so a clean dependency install, ESLint, Vite production build, and installable JSON smoke test remain external release gates. This limitation does not alter the Part 1 source/behavior results above.
