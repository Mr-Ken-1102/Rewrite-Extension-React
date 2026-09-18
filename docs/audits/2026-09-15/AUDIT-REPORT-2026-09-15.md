# Upgrade Audit Report — 2026-09-15

## Scope

This cumulative checkpoint audits Rewrite Assistant React v3.0.0 against the supplied Marinara Engine v2.4.4 source tree and reconciles selected behavior with Marinara-Rewrite v6.1.0. The current source starts from the verified RC4 Release-Gate Hardened baseline and contains verified Parity Parts 1 and 2 without changing the Engine baseline or weakening the Rewrite Assistant safety model.

## Release-gate results

- Regression self-check: **55/55 pass**.
- Executable failure-mode suite: **27/27 pass**.
- Marinara Engine source compatibility: **18/18 pass**.
- Dependency-free source gate: **PASS** (lockfile consistency, relative imports, runtime JavaScript syntax, and high-risk patterns).
- Dependency-free installable-manifest preflight: **PASS** (flat JSON shape, version/name/description limits, `runtime: client`, only `full_page_access`, inline JS, round-trip integrity).
- Relative import graph: all local imports resolve.
- `git diff --check`: no whitespace errors.
- High-risk static patterns: no `eval`, `new Function`, `dangerouslySetInnerHTML`, `innerHTML =`, `document.write`, wildcard `rwa-*` localStorage deletion, or arbitrary-textarea write fallback.
- Package lock: valid JSON; root dependency/devDependency/engine metadata matches `package.json`.
- Supplemental TypeScript transpile scan: source JS/JSX/MJS parses without diagnostics.

## Engine v2.4.4 contracts rechecked

- `runtime: client` + `full_page_access`.
- `marinara.fetch`, private `marinara.storage`, timers, cleanup callback.
- `x-marinara-csrf: 1` for unsafe same-origin writes.
- Chat messages GET and PATCH; PATCH returns the updated message object.
- Persona path under `/api/characters/personas/:id`.
- Lorebook scan returns an `entries` envelope.
- `/api/generate/raw` request schema.
- `/api/generate/raw` explicit `{ aborted: true }` cancellation response.
- `/api/sidecar/tracker` 16k limits.
- Current message/composer DOM hooks.
- 1,000,000-byte private extension storage quota.
- Message `characterId`, historical `personaSnapshot`, hidden-from-AI metadata, and conversation-start boundaries.
- Flat JSON Personal Extension import path preserves runtime/capabilities/inline JavaScript.
- `full_page_access` selects the full-page runtime endpoint.
- Full-page Engine runtime injects extension JavaScript inside the callback that receives the host API as `marinara`.

## Additional defects fixed in this pass

- Private-storage hydration is awaited before React mounts, removing startup overwrite races.
- Host cleanup is registered before hydration so an unload during async startup cannot mount a late instance.
- Direct API temperature `0` is preserved both in Settings and provider payloads.
- Stale Marinara connection IDs are validated and cleared; Rewrite Assistant never silently switches to another provider.
- Modern Marinara API 4xx/5xx responses now fail explicitly instead of being treated as empty data.
- Reserved prompt block tags are neutralized inside all untrusted context blocks.
- Sidecar's 16k limit is enforced again at the provider boundary.
- Dialog focus traps no longer restart when an `onClose` callback identity changes.
- App subscriptions were narrowed to avoid unrelated store updates rerendering modal/pointer logic.
- Clipboard fallback always removes its temporary textarea.
- Only one App-level settings/editor/architect modal is rendered at a time; nested confirmation dialogs have an explicit nearest-dialog focus-trap guard.
- Undo/redo state remains bounded during state transitions.
- Unused template assets and the unnecessary CSS-injection Vite plugin were removed.
- Persisted JSON is whitelisted during hydration so it cannot replace Zustand action functions.
- AI Refine removes only a matching outer quote pair instead of stripping legitimate quote characters.
- Role radar now follows Marinara v2.4.4 `data-message-role` / `mari-message-user` DOM markers.
- Intentionally aborted Settings connection tests no longer emit false failure toasts.
- Installable-manifest version is sourced from `package.json`, removing a release-version drift point.
- Added `sourcecheck.mjs`, a dependency-free gate that CI runs before package installation.
- History context now honors global/per-character hidden-from-AI metadata and never crosses Marinara conversation-start boundaries.
- Historical user rewrites prefer the message's persisted persona identity instead of silently substituting the chat's current persona.
- Assistant rewrites prefer the selected message's authoritative `characterId` in group chats; the chat roster is only a fallback when no sender ID exists.
- Server message role metadata now outranks DOM role heuristics whenever the API row is available.
- Raw-generation `{ aborted: true }` responses and message-metadata aborts propagate as cancellation rather than empty/error output.
- Expanded rendered-to-raw regression coverage for nested Markdown/HTML, opaque-token boundaries, >4M alignment matrices, and large selections.
- Added behavioral fail-closed checks for composer/arbitrary textarea versus a sent-message edit textarea.
- Enabled Character/Persona/history context now fails closed when authoritative message metadata cannot be read; no-context rewrites skip that unnecessary API dependency.
- Commit failures keep the generated result visible if clipboard recovery also fails, and applying state suppresses duplicate destructive writes.
- Private-storage reads opportunistically remove stale same-origin duplicates left by an interrupted legacy migration.
- Added `failuremodecheck.mjs`, which executes API/storage/editor failure paths against the real project modules with controlled mocks.
- Centralized installable-manifest creation/validation in `extension-manifest.mjs` and added `manifestcheck.mjs` so the Marinara v2.4.4 payload contract is verified without Vite or installed dependencies.
- `build-extension.mjs` now runs source/regression/failure-mode/manifest preflights before dynamically importing Vite; CI runs source + manifest preflight before `npm ci`.
- Engine compatibility checks now cover flat JSON import normalization, full-page endpoint selection, and the actual `marinara` host-API injection wrapper.

## Parity Part 1 reconciliation

- **KEEP:** React component architecture, Preview/Diff, AI Architect, private storage, explicit provider trust, historical Persona/sender targeting, hidden-from-AI semantics, and guarded destructive writes.
- **MERGE/UPGRADE:** explicit reference-aligned context priority; surrounding prose from captured snapshots rather than broad DOM scraping; safe trim restricted to an unambiguous captured subspan; popup pinning using bounded coordinates; Custom Prompt promotion through the existing React profile editor.
- **PORT:** pre-inference dropped-context transparency, session-only per-rewrite source exclusions, explicit Copy, profile search/hide, and concise system prompt.
- **DO NOT PORT:** persisted Direct API credentials or other behavior that weakens provider trust/privacy.
- One-shot context state is keyed to a session-only selection `captureId`; a newly captured selection resets overrides even when Alt+R is reused at the same screen position, while trim preserves the same capture identity.
- Part 1 did **not** claim full parity. Part 2 now covers token-cost UI, auto-profile, Extender integration, character picker/search, selective import/export, and session-only debug tools. Advanced multi-message/Ledger/manual-save workflows remain explicitly deferred to Part 3.

## Parity Part 2 reconciliation

- **KEEP:** React/Zustand architecture, guarded Preview/commit flow, private Marinara storage, explicit provider trust, historical message semantics, and Part 1 one-shot selection controls.
- **MERGE/UPGRADE:** Character selection explicitly overrides authoritative-sender fallback; token preview and rewrite share one context collector; Extender memory prefers its sidecar but falls back to Marinara Extender lorebooks; persistence is constrained by UTF-8 bytes rather than character count.
- **PORT:** Extender inference, Extender memory, speaker-aware notes, Character picker/search, approximate token/context cost, auto-profile, selective export/import, and debug tooling.
- **DO NOT PORT:** persisted Direct API credentials, portable provider-routing configuration, persisted prompt/reply debug bodies, or automatic auto-profile generation as an opt-out default.
- Automatic auto-profile generation is **OFF by default** because enabling it can send Character-card data to the currently selected provider.
- Debug history is session-only and records bounded metadata; it is intentionally excluded from private persisted state.


## Dependency review

The lockfile currently resolves React 19.2.7 / React DOM 19.2.7, Zustand 5.0.14, and Vite 8.0.16. The 2026 Vite `server.fs.deny` advisory affecting Vite 8.0.0–8.0.15 is patched in 8.0.16. React's July 2026 DoS advisory applies to `react-server-dom-*` packages; none are present in this lockfile or extension architecture.

## Residual concurrency limitation

The sent-message write path re-reads the authoritative message immediately before PATCH and refuses the write when the expected content has changed. This is a strong fail-closed guard, but it is not an atomic compare-and-swap: Marinara Engine v2.4.4 accepts only `{ content }` on the message PATCH route and exposes no ETag, `If-Match`, revision, or `expectedContent` precondition. A very small TOCTOU window therefore remains between the final GET and PATCH. The extension cannot eliminate that window client-side without an Engine conditional-update primitive. This residual risk is carried into the live concurrency smoke test rather than being mislabeled as fully atomic.

## Remaining validation limitation

A clean `npm ci` still cannot complete in the current sandbox because npm registry access fails with DNS `EAI_AGAIN` for `registry.npmjs.org`. The partial install was removed; Vite/React/Zustand/ESLint are not available locally. Therefore **ESLint and the final Vite production bundle have not been executed in this sandbox checkpoint**. This is an environment limitation, not a known source failure, but it remains a release gate.

`npm run bundle` was deliberately exercised without dependencies after the Part 3 hardening. It successfully completed sourcecheck, regression tests, failure-mode tests, and manifest preflight, then failed exactly at the deferred `import('vite')` with `ERR_MODULE_NOT_FOUND`. This proves package-dependent build failure can no longer hide preflight failures.

The repository CI now runs dependency-free source + manifest preflights before `npm ci --ignore-scripts`, then `npm run check` and `npm run bundle` on a clean runner. Do not label an installable JSON as fully validated until that clean dependency/build gate passes.

## Current disposition

**Source release candidate: PASS. Installable release artifact: pending clean dependency install + ESLint + Vite bundle.**
