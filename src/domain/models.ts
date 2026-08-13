export type StandardMeasure = 'gram' | 'deciliter'
export type DayStatus = 'active' | 'completed'

export interface Day {
  id: string
  logDate: string
  status: DayStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface MeasuredDefinition {
  id: string
  kind: 'measured'
  itemName: string
  normalizedItemName: string
  measure: StandardMeasure
  caloriesPerBaseUnit: number
  createdAt: string
  updatedAt: string
}

export interface CustomCountDefinition {
  id: string
  kind: 'custom-count'
  canonicalLabel: string
  normalizedCanonicalLabel: string
  aliases: string[]
  normalizedAliases: string[]
  caloriesPerUnit: number
  createdAt: string
  updatedAt: string
}

export type CalorieDefinition = MeasuredDefinition | CustomCountDefinition

interface EntryBase {
  id: string
  dayId: string
  rawText: string
  quantity: number
  definitionId: string
  caloriesPerBaseUnitSnapshot: number
  calculatedCalories: number
  createdAt: string
  updatedAt: string
}

export interface MeasuredEntry extends EntryBase {
  kind: 'measured'
  itemName: string
  normalizedItemName: string
  standardMeasure: StandardMeasure
}

export interface CustomCountEntry extends EntryBase {
  kind: 'custom-count'
  customLabel: string
  normalizedCustomLabel: string
}

export type Entry = MeasuredEntry | CustomCountEntry

export interface ParsedMeasuredInput {
  kind: 'measured'
  rawText: string
  quantity: number
  itemName: string
  normalizedItemName: string
  measure: StandardMeasure
}

export interface ParsedCustomInput {
  kind: 'custom-count'
  rawText: string
  quantity: number
  customLabel: string
  normalizedCustomLabel: string
}

export type ParsedInput = ParsedMeasuredInput | ParsedCustomInput

export interface DaySummary {
  day: Day
  entries: Entry[]
  totalCalories: number
}

export type DefinitionBasis = StandardMeasure | 'custom-count'

export interface DefinitionDraft {
  basis: DefinitionBasis
  name: string
  caloriesPerUnit: number
  aliases: string[]
}

export interface PendingEntry {
  parsed: ParsedInput
  existingEntryId?: string
}
