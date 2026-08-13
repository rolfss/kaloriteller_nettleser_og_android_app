# Confirmed product decisions

These decisions are confirmed and should not be reopened unless implementation reveals a genuine blocker.

## P1 — Retention
Keep the active day plus the seven most recently completed days.

## P2 — Midnight
An active day remains active across midnight until explicitly completed.

## P3 — Wireframe field D
Screen 1 field D is the food-entry text field/composer.

## P4 — Wireframe field E
Screen 1 field E is the active-day calorie total.

## P5 — Custom units
A custom count unit can use essentially any user-defined label, including words such as:
- scoop
- flaske
- kartong
- elefant

The label represents an explicit kcal-per-one-unit rule.

## P6 — No calorie guessing
The app never guesses calorie values.

When it lacks a required definition, it asks the user.

## P7 — Design autonomy
Codex may decide unspecified implementation/UI details using sound engineering judgment.

It must record material autonomous decisions in `docs/AGENT_DECISIONS.md` and surface them in its final report.

## P8 — Local-first
Persistent food/day data remains local.

## P9 — Historical integrity
Changing a definition does not silently rewrite historical calorie entries.
