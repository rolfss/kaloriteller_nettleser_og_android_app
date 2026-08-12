import { describe, expect, it } from 'vitest'
import { isEarlierLocalDay, localDateString } from './dates'

describe('local day rules', () => {
  it('uses local date components rather than UTC slicing', () => {
    const local = new Date(2026, 7, 12, 0, 15)
    expect(localDateString(local)).toBe('2026-08-12')
  })

  it('identifies an old open day without changing it', () => {
    expect(isEarlierLocalDay('2026-08-11', new Date(2026, 7, 12, 8))).toBe(true)
    expect(isEarlierLocalDay('2026-08-12', new Date(2026, 7, 12, 8))).toBe(false)
  })
})
