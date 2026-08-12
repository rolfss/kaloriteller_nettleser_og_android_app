# Quality bar

## Functional quality
- Every calorie displayed is traceable to an explicit user-defined rule.
- Unknown data never becomes a guessed calorie value.
- Totals always derive from entry data.
- Day completion is explicit.
- Seven-day retention is deterministic.
- Historical logs do not silently change when a definition changes.

## Code quality
- strict TypeScript;
- small cohesive modules;
- no duplicated calculation logic;
- no business rules hidden in UI;
- meaningful names;
- minimal dependencies;
- no dead code or placeholder TODOs in completed MVP paths.

## Testing priorities

Highest-value automated tests:

1. parser and normalization;
2. measured calculation;
3. custom-count calculation;
4. unknown-definition flow;
5. custom aliases;
6. daily totals after add/edit/delete;
7. midnight behavior;
8. completion state transition;
9. seven-day retention;
10. historical snapshot behavior;
11. PDF data construction;
12. persistence round-trip.

Use UI/end-to-end tests for the user journeys that pure unit tests cannot prove.

## UX quality
- logging a known item is fast;
- teaching an unknown item is unambiguous;
- no accidental day completion;
- editing mistakes is possible;
- actions are usable on phone-sized screens;
- no unnecessary screens or settings.

## Completion report

Codex's final report must contain:
- implementation summary;
- tests/commands actually run;
- build results;
- Android verification status;
- PWA/offline verification status;
- autonomous design decisions from `docs/AGENT_DECISIONS.md`;
- remaining limitations.

Do not say a capability was verified if it was not actually tested.
