# Repository Tooling

Project tooling is intentionally separated from runtime source.

## build/
- `build-extension.mjs` — runs dependency-free release preflights, builds the production bundle, creates the Marinara installable JSON, and validates round-trip manifest integrity.

## quality/
- `sourcecheck.mjs` — dependency-free source/import/lockfile/high-risk-pattern gate.
- `selfcheck.mjs` — regression invariants.
- `failuremodecheck.mjs` — controlled failure/race/security behavior checks.
- `propertycheck.mjs` — deterministic property/fuzz checks.
- `manifestcheck.mjs` — installable manifest contract.
- `engine-compatcheck.mjs` — Marinara Engine source-contract verification.
- `uxcheck.mjs`, `popupcheck.mjs`, `popupcalibrationcheck.mjs`, `interactioncheck.mjs`, `modalcheck.mjs`, `settingscheck.mjs`, `lancheck.mjs` — focused UI/UX/connection architecture gates.

Use the npm scripts in the repository root rather than invoking these files directly unless you are debugging a specific gate.
