# UX specification

Reference: `assets/wireframe.png`

The sketch defines the rough hierarchy, not pixel-perfect layout.

## Screen 1 — active day

### Correct wireframe mapping

- `A`, `B`, `C`: previously submitted food entries for the active day.
- `D`: **food-entry composer/text field**.
- `E`: **current calorie total**.

The earlier interpretation that D was `Avslutt dag` is superseded by this specification.

### Required elements

Header/top:
- date;
- calorie total prominently visible near the upper-left area corresponding to E;
- compact access to `Historikk`.

Body:
- chronological entry stream;
- message-like/compact rows;
- raw entry text;
- calculated kcal;
- tap/click for edit/delete.

Composer D:
- visible text field;
- placeholder such as `Hva spiste du?`;
- clear submit control;
- Enter may submit on desktop;
- validation errors appear next to the composer.

`Avslutt dag`:
- separate explicit button;
- not inside or confused with D;
- placement may be chosen by Codex;
- should remain easy to find without dominating normal entry logging;
- requires confirmation.

## Unknown-definition dialog

Title:
`Hvor mange kalorier er dette?`

Always show the raw pending input.

### For measured entries

Example:
`Du skrev: 15 g tran`

Show:
- item name: `tran`, editable;
- basis selector;
- kcal field.

Basis choices:
- `1 gram`
- `1 desiliter`
- `Custom enhet`

Default to the detected standard measurement.

If the user changes from a standard measure to custom, make the change explicit; never silently convert.

### For custom/count entries

Example:
`Du skrev: 3 flasker`

Show:
- detected custom unit label, editable;
- basis `Custom enhet`;
- kcal per 1 unit;
- optional alias management where useful.

Example visible meaning:
`1 flaske = [150] kcal`

Primary:
`Lagre og legg til`

Secondary:
`Avbryt`

## Old open day

If active `logDate` is earlier than today's local date, show a subtle warning such as:

`Denne dagen er fortsatt åpen fra 11.08.`

It must not block entry.

## Screen 2 — history

The wireframe rows A-F represent completed-day rows. The app supports up to seven.

Header:
- `Historikk`
- action back to current day
- `Eksporter 7 dager`

Each day row:
- date;
- `Kalorier konsumert`;
- total kcal;
- obvious affordance for opening.

Newest first.

## Completed-day detail

Show:
- date;
- total;
- entry list;
- edit/delete entry;
- `Eksporter PDF`.

Do not show `Avslutt dag`.

## Saved definition management

Provide a minimal, unobtrusive route such as a menu/settings action:
`Kaloridefinisjoner`

User can:
- inspect definitions;
- edit kcal rate;
- edit custom aliases;
- delete a definition after confirmation.

Explain briefly that definition changes affect future entries, not old entries unless the old entry is edited.

This management UI should remain secondary to the two main screens.

## Visual design

- mobile-first;
- sparse;
- high contrast;
- large touch targets;
- restrained typography;
- no charts;
- no macro rings;
- no goal/progress visuals;
- no gamification;
- no decorative complexity.

On wide Chrome screens, center a sensible mobile/tablet-width content column rather than stretching the UI excessively.

## Accessibility

- semantic form labels;
- keyboard operability;
- visible focus states;
- accessible dialogs;
- focus trapping/restoration;
- useful button names;
- sufficient contrast;
- errors associated with their input.
