import { describe, expect, it } from 'vitest'
import type { DaySummary } from '../domain/models'
import { BACKUP_FORMAT, BACKUP_VERSION, buildCsv, makeBackup, parseBackupText } from './dataExport'

const summary: DaySummary = {
  day: {
    id: 'day-1',
    logDate: '2026-08-13',
    status: 'completed',
    createdAt: '2026-08-13T08:00:00.000Z',
    updatedAt: '2026-08-13T09:00:00.000Z',
    completedAt: '2026-08-13T09:00:00.000Z',
  },
  entries: [{
    id: 'entry-1',
    dayId: 'day-1',
    rawText: '=1+1 kjeks',
    quantity: 1.5,
    kind: 'custom-count',
    customLabel: 'kjeks',
    normalizedCustomLabel: 'kjeks',
    definitionId: 'definition-1',
    caloriesPerBaseUnitSnapshot: 56,
    calculatedCalories: 84,
    createdAt: '2026-08-13T08:00:00.000Z',
    updatedAt: '2026-08-13T08:00:00.000Z',
  }],
  totalCalories: 84,
}

describe('portable local data', () => {
  it('round-trips a versioned backup', () => {
    const backup = makeBackup([summary.day], summary.entries, [], '2026-08-13T10:00:00.000Z')
    expect(parseBackupText(JSON.stringify(backup))).toEqual(backup)
    expect(backup).toMatchObject({ format: BACKUP_FORMAT, version: BACKUP_VERSION })
  })

  it('rejects malformed or inconsistent backups', () => {
    expect(() => parseBackupText('not json')).toThrow(/gyldig JSON/)
    const backup = makeBackup([summary.day], [{ ...summary.entries[0]!, calculatedCalories: 999 }], [])
    expect(() => parseBackupText(JSON.stringify(backup))).toThrow(/gyldig Kaloriteller/)
  })

  it('builds Norwegian-friendly CSV and neutralizes spreadsheet formulas', () => {
    const csv = buildCsv([summary])
    expect(csv).toContain('"2026-08-13";"Avsluttet"')
    expect(csv).toContain('"\'=1+1 kjeks"')
    expect(csv).toContain('"1,5";"84"')
    expect(csv.startsWith('\uFEFF')).toBe(true)
  })
})
