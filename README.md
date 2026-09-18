# Rewrite Assistant React for Marinara Engine

Rewrite Assistant is a client-side Personal Extension cross-checked against **Marinara Engine v2.4.4 and v2.4.6**. It rewrites a selected passage with a configured Marinara connection, Sidecar, or a direct OpenAI-compatible/Ollama endpoint, then applies the result back to the exact message/editor only after safety checks.

## Compatibility baseline

- Marinara Engine: **v2.4.4 and v2.4.6 certified source contracts**
- Personal Extension runtime: `client`
- Required capability: `full_page_access`
- Node for development/build: `^20.19.0 || >=22.12.0`
- Package version: `3.0.2`

`full_page_access` is intentionally required because the extension maps rendered selections back to stored message content and integrates with Marinara's page APIs. Only install code you trust and review the permission warning shown by Marinara.

## Safety model

The v3 rewrite path is fail-closed. Before a sent message is modified, the extension re-reads the message, maps the rendered selection to raw stored content, validates surrounding text, and checks that the message has not changed. If any guard fails, no destructive write occurs. Clipboard recovery is attempted; if that also fails, the preview remains open so the generated result can be recovered manually.

Textarea edits are allowed only for an editor inside a real `[data-message-id]` container. The normal Marinara composer (`data-chat-composer="true"`) and arbitrary page textareas are excluded.

Undo/redo message bodies are kept in memory only. Persisted settings use Marinara private extension storage when available; legacy origin `localStorage` is used only for one-time migration or older hosts.

## Privacy defaults

New installs start with Character, Persona, Lorebook, and previous-message context disabled (`contextDepth: 0`). Users opt in to context explicitly. Direct API mode sends selected text and enabled context to the configured endpoint; the UI warns when a remote endpoint is used.

No telemetry, remote scripts, cookies, `eval`, or `new Function` are used by this project.

## Reference parity status

The React product remains the authority for its UX and safety model; `Marinara-Rewrite` is a behavior reference, not a codebase transplanted wholesale. v3.0.2 contains the verified Part 1 foundation, Part 2 context/management parity, and the identity/Draft Reply hardening certified against Marinara Engine v2.4.4 and v2.4.6.

Part 1 adds explicit context priority and pre-inference drop notices, one-shot source exclusions, captured-snapshot surrounding prose, safe trim-before-send, Preview Copy, Custom Prompt → Profile, profile search/hide, concise instructions, and popup pinning.

Part 2 adds:

- Marinara Extender inference mode without stored Extender credentials or a forced model field;
- opt-in Extender memory with sidecar-first retrieval and Marinara Extender lorebook fallback;
- speaker-aware reference notes;
- current-chat Character picker/search, where an explicit selection overrides sender fallback;
- approximate token/context cost inspection using the same context collector as the rewrite path;
- chat-specific auto-profiles, **OFF by default**, with explicit/manual generation;
- selective portable export/import that deliberately excludes provider-routing fields; and
- bounded session-only debug logs that store metadata rather than prompt/reply bodies.

v3.0.2 identity and Draft Reply hardening adds:

- exact selected-message Character identity targeting in group chats, with identity-scoped Character/Persona Voice Profiles and source-fingerprint revalidation;
- active-Persona Draft Reply with Idea → Reply, Continue Draft, alternatives, shorter/longer, streaming, real cancellation, preview, copy, and explicit composer insertion;
- Persona identity + source-fingerprint session locking before generation, after generation, and again before insertion, so chat/Persona/card changes fail closed;
- conservative hidden-from-AI and conversation-boundary handling for Draft Reply history, plus post-generation rejection of obvious extra Character/Narrator/speaker turns; and
- release security gates that reject moderate-or-higher advisories across the full locked dependency tree.

Persisted profiles/custom prompts/auto-profiles are now bounded by UTF-8 byte budgets so Unicode-heavy data stays below Marinara's 1,000,000-byte private-storage quota. Direct API credentials are intentionally **not** persisted; credentialed remote providers should use Marinara Connections.

Advanced editing is now implemented behind the same fail-closed safety model:

- cross-message selections preserve ordered per-message targeting metadata;
- sequential multi-message rewrite is the default and reports partial commits honestly;
- optional merged multi-message rewrite uses capture-bound nonce markers and refuses to split/apply malformed output;
- oversized selections enter a session-only Ledger pipeline with lossless Unicode/CRLF/whitespace splitting, retry/skip/resume, continuity hints, adaptive re-splitting when the real provider budget is tighter than estimated, and guarded final assembly; Ledger source prose has an explicit 2,000,000-character session safety ceiling that fails closed before context collection/inference instead of truncating text;
- manual-save mode prepares Marinara's native message editor but never presses Save or PATCHes on the user's behalf; and
- every completed result remains recoverable through a selectable raw-result field, robust clipboard fallback, or `.txt` download even when Apply is blocked.

Merge Part 3 hardens these paths further: automatic message writes now stop if the active chat changes during generation; Ledger resume identity includes the source fingerprint plus inference-affecting profile/provider/context settings and freezes one prompt-context snapshot for a consistent run; merged partial applies resume only the uncommitted messages; message-edge whitespace is normalized at the Ledger/guarded-commit boundary; and manual-save prefers Marinara's `marinara:start-edit-message` event with a localized Pencil-icon fallback. Optimization hardening additionally makes Ledger cuts Unicode-scalar safe and, when `Intl.Segmenter` is available, grapheme-boundary aware; bounds hung Diff Worker requests with synchronous fallback; scans every duplicate message wrapper for the exact native editor; and adds deterministic property/fuzz coverage for span mapping, fingerprints, Ledger split/assemble/subdivide, and merged markers.

## Development

```bash
npm run verify:source
npm run test:properties
npm ci --ignore-scripts
npm run check
npm run compat:engine -- /path/to/Marinara-Engine-main
npm run bundle
```

`npm run verify:source` is a dependency-free source gate for lockfile consistency, relative imports, runtime JavaScript syntax, import-cycle detection, raw-network/page-storage escapes, and high-risk patterns. `npm run test:properties` runs deterministic property/fuzz checks without third-party test dependencies. `npm run verify:manifest` independently validates the flat Marinara v2.4.4–v2.4.6 installable payload contract before any build dependency is required. `npm run check` repeats both gates, then runs the regression and behavioral failure-mode suites, ESLint, and the Vite production build. `npm run bundle` runs source, regression, failure-mode, and manifest preflights before dynamically loading Vite and emits `rewrite-assistant-react.json`, the installable Marinara Personal Extension manifest.

## Verification included in the repository

Quality and compatibility tooling is grouped under `tools/quality/`; build orchestration lives under `tools/build/`. Historical audits are archived by date under `docs/audits/` so the repository root stays focused on product source, configuration, and current release documentation.

- `tools/quality/sourcecheck.mjs` — dependency-free lockfile/import/runtime-syntax/high-risk-pattern gate.
- `tools/quality/manifestcheck.mjs` / `extension-manifest.mjs` — dependency-free Marinara v2.4.4–v2.4.6 installable-manifest factory and preflight validator.
- `tools/quality/selfcheck.mjs` — regression invariants for selection mapping, privacy defaults, persistence, provider limits, modal/storage lifecycle, and destructive-write guards.
- `tools/quality/failuremodecheck.mjs` — executable mocks for provider trust, abort/timeout behavior, HTTP/CSRF handling, storage migration, and destructive-write races.
- `tools/quality/propertycheck.mjs` — deterministic property/fuzz coverage for span mapping, context fingerprints, Unicode/grapheme-safe Ledger splitting/assembly/subdivision, capacity bounds, and merged-marker integrity.
- `tools/quality/engine-compatcheck.mjs` — checks the extension's assumptions directly against a Marinara Engine source tree, including 2.4.6 character-backed user identity.
- `tools/build/build-extension.mjs` — verified installable JSON build orchestration.
- `.github/workflows/ci.yml` — clean-install CI gate.

See `COMPATIBILITY.md`, `SECURITY-PRIVACY.md`, and `CHANGELOG.md` for release details. Repository organization is documented in `docs/REPOSITORY-STRUCTURE.md`; historical audit reports are indexed in `docs/audits/README.md`.
