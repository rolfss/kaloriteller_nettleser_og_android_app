import { useState, type FormEvent } from 'react'
import type { DefinitionBasis, DefinitionDraft, PendingEntry } from '../domain/models'
import { parseLocalizedNumber } from '../domain/normalize'
import { Modal } from './Modal'

interface DefinitionDialogProps {
  pending: PendingEntry
  busy: boolean
  error: string
  onCancel: () => void
  onSave: (draft: DefinitionDraft) => Promise<void>
}

export function DefinitionDialog({ pending, busy, error, onCancel, onSave }: DefinitionDialogProps) {
  const parsed = pending.parsed
  const initialBasis: DefinitionBasis = parsed.kind === 'measured' ? parsed.measure : 'custom-count'
  const [basis, setBasis] = useState<DefinitionBasis>(initialBasis)
  const [name, setName] = useState(parsed.kind === 'measured' ? parsed.itemName : parsed.customLabel)
  const [calories, setCalories] = useState('')
  const [aliases, setAliases] = useState('')
  const [localError, setLocalError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsedCalories = parseLocalizedNumber(calories)
    if (parsedCalories === null) {
      setLocalError('Skriv inn et gyldig kaloritall (0 eller mer).')
      return
    }
    setLocalError('')
    await onSave({
      basis,
      name,
      caloriesPerUnit: parsedCalories,
      aliases: basis === 'custom-count' ? aliases.split(',').map((alias) => alias.trim()).filter(Boolean) : [],
    })
  }

  const unitText = basis === 'gram' ? 'gram' : basis === 'deciliter' ? 'desiliter' : name || 'enhet'
  return (
    <Modal title="Hvor mange kalorier er dette?" onClose={onCancel} labelledBy="definition-title">
      <form onSubmit={(event) => { void submit(event) }}>
        <p className="pending-input">Du skrev: <strong>{parsed.rawText}</strong></p>
        <label>
          Beregningsgrunnlag
          <select value={basis} onChange={(event) => setBasis(event.target.value as DefinitionBasis)}>
            <option value="gram">1 gram</option>
            <option value="deciliter">1 desiliter</option>
            <option value="custom-count">Custom enhet</option>
          </select>
        </label>
        <label>
          {basis === 'custom-count' ? 'Navn på enhet' : 'Matvare'}
          <input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
        </label>
        <label>
          Kalorier per 1 {unitText}
          <span className="input-suffix">
            <input
              inputMode="decimal"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              aria-describedby="calorie-help"
              required
            />
            <span>kcal</span>
          </span>
        </label>
        {basis === 'custom-count' && (
          <label>
            Alias, separert med komma <span className="optional">(valgfritt)</span>
            <input
              value={aliases}
              onChange={(event) => setAliases(event.target.value)}
              placeholder={name ? `f.eks. flertall av ${name}` : 'f.eks. flasker'}
            />
          </label>
        )}
        <p id="calorie-help" className="help-text">Verdien kommer bare fra deg. Appen gjør ingen oppslag eller gjetting.</p>
        {(localError || error) && <p className="form-error" role="alert">{localError || error}</p>}
        <div className="modal__actions">
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>Avbryt</button>
          <button type="submit" className="button" disabled={busy}>{busy ? 'Lagrer…' : 'Lagre og legg til'}</button>
        </div>
      </form>
    </Modal>
  )
}
