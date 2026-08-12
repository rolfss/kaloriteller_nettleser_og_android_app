# Master prompt for Codex

Paste the prompt below into Codex from the repository root.

```text
Build the complete Kaloriteller application specified by this repository.

FIRST: UNDERSTAND AND PLAN
1. Read START_HERE.md and AGENTS.md.
2. Read every source-of-truth specification referenced there.
3. Inspect assets/wireframe.png visually.
4. Inspect the current repository state.
5. Rewrite/expand docs/EXEC_PLAN.md into a concrete implementation plan before substantial coding.
6. Identify only genuinely blocking contradictions. Do not ask generic preference questions.
7. For unspecified details, make the simplest robust design choice and record material choices in docs/AGENT_DECISIONS.md.

IMPORTANT PRODUCT FACTS
- The app counts calories only.
- Screen 1 D is the food-entry composer.
- Screen 1 E is the current calorie total.
- A/B/C are current-day historical entries.
- Avslutt dag is a separate explicit action.
- A day never auto-completes at midnight.
- Retain the active day plus seven completed days.
- All calorie values come from explicit user definitions.
- Never guess calories, food values, density, or gram/dl conversions.
- Support gram, deciliter, and arbitrary custom/count units.
- Custom count labels can be essentially anything: kjeks, scoop, flaske, kartong, elefant, etc.
- Example: stored `flaske`/alias `flasker` = 150 kcal per unit; `3 flasker` = 450 kcal.
- Persistent user data stays local.
- The product must work in Chrome/PWA and Android.

ENGINEERING EXPECTATION
Use strong but pragmatic engineering:
- deterministic domain logic;
- clear separation of domain/application/persistence/platform/UI;
- strict TypeScript;
- versioned local persistence;
- transactional consistency where needed;
- accessible mobile-first UI;
- offline-first behavior;
- minimal permissions;
- no unnecessary dependencies or architecture.

You have autonomy on unspecified implementation details. Make those choices rather than blocking on minor questions, but make material autonomous choices visible in docs/AGENT_DECISIONS.md and in your final report.

IMPLEMENT
Proceed through the whole MVP, not merely scaffolding:
- domain parser/calculation;
- storage;
- active-day UI;
- unknown-definition UI;
- custom-unit/alias behavior;
- entry editing/deletion;
- definition correction;
- explicit day completion;
- midnight behavior;
- seven-day retention;
- history/day detail;
- local PDF generation/export;
- PWA/offline;
- Android/Capacitor;
- automated tests;
- documentation and build commands.

VERIFY CONTINUOUSLY
After each meaningful slice:
- run relevant tests;
- fix failures;
- update docs/EXEC_PLAN.md.

Before declaring completion:
- run typecheck;
- run lint;
- run complete automated test suite;
- run production build;
- verify PWA/offline behavior;
- configure/sync Android;
- attempt Android build when tooling permits;
- work through ACCEPTANCE_TESTS.md;
- inspect for unintended food-data network transmission.

If an external environment limitation prevents a verification step, state exactly what was and was not verified. Do not pretend it passed.

FINAL RESPONSE
Give a concise report containing:
1. what was built;
2. important autonomous design choices;
3. test/build commands and outcomes;
4. Android/PWA status;
5. any remaining limitations.

Do not add unrelated product features.
```
