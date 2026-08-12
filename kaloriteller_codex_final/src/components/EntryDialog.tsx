import { useState, type FormEvent } from 'react'
import type { Entry } from '../domain/models'
import { Modal } from './Modal'

interface EntryDialogProps {
  entry: Entry
  busy: boolean
  error: string
  onClose: () => void
  onSave: (rawText: string) => Promise<void>
  onDelete: () => Promise<void>
}

export function EntryDialog({ entry, busy, error, onClose, onSave, onDelete }: EntryDialogProps) {
  const [rawText, setRawText] = useState(entry.rawText)
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave(rawText) }
  return (
    <Modal title="Rediger innlegg" onClose={onClose} labelledBy="edit-entry-title">
      <form onSubmit={submit}>
        <label>
          Mengde og matvare eller enhet
          <input value={rawText} onChange={(event) => setRawText(event.target.value)} autoFocus required />
        </label>
        <p className="help-text">Innlegget beregnes på nytt med gjeldende definisjon når du lagrer.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal__actions modal__actions--spread">
          <button
            type="button"
            className="button button--danger-quiet"
            disabled={busy}
            onClick={() => { if (window.confirm('Slette dette innlegget?')) void onDelete() }}
          >Slett</button>
          <div className="action-group">
            <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>Avbryt</button>
            <button type="submit" className="button" disabled={busy}>{busy ? 'Lagrer…' : 'Lagre'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
