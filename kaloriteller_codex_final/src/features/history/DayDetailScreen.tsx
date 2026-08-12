import { EntryList } from '../../components/EntryList'
import { formatCalories, formatLogDate } from '../../domain/dates'
import type { DaySummary, Entry } from '../../domain/models'

interface DayDetailScreenProps {
  summary: DaySummary
  exporting: boolean
  onBack: () => void
  onSelectEntry: (entry: Entry) => void
  onExport: () => Promise<void>
}

export function DayDetailScreen({ summary, exporting, onBack, onSelectEntry, onExport }: DayDetailScreenProps) {
  return (
    <main className="screen">
      <header className="page-header">
        <button type="button" className="back-button" onClick={onBack} aria-label="Tilbake til historikk">←</button>
        <div><p className="eyebrow">Avsluttet dag</p><h1>{formatLogDate(summary.day.logDate, { day: 'numeric', month: 'long', year: 'numeric' })}</h1></div>
      </header>
      <section className="detail-total" aria-label="Kalorier konsumert">
        <span>Kalorier konsumert</span>
        <strong>{formatCalories(summary.totalCalories)} kcal</strong>
      </section>
      <button type="button" className="button button--secondary export-all" onClick={() => { void onExport() }} disabled={exporting}>
        {exporting ? 'Klargjør PDF…' : 'Eksporter PDF'}
      </button>
      <section className="entries-section" aria-labelledby="detail-entries-heading">
        <h2 id="detail-entries-heading">Innlegg</h2>
        <EntryList entries={summary.entries} onSelect={onSelectEntry} emptyText="Ingen innlegg på denne dagen." />
      </section>
    </main>
  )
}
