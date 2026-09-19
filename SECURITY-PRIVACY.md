# Security and Privacy Notes

## Destructive writes

Sent-message replacement is guarded by a read-map-verify-write sequence. The extension refuses to PATCH when the message changed, the rendered selection cannot be safely mapped to raw content, or the selection surroundings no longer match.

Textarea replacement requires the exact original textarea element, original value, and selected slice to remain unchanged. There is no fallback that writes to an arbitrary active textarea.

## Persistence

Settings, profiles, and custom prompts use Marinara private extension storage on the certified v2.4.4–v2.4.6 hosts. Undo/redo content is session-only and is deliberately excluded from persisted state.

Legacy compressed localStorage is decoded only for migration. Because the old codec could corrupt Unicode, migration verifies round-trip bytes and fails closed when loss is detected. The exact legacy bytes are retained under `rwa-premium-storage-legacy-backup-v3` until the user chooses Clean Data.

## Network behavior

Marinara connection mode uses `/api/generate/raw`. Sidecar inference also uses `/api/generate/raw`, addressed through Marinara Engine's stable synthetic connection `__local_sidecar__`; the extension retains its conservative 16,000-character-per-prompt Sidecar ceiling. Direct mode accepts only `http://` or `https://` URLs and rejects embedded credentials, query strings, and fragments so secrets cannot be smuggled through a persisted/base endpoint.

The extension prefers `marinara.fetch()` so Personal Extension traffic is attributed by Marinara. Unsafe same-origin requests add `x-marinara-csrf: 1`.

## Prompt boundaries

Selected text and optional Character, Persona, history, and Lorebook context are wrapped in explicit data blocks. Reserved block tags appearing inside user/model context are neutralized before prompt composition. Context is dropped before selected text when a prompt budget is exceeded.

## Draft Reply identity and privacy

Draft Reply is preview-first. When a Persona is active, it writes only for that user Persona: the Persona is resolved when the session opens and bound to both an identity key and a source fingerprint, then revalidated after model generation and immediately before composer insertion. If no Persona is active, the UI enters explicit Generic Draft mode and uses recent chat plus the user's direction without inventing Persona-specific biography, memories, or traits and without applying a Persona Voice Profile. A Generic Draft is discarded if a Persona becomes active during generation or before insertion.

Draft Reply never presses Send. Composer insertion only dispatches the normal input event after exact chat and identity-mode verification, leaving the final edit and send action to the user.

Recent Draft Reply history excludes globally hidden messages and treats per-Character hidden metadata conservatively when there is no single Character audience. System/unsupported roles are not forwarded. Conversation-start boundaries stop backfilling older history. Historical user messages are attributed to a named Persona only when Marinara supplied a Persona snapshot; otherwise they remain labeled generically as User.

Provider output is normalized and checked before preview/insert. Obvious extra Character, Narrator, Assistant, System, User, or additional speaker-labeled turns are rejected instead of being silently inserted as part of the Persona reply.

## Advanced editing and long-result recovery

Multi-message edits are not treated as atomic. Sequential mode is the default; if an earlier message commits and a later message fails, the UI reports the exact partial state instead of implying rollback. Optional merged mode may generate several message rewrites in one request, but output is split only after all capture-bound markers survive exactly once and in order. Marker validation failure causes zero merged writes and falls back to the safer path.

After a merged partial commit, the exact generated pieces and per-message commit state remain in the Preview. A subsequent Accept retries only uncommitted messages; regeneration is deliberately blocked until the user closes that partially committed batch. If the user changes chats while generation or review is in progress, automatic writes fail closed rather than modifying the previously active chat in the background.

Large selections use a Ledger held only in extension-session RAM. Selected prose, slice results, retry state, and continuity references are not persisted to Marinara storage, localStorage, sessionStorage, or debug logs. Original Ledger source prose is hard-bounded to 2,000,000 characters across retained session ledgers; a single over-ceiling selection fails before context collection or inference, with no truncation or send. Generated results are kept recoverable rather than silently truncated. Ledger state is cleared when the extension is unloaded. Final assembly still passes through the original message/textarea stale-write guards.

A Ledger also binds resume state to the selected-source fingerprint and inference-affecting profile/provider/context settings. Prompt context is snapshotted once for a run so retries cannot silently combine slices generated against different context. The retained snapshot omits the full message-info/history object, and pruning accounts for generated results/context as well as source text.

Manual-save mode never calls the message PATCH API. It verifies the current source, opens or targets the exact Marinara message editor, fills the proposed content, and leaves the native Save action to the user. If that cannot be done safely, the generated result remains in Preview.

Programmatic clipboard failure does not discard output. Preview keeps the full raw result selectable and can create a UTF-8 `.txt` download as an independent recovery path. Ledger slicing never splits a UTF-16 surrogate pair; where `Intl.Segmenter` is available it also avoids grapheme-cluster boundaries such as ZWJ emoji and combining-mark sequences. Diff Worker requests have a bounded response time and fall back to the same bounded synchronous diff path if a worker hangs.

## Out of scope

A `full_page_access` Personal Extension is unsandboxed by design and can interact with the Marinara page. Users should install only reviewed builds and should compare release hashes when distributing the extension outside their own instance.
