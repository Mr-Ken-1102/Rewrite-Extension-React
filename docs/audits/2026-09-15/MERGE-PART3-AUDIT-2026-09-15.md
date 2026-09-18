# Rewrite Assistant v3.0.0 — Merge Part 3/3 Audit

Date: 2026-09-15

## Scope

This checkpoint is the final hardening/reconciliation pass after the recovered RC6-equivalent merge and Advanced Editing Part 2. It preserves the React/Zustand/Preview architecture and the fail-closed Marinara v2.4.4 write model. Marinara-Rewrite v6.1.0 remains a behavior reference only; its limitations are not product limits for Rewrite Assistant.

## Part 3 hardening

- **Chat-switch concurrency guard:** sent-message PATCH, native-editor preparation, and message undo/redo refuse to act when the active chat differs from the chat captured at selection time.
- **Merged partial resume:** partial multi-message apply state is retained; subsequent Accept attempts only uncommitted messages. Regeneration is blocked after a partial commit to prevent mixing two generated batches.
- **Ledger execution identity:** resume keys include source guard state, profile prompt, provider route, connection/model/endpoints, temperature, prompt budget, length controls, and enabled context controls. Unrelated UI layout changes do not invalidate a run.
- **Frozen Ledger prompt context:** context is captured once per session-only Ledger and reused for retries/resume. Full `messageInfo`/message arrays are not retained in the Ledger snapshot.
- **Ledger footprint accounting:** pruning counts generated result/context text, not only original text.
- **Boundary whitespace fix:** Ledger output for rendered-message selections removes only the mirrored source edge whitespace before guarded commit, preventing duplicate spaces/newlines while textarea selections keep exact edges.
- **Native-editor integration:** prefers Marinara v2.4.4 `marinara:start-edit-message`; falls back to a scoped localized/Pencil-icon action. It still performs zero automatic PATCHes.
- **Recovery remains independent of Apply:** raw result remains selectable; robust Copy fallback and `.txt` save remain available.

## Verification status before GitHub backup

Fresh local dependency-free verification after Part 3 changes:

- sourcecheck: PASS
- regression selfcheck: 79/79 PASS
- failure-mode: 42/42 PASS
- manifest contract: PASS
- Marinara Engine v2.4.4 compatibility: 18/18 PASS
- Marinara-Rewrite v6.1.0 reference selfcheck: PASS
- TypeScript transpile parser: 50/50 source files, 0 syntax diagnostics
- `git diff --check`: PASS

Local npm registry access remains unavailable in the sandbox (`EAI_AGAIN registry.npmjs.org`), so local `npm ci` / ESLint / Vite build cannot be certified here. The backup branch CI is configured to run a real `npm ci`, runtime/full advisory gates, ESLint, Vite production build, installable JSON creation/validation, pinned Engine cross-check, artifact SHA-256 creation, and artifact upload.

## Release-label rule

This source must **not** be called Production Final solely from dependency-free checks. A Production Final label still requires the package-dependent CI gate and the live Marinara Engine v2.4.4 smoke/concurrency matrix. The GitHub backup branch is a source-of-truth recovery checkpoint even if a later live UI gate remains outstanding.

## Known Engine limitation

Marinara Engine v2.4.4 message PATCH does not expose an ETag/revision/`If-Match` compare-and-swap token. Rewrite Assistant therefore performs GET/current-content/fingerprint verification immediately before PATCH and fails closed on detected changes, but a very small TOCTOU window between the final read and PATCH is an Engine-level residual risk. Multi-message operations also cannot be truly atomic; partial progress is reported explicitly.
