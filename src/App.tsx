import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppSnapshot } from './application/calorieService'
import { buildCsv, parseBackupText } from './application/dataExport'
import { DefinitionDialog } from './components/DefinitionDialog'
import { EntryDialog } from './components/EntryDialog'
import type { DefinitionDraft, Entry, PendingEntry } from './domain/models'
import { CurrentDayScreen } from './features/current-day/CurrentDayScreen'
import { DataScreen } from './features/data/DataScreen'
import { DefinitionsScreen } from './features/definitions/DefinitionsScreen'
import { DayDetailScreen } from './features/history/DayDetailScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { saveFile } from './platform/saveFile'
import { savePdf } from './platform/savePdf'
import { useAppInstall } from './platform/installApp'
import { createCalorieRuntime, type CalorieRuntime } from './persistence/runtime'

type View = { name: 'current' | 'history' | 'definitions' | 'data' } | { name: 'day'; dayId: string }

interface UndoAction {
  message: string
  run: () => Promise<void>
}

const emptySnapshot: AppSnapshot = { active: null, history: [], definitions: [] }
const demoRequested = new URLSearchParams(window.location.search).get('demo') === '1'

export default function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot)
  const [runtime, setRuntime] = useState<CalorieRuntime | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>({ name: 'current' })
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<PendingEntry | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [notice, setNotice] = useState('')
  const [undo, setUndo] = useState<UndoAction | null>(null)
  const appInstall = useAppInstall()

  const refresh = useCallback(async () => {
    if (!runtime) return
    try {
      setSnapshot(await runtime.service.snapshot())
      setFatalError('')
    } catch (error) {
      setFatalError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [runtime])

  useEffect(() => {
    let cancelled = false
    void createCalorieRuntime({ forceMemory: demoRequested })
      .then(async (nextRuntime) => {
        const data = await nextRuntime.service.snapshot()
        if (!cancelled) {
          setRuntime(nextRuntime)
          setSnapshot(data)
          setFatalError('')
        } else {
          nextRuntime.database.close()
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setFatalError(errorMessage(error))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!notice || undo) return
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice, undo])

  useEffect(() => {
    if (!undo) return
    const timeout = window.setTimeout(() => setUndo(null), 10_000)
    return () => window.clearTimeout(timeout)
  }, [undo])

  const selectedDay = useMemo(
    () => view.name === 'day' ? snapshot.history.find((item) => item.day.id === view.dayId) : undefined,
    [snapshot.history, view],
  )
  const allEntries = useMemo(
    () => [...(snapshot.active?.entries ?? []), ...snapshot.history.flatMap((day) => day.entries)],
    [snapshot],
  )
  const retentionDay = snapshot.active && snapshot.history.length >= 7
    ? snapshot.history.at(-1) ?? null
    : null

  const showNotice = (message: string) => {
    setUndo(null)
    setNotice(message)
  }

  const offerUndo = (message: string, run: () => Promise<void>) => {
    setNotice('')
    setUndo({ message, run })
  }

  const runUndo = async () => {
    if (!undo) return
    const action = undo
    setUndo(null)
    setBusy(true)
    try {
      await action.run()
      await refresh()
      showNotice('Handlingen er angret.')
    } catch (error) {
      setFatalError(`Kunne ikke angre. ${errorMessage(error)}`)
    } finally {
      setBusy(false)
    }
  }

  const addEntry = async (rawText: string): Promise<boolean> => {
    if (!runtime) return false
    setBusy(true); setFormError('')
    try {
      const result = await runtime.service.addEntry(rawText)
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

  const resolvePending = async (definitionDraft: DefinitionDraft) => {
    if (!pending || !runtime) return
    setBusy(true); setFormError('')
    try {
      const wasNewEntry = !pending.existingEntryId
      await runtime.service.resolvePending(pending, definitionDraft)
      setPending(null)
      if (wasNewEntry) setDraft('')
      await refresh()
      showNotice('Definisjonen er lagret, og innlegget er lagt til.')
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const editEntry = async (rawText: string) => {
    if (!editing || !runtime) return
    setBusy(true); setFormError('')
    try {
      const result = await runtime.service.editEntry(editing.id, rawText)
      setEditing(null)
      if (result.status === 'needs-definition') setPending(result.pending)
      else { await refresh(); showNotice('Innlegget er oppdatert.') }
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const deleteEntry = async () => {
    if (!editing || !runtime) return
    setBusy(true)
    try {
      const deleted = await runtime.service.deleteEntry(editing.id)
      setEditing(null)
      await refresh()
      if (deleted) offerUndo('Innlegget ble slettet.', () => runtime.service.restoreEntry(deleted))
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const completeDay = async () => {
    if (!runtime) return
    setBusy(true); setFormError('')
    try {
      await runtime.service.completeActiveDay()
      await refresh()
      showNotice('Dagen er avsluttet og lagt i historikken.')
    } catch (error) { setFormError(errorMessage(error)) } finally { setBusy(false) }
  }

  const exportDays = async (days: AppSnapshot['history'], filename: string) => {
    if (days.length === 0) return
    setExporting(true)
    try {
      const { buildPdfBytes } = await import('./application/pdf')
      const result = await savePdf(buildPdfBytes(days), filename)
      if (result === 'saved') showNotice('PDF-en er klar.')
    } catch (error) { setFatalError(`PDF-en kunne ikke eksporteres. ${errorMessage(error)}`) } finally { setExporting(false) }
  }

  const exportBackup = async () => {
    if (!runtime) return
    setBusy(true)
    try {
      const backup = await runtime.service.createBackup()
      const result = await saveFile(JSON.stringify(backup, null, 2), {
        filename: `kaloriteller-sikkerhetskopi-${localDate()}.json`,
        mimeType: 'application/json',
        extension: '.json',
        description: 'Kaloriteller-sikkerhetskopi',
        shareTitle: 'Kaloriteller sikkerhetskopi',
      })
      if (result === 'saved') showNotice('Sikkerhetskopien er klar.')
    } catch (error) { setFatalError(`Sikkerhetskopien kunne ikke eksporteres. ${errorMessage(error)}`) } finally { setBusy(false) }
  }

  const exportCsv = async () => {
    const days = snapshot.active ? [snapshot.active, ...snapshot.history] : snapshot.history
    if (days.length === 0) { showNotice('Det finnes ingen dager å eksportere.'); return }
    setBusy(true)
    try {
      const result = await saveFile(buildCsv(days), {
        filename: `kaloriteller-${localDate()}.csv`,
        mimeType: 'text/csv',
        extension: '.csv',
        description: 'CSV-regneark',
        shareTitle: 'Kaloriteller CSV',
      })
      if (result === 'saved') showNotice('CSV-filen er klar.')
    } catch (error) { setFatalError(`CSV-filen kunne ikke eksporteres. ${errorMessage(error)}`) } finally { setBusy(false) }
  }

  const importBackup = async (text: string) => {
    if (!runtime) return
    setBusy(true)
    try {
      const backup = parseBackupText(text)
      await runtime.service.replaceFromBackup(backup)
      setUndo(null); setDraft(''); setView({ name: 'current' })
      await refresh()
      showNotice('Sikkerhetskopien er importert.')
    } finally {
      setBusy(false)
    }
  }

  const clearAll = async () => {
    if (!runtime) return
    setBusy(true)
    try {
      await runtime.service.clearAll()
      setUndo(null); setDraft(''); setView({ name: 'current' })
      await refresh()
      showNotice('Alle lokale data er slettet.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="loading-state"><div className="spinner" /><p>Åpner den lokale kaloriloggen…</p></main>

  if (!runtime) {
    return (
      <main className="loading-state">
        <p role="alert">{fatalError || 'Kaloriloggen kunne ikke startes.'}</p>
        <button type="button" className="button" onClick={() => window.location.reload()}>Prøv igjen</button>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <StorageNotice mode={runtime.storageMode} />
      {fatalError && <div className="global-error" role="alert"><span>{fatalError}</span><button type="button" onClick={() => { setFatalError(''); void refresh() }}>Prøv igjen</button></div>}
      {view.name === 'current' && (
        <CurrentDayScreen
          active={snapshot.active}
          error={formError}
          busy={busy}
          draft={draft}
          retentionDay={retentionDay}
          exporting={exporting}
          onAdd={addEntry}
          onDraftChange={setDraft}
          onSelectEntry={(entry) => { setFormError(''); setEditing(entry) }}
          onHistory={() => { setFormError(''); setView({ name: 'history' }) }}
          onDefinitions={() => { setFormError(''); setView({ name: 'definitions' }) }}
          onInstall={() => { setFormError(''); setView({ name: 'data' }) }}
          onData={() => { setFormError(''); setView({ name: 'data' }) }}
          onExportHistory={() => exportDays(snapshot.history, 'kaloriteller-7-dager.pdf')}
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
          entries={allEntries}
          onBack={() => setView({ name: 'current' })}
          onUpdate={async (id, definitionDraft) => { await runtime.service.updateDefinition(id, definitionDraft); await refresh(); showNotice('Definisjonen er oppdatert.') }}
          onDelete={async (id) => {
            const deleted = await runtime.service.deleteDefinition(id)
            await refresh()
            if (deleted) offerUndo('Definisjonen ble slettet.', () => runtime.service.restoreDefinition(deleted))
          }}
          onMerge={async (sourceId, targetId) => {
            await runtime.service.mergeCustomDefinitions(sourceId, targetId)
            await refresh()
            showNotice('Definisjonene er slått sammen. Historiske innlegg er uendret.')
          }}
        />
      )}
      {view.name === 'data' && (
        <DataScreen
          storageMode={runtime.storageMode}
          busy={busy}
          installStatus={appInstall.status}
          onInstall={async () => {
            const result = await appInstall.requestInstall()
            if (result === 'accepted') showNotice('Kaloriteller installeres på enheten.')
            else if (result === 'dismissed') showNotice('Installasjonen ble avbrutt.')
            else showNotice('Bruk Chrome-menyen for å installere appen.')
          }}
          onBack={() => setView({ name: 'current' })}
          onBackup={exportBackup}
          onCsv={exportCsv}
          onImport={importBackup}
          onClear={clearAll}
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
      <div className={`toast${undo ? ' toast--undo' : ''}`} aria-live="polite" aria-atomic="true">
        {undo ? <><span>{undo.message}</span><button type="button" onClick={() => { void runUndo() }}>Angre</button></> : notice}
      </div>
    </div>
  )
}

function StorageNotice({ mode }: { mode: CalorieRuntime['storageMode'] }) {
  if (mode === 'demo') {
    return (
      <aside className="storage-notice storage-notice--temporary" role="status">
        <strong>Demomodus.</strong> Ingenting lagres. Data forsvinner når siden lastes på nytt eller fanen lukkes.
      </aside>
    )
  }
  if (mode === 'memory') {
    return (
      <aside className="storage-notice storage-notice--temporary" role="status">
        <strong>Midlertidig økt.</strong> Nettleserlagring er blokkert. Data forsvinner når siden lastes på nytt eller fanen lukkes.
      </aside>
    )
  }
  return (
    <aside className="storage-notice" role="status">
      Ingen installasjon eller filer kreves. Data lagres bare i denne nettleseren.
    </aside>
  )
}

function localDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Noe gikk galt. Dataene dine er ikke endret.'
}
