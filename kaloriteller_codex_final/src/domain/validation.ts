import type { CalorieDefinition, Day, Entry } from './models'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isDay(value: unknown): value is Day {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.logDate === 'string' &&
    (value.status === 'active' || value.status === 'completed') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.completedAt === undefined || typeof value.completedAt === 'string')
  )
}

export function isEntry(value: unknown): value is Entry {
  if (!isRecord(value)) return false
  const common =
    typeof value.id === 'string' &&
    typeof value.dayId === 'string' &&
    typeof value.rawText === 'string' &&
    isFiniteNumber(value.quantity) && value.quantity > 0 &&
    typeof value.definitionId === 'string' &&
    isFiniteNumber(value.caloriesPerBaseUnitSnapshot) && value.caloriesPerBaseUnitSnapshot >= 0 &&
    isFiniteNumber(value.calculatedCalories) && value.calculatedCalories >= 0 &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  if (!common) return false
  if (value.kind === 'measured') {
    return typeof value.itemName === 'string' && typeof value.normalizedItemName === 'string' &&
      (value.standardMeasure === 'gram' || value.standardMeasure === 'deciliter')
  }
  return value.kind === 'custom-count' && typeof value.customLabel === 'string' &&
    typeof value.normalizedCustomLabel === 'string'
}

export function isDefinition(value: unknown): value is CalorieDefinition {
  if (!isRecord(value)) return false
  const common = typeof value.id === 'string' && typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  if (!common) return false
  if (value.kind === 'measured') {
    return typeof value.itemName === 'string' && typeof value.normalizedItemName === 'string' &&
      (value.measure === 'gram' || value.measure === 'deciliter') &&
      isFiniteNumber(value.caloriesPerBaseUnit) && value.caloriesPerBaseUnit >= 0
  }
  return value.kind === 'custom-count' && typeof value.canonicalLabel === 'string' &&
    typeof value.normalizedCanonicalLabel === 'string' && Array.isArray(value.aliases) &&
    value.aliases.every((alias) => typeof alias === 'string') && Array.isArray(value.normalizedAliases) &&
    value.normalizedAliases.every((alias) => typeof alias === 'string') &&
    isFiniteNumber(value.caloriesPerUnit) && value.caloriesPerUnit >= 0
}
