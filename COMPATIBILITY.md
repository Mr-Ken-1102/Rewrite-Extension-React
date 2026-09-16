# Marinara Engine Compatibility

## Certified baselines

Rewrite Assistant v3.0.1 is cross-checked against **Marinara Engine v2.4.4 and v2.4.6**.

The v2.4.6 audit additionally covers character-backed user identity (`chat.personaCharacterId`) and historical `personaSnapshot.source` metadata. Rewrite Assistant resolves `source: "character"` through the Character endpoint while retaining the v2.4.4 legacy interpretation for snapshots that do not carry a source field.

The compatibility checker validates these contracts directly from an Engine source tree:

- Personal Extension runtime `client` and capability `full_page_access`.
- Full-page host API: private storage, attributed fetch, managed timers, and cleanup callback.
- CSRF header contract for unsafe same-origin API writes.
- Chat message list and PATCH routes, including the updated-message response.
- Character and Persona route prefixes.
- Lorebook scan response envelope (`entries`, token metadata).
- `/generate/raw` request schema.
- `/generate/raw` explicit aborted-response contract.
- `/sidecar/tracker` 16,000-character limits.
- `data-message-id`, `.mari-message-content`, `data-chat-composer="true"`, and active-chat storage hooks.
- Personal Extension private-storage quota of 1,000,000 bytes.
- Chat API normalization of `characterIds`.
- Message sender `characterId` and historical user `personaSnapshot` metadata.
- Global/per-character hidden-from-AI and conversation-start metadata used to scope optional Rewrite history context.

Run:

```bash
npm run compat:engine -- /absolute/path/to/Marinara-Engine-main
# Optional explicit expected version during an Engine upgrade audit:
node engine-compatcheck.mjs /absolute/path/to/Marinara-Engine-2.4.4 2.4.4
node engine-compatcheck.mjs /absolute/path/to/Marinara-Engine-2.4.6 2.4.6
```

Do not assume a future Marinara release is compatible merely because the manifest still installs. The checker accepts an explicit expected-version argument for upgrade audits, but passing it is only a contract preflight: a new Engine release still requires source-diff review plus the full test/build/live matrix before the compatibility baseline is changed.
## Advanced-editing compatibility assumptions

Cross-message capture depends only on the same certified Engine message markers already checked above (`[data-message-id]` and `.mari-message-content`). Manual-save mode additionally requires Marinara's sent-message Edit action to expose a scoped textarea under a wrapper carrying the exact message id; duplicate wrappers with the same id are all searched, and if the editor cannot be located and verified, Rewrite Assistant fails closed and keeps the result recoverable in Preview instead of writing elsewhere.

Ledger splitting and merged-marker validation are extension-local algorithms and do not add Engine API contracts. All final automatic message writes still use the checked chat-message PATCH route (unchanged in v2.4.6).


## Manual-save integration detail

Marinara Engine v2.4.4 and v2.4.6 Roleplay and Conversation message components both listen for the page event `marinara:start-edit-message` with `{ messageId }`. Rewrite Assistant prefers this host event for native-editor preparation because it is independent of localized button labels. A scoped DOM/Pencil-icon fallback remains for compatible forks. If neither path opens the exact message editor and its value cannot be verified against the just-read message content, manual-save fails closed and Preview remains recoverable.

Automatic message writes additionally verify that the currently active chat still matches the chat captured at selection time. This is an extension safety policy layered on top of the certified API contract, not a new Engine route requirement.
