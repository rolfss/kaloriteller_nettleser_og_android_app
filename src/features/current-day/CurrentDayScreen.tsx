import { useState, type FormEvent } from 'react'
import { formatCalories, formatLogDate, isEarlierLocalDay, localDateString } from '../../domain/dates'
import type { DaySummary, Entry } from '../../domain/models'
import { EntryList } from '../../components/EntryList'
import { Modal } from '../../components/Modal'

interface CurrentDayScreenProps {
  active: DaySummary | null
  error: string
  busy: boolean
  draft: string
  retentionDay: DaySummary | null
  exporting: boolean
  onAdd: (rawText: string) => Promise<boolean>
  onDraftChange: (value: string) => void
  onSelectEntry: (entry: Entry) => void
  onHistory: () => void
  onDefinitions: () => void
  onData: () => void
  onExportHistory: () => Promise<void>
  onComplete: () => Promise<void>
}

export function CurrentDayScreen({
  active, error, busy, draft, retentionDay, exporting, onAdd, onDraftChange,
  onSelectEntry, onHistory, onDefinitions, onData, onExportHistory, onComplete,
}: CurrentDayScreenProps) {
  const [confirmCompletion, setConfirmCompletion] = useState(false)
  const logDate = active?.day.logDate ?? localDateString()

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
          <button type="button" className="text-button" onClick={onData}>Data</button>
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

      <EntryComposer
        error={error}
        busy={busy}
        value={draft}
        onChange={onDraftChange}
        onAdd={onAdd}
      />
      {confirmCompletion && (
        <Modal title="Avslutte dagen?" onClose={() => setConfirmCompletion(false)} labelledBy="complete-day-title">
          <p>Alle innlegg beholdes, og dagen flyttes til historikken.</p>
          {retentionDay && (
            <div className="retention-warning" role="alert">
              <strong>Historikken er full.</strong>
              <p>Når du avslutter dagen, fjernes {formatLogDate(retentionDay.day.logDate, { day: 'numeric', month: 'long', year: 'numeric' })} og tilhørende innlegg.</p>
              <button type="button" className="button button--secondary" disabled={exporting} onClick={() => { void onExportHistory() }}>
                {exporting ? 'Klargjør PDF…' : 'Eksporter historikken først'}
              </button>
            </div>
          )}
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

function EntryComposer({
  error, busy, value, onChange, onAdd,
}: {
  error: string
  busy: boolean
  value: string
  onChange: (value: string) => void
  onAdd: (rawText: string) => Promise<boolean>
}) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (await onAdd(value)) onChange('')
  }

  return (
    <form className="composer" onSubmit={(event) => { void submit(event) }}>
        <label htmlFor="food-entry" className="sr-only">Hva spiste du?</label>
        <div className="composer__row">
          <input
            id="food-entry"
            name="entry"
            placeholder="Hva spiste du?"
            autoComplete="off"
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={error ? 'composer-error' : undefined}
          />
          <button className="button composer__submit" type="submit" disabled={busy} aria-label="Legg til innlegg">
            {busy ? '…' : 'Legg til'}
          </button>
        </div>
        {error && <p id="composer-error" className="form-error" role="alert">{error}</p>}
        <div className="composer__examples" aria-label="Eksempler som fyller inn feltet">
          <span>Prøv:</span>
          {['15 g tran', '1,5 dl melk', '2 kjeks'].map((example) => (
            <button key={example} type="button" onClick={() => onChange(example)}>{example}</button>
          ))}
        </div>
    </form>
  )
}
