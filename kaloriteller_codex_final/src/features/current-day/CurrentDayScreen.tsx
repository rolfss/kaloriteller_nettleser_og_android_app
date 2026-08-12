import { useState, type FormEvent } from 'react'
import { formatCalories, formatLogDate, isEarlierLocalDay, localDateString } from '../../domain/dates'
import type { DaySummary, Entry } from '../../domain/models'
import { EntryList } from '../../components/EntryList'
import { Modal } from '../../components/Modal'

interface CurrentDayScreenProps {
  active: DaySummary | null
  error: string
  busy: boolean
  onAdd: (rawText: string) => Promise<boolean>
  onSelectEntry: (entry: Entry) => void
  onHistory: () => void
  onDefinitions: () => void
  onComplete: () => Promise<void>
}

export function CurrentDayScreen({
  active, error, busy, onAdd, onSelectEntry, onHistory, onDefinitions, onComplete,
}: CurrentDayScreenProps) {
  const [rawText, setRawText] = useState('')
  const [confirmCompletion, setConfirmCompletion] = useState(false)
  const logDate = active?.day.logDate ?? localDateString()
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (await onAdd(rawText)) setRawText('')
  }

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <p className="eyebrow">{formatLogDate(logDate)}</p>
          <div className="total" aria-label={`${formatCalories(active?.totalCalories ?? 0)} kilokalorier totalt`}>
            <strong>{formatCalories(active?.totalCalories ?? 0)}</strong>
            <span>kcal</span>
          </div>
        </div>
        <nav className="topbar__actions" aria-label="Hovednavigasjon">
          <button type="button" className="text-button" onClick={onDefinitions}>Definisjoner</button>
          <button type="button" className="button button--secondary button--compact" onClick={onHistory}>Historikk</button>
        </nav>
      </header>

      {active && isEarlierLocalDay(active.day.logDate) && (
        <p className="day-warning" role="status">Denne dagen er fortsatt åpen fra {formatLogDate(active.day.logDate, { day: 'numeric', month: 'numeric' })}.</p>
      )}

      <section className="entries-section" aria-labelledby="entries-heading">
        <div className="section-heading">
          <h1 id="entries-heading">Dagens innlegg</h1>
          {active && (
            <button
              type="button"
              className="text-button text-button--danger"
              onClick={() => setConfirmCompletion(true)}
              disabled={busy}
            >Avslutt dag</button>
          )}
        </div>
        <EntryList entries={active?.entries ?? []} onSelect={onSelectEntry} emptyText="Dagen er tom. Legg til det første du spiste." />
      </section>

      <form className="composer" onSubmit={(event) => { void submit(event) }}>
        <label htmlFor="food-entry" className="sr-only">Hva spiste du?</label>
        <div className="composer__row">
          <input
            id="food-entry"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Hva spiste du?"
            autoComplete="off"
            aria-describedby={error ? 'composer-error' : undefined}
          />
          <button className="button composer__submit" type="submit" disabled={busy || !rawText.trim()} aria-label="Legg til innlegg">
            {busy ? '…' : 'Legg til'}
          </button>
        </div>
        {error && <p id="composer-error" className="form-error" role="alert">{error}</p>}
        <p className="composer__hint">Eksempel: 15 g tran, 1,5 dl melk eller 2 kjeks</p>
      </form>
      {confirmCompletion && (
        <Modal title="Avslutte dagen?" onClose={() => setConfirmCompletion(false)} labelledBy="complete-day-title">
          <p>Alle innlegg beholdes, og dagen flyttes til historikken.</p>
          <div className="modal__actions">
            <button type="button" className="button button--secondary" onClick={() => setConfirmCompletion(false)}>Avbryt</button>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => { setConfirmCompletion(false); void onComplete() }}
            >{busy ? 'Avslutter…' : 'Avslutt dag'}</button>
          </div>
        </Modal>
      )}
    </main>
  )
}
