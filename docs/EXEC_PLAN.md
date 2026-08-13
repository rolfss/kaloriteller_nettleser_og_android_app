# Execution plan

## Goal

Build and verify the complete local-first Kaloriteller MVP for installable Chrome/PWA and Android from one TypeScript/React codebase.

## Inspected starting point

The repository initially contained only specifications, documentation, and `assets/wireframe.png`. `START_HERE.md`, every referenced source-of-truth document, `AGENTS.md`, and the wireframe were reviewed before implementation.

## Completed implementation slices

- [x] Vite, React, strict TypeScript, ESLint, Vitest, Testing Library, and locked dependencies.
- [x] Deterministic Norwegian-friendly parser, normalization, validation, exact definition matching, calculations, dates, and retention rules.
- [x] Schema-versioned Dexie/IndexedDB persistence with runtime boundary validation.
- [x] Transactional definition-plus-entry creation, day completion/retention, alias collision prevention, lazy active days, and immutable historical rate snapshots.
- [x] Sparse mobile-first active day, unknown-definition dialog, entry editing/deletion, completion modal, midnight warning, history, day detail, and definition management.
- [x] Local, testable PDF construction and browser/Android save adapters.
- [x] Installable PWA manifest, generated icons, app-shell service worker, and offline verification.
- [x] Capacitor Android project, Filesystem/Share integration, generated app icons, and platform sync.
- [x] README and acceptance/verification records.

## Risks and outcomes

- **Android build toolchain:** Android generation and sync passed. The debug build was attempted and stopped before compilation because this machine has no Java executable/`JAVA_HOME` and no Android SDK. No APK result is claimed.
- **Browser save support:** File System Access API is used when available; standard Blob download is the fallback. Export cancellation is handled without data mutation.
- **Alias collisions:** The entire normalized custom-label namespace is checked transactionally before save.
- **Historical integrity:** Entries store rate and result snapshots. Definition edits never rewrite old entries silently.
- **Offline:** The server was stopped after the installed/cached app had loaded; reload, retained history, IndexedDB definitions, and a new known entry all worked without the server.

## Progress

- 2026-08-12: Source documents and wireframe reviewed; concrete plan prepared.
- 2026-08-12: Domain/persistence slices completed and continuously tested.
- 2026-08-12: UI, PDF, PWA, and Android slices completed.
- 2026-08-12: Browser acceptance/offline pass completed; a completion-confirmation UX issue found during browser testing was replaced with an accessible app modal and retested.

## Verification record

- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm test` — 7 files, 32 tests passed.
- `pnpm build` — passed; 23 PWA resources precached, manifest and service worker generated.
- `pnpm cap:sync` — passed; Filesystem and Share plugins synchronized.
- `android\\gradlew.bat assembleDebug` — attempted; blocked because `JAVA_HOME`/Java is unavailable.
- Browser production-flow check — passed for definition creation/reuse, custom alias, derived totals, edit, completion cancel/confirm, history/detail, definition list, 390 px viewport, and zero console errors.
- Offline check — passed after stopping the preview server: shell reload, retained history, and adding `2 flasker` from the local definition all worked.
- Privacy scan — no application backend, analytics, food lookup, or food-data transmission code; Android manifest has no network/storage permission.
- GitHub Pages build — verified under `/kaloriteller_nettleser_og_android_app/` with correct manifest start URL/scope, working assets, and zero browser console errors.
- 2026-08-13: Project moved to the repository root; recruiter-facing README, application preview, and quality-gated GitHub Pages deployment added.
- 2026-08-13: Added automatic session-memory fallback for browsers where IndexedDB is unavailable or blocked, with an explicit storage-status notice and no file/install requirement.
- 2026-08-13: Started the post-MVP usability package: explicit recruiter demo sessions, undoable deletion, retention warnings, portable local backup/import, CSV export, draft preservation, data/privacy controls, richer definition management, and Android test-package automation.

## Post-MVP implementation slices

- [x] Forceable `?demo=1` in-memory session with restart control and recruiter-facing link.
- [x] Composer draft preserved across in-app navigation without sending data off-device.
- [x] Ten-second undo for entry and definition deletion.
- [x] Seven-day retention warning naming the day to be removed, with export-before-completion.
- [x] Transactional versioned JSON backup/import and explicit clear-all operation.
- [x] Safe local CSV export for active and retained days.
- [x] Definition search, sorting, aliases, usage count, and last-used metadata.
- [x] Data/privacy screen and example-driven first-use guidance.
- [x] Automated coverage for memory/demo mode, backup boundaries, CSV, undo restore, and retention preview.
- [x] GitHub-built debug-signed Android test APK attached to the clearly labeled `v1.1.0` prerelease.
