# Acceptance tests

The MVP is complete only when these behaviors are satisfied.

## A. Unknown measured definition

Given no definition for `tran + gram`:

1. Enter `15 g tran`.
2. Definition UI appears.
3. Confirm `1 gram`.
4. Enter `9 kcal`.
5. Save.

Expected:
- definition stored;
- pending entry added;
- entry = `135 kcal`;
- daily total increases by 135.

## B. Reuse measured definition

After A, enter:
`10 gram tran`

Expected:
- no definition UI;
- entry = `90 kcal`.

## C. Unknown custom/count definition

Given no `kjeks` custom definition:

1. Enter `1 kjeks`.
2. Define `1 kjeks = 56 kcal`.
3. Save.
4. Enter `2 kjeks`.

Expected:
- first = 56 kcal;
- second = 112 kcal;
- second does not ask again.

## D. Arbitrary custom unit

1. Enter `1 elefant`.
2. Define `1 elefant = 900 kcal`.
3. Enter `3 elefant` or a stored alias.

Expected:
- calculation = 2700 kcal;
- word semantics have no special role.

## E. Custom alias/plural

Create a custom definition:
- canonical label `flaske`
- alias `flasker`
- `150 kcal` per unit.

Enter:
`3 flasker`

Expected:
- result = 450 kcal;
- no calorie guessing occurs.

## F. Decimal comma

Given:
`melk + deciliter = 46 kcal`

Enter:
`1,5 dl melk`

Expected:
- quantity = 1.5;
- result = 69 kcal.

## G. No gram/dl conversion

Given only:
`melk + deciliter = 46`

Enter:
`200 g melk`

Expected:
- ask for `melk + gram`;
- do not infer a conversion.

## H. Daily total

Add three entries.

Expected:
- total equals exact sum of entries;
- edit/delete updates total immediately;
- no independently editable total exists.

## I. Bad input

Try:
- `tran`
- `0 g tran`
- `-5 g tran`
- `15 g`
- blank input

Expected:
- no entry;
- concise validation;
- no guessed data.

## J. Midnight

1. Create active day.
2. Simulate next local calendar date without completing it.

Expected:
- original day remains active;
- original log date remains;
- warning shown;
- entries can still be added;
- no automatic history move.

## K. Complete day

1. Press `Avslutt dag`.
2. Cancel confirmation.

Expected:
- remains active.

Then confirm.

Expected:
- day becomes completed;
- appears newest in history;
- entries remain intact.

## L. Edit completed day

Open a completed day and edit/delete an entry.

Expected:
- total recalculates;
- day stays completed;
- active-day state does not change.

## M. Definition correction and history integrity

1. Create `flaske = 150`.
2. Add historical entry `2 flasker` => 300.
3. Complete day.
4. Change saved definition to `flaske = 160`.

Expected:
- historical entry stays 300;
- new `2 flasker` entry becomes 320;
- editing/recalculating the old entry may update its snapshot deliberately.

## N. Seven-day retention

Complete eight days.

Expected:
- seven completed days remain;
- newest seven remain;
- oldest day's entries are removed;
- calorie definitions remain.

## O. Persistence

Add entries and definitions, reload/restart.

Expected:
- retained data remains.

## P. Offline

After installation/caching:
- disconnect network;
- reopen;
- add known entry;
- define unknown entry;
- complete day;
- view/edit history.

Expected:
- core functionality works.

## Q. PDF one day

Export selected completed day.

Expected PDF:
- correct date;
- correct total;
- raw entries;
- per-entry calories.

## R. PDF retained history

Export history.

Expected:
- retained completed days grouped by date;
- correct totals and entries.

## S. Export cancellation

Open file-save/share flow and cancel.

Expected:
- no data corruption;
- no alarming generic error;
- app remains usable.

## T. Privacy/network

Inspect normal logging/edit/history behavior.

Expected:
- food-entry/user calorie data is not transmitted to an application backend, analytics service, or external food service.

## U. Duplicate custom alias protection

Attempt to assign one normalized alias to two conflicting custom definitions.

Expected:
- app prevents or explicitly resolves the conflict;
- it never chooses one silently.
