import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { CalorieDefinition, DefinitionDraft } from '../../domain/models'
import { parseLocalizedNumber } from '../../domain/normalize'

interface DefinitionsScreenProps {
  definitions: CalorieDefinition[]
  onBack: () => void
  onUpdate: (id: string, draft: DefinitionDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function DefinitionsScreen({ definitions, onBack, onUpdate, onDelete }: DefinitionsScreenProps) {
  const [editing, setEditing] = useState<CalorieDefinition | null>(null)
  return (
    <main className="screen">
      <header className="page-header">
        <button type="button" className="back-button" onClick={onBack} aria-label="Tilbake til dagens registrering">←</button>
        <div><p className="eyebrow">Lokalt lagret</p><h1>Kaloridefinisjoner</h1></div>
      </header>
      <p className="info-note">Endringer gjelder nye innlegg. Gamle innlegg beholder kaloriverdien de ble lagret med, til du eventuelt redigerer dem.</p>
      {definitions.length === 0 ? (
        <div className="empty-card"><h2>Ingen definisjoner ennå</h2><p>De opprettes når du lærer appen en kaloriverdi.</p></div>
      ) : (
        <ul className="definition-list">
          {definitions.map((definition) => {
            const name = definition.kind === 'measured' ? definition.itemName : definition.canonicalLabel
            const basis = definition.kind === 'measured' ? definition.measure : definition.canonicalLabel
            const calories = definition.kind === 'measured' ? definition.caloriesPerBaseUnit : definition.caloriesPerUnit
            return (
              <li key={definition.id}>
                <button type="button" className="definition-row" onClick={() => setEditing(definition)}>
                  <span><strong>{name}</strong><small>1 {basis} = {calories.toLocaleString('nb-NO')} kcal</small></span>
                  <span aria-hidden="true">Rediger ›</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <EditDefinitionDialog
          definition={editing}
          onClose={() => setEditing(null)}
          onUpdate={async (draft) => { await onUpdate(editing.id, draft); setEditing(null) }}
          onDelete={async () => { await onDelete(editing.id); setEditing(null) }}
        />
      )}
    </main>
  )
}

function EditDefinitionDialog({
  definition, onClose, onUpdate, onDelete,
}: {
  definition: CalorieDefinition
  onClose: () => void
  onUpdate: (draft: DefinitionDraft) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const basis = definition.kind === 'measured' ? definition.measure : 'custom-count'
  const [name, setName] = useState(definition.kind === 'measured' ? definition.itemName : definition.canonicalLabel)
  const [calories, setCalories] = useState(String(definition.kind === 'measured' ? definition.caloriesPerBaseUnit : definition.caloriesPerUnit).replace('.', ','))
  const [aliases, setAliases] = useState(definition.kind === 'custom-count' ? definition.aliases.join(', ') : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const rate = parseLocalizedNumber(calories)
    if (rate === null) { setError('Skriv inn et gyldig kaloritall (0 eller mer).'); return }
    setBusy(true); setError('')
    try {
      await onUpdate({ basis, name, caloriesPerUnit: rate, aliases: aliases.split(',').map((alias) => alias.trim()).filter(Boolean) })
    } catch (caught) { setError(errorMessage(caught)); setBusy(false) }
  }
  return (
    <Modal title="Rediger definisjon" onClose={onClose} labelledBy="edit-definition-title">
      <form onSubmit={(event) => { void submit(event) }}>
        <label>{basis === 'custom-count' ? 'Navn på enhet' : 'Matvare'}<input value={name} onChange={(event) => setName(event.target.value)} autoFocus required /></label>
        <label>Kalorier per 1 {basis === 'deciliter' ? 'desiliter' : basis === 'custom-count' ? name : 'gram'}<span className="input-suffix"><input inputMode="decimal" value={calories} onChange={(event) => setCalories(event.target.value)} required /><span>kcal</span></span></label>
        {basis === 'custom-count' && <label>Alias, separert med komma<input value={aliases} onChange={(event) => setAliases(event.target.value)} /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal__actions modal__actions--spread">
          <button type="button" className="button button--danger-quiet" disabled={busy} onClick={() => { if (window.confirm('Slette denne definisjonen? Gamle innlegg beholdes.')) { setBusy(true); void onDelete().catch((caught: unknown) => { setError(errorMessage(caught)); setBusy(false) }) } }}>Slett</button>
          <div className="action-group"><button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>Avbryt</button><button type="submit" className="button" disabled={busy}>Lagre</button></div>
        </div>
      </form>
    </Modal>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Noe gikk galt.'
}
