# Repository Structure

Rewrite Assistant keeps runtime product code, quality tooling, and historical evidence separated so the repository root remains readable and release-oriented.

```text
.github/
  workflows/             GitHub Actions release gates
public/                  Static assets
src/                     Runtime extension source
tools/
  build/                  Build/release orchestration
  quality/                Regression, failure, fuzz, UX and Engine checks
docs/
  architecture/           Current design guardrails and architecture decisions
  audits/
    YYYY-MM-DD/           Historical audit reports grouped by date
CHANGELOG.md              Current release history
COMPATIBILITY.md          Supported Marinara Engine contracts
SECURITY-PRIVACY.md       Security/privacy model
extension-manifest.mjs    Installable manifest factory/validator
package.json              Package metadata and canonical npm commands
vite.config.js            Production build configuration
README.md                 Product and development overview
```

## Placement rules

1. Runtime implementation belongs under `src/`.
2. Executable test/build utilities belong under `tools/`, not the repository root.
3. Current architecture/design guardrails belong under `docs/architecture/`.
4. Historical audit snapshots belong under `docs/audits/<date>/`.
5. Current release documentation remains in the root because it is part of the public project entry surface.
6. Do not place generated `dist/`, installable JSON, temporary logs, local backups, or vendor Engine trees in source control.
7. Repository reorganization must not change runtime behavior; all quality gates and Engine compatibility checks must pass after structural changes.

The pre-cleanup rollback point for the v3.0.2 reorganization is maintained separately on the dedicated Git backup branch created before this cleanup.
