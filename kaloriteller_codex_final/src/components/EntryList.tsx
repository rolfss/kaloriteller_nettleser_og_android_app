import { formatCalories } from '../domain/dates'
import type { Entry } from '../domain/models'

interface EntryListProps {
  entries: Entry[]
  onSelect: (entry: Entry) => void
  emptyText?: string
}

export function EntryList({ entries, onSelect, emptyText = 'Ingen innlegg ennå.' }: EntryListProps) {
  if (entries.length === 0) return <p className="empty-state">{emptyText}</p>
  return (
    <ol className="entry-list" aria-label="Registrerte innlegg">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button type="button" className="entry-row" onClick={() => onSelect(entry)}>
            <span>{entry.rawText}</span>
            <strong>{formatCalories(entry.calculatedCalories)} kcal</strong>
          </button>
        </li>
      ))}
    </ol>
  )
}
