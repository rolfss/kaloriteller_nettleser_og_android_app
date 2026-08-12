# Domain model

The domain should be understandable without UI code.

## 1. Day

```ts
type DayStatus = "active" | "completed";

interface Day {
  id: string;
  logDate: string;       // local YYYY-MM-DD created for this logical day
  status: DayStatus;
  createdAt: string;     // timestamp
  updatedAt: string;
  completedAt?: string;
}
```

Invariant:
- zero or one active Day may exist.

Do not store an independently editable authoritative total.

`dayTotal = sum(entry.calculatedCalories for entries belonging to day)`

## 2. Entry

```ts
type EntryKind = "measured" | "custom-count";
type StandardMeasure = "gram" | "deciliter";

interface Entry {
  id: string;
  dayId: string;

  rawText: string;
  quantity: number;

  kind: EntryKind;

  // measured entry
  itemName?: string;
  normalizedItemName?: string;
  standardMeasure?: StandardMeasure;

  // custom-count entry
  customLabel?: string;
  normalizedCustomLabel?: string;

  definitionId: string;

  // immutable-ish snapshot used for this entry's historical calculation
  caloriesPerBaseUnitSnapshot: number;
  calculatedCalories: number;

  createdAt: string;
  updatedAt: string;
}
```

## 3. Measured definition

```ts
interface MeasuredDefinition {
  id: string;
  kind: "measured";
  itemName: string;
  normalizedItemName: string;
  measure: "gram" | "deciliter";
  caloriesPerBaseUnit: number;
  createdAt: string;
  updatedAt: string;
}
```

Uniqueness:
`normalizedItemName + measure`

Examples:
- `tran + gram -> 9`
- `melk + deciliter -> 46`

A gram definition is never used for dl and vice versa.

## 4. Custom/count definition

```ts
interface CustomCountDefinition {
  id: string;
  kind: "custom-count";
  canonicalLabel: string;
  normalizedCanonicalLabel: string;
  aliases: string[];
  normalizedAliases: string[];
  caloriesPerUnit: number;
  createdAt: string;
  updatedAt: string;
}
```

Examples:
- canonical `kjeks`, aliases optionally `kjeksene` etc.
- canonical `flaske`, alias `flasker`
- canonical `scoop`, alias `scoops`
- canonical `kartong`, alias `kartonger`
- canonical `elefant`, alias `elefanter`

### Matching rule

Custom units match only:
- canonical normalized label; or
- an explicitly stored normalized alias.

Do not use fuzzy matching.

The implementation may offer a conservative UI convenience for adding common singular/plural aliases, but it must make aliases inspectable/editable and must not silently merge two existing definitions.

## 5. Parsing

Parsing is deterministic.

### Normalization

- trim outside whitespace;
- collapse repeated internal spaces for matching;
- case-insensitive matching;
- accept decimal `.` and `,`;
- preserve original `rawText`;
- do not use fuzzy food-name matching.

### Measured grammar

If the first token is a positive number and the next token is a recognized standard measurement alias:

`<quantity> <measure alias> <item name>`

Examples:
- `15 g tran`
- `15 gram tran`
- `1,5 dl melk`

Aliases:

```ts
gram = ["g", "gram", "grammer"]
deciliter = ["dl", "desiliter", "desilitre", "deciliter", "decilitre"]
```

Everything after the measurement alias is the item name.

### Custom/count grammar

Otherwise:

`<quantity> <custom label>`

Everything after the quantity is the custom label.

Examples:
- `1 kjeks`
- `3 scoops`
- `2 skiver`
- `3 flasker`
- `2 kartonger`
- `1 stor proteinbar`

This permits multi-word custom labels.

## 6. Ambiguity

If a normalized input could match more than one custom definition because of malformed/duplicate aliases:
- do not choose silently;
- surface a repair/selection flow;
- prevent creation of duplicate aliases where practical.

## 7. Calculations

Measured:
`quantity × caloriesPerBaseUnit`

Custom:
`quantity × caloriesPerUnit`

Keep full numeric precision internally.

Round to nearest whole kcal for ordinary UI display unless Codex documents a better consistent presentation choice.

## 8. Validation

Reject:
- missing quantity;
- quantity <= 0;
- missing item/label;
- NaN/infinity;
- negative calorie definitions;
- malformed numeric text.

Zero-calorie definitions are valid.

## 9. Historical snapshots

Every entry stores the rate used at creation/edit time.

Changing a saved definition later:
- affects future entries;
- does not mutate existing entries automatically.

If a historical entry is deliberately edited/recalculated, update its snapshot.

## 10. Persistence

Use schema-versioned local storage.

Migrations should preserve user data by default.

When completed-day retention removes a day, delete its child entries in the same consistency boundary/transaction.

Do not delete calorie definitions merely because old day logs are removed.
