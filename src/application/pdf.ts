import { jsPDF } from 'jspdf'
import { formatCalories, formatLogDate } from '../domain/dates'
import type { DaySummary } from '../domain/models'

export interface PdfDayData {
  date: string
  total: string
  entries: { rawText: string; calories: string }[]
}

export function buildPdfData(days: DaySummary[]): PdfDayData[] {
  return days.map(({ day, entries, totalCalories }) => ({
    date: formatLogDate(day.logDate, { day: 'numeric', month: 'long', year: 'numeric' }),
    total: `${formatCalories(totalCalories)} kcal`,
    entries: entries.map((entry) => ({
      rawText: entry.rawText,
      calories: `${formatCalories(entry.calculatedCalories)} kcal`,
    })),
  }))
}

export function buildPdfBytes(days: DaySummary[]): Uint8Array {
  const data = buildPdfData(days)
  const document = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 18
  let y = 20

  document.setProperties({ title: 'Kaloriteller', subject: 'Lokalt eksportert kalorihistorikk' })
  document.setFont('helvetica', 'bold')
  document.setFontSize(18)
  document.text('Kaloriteller', margin, y)
  y += 12

  for (const [dayIndex, day] of data.entries()) {
    const requiredHeight = 32 + Math.max(day.entries.length, 1) * 8
    if (y + requiredHeight > pageHeight - margin) {
      document.addPage()
      y = 20
    }
    document.setFont('helvetica', 'bold')
    document.setFontSize(13)
    document.text(day.date, margin, y)
    y += 7
    document.setFontSize(10)
    document.text('Kalorier konsumert', margin, y)
    document.text(day.total, pageWidth - margin, y, { align: 'right' })
    y += 8
    document.setDrawColor(205, 205, 198)
    document.line(margin, y - 3, pageWidth - margin, y - 3)
    document.setFont('helvetica', 'normal')
    if (day.entries.length === 0) {
      document.text('Ingen registrerte innlegg', margin, y + 2)
      y += 9
    } else {
      for (const entry of day.entries) {
        const wrapped = document.splitTextToSize(entry.rawText, pageWidth - margin * 2 - 32) as string[]
        if (y + wrapped.length * 5 > pageHeight - margin) {
          document.addPage()
          y = 20
        }
        document.text(wrapped, margin, y)
        document.text(entry.calories, pageWidth - margin, y, { align: 'right' })
        y += Math.max(7, wrapped.length * 5 + 2)
      }
    }
    if (dayIndex < data.length - 1) y += 8
  }
  return new Uint8Array(document.output('arraybuffer'))
}
