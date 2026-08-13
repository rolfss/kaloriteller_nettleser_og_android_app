# Codex repository instructions

## Mission

Build the application specified in this repository. It is intentionally small and focused.

The product counts **calories only**.

Before implementation, read all source-of-truth documents listed in `START_HERE.md` and inspect `assets/wireframe.png`.

## Working method

For any substantial task:

1. inspect the repository;
2. create or update `docs/EXEC_PLAN.md`;
3. implement in small verifiable slices;
4. run tests after each meaningful slice;
5. record non-trivial autonomous design decisions in `docs/AGENT_DECISIONS.md`;
6. finish with a full verification pass.

Do not ask the user about minor design details that can be resolved safely with standard engineering judgment.

Ask only when an ambiguity:
- changes core product behavior;
- risks data loss;
- changes the user's explicitly stated workflow;
- or makes two incompatible implementations equally plausible.

Otherwise choose the simplest robust option and document the decision.

## Autonomy rule

You have freedom to make implementation and UI-detail decisions that are not explicitly specified.

When you do:
- make the choice deliberately;
- prefer established, boring, maintainable patterns;
- avoid unnecessary dependencies and abstractions;
- record the choice in `docs/AGENT_DECISIONS.md`;
- include the important autonomous choices in the final implementation report.

Never reinterpret an explicit product requirement merely because another design is more conventional.

## Required engineering principles

- Single responsibility and clear module boundaries.
- Separation of domain logic, persistence, platform adapters, and UI.
- Pure deterministic functions for parsing/calorie calculations where practical.
- One canonical source of persistent truth.
- Derived totals rather than independently mutable totals.
- Explicit state transitions.
- Transactional data mutations where data consistency matters.
- Strong TypeScript types and runtime input validation at persistence/file boundaries.
- YAGNI: no speculative features.
- Accessibility by default.
- Privacy by default.
- Offline-first behavior.
- Graceful errors with no silent data loss.
- Tests target behavior, not implementation details.

## Non-negotiable product constraints

- Calories only.
- No macros.
- No weight tracking.
- No exercise tracking.
- No calorie goals.
- No accounts.
- No backend.
- No cloud sync.
- No analytics.
- No advertising SDKs.
- No external food database.
- No LLM/AI calorie inference.
- No silent unit conversion.
- No automatic completion at midnight.
- No food-entry data sent off-device.

## Platforms

Target:
- current Google Chrome as an offline-capable installable PWA;
- Android using the same web codebase, preferably through Capacitor unless a concrete blocker is discovered and documented.

## Preferred stack

Unless repository inspection reveals a concrete reason otherwise:

- TypeScript
- React
- Vite
- IndexedDB via a thin typed persistence layer; Dexie is acceptable
- service worker / PWA support
- Capacitor for Android
- mature client-side PDF generation library
- Vitest for domain/unit tests
- Testing Library for UI behavior
- Playwright when useful for high-value browser flows

Use current stable mutually compatible package versions at implementation time and lock them.

## Data and calculation rules

- All calorie definitions are supplied by the user.
- Never infer nutritional values from names.
- Never infer density.
- Never convert gram <-> deciliter.
- Quantities must be finite and positive.
- Calories per unit must be finite and non-negative.
- Preserve raw user input for display/PDF.
- Keep numeric precision internally; round only for presentation.
- Use the user's local timezone for date labels and day creation.

## UI

The wireframe is conceptual, not pixel-perfect.

Important correction to the original sketch:
- Screen 1 field `D` is the **food-entry text field/composer**.
- `E` is the current calorie total.
- `A`, `B`, `C` are historical entries during the current active day.
- `Avslutt dag` is a separate clear action, placed by the implementation where it works best without confusing it with the composer.

Keep the interface sparse and mobile-first.

## Definition behavior

There are two calorie-definition families:

1. measured foods:
   - kcal per 1 gram
   - kcal per 1 deciliter

2. count/custom units:
   - any user-defined count label can represent one calorie-bearing unit;
   - examples: `kjeks`, `scoop`, `flaske`, `kartong`, `elefant`;
   - one custom unit definition maps one normalized label/alias to kcal per one unit.

The app may support aliases for custom unit labels, but must never guess calories.

## Completion requirements

Before claiming completion:
- typecheck passes;
- lint passes;
- tests pass;
- production web build passes;
- PWA behavior is verified;
- core app works offline after installation/caching;
- Android project is configured and synchronized;
- Android build is attempted when environment permits;
- acceptance tests are checked;
- no unexpected network transmission of food data exists;
- all remaining limitations are explicitly reported.
