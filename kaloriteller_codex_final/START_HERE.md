# Kaloriteller — start here

This repository package is the complete product brief for Codex.

## Recommended Codex workflow

1. Put these files in the root of a new Git repository.
2. Open that repository in Codex.
3. Start with `CODEX_MASTER_PROMPT.md`.
4. Let Codex plan before implementation.
5. Review `docs/EXEC_PLAN.md` and `docs/AGENT_DECISIONS.md`.
6. Then let Codex implement, test, build, and harden the app.

## Source of truth

Read in this order:

1. `AGENTS.md`
2. `PRODUCT_SPEC.md`
3. `DOMAIN_MODEL.md`
4. `UX_SPEC.md`
5. `ARCHITECTURE.md`
6. `ACCEPTANCE_TESTS.md`
7. `PRODUCT_DECISIONS.md`
8. `QUALITY_BAR.md`
9. `assets/wireframe.png`

If a lower-level implementation choice conflicts with the product specification, the product specification wins.

## Core idea

A local-first calorie logger.

The user types what they consumed. The app either:
- already knows the calorie rule and calculates the entry; or
- asks the user to define the missing calorie rule clearly and then remembers it.

The app never guesses calories.
