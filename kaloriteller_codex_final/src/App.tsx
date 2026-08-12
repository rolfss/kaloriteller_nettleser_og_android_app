import { useCallback, useEffect, useMemo, useState } from 'react'
import { calorieService, type AppSnapshot } from './application/calorieService'
import { DefinitionDialog } from './components/DefinitionDialog'
import { EntryDialog } from './components/EntryDialog'
import type { DefinitionDraft, Entry, PendingEntry } from './domain/models'
import { CurrentDayScreen } from './features/current-day/CurrentDayScreen'
import { DefinitionsScreen } from './features/definitions/DefinitionsScreen'
import { DayDetailScreen } from './features/history/DayDetailScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { savePdf } from './platform/savePdf'

type View = { name: 'current' | 'history' | 'definitions' } | { name: 'day'; dayId: string }

const emptySnapshot: AppSnapshot = { active: null, history: [], definitions: [] }

export default function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>({ name: 'current' })
  const [pending, setPending] = useState<PendingEntry | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await calorieService.snapshot())
      setFatalError('')
    } catch (error) {
      setFatalError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void calorieService.snapshot()
      .then((data) => {
        if (!cancelled) { setSnapshot(data); setFatalError('') }
      })
      .catch((error: unknown) => {
        if (!cancelled) setFatalError(errorMessage(error))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const selectedDay = useMemo(
    () => view.name === 'day' ? snapshot.history.find((item) => item.day.id === view.dayId) : undefined,
    [snapshot.history, view],
  )

  const addEntry = async (rawText: string): Promise<boolean> => {
    setBusy(true); setFormError('')
    try {
      const result = await calorieService.addEntry(rawText)
      if (result.status === 'needs-definition') {
        setPending(result.pending)
        return false
      }
      await refresh()
      return true
    } catch (error) {
      setFormError(errorMessage(error))
      return false
    } finally { setBusy(false) }
  }

  const resolvePending = async (draft: DefinitionDraft) => {
    if (!pending) return
    setBusy(true); setFormError('')
    try {
      await calorieService.resolvePending(pending, draft)
      setPending(null)
      await refresh()
      setNotice('Definisjonen er lagret, og innlegget er lagt til.')
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const editEntry = async (rawText: string) => {
    if (!editing) return
    setBusy(true); setFormError('')
    try {
      const result = await calorieService.editEntry(editing.id, rawText)
      setEditing(null)
      if (result.status === 'needs-definition') setPending(result.pending)
      else { await refresh(); setNotice('Innlegget er oppdatert.') }
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const deleteEntry = async () => {
    if (!editing) return
    setBusy(true)
    try {
      await calorieService.deleteEntry(editing.id)
      setEditing(null)
      await refresh()
      setNotice('Innlegget er slettet.')
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const completeDay = async () => {
    setBusy(true); setFormError('')
    try {
      await calorieService.completeActiveDay()
      await refresh()
      setNotice('Dagen er avsluttet og lagt i historikken.')
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const exportDays = async (days: AppSnapshot['history'], filename: string) => {
    if (days.length === 0) return
    setExporting(true)
    try {
      const { buildPdfBytes } = await import('./application/pdf')
      const result = await savePdf(buildPdfBytes(days), filename)
      if (result === 'saved') setNotice('PDF-en er klar.')
    } catch (error) { setFatalError(`PDF-en kunne ikke eksporteres. ${errorMessage(error)}`) } finally { setExporting(false) }
  }

  if (loading) return <main className="loading-state"><div className="spinner" /><p>Åpner den lokale kaloriloggen…</p></main>

  return (
    <div className="app-shell">
      {fatalError && <div className="global-error" role="alert"><span>{fatalError}</span><button type="button" onClick={() => { setFatalError(''); void refresh() }}>Prøv igjen</button></div>}
      {view.name === 'current' && (
        <CurrentDayScreen
          active={snapshot.active}
          error={formError}
          busy={busy}
          onAdd={addEntry}
          onSelectEntry={(entry) => { setFormError(''); setEditing(entry) }}
          onHistory={() => { setFormError(''); setView({ name: 'history' }) }}
          onDefinitions={() => { setFormError(''); setView({ name: 'definitions' }) }}
          onComplete={completeDay}
        />
      )}
      {view.name === 'history' && (
        <HistoryScreen
          history={snapshot.history}
          exporting={exporting}
          onBack={() => setView({ name: 'current' })}
          onOpen={(dayId) => setView({ name: 'day', dayId })}
          onExportAll={() => exportDays(snapshot.history, 'kaloriteller-7-dager.pdf')}
        />
      )}
      {view.name === 'day' && selectedDay && (
        <DayDetailScreen
          summary={selectedDay}
          exporting={exporting}
          onBack={() => setView({ name: 'history' })}
          onSelectEntry={(entry) => { setFormError(''); setEditing(entry) }}
          onExport={() => exportDays([selectedDay], `kaloriteller-${selectedDay.day.logDate}.pdf`)}
        />
      )}
      {view.name === 'definitions' && (
        <DefinitionsScreen
          definitions={snapshot.definitions}
          onBack={() => setView({ name: 'current' })}
          onUpdate={async (id, draft) => { await calorieService.updateDefinition(id, draft); await refresh(); setNotice('Definisjonen er oppdatert.') }}
          onDelete={async (id) => { await calorieService.deleteDefinition(id); await refresh(); setNotice('Definisjonen er slettet.') }}
        />
      )}
      {pending && (
        <DefinitionDialog
          pending={pending}
          busy={busy}
          error={formError}
          onCancel={() => { setPending(null); setFormError('') }}
          onSave={resolvePending}
        />
      )}
      {editing && (
        <EntryDialog
          entry={editing}
          busy={busy}
          error={formError}
          onClose={() => { setEditing(null); setFormError('') }}
          onSave={editEntry}
          onDelete={deleteEntry}
        />
      )}
      <div className="toast" aria-live="polite" aria-atomic="true">{notice}</div>
    </div>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Noe gikk galt. Dataene dine er ikke endret.'
}
