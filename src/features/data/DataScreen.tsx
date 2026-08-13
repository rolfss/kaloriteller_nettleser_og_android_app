import { useState, type ChangeEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { StorageMode } from '../../persistence/runtime'
import { ANDROID_APK_URL, ANDROID_RELEASE_URL, type InstallStatus } from '../../platform/installApp'

interface DataScreenProps {
  storageMode: StorageMode
  busy: boolean
  installStatus: InstallStatus
  onInstall: () => Promise<void>
  onBack: () => void
  onBackup: () => Promise<void>
  onCsv: () => Promise<void>
  onImport: (text: string) => Promise<void>
  onClear: () => Promise<void>
}

interface PendingImport {
  filename: string
  text: string
}

export function DataScreen({
  storageMode, busy, installStatus, onInstall, onBack, onBackup, onCsv, onImport, onClear,
}: DataScreenProps) {
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [error, setError] = useState('')
  const demoUrl = `${window.location.pathname}?demo=1`

  const selectImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 5_000_000) {
      setError('Sikkerhetskopien er for stor. Maksimal størrelse er 5 MB.')
      return
    }
    try {
      setPendingImport({ filename: file.name, text: await file.text() })
      setError('')
    } catch {
      setError('Filen kunne ikke leses.')
    }
  }

  return (
    <main className="screen">
      <header className="page-header">
        <button type="button" className="back-button" onClick={onBack} aria-label="Tilbake til dagens registrering">←</button>
        <div><p className="eyebrow">Lokalt og privat</p><h1>Installer, data og personvern</h1></div>
      </header>

      <section className="settings-section install-section" aria-labelledby="install-heading">
        <p className="eyebrow">Android</p>
        <h2 id="install-heading">Bruk Kaloriteller som en app</h2>
        {installStatus === 'installed' ? (
          <p className="install-status" role="status"><strong>Appen er installert.</strong> Den åpnes fra hjemmeskjermen og fungerer uten nett.</p>
        ) : (
          <>
            <p>Velg den enkle Chrome-installasjonen, eller last ned Android-pakken direkte. Begge kjører lokalt og krever ingen konto.</p>
            {installStatus === 'available' ? (
              <button type="button" className="button" onClick={() => { void onInstall() }}>Installer appen</button>
            ) : (
              <div className="install-instructions">
                <strong>Installer fra Chrome</strong>
                <p>Åpne denne siden i Chrome på Android, trykk menyen <span aria-hidden="true">⋮</span>, og velg «Installer app» eller «Legg til på startskjermen».</p>
              </div>
            )}
            <div className="install-download">
              <a className="button button--secondary inline-action" href={ANDROID_APK_URL}>Last ned Android APK</a>
              <p className="help-text">Direktepakken er en debug-signert testutgave. Android kan be deg tillate installasjon fra nettleseren.</p>
              <a href={ANDROID_RELEASE_URL} target="_blank" rel="noreferrer">Versjon og utgivelsesdetaljer</a>
            </div>
          </>
        )}
        <ul className="plain-list install-benefits">
          <li>Fungerer offline etter første åpning eller installasjon.</li>
          <li>Matdata lagres bare lokalt på telefonen.</li>
          <li>Ingen abonnement, tokens eller løpende brukskostnad.</li>
        </ul>
      </section>

      <section className="settings-section" aria-labelledby="storage-heading">
        <h2 id="storage-heading">Lagring</h2>
        <p>{storageDescription(storageMode)}</p>
        {storageMode === 'demo' ? (
          <button type="button" className="button button--secondary" onClick={() => window.location.reload()}>Start demoen på nytt</button>
        ) : (
          <a className="button button--secondary inline-action" href={demoUrl}>Åpne privat demomodus</a>
        )}
      </section>

      <section className="settings-section" aria-labelledby="export-heading">
        <h2 id="export-heading">Eksporter og sikkerhetskopier</h2>
        <p>Filene lages på enheten din. De sendes ikke til en server.</p>
        <div className="settings-actions">
          <button type="button" className="button" disabled={busy} onClick={() => { void onBackup() }}>Sikkerhetskopi (JSON)</button>
          <button type="button" className="button button--secondary" disabled={busy} onClick={() => { void onCsv() }}>Regnearkdata (CSV)</button>
          <label className={`button button--secondary file-button${busy ? ' file-button--disabled' : ''}`}>
            Importer sikkerhetskopi
            <input type="file" accept="application/json,.json" disabled={busy} onChange={(event) => { void selectImport(event) }} />
          </label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>

      <section className="settings-section" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Dette forlater aldri appen</h2>
        <ul className="plain-list">
          <li>Matinnlegg og kaloriregler sendes ikke til en server.</li>
          <li>Ingen konto, analyseverktøy, reklame eller ekstern matdatabase brukes.</li>
          <li>PDF, JSON og CSV lages lokalt først etter at du velger eksport.</li>
          <li>Android-utgaven ber ikke om nettverks- eller generell lagringstilgang.</li>
        </ul>
      </section>

      <section className="settings-section danger-zone" aria-labelledby="delete-heading">
        <h2 id="delete-heading">Slett lokale data</h2>
        <p>Dette sletter alle dager, innlegg og kaloridefinisjoner i den aktive lagringsmodusen.</p>
        <button type="button" className="button button--danger-quiet" disabled={busy} onClick={() => setConfirmClear(true)}>Slett alt</button>
      </section>

      {pendingImport && (
        <Modal title="Erstatte lokale data?" onClose={() => setPendingImport(null)} labelledBy="import-title">
          <p><strong>{pendingImport.filename}</strong> vil erstatte alle dager, innlegg og definisjoner i den aktive lagringsmodusen.</p>
          <p>Importen valideres før noe endres.</p>
          <div className="modal__actions">
            <button type="button" className="button button--secondary" disabled={busy} onClick={() => setPendingImport(null)}>Avbryt</button>
            <button type="button" className="button" disabled={busy} onClick={() => {
              void onImport(pendingImport.text)
                .then(() => setPendingImport(null))
                .catch((caught: unknown) => setError(errorMessage(caught)))
            }}>Importer og erstatt</button>
          </div>
        </Modal>
      )}

      {confirmClear && (
        <Modal title="Slette alt?" onClose={() => setConfirmClear(false)} labelledBy="clear-data-title">
          <p>Denne handlingen kan ikke angres. Lag en sikkerhetskopi først hvis du vil beholde dataene.</p>
          <div className="modal__actions">
            <button type="button" className="button button--secondary" disabled={busy} onClick={() => setConfirmClear(false)}>Avbryt</button>
            <button type="button" className="button button--danger-quiet" disabled={busy} onClick={() => {
              void onClear().then(() => setConfirmClear(false)).catch((caught: unknown) => setError(errorMessage(caught)))
            }}>Slett alle data</button>
          </div>
        </Modal>
      )}
    </main>
  )
}

function storageDescription(mode: StorageMode): string {
  if (mode === 'demo') return 'Demomodus bruker bare minnet. Data forsvinner ved oppdatering eller lukking.'
  if (mode === 'memory') return 'Nettleserlagring er blokkert. Data finnes bare til siden oppdateres eller lukkes.'
  return 'Data lagres internt i denne nettleseren. Appen oppretter ingen prosjektfiler automatisk.'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Noe gikk galt.'
}
