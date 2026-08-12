import { describe, expect, it } from 'vitest'
import type { CalorieDefinition, Day, Entry } from './models'
import { completedDaysToRemove, dayTotal, matchDefinition } from './rules'
import { parseEntryInput } from './parser'

const timestamp = '2026-08-12T08:00:00.000Z'
const definitions: CalorieDefinition[] = [
  {
    id: 'milk-dl', kind: 'measured', itemName: 'melk', normalizedItemName: 'melk',
    measure: 'deciliter', caloriesPerBaseUnit: 46, createdAt: timestamp, updatedAt: timestamp,
  },
  {
    id: 'bottle', kind: 'custom-count', canonicalLabel: 'flaske',
    normalizedCanonicalLabel: 'flaske', aliases: ['flasker'], normalizedAliases: ['flasker'],
    caloriesPerUnit: 150, createdAt: timestamp, updatedAt: timestamp,
  },
]

describe('domain rules', () => {
  it('matches exact measured definitions without gram/dl conversion', () => {
    expect(matchDefinition(parseEntryInput('1,5 dl melk'), definitions).status).toBe('matched')
    expect(matchDefinition(parseEntryInput('200 g melk'), definitions).status).toBe('missing')
  })

  it('matches only explicit custom canonical names and aliases', () => {
    expect(matchDefinition(parseEntryInput('3 flasker'), definitions).status).toBe('matched')
    expect(matchDefinition(parseEntryInput('3 flaskene'), definitions).status).toBe('missing')
  })

  it('derives totals from exact entry values', () => {
    const entries = [12.4, 7.6, 10].map((calories, index) => ({ calculatedCalories: calories, id: `${index}` }))
    expect(dayTotal(entries as Entry[])).toBe(30)
  })

  it('selects only completed days beyond the newest seven', () => {
    const days: Day[] = Array.from({ length: 8 }, (_, index) => ({
      id: `${index + 1}`,
      logDate: `2026-08-${String(index + 1).padStart(2, '0')}`,
      status: 'completed',
      createdAt: timestamp,
      updatedAt: `2026-08-${String(index + 1).padStart(2, '0')}T20:00:00.000Z`,
      completedAt: `2026-08-${String(index + 1).padStart(2, '0')}T20:00:00.000Z`,
    }))
    expect(completedDaysToRemove(days).map((day) => day.id)).toEqual(['1'])
  })
})
