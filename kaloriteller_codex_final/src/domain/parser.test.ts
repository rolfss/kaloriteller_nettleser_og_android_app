import { describe, expect, it } from 'vitest'
import { parseEntryInput } from './parser'
import { normalizeLabel, parseLocalizedNumber } from './normalize'

describe('entry parser', () => {
  it('parses gram aliases and preserves clean raw input', () => {
    expect(parseEntryInput('  15   g   Tran  ')).toEqual({
      kind: 'measured',
      rawText: '15 g Tran',
      quantity: 15,
      itemName: 'Tran',
      normalizedItemName: 'tran',
      measure: 'gram',
    })
    expect(parseEntryInput('10 gram tran')).toMatchObject({ kind: 'measured', measure: 'gram' })
  })

  it('parses decimal comma and deciliter aliases', () => {
    expect(parseEntryInput('1,5 dl melk')).toMatchObject({
      kind: 'measured',
      quantity: 1.5,
      itemName: 'melk',
      measure: 'deciliter',
    })
  })

  it('allows arbitrary multi-word custom labels', () => {
    expect(parseEntryInput('2 stor proteinbar')).toEqual({
      kind: 'custom-count',
      rawText: '2 stor proteinbar',
      quantity: 2,
      customLabel: 'stor proteinbar',
      normalizedCustomLabel: 'stor proteinbar',
    })
    expect(parseEntryInput('3 elefanter')).toMatchObject({ kind: 'custom-count' })
  })

  it.each(['', 'tran', '0 g tran', '-5 g tran', '15 g', '1,2,3 dl melk'])(
    'rejects malformed input %j',
    (input) => expect(() => parseEntryInput(input)).toThrow(),
  )

  it('normalizes only case and whitespace and parses both decimal separators', () => {
    expect(normalizeLabel('  Stor   BAR ')).toBe('stor bar')
    expect(parseLocalizedNumber('1,25')).toBe(1.25)
    expect(parseLocalizedNumber('1.25')).toBe(1.25)
  })
})
