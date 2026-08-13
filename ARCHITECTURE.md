# Recommended architecture

Codex may refine details but should preserve the separation of concerns.

## 1. Layers

### Domain
Pure or near-pure TypeScript:
- parser;
- normalization;
- calorie calculation;
- day state rules;
- retention selection;
- validation.

No React, IndexedDB, Capacitor, or browser APIs in domain modules.

### Application
Use cases/services:
- add entry;
- resolve unknown definition;
- edit/delete entry;
- complete day;
- load history;
- edit definition;
- export day/history.

### Persistence
A typed repository layer over IndexedDB.

The UI should not issue ad-hoc IndexedDB queries directly.

### Platform adapters
Abstract only where platform behavior genuinely differs:
- save/download PDF;
- Android share/save;
- PWA install/offline plumbing.

### UI
React components consume application services/state.

Avoid embedding calorie calculations or parser logic inside components.

## 2. Suggested project shape

Codex can adjust names, but keep equivalent boundaries.

```text
src/
  app/
  domain/
    calories/
    days/
    entries/
    definitions/
  application/
  persistence/
  platform/
  features/
    current-day/
    history/
    definitions/
  components/
  test/
```

## 3. State management

Prefer the simplest state solution that remains explicit.

Do not add a large global state library unless the app demonstrably benefits.

Persistent truth is the database, not an in-memory store.

## 4. Data consistency

Use database transactions for:
- completing a day + retention cleanup;
- definition + pending-entry creation if they are committed together;
- destructive operations involving parent/child rows.

Prevent multiple active days through application logic and, where feasible, persistence constraints/repair logic.

## 5. Offline

The app shell and static resources should be cached for offline use.

Core operations require no network.

Do not cache irrelevant remote resources because the product should not need them.

## 6. PDF

PDF document construction is application/domain-adjacent and platform-independent.

Saving/sharing is platform-specific.

Separate:
`buildPdfBytes(data)` from `savePdf(bytes, filename)`.

This makes PDF content testable without invoking a platform picker.

## 7. Error handling

Use clear typed/application errors for expected cases:
- parse error;
- definition missing;
- duplicate alias;
- persistence failure;
- export cancelled;
- export failed.

User cancellation is not an application error requiring alarming messaging.

## 8. Security/privacy

- no secrets required;
- no backend credentials;
- no analytics;
- no food-data network calls;
- minimize Android permissions;
- sanitize file names;
- treat imported/persisted values as untrusted at boundaries.

## 9. Performance

Dataset is tiny. Optimize for correctness and maintainability, not micro-performance.

Avoid premature caching that can create stale totals.
