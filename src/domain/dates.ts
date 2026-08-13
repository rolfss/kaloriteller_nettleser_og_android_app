export function localDateString(date = new Date()): string {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatLogDate(logDate: string, options?: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = logDate.split('-').map(Number)
  if (!year || !month || !day) return logDate
  return new Intl.DateTimeFormat('nb-NO', options ?? {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day))
}

export function isEarlierLocalDay(logDate: string, now = new Date()): boolean {
  return logDate < localDateString(now)
}

export function formatCalories(value: number): string {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(Math.round(value))
}
