import { formatCalories, formatLogDate } from '../../domain/dates'
import type { DaySummary } from '../../domain/models'

interface HistoryScreenProps {
  history: DaySummary[]
  exporting: boolean
  onBack: () => void
  onOpen: (dayId: string) => void
  onExportAll: () => Promise<void>
}

export function HistoryScreen({ history, exporting, onBack, onOpen, onExportAll }: HistoryScreenProps) {
  return (
    <main className="screen">
      <header className="page-header">
        <button type="button" className="back-button" onClick={onBack} aria-label="Tilbake til dagens registrering">←</button>
        <div><p className="eyebrow">Siste sju avsluttede dager</p><h1>Historikk</h1></div>
      </header>
      <button
        type="button"
        className="button button--secondary export-all"
        onClick={() => { void onExportAll() }}
        disabled={history.length === 0 || exporting}
      >{exporting ? 'Klargjør PDF…' : 'Eksporter 7 dager'}</button>
      {history.length === 0 ? (
        <div className="empty-card"><h2>Ingen avsluttede dager</h2><p>En dag vises her etter at du velger «Avslutt dag».</p></div>
      ) : (
        <ol className="history-list">
          {history.map(({ day, totalCalories }) => (
            <li key={day.id}>
              <button type="button" className="history-row" onClick={() => onOpen(day.id)}>
                <span><strong>{formatLogDate(day.logDate, { day: 'numeric', month: 'long', year: 'numeric' })}</strong><small>Kalorier konsumert</small></span>
                <span className="history-row__total">{formatCalories(totalCalories)} kcal <span aria-hidden="true">›</span></span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
