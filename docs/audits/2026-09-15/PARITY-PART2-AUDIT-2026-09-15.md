# Rewrite Assistant v3.0.0 RC6 — Parity Part 2 Audit

## Scope

RC6 continues from the verified RC5 Parity Part 1 artifact. `Marinara Engine v2.4.4` remains the runtime/API authority; `Marinara-Rewrite v6.1.0` remains a feature/behavior reference. Part 2 does not replace the React/Zustand architecture or weaken RC5 safety controls.

## Implemented

- Marinara Extender inference mode (`/v1/chat/completions`), no auth header and no forced model field.
- Opt-in Extender memory (`/api/memory-block`) with bounded Marinara Extender lorebook fallback.
- Speaker-aware context fenced as untrusted reference data.
- Current-chat Character picker/search; explicit IDs override sender fallback and work independently of the selected message role.
- Approximate token/context panel driven by the same context collector used by rewrite execution.
- Chat-specific auto-profile generation; automatic mode OFF by default.
- Selective portable export/import excluding provider routing and endpoints.
- Session-only bounded debug log with sensitive-key redaction.
- UTF-8 byte-budget persistence for profiles, auto-profiles, and custom prompts.

## Verification

- Regression suite: **55/55 PASS**.
- Executable failure-mode suite: **27/27 PASS**.
- Marinara Engine v2.4.4 compatibility: **18/18 PASS**.
- Dependency-free source gate: **PASS**.
- Manifest preflight: **PASS**.
- Supplemental TypeScript parser: **47 files / 0 diagnostics**.
- Node syntax check for `.js`/`.mjs`: **PASS**.
- Package-lock root consistency: **PASS**.

Failure-mode coverage added in Part 2 includes Extender request shape, selected Character + memory + speaker context sharing, explicit auto-profile generation, routing-safe portable data, Unicode-heavy private-storage budgets, and Extender-memory lorebook fallback.

## Deliberate differences from reference

- Auto-profile is opt-in instead of enabled by default.
- Debug logs are not persisted and do not contain full prompt/reply bodies.
- Portable data cannot change provider mode, connection ID, Direct endpoint/model, or Extender endpoint.
- Direct API credentials remain unsupported; credentialed remote providers belong in Marinara Connections.

## Remaining scope

Advanced multi-message sequential/merge behavior, Ledger Pattern, manual-save workflow, partial-commit reporting, and their live integration tests are deferred to Parity Part 3. Production Vite/ESLint/installable-JSON validation remains blocked in this sandbox while npm registry DNS returns `EAI_AGAIN`.

## Disposition

**RC6 Parity Part 2 source candidate: PASS. Clean-artifact round-trip verification: PASS.**
