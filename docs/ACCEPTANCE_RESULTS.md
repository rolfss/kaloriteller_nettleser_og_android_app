# Acceptance verification — 2026-08-12

The source checklist is `ACCEPTANCE_TESTS.md`. Automated tests use fake IndexedDB where persistence is involved; browser checks use the production PWA build.

| ID | Result | Evidence |
|---|---|---|
| A–B | Passed | Browser: `15 g tran`, explicit 9 kcal/gram => 135; `10 gram tran` reused => 90. Service tests cover transaction/persistence. |
| C–E | Passed | Service/UI tests cover custom definitions, arbitrary `elefant`, plural alias, and `3 flasker` => 450. |
| F–G | Passed | Parser/rule tests cover `1,5 dl`, 69 kcal, and no gram↔dl reuse/conversion. |
| H–I | Passed | Domain/service/UI tests cover derived total, edit/delete, and all specified bad inputs. |
| J | Passed | Date and service tests advance the local date while preserving the open day/date and accepting entries; UI warning is tested. |
| K | Passed | Browser check cancelled then confirmed the app completion modal; history retained all entries. |
| L–M | Passed | Service tests edit/delete completed data and verify definition correction leaves historical snapshot unchanged; browser verified completed-day detail actions are exposed. |
| N–O | Passed | Service tests complete eight days, retain seven days/entries and the definition, and reopen the same database. |
| P | Passed | Production PWA was loaded, local server stopped, page reloaded, retained history viewed, and known `2 flasker` added offline. |
| Q–R | Passed | PDF data/byte tests verify date, total, raw text and per-entry kcal; UI exposes selected-day and retained-history export flows. |
| S | Passed by design/test boundary | Cancellation returns a non-error result and occurs only in the platform save adapter; no mutation is coupled to export. Native share cancellation cannot be exercised without Android runtime. |
| T | Passed | Source/build scan found no food-data network calls, analytics, backend, or external food service. Android has no `INTERNET` permission. |
| U | Passed | Transactional service test rejects a duplicate normalized alias and creates no pending entry/definition. |

## Platform verification

- PWA manifest and service worker generated; 23 static resources precached.
- Mobile production UI visually inspected at 390 × 844; no horizontal overflow and no browser console errors.
- Capacitor Android project generated and synchronized with Filesystem and Share.
- Android launcher assets generated for all standard density buckets.
- Android manifest requests no network or storage permission.
- Android debug build was attempted but could not start: the machine has no Java executable/`JAVA_HOME` or Android SDK.
- The GitHub Pages production build was loaded from its repository subpath with the expected PWA manifest scope and no browser console errors.
