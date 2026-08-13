import type {
  CalorieDefinition,
  CustomCountDefinition,
  Day,
  Entry,
  ParsedInput,
} from './models'
import { DomainError } from './normalize'

export type DefinitionMatch =
  | { status: 'matched'; definition: CalorieDefinition }
  | { status: 'missing' }
  | { status: 'ambiguous'; definitions: CustomCountDefinition[] }

export function matchDefinition(
  parsed: ParsedInput,
  definitions: CalorieDefinition[],
): DefinitionMatch {
  if (parsed.kind === 'measured') {
    const definition = definitions.find(
      (candidate) =>
        candidate.kind === 'measured' &&
        candidate.normalizedItemName === parsed.normalizedItemName &&
        candidate.measure === parsed.measure,
    )
    return definition ? { status: 'matched', definition } : { status: 'missing' }
  }

  const matches = definitions.filter(
    (candidate): candidate is CustomCountDefinition =>
      candidate.kind === 'custom-count' &&
      (candidate.normalizedCanonicalLabel === parsed.normalizedCustomLabel ||
        candidate.normalizedAliases.includes(parsed.normalizedCustomLabel)),
  )
  if (matches.length === 0) return { status: 'missing' }
  if (matches.length > 1) return { status: 'ambiguous', definitions: matches }
  return { status: 'matched', definition: matches[0] as CustomCountDefinition }
}

export function calorieRate(definition: CalorieDefinition): number {
  return definition.kind === 'measured'
    ? definition.caloriesPerBaseUnit
    : definition.caloriesPerUnit
}

export function calculateCalories(quantity: number, rate: number): number {
  const result = quantity * rate
  if (!Number.isFinite(result)) throw new DomainError('Kaloriberegningen ble for stor.')
  return result
}

export function dayTotal(entries: Entry[]): number {
  return entries.reduce((total, entry) => total + entry.calculatedCalories, 0)
}

export function completedDaysToRemove(days: Day[], retain = 7): Day[] {
  return days
    .filter((day) => day.status === 'completed')
    .sort((left, right) =>
      (right.completedAt ?? right.updatedAt).localeCompare(left.completedAt ?? left.updatedAt),
    )
    .slice(retain)
}
