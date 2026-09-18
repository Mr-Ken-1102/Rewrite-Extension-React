# Changelog

## 3.0.3 — Persona Reply UX and three-mode anchoring

### Marinara layout integration
- Persona Reply quick-launch anchoring is now mode-aware across Roleplay, Conversation, and Game.
- Roleplay/Conversation continue to use Marinara's explicit `data-chat-composer` hook.
- Game uses a strictly scoped fallback inside the visible `data-chat-mode="game"` resource-exclusion input region because Marinara Engine v2.4.6 GameInput does not expose `data-chat-composer`.
- Engine compatibility checks now pin all three mode contracts so future DOM drift fails CI.

### Draft Reply popup
- Replaced the blocking overlay modal with a modeless draggable floating popup so users can keep reading and scrolling previous chat turns.
- Moved the active Persona chip into the right side of the header.
- Header and footer now share the same compact 36px height and reuse the main Rewrite popup's visual tokens.
- Primary actions remain in the stable footer; alternative/shorter/longer/copy actions stay in the body.
- Floating-panel geometry uses the visual viewport, re-clamps on resize/content changes, and never requires page-wide focus trapping.

### Quick launcher positioning
- Added simple settings for Auto, Remember dragged position, and Reset.
- Remember mode stores separate positions for Roleplay, Conversation, and Game and re-clamps them to the current viewport.
- Dragging the launcher uses a movement threshold and post-drag click suppression so repositioning cannot accidentally open Draft Reply.
- Persisted launcher data is sanitized to supported modes and finite bounded coordinates only.

## 3.0.2 — Identity-safe Draft Reply and release certification

### Exact Character / Voice Profile identity
- Selected assistant messages now use authoritative Marinara DOM/message identity instead of stale manual Character fallbacks in group chats.
- Character and Persona Voice Profiles remain identity-scoped and are reused only when their source fingerprints still match current card data.
- Voice Profile generation rechecks abort state and re-fetches source evidence before persistence; stale or cancelled model results are discarded instead of saved.

### Persona Draft Reply
- Added active-Persona Draft Reply with Idea → Reply, Continue Draft, context-based suggestions, streaming, real cancellation, preview, alternatives, shorter/longer, copy, and explicit composer insertion.
- Draft Reply resolves and locks the active Persona before generation using both identity key and source fingerprint, then revalidates after generation and again before insertion.
- Character-backed Personas use a distinct `persona:character:<id>` identity namespace.
- Recent history excludes hidden/system/unsupported context conservatively, respects conversation-start boundaries, and preserves historical Persona names only when Marinara supplied a snapshot.
- Obvious extra Character/Narrator/speaker turns, malformed protocol output, and unusually large provider output are rejected before insertion.
- Draft Reply never auto-sends and refuses insertion after chat, Persona, or Persona-card changes.

### Release hardening
- Refreshed vulnerable dev/build transitive dependencies without changing runtime dependencies.
- Tightened CI so moderate-or-higher advisories anywhere in the locked dependency tree block release.
- Full source/regression/failure/property/UX/build/installable-artifact and Marinara Engine v2.4.4/v2.4.6 compatibility gates remain release requirements.

## 3.0.1 — Marinara Engine v2.4.6 compatibility

- Cross-checked the Personal Extension host, message routes, generation routes, DOM selectors, private storage, and edit event against Marinara Engine v2.4.6.
- Added character-backed user Persona support for the new `chat.personaCharacterId` and `personaSnapshot.source` contracts. Historical v2.4.4 snapshots without `source` remain interpreted as ordinary Personas.
- Engine compatibility checks now certify 20 legacy contracts on v2.4.4 and 22 contracts on v2.4.6.
- Confirmed that the v2.4.6 message PATCH route still has no ETag/revision/If-Match compare-and-swap primitive; Rewrite Assistant therefore retains its client-side reread/fingerprint/chat-identity guards.


## 3.0.0 Optimization — Part 3/3 final verification hardening

### Property/fuzz and Unicode correctness
- Added deterministic property/fuzz coverage for rendered-to-stored span mapping, fingerprint invalidation, Ledger split/assemble/subdivide invariants, capacity enforcement, and merged-marker integrity.
- Ledger hard cuts never split UTF-16 surrogate pairs; when `Intl.Segmenter` is available, boundaries are also grapheme-aware for ZWJ emoji and combining sequences.
- Added an explicit 2,000,000-character retained-source ceiling. Over-ceiling Ledger work fails closed before context collection/inference; selected text is never silently truncated or sent.

### Runtime resilience
- Added a bounded Diff Worker response timeout with synchronous bounded fallback so a hung worker cannot leave Preview diff computation pending indefinitely.
- Native manual-save now searches every duplicate wrapper for the exact message id before falling back, preserving zero-PATCH behavior.
- Source verification now checks runtime import cycles, raw network/page-storage escapes, and obvious hardcoded-secret patterns in addition to imports/syntax/lockfile consistency.

### Engine upgrade readiness
- Expanded the Engine compatibility checker with managed-timer cleanup and native sent-message edit-event contracts.
- The checker now accepts an explicit expected Engine version for upgrade audits; v2.4.4 remains the certified baseline until a newer Engine source is independently diffed and tested.

## 3.0.0 Recovery Merge — Final Hardening (Merge Part 3/3)

### Concurrency and destructive-write hardening
- Added an active-chat guard before message PATCH, native-editor preparation, and message undo/redo. A rewrite started in one chat cannot silently write to that chat after the user navigates elsewhere.
- Merged multi-message partial applies now retain explicit per-message commit state. Re-pressing **Accept All** retries only uncommitted messages instead of touching messages that already committed.
- Regeneration is blocked after a merged result has partially committed so one batch cannot accidentally mix two independently generated merged outputs.

### Ledger consistency and long-text correctness
- Ledger resume keys now include the selected-source guard plus every inference-affecting profile/provider/context setting while ignoring unrelated UI layout settings.
- Ledger context is captured once per in-memory run and reused for retry/resume; the full message-info/history payload is deliberately dropped from the retained snapshot.
- Session Ledger pruning now accounts for generated results and retained prompt context as well as original text.
- Fixed message-selection edge whitespace at the final Ledger boundary so preserved source spaces/newlines are not duplicated by the rendered-to-stored mapper.

### Native-editor reliability
- Manual-save now prefers Marinara v2.4.4's `marinara:start-edit-message` event, which works independently of UI language.
- Added a Lucide Pencil fallback for localized/forked message action buttons and Lucide Check/X recognition when clearing stale in-memory editor history.

### Release/backup pipeline
- CI now runs a real `npm ci`, accepts `backup/**` branches, hashes the verified installable JSON, and uploads both the JSON and its SHA-256 sidecar.
- Expanded regression and executable failure-mode coverage for chat switching, Ledger execution identity, edge-whitespace assembly, merged partial-resume planning, and event-driven native-editor preparation.

## 3.0.0 Recovery Merge — Advanced Editing (Merge Part 2/3)

### Multi-message editing
- Added ordered cross-message selection capture with per-message stale-write/fingerprint metadata.
- Added sequential multi-message rewrite as the safe default; previously committed messages are never silently rolled back and partial success is reported explicitly.
- Added opt-in merged rewrite with capture-bound nonce markers, exact count/order/duplicate validation, and safe fallback to sequential processing when marker integrity cannot be proven.

### Large selections / Ledger
- Added a session-RAM-only Ledger pipeline for selections that exceed the real provider prompt budget.
- Ledger splitting is lossless for Unicode, CRLF, and edge whitespace and prefers paragraph/sentence boundaries without truncating source text.
- Added per-slice retry, skip/unskip, close-and-resume within the current extension session, bounded neighboring-slice continuity references, and adaptive subdivision if provider overhead still makes a slice too large.
- Final Ledger assembly uses the original selection's guarded commit path; no large-selection mode bypasses stale-content or rendered-to-stored mapping checks.
- Session Ledger prose is cleared on extension cleanup and is never written to Marinara/private/origin storage.

### Output recovery and manual save
- Added a raw-result textarea that remains selectable even when clipboard APIs fail.
- Added clipboard fallback via a temporary textarea plus `.txt` download recovery for long outputs.
- Added native-editor manual-save mode: Rewrite Assistant safely prepares the scoped Marinara editor, then leaves Marinara's Save action to the user and performs zero automatic PATCHes.
- Large previews bypass expensive typewriter rendering and retain bounded diff behavior.

### Verification
- Expanded regression coverage for multi-message selection, merged markers, Ledger assembly/budgeting, manual-save behavior, output recovery, and partial commits.
- Added executable failure-mode tests for marker tampering, lossless long-text splitting, session-only Ledger retention, target override/overflow, zero-PATCH manual save, adaptive subdivision, and explicit partial-apply reporting.

## 3.0.0 RC6 — Parity Part 2

### Context and management parity
- Added Marinara Extender inference mode with no auth/model persistence and explicit URL validation.
- Added opt-in Extender memory with `/api/memory-block` retrieval and Marinara Extender lorebook fallback.
- Added speaker-aware context and reserved-tag neutralization for `<memory>` / `<speaker>` data blocks.
- Added searchable current-chat Character picker; explicit selections override sender fallback without requiring a character-role heuristic.
- Added approximate token/context cost inspection using the same context collector as the actual rewrite path.
- Added chat-specific auto-profiles; automatic generation remains OFF by default and manual generation stays available.
- Added selective portable export/import while excluding provider-routing fields (`connMode`, connection IDs, Direct/Extender endpoints/models).
- Added bounded session-only debug logs with credential-key redaction and no prompt/reply-body persistence.

### Hardening
- Added UTF-8 byte-budgeted persistence for profiles, custom prompts, and auto-profiles to remain below Marinara's private-storage quota with Vietnamese/emoji-heavy content.
- Hardened legacy/fork character ID parsing, prototype-sensitive keys in imports/auto-profiles/debug metadata, and context-tag injection boundaries.
- Expanded executable failure-mode coverage for Extender inference, memory fallback, Character selection, auto-profile generation, routing-safe portable data, and Unicode-heavy storage.


## 3.0.0 — Marinara Engine v2.4.4 hardening

### Data integrity
- Replaced Unicode-unsafe current persistence with Marinara private extension storage and guarded legacy migration.
- Made undo/redo session-only and scoped history by chat + message.
- Added guarded sent-message PATCH with rendered-to-raw mapping and concurrency checks.
- Failed commits now keep the generated result recoverable when clipboard fallback also fails, and duplicate commit clicks are suppressed while applying.
- Removed arbitrary active-textarea fallback and guarded textarea commits against stale edits.

### Engine compatibility
- Pinned Persona to `/api/characters/personas/:id`.
- Corrected Lorebook scan response handling for the v2.4.4 `entries` envelope.
- Added Marinara Connections and `/api/generate/raw` support.
- Stale Marinara connection IDs are cleared instead of silently switching to another provider; a new connection requires explicit user selection.
- Message-dependent Character/Persona/history context now fails closed when authoritative message metadata cannot be read.
- Enforced Sidecar's 16,000-character prompt contract.
- Prefer attributed `marinara.fetch()` and private `marinara.storage`.
- Added Engine-source compatibility checker.
- Honor Marinara message-level hidden-from-AI flags and global/per-character conversation-start boundaries when optional history context is enabled.
- Use persisted `personaSnapshot` identity for historical user messages and authoritative message `characterId` for group-chat assistant rewrites.
- Treat `/generate/raw` `{ aborted: true }` as cancellation rather than an empty model response.

### Privacy and security
- Context injection defaults to off with history depth zero.
- Added prompt budgets and bounded Character/Lorebook context.
- Hardened request timeout/abort behavior and CSRF handling.
- Added reserved-tag neutralization for prompt data blocks.
- Removed wildcard localStorage deletion.
- Private storage remains authoritative and opportunistically removes stale same-origin legacy duplicates after interrupted migrations.

### Runtime and UX
- Bounded diff computation and worker lifecycle.
- Reduced typewriter render frequency and throttled pointer updates.
- Added dialog focus trapping, Escape close, and focus restoration.
- Fixed profile edit/delete identity, settings scroll state, clipboard fallback cleanup, direct temperature `0` handling, and role-radar handling for unknown/non-character messages.
- Await private-storage hydration before mounting React to prevent startup state races.

### Reference-parity foundation
- Preserved the React/Zustand/Preview architecture while merging selected Marinara-Rewrite v6.1.0 behaviors instead of transplanting its implementation.
- Added explicit context drop priority with pre-inference user notification; previous-message history is discarded before higher-priority context when a prompt budget is tight.
- Added session-only source exclusions, captured-snapshot surrounding prose, safe trim-before-send, popup pinning, concise system instructions, explicit result Copy, profile search/hide, and Custom Prompt → Save as Profile.
- Added per-selection `captureId` so one-shot exclusions cannot leak into a later Alt+R capture; trim preserves the same capture identity while recomputing targeting guards.
- Deliberately retained stronger Rewrite Assistant controls: private storage, explicit provider choice, fail-closed writes, and no persisted Direct API credentials.

### Project quality
- Added self-check regression suite, executable failure-mode suite, dependency-free source gate, CI workflow, installable-manifest builder, compatibility documentation, and release hygiene.
- Hardened persisted-state merge so stored JSON cannot overwrite Zustand actions; corrected Marinara role detection; made AI Refine quote unwrapping conservative; suppressed false failure toasts for intentionally aborted connection tests; and sourced bundle version from `package.json`.
- Removed unused template assets and the unnecessary CSS-in-JS Vite plugin.
- Expanded mapper regression coverage for nested formatting, large transformed messages, large selections, and behavioral sent-message editor detection.
- Added dependency-free installable-manifest preflight, centralized manifest creation/validation, expanded Engine import/full-page runtime checks, and deferred Vite loading until all preflight gates pass.
