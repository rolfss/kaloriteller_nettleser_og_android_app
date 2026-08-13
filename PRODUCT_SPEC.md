# Product specification — Kaloriteller

## 1. Purpose

A minimal calorie logger that learns calorie rules directly from the user.

The app tracks one thing: **calories consumed**.

## 2. Core interaction

The user writes an entry such as:

- `15 g tran`
- `200 g melk`
- `1 kjeks`
- `3 scoops`
- `2 skiver`
- `3 flasker`
- `2 kartonger`
- `1,5 dl melk`

The application parses quantity plus a calorie-bearing definition.

If the definition is known, calories are calculated immediately.

If the definition is unknown, the application asks the user to define it clearly before the entry can be added.

The application never guesses calories.

## 3. Definition types

### 3.1 Gram-based food

Example:

Input:
`15 g tran`

User teaches:
`tran: 1 gram = 9 kcal`

Result:
`15 × 9 = 135 kcal`

Later entries such as `10 gram tran` reuse the same gram definition.

### 3.2 Deciliter-based food

Example:

Input:
`1,5 dl melk`

User teaches:
`melk: 1 dl = 46 kcal`

Result:
`1.5 × 46 = 69 kcal`

### 3.3 Custom/count unit

A user-defined count unit may be effectively any label.

Examples:

- `1 kjeks = 56 kcal`
- `1 scoop = 120 kcal`
- `1 flaske = 150 kcal`
- `1 kartong = 420 kcal`
- `1 elefant = 900 kcal`

After a matching custom unit is known:

`3 flasker` with `1 flaske = 150 kcal`
→ `450 kcal`

A custom unit is intentionally flexible. Its name does not need to correspond to a formal measurement unit.

The system must not attach nutritional meaning to the word. It only remembers the explicit user-supplied kcal rule.

## 4. Unknown definition flow

When an entry cannot be calculated safely, show a focused definition UI.

It must make the pending interpretation visible.

For measured food, show:
- detected food/item;
- detected measure;
- quantity;
- kcal per `1 gram` or `1 dl`.

For a count/custom entry, show:
- detected custom label;
- quantity;
- kcal per `1 <label>`.

The user can correct the detected name/label before saving.

The UI should also allow the user to choose the definition basis explicitly:
- `1 gram`
- `1 desiliter`
- `Custom enhet`

For `Custom enhet`, the user supplies/edits:
- custom unit label;
- kcal per one unit.

Saving the definition:
1. validates it;
2. persists it locally;
3. applies it to the pending entry;
4. adds the entry;
5. updates the total.

Canceling does not create the definition or entry.

## 5. No guessing

Never:
- look up calories automatically;
- use AI to infer calories;
- infer calories from similar foods;
- infer density;
- convert grams to dl;
- convert a measured definition into a custom unit;
- select between ambiguous definitions silently.

If safe deterministic matching fails, ask.

## 6. Active day

There is at most one active day.

Screen 1 shows:
- active-day date;
- current total calories;
- chronological entries;
- entry composer;
- access to history;
- explicit `Avslutt dag` action.

The daily total is derived from the entries.

## 7. Midnight behavior

A day is never automatically completed.

If the calendar date changes while the day remains open:
- keep the same active day;
- keep its original date;
- continue allowing entries;
- show a subtle message that an earlier day is still open;
- wait for explicit completion.

## 8. Ending a day

The user explicitly presses `Avslutt dag`.

Require a small confirmation.

On confirmation:
- mark the day completed;
- retain all entries;
- put it in history;
- preserve its date;
- no longer treat it as active.

A new active day is created lazily when the user next needs one.

## 9. History

Keep:
- the current active day, if any;
- the seven most recently completed days.

History shows newest completed day first.

Each history row shows:
- date;
- `Kalorier konsumert`;
- total kcal.

Opening a day shows:
- date;
- total;
- all entries;
- per-entry calories;
- edit/delete actions;
- PDF export.

## 10. Editing

Active-day entries can be edited or deleted.

Completed-day entries can also be edited or deleted.

Editing a completed day:
- recalculates its total;
- does not reopen it;
- does not change which day is active.

If an edited entry refers to an unknown definition, use the same definition flow.

## 11. Definition corrections

The product must provide a simple way to correct or delete saved calorie definitions.

A changed definition applies to future calculations.

Historical entries retain the calorie-rate snapshot that was used when they were created unless the user explicitly edits/recalculates that historical entry.

This avoids silent rewriting of history.

## 12. Retention

After completing an eighth retained day:
- delete the oldest completed day;
- delete its associated entries;
- retain the seven newest completed days;
- retain learned calorie definitions.

The mutation should be consistent/transactional.

## 13. PDF

Generate PDFs locally.

Support:
- one selected completed day;
- all currently retained completed days.

A day section includes:
- date;
- `Kalorier konsumert`;
- total kcal;
- raw entry text;
- calculated kcal for each entry.

Chrome:
- use a user-initiated save flow when supported;
- otherwise use a standard browser download.

Android:
- use an appropriate native save/share flow;
- request access only when the user explicitly exports;
- do not request broad storage access at application startup.

## 14. Offline and privacy

Normal use must work offline after installation/caching.

Persistent application data stays on-device.

No account, server, analytics, or telemetry is required.

## 15. Out of scope

Do not add:
- macros or nutrients;
- weight/body-fat tracking;
- targets;
- calorie recommendations;
- exercise;
- barcode scanning;
- camera recognition;
- external food lookup;
- meal planning;
- social features;
- cloud sync;
- multi-user support.
