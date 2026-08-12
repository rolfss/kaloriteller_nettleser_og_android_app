export function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('nb-NO')
}

export function displayLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function parseLocalizedNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return null
  const number = Number(trimmed.replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

export function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new DomainError(`${label} må være større enn 0.`)
  }
}

export function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new DomainError(`${label} kan ikke være negativ.`)
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
