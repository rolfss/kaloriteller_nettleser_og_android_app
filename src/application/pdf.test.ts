import { describe, expect, it } from 'vitest'
import type { DaySummary } from '../domain/models'
import { buildPdfBytes, buildPdfData } from './pdf'

const summary: DaySummary = {
  day: {
    id: 'day-1', logDate: '2026-08-12', status: 'completed',
    createdAt: '2026-08-12T08:00:00.000Z', updatedAt: '2026-08-12T20:00:00.000Z',
    completedAt: '2026-08-12T20:00:00.000Z',
  },
  entries: [{
    id: 'entry-1', dayId: 'day-1', rawText: '15 g tran', quantity: 15, kind: 'measured',
    itemName: 'tran', normalizedItemName: 'tran', standardMeasure: 'gram', definitionId: 'tran-g',
    caloriesPerBaseUnitSnapshot: 9, calculatedCalories: 135,
    createdAt: '2026-08-12T08:00:00.000Z', updatedAt: '2026-08-12T08:00:00.000Z',
  }],
  totalCalories: 135,
}

describe('PDF export', () => {
  it('constructs exact day and entry content before rendering', () => {
    expect(buildPdfData([summary])).toEqual([{
      date: '12. august 2026',
      total: '135 kcal',
      entries: [{ rawText: '15 g tran', calories: '135 kcal' }],
    }])
  })

  it('creates local PDF bytes', () => {
    const bytes = buildPdfBytes([summary])
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
})
