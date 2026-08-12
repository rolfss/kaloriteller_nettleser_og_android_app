import type { ParsedInput, StandardMeasure } from './models'
import { displayLabel, DomainError, normalizeLabel, parseLocalizedNumber } from './normalize'

const measureAliases = new Map<string, StandardMeasure>([
  ['g', 'gram'],
  ['gram', 'gram'],
  ['grammer', 'gram'],
  ['dl', 'deciliter'],
  ['desiliter', 'deciliter'],
  ['desilitre', 'deciliter'],
  ['deciliter', 'deciliter'],
  ['decilitre', 'deciliter'],
])

export function parseEntryInput(rawValue: string): ParsedInput {
  const rawText = rawValue.trim().replace(/\s+/g, ' ')
  if (!rawText) throw new DomainError('Skriv inn mengde og matvare eller enhet.')

  const tokens = rawText.split(' ')
  const quantityToken = tokens[0] ?? ''
  const quantity = parseLocalizedNumber(quantityToken)
  if (quantity === null || quantity <= 0) {
    throw new DomainError('Mengden må være et tall større enn 0.')
  }

  const secondToken = tokens[1]
  if (!secondToken) throw new DomainError('Legg til matvare eller enhet etter mengden.')

  const measure = measureAliases.get(normalizeLabel(secondToken))
  if (measure) {
    const itemName = displayLabel(tokens.slice(2).join(' '))
    if (!itemName) throw new DomainError('Legg til en matvare etter måleenheten.')
    return {
      kind: 'measured',
      rawText,
      quantity,
      itemName,
      normalizedItemName: normalizeLabel(itemName),
      measure,
    }
  }

  const customLabel = displayLabel(tokens.slice(1).join(' '))
  if (!customLabel) throw new DomainError('Legg til en enhet etter mengden.')
  return {
    kind: 'custom-count',
    rawText,
    quantity,
    customLabel,
    normalizedCustomLabel: normalizeLabel(customLabel),
  }
}
