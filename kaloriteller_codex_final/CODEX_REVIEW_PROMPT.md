# Fresh-thread adversarial review prompt

After the main implementation, start a fresh Codex thread in the same repository and paste:

```text
Perform an adversarial senior-engineer review of the implemented Kaloriteller MVP.

Read:
- AGENTS.md
- PRODUCT_SPEC.md
- DOMAIN_MODEL.md
- UX_SPEC.md
- ARCHITECTURE.md
- QUALITY_BAR.md
- PRODUCT_DECISIONS.md
- ACCEPTANCE_TESTS.md
- docs/EXEC_PLAN.md
- docs/AGENT_DECISIONS.md

Inspect assets/wireframe.png and the actual implementation.

Find real defects, not stylistic preferences.

Prioritize:
- calorie calculation correctness;
- parser failures;
- decimal comma handling;
- custom unit/alias collisions;
- accidental fuzzy matching;
- any calorie guessing;
- gram/dl conversion mistakes;
- multiple active-day bugs;
- midnight bugs;
- retention/data-loss bugs;
- historical snapshot bugs;
- IndexedDB migration/transaction errors;
- PDF content mismatches;
- export cancellation/failure behavior;
- PWA/offline breakage;
- Android/Capacitor issues;
- unintended network transmission;
- accessibility regressions;
- missing high-value tests.

For each confirmed defect:
1. reproduce or prove it;
2. fix it;
3. add a regression test where practical;
4. run the relevant verification.

Do not redesign the product or add unrelated features.

Finish with:
- defects found/fixed;
- exact verification results;
- remaining known limitations.
```
