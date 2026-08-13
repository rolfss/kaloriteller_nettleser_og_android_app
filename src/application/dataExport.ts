import type { CalorieDefinition, Day, DaySummary, Entry } from '../domain/models'
import { normalizeLabel } from '../domain/normalize'
import { isDay, isDefinition, isEntry } from '../domain/validation'

export const BACKUP_FORMAT = 'kaloriteller-backup'
export const BACKUP_VERSION = 1

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  days: Day[]
  entries: Entry[]
  definitions: CalorieDefinition[]
}

export function makeBackup(
  days: Day[],
  entries: Entry[],
  definitions: CalorieDefinition[],
  exportedAt = new Date().toISOString(),
): BackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    days,
    entries,
    definitions,
  }
}

export function parseBackupText(text: string): BackupEnvelope {
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch {
    throw new Error('Filen er ikke gyldig JSON.')
  }
  if (!isBackupEnvelope(value)) {
    throw new Error('Filen er ikke en gyldig Kaloriteller-sikkerhetskopi.')
  }
  return value
}

export function isBackupEnvelope(value: unknown): value is BackupEnvelope {
  if (!isRecord(value)) return false
  if (
    value.format !== BACKUP_FORMAT || value.version !== BACKUP_VERSION ||
    typeof value.exportedAt !== 'string' || !isIsoDate(value.exportedAt) ||
    !Array.isArray(value.days) || !value.days.every(isDay) ||
    !Array.isArray(value.entries) || !value.entries.every(isEntry) ||
    !Array.isArray(value.definitions) || !value.definitions.every(isDefinition)
  ) return false

  const days = value.days
  const entries = value.entries
  const definitions = value.definitions
  if (!hasUniqueIds(days) || !hasUniqueIds(entries) || !hasUniqueIds(definitions)) return false
  if (days.filter((day) => day.status === 'active').length > 1) return false
  if (days.filter((day) => day.status === 'completed').length > 7) return false
  if (!definitionsAreConsistent(definitions)) return false
  const dayIds = new Set(days.map((day) => day.id))
  if (entries.some((entry) => !dayIds.has(entry.dayId))) return false
  return entries.every((entry) => approximatelyEqual(
    entry.calculatedCalories,
    entry.quantity * entry.caloriesPerBaseUnitSnapshot,
  ))
}

function definitionsAreConsistent(definitions: CalorieDefinition[]): boolean {
  const measuredKeys = new Set<string>()
  const customLabels = new Set<string>()
  for (const definition of definitions) {
    if (definition.kind === 'measured') {
      if (definition.normalizedItemName !== normalizeLabel(definition.itemName)) return false
      const key = `${definition.measure}:${definition.normalizedItemName}`
      if (measuredKeys.has(key)) return false
      measuredKeys.add(key)
      continue
    }
    if (definition.normalizedCanonicalLabel !== normalizeLabel(definition.canonicalLabel)) return false
    if (definition.normalizedAliases.length !== definition.aliases.length) return false
    const labels = [definition.normalizedCanonicalLabel]
    for (let index = 0; index < definition.aliases.length; index += 1) {
      const normalizedAlias = definition.normalizedAliases[index]
      if (typeof normalizedAlias !== 'string' || normalizedAlias !== normalizeLabel(definition.aliases[index] ?? '')) return false
      labels.push(normalizedAlias)
    }
    for (const label of labels) {
      if (customLabels.has(label)) return false
      customLabels.add(label)
    }
  }
  return true
}

export function buildCsv(days: DaySummary[]): string {
  const rows = [
    ['Dato', 'Status', 'Innlegg', 'Mengde', 'Kalorier'],
    ...days.flatMap((summary) => summary.entries.map((entry) => [
      summary.day.logDate,
      summary.day.status === 'active' ? 'Aktiv' : 'Avsluttet',
      entry.rawText,
      formatCsvNumber(entry.quantity),
      formatCsvNumber(entry.calculatedCalories),
    ])),
  ]
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`
}

function csvCell(value: string): string {
  const safeValue = /^[=+@]/.test(value) || /^-\D/.test(value) ? `'${value}` : value
  return `"${safeValue.replaceAll('"', '""')}"`
}

function formatCsvNumber(value: number): string {
  return String(value).replace('.', ',')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value))
}

function hasUniqueIds(values: { id: string }[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length
}

function approximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right)) * 8
}
