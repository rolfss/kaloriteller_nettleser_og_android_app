import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { CalorieDefinition, DefinitionDraft, Entry } from '../../domain/models'
import { parseLocalizedNumber } from '../../domain/normalize'

interface DefinitionsScreenProps {
  definitions: CalorieDefinition[]
  entries: Entry[]
  onBack: () => void
  onUpdate: (id: string, draft: DefinitionDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMerge: (sourceId: string, targetId: string) => Promise<void>
}

export function DefinitionsScreen({ definitions, entries, onBack, onUpdate, onDelete, onMerge }: DefinitionsScreenProps) {
  const [editing, setEditing] = useState<CalorieDefinition | null>(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'usage'>('name')
  const usage = useMemo(() => definitionUsage(entries), [entries])
  const visibleDefinitions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('nb-NO')
    return definitions
      .filter((definition) => definitionSearchText(definition).includes(normalizedQuery))
      .sort((left, right) => compareDefinitions(left, right, sortBy, usage))
  }, [definitions, query, sortBy, usage])

  return (
    <main className="screen">
      <header className="page-header">
        <button type="button" className="back-button" onClick={onBack} aria-label="Tilbake til dagens registrering">←</button>
        <div><p className="eyebrow">Lokalt lagret</p><h1>Kaloridefinisjoner</h1></div>
      </header>
      <p className="info-note">Endringer gjelder nye innlegg. Gamle innlegg beholder kaloriverdien de ble lagret med, til du eventuelt redigerer dem.</p>

      {definitions.length > 0 && (
        <div className="definition-tools">
          <label>Søk<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Navn eller alias" /></label>
          <label>Sorter<select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
            <option value="name">Navn</option>
            <option value="recent">Sist brukt</option>
            <option value="usage">Mest brukt</option>
          </select></label>
        </div>
      )}

      {definitions.length === 0 ? (
        <div className="empty-card"><h2>Ingen definisjoner ennå</h2><p>De opprettes når du lærer appen en kaloriverdi.</p></div>
      ) : visibleDefinitions.length === 0 ? (
        <div className="empty-card"><h2>Ingen treff</h2><p>Prøv et annet navn eller alias.</p></div>
      ) : (
        <ul className="definition-list">
          {visibleDefinitions.map((definition) => {
            const name = definition.kind === 'measured' ? definition.itemName : definition.canonicalLabel
            const basis = definition.kind === 'measured' ? definition.measure : definition.canonicalLabel
            const calories = definition.kind === 'measured' ? definition.caloriesPerBaseUnit : definition.caloriesPerUnit
            const itemUsage = usage.get(definition.id)
            return (
              <li key={definition.id}>
                <button type="button" className="definition-row" onClick={() => setEditing(definition)}>
                  <span>
                    <strong>{name}</strong>
                    <small>1 {basis} = {calories.toLocaleString('nb-NO')} kcal</small>
                    {definition.kind === 'custom-count' && definition.aliases.length > 0 && <small>Alias: {definition.aliases.join(', ')}</small>}
                    <small>{usageText(itemUsage)}</small>
                  </span>
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
          mergeTargets={definitions.filter((definition) => definition.kind === 'custom-count' && definition.id !== editing.id)}
          onMerge={async (targetId) => { await onMerge(editing.id, targetId); setEditing(null) }}
        />
      )}
    </main>
  )
}

interface Usage {
  count: number
  lastUsedAt: string
}

function definitionUsage(entries: Entry[]): Map<string, Usage> {
  const usage = new Map<string, Usage>()
  for (const entry of entries) {
    const existing = usage.get(entry.definitionId)
    usage.set(entry.definitionId, {
      count: (existing?.count ?? 0) + 1,
      lastUsedAt: existing && existing.lastUsedAt > entry.updatedAt ? existing.lastUsedAt : entry.updatedAt,
    })
  }
  return usage
}

function definitionSearchText(definition: CalorieDefinition): string {
  const names = definition.kind === 'measured'
    ? [definition.itemName]
    : [definition.canonicalLabel, ...definition.aliases]
  return names.join(' ').toLocaleLowerCase('nb-NO')
}

function compareDefinitions(
  left: CalorieDefinition,
  right: CalorieDefinition,
  sortBy: 'name' | 'recent' | 'usage',
  usage: Map<string, Usage>,
): number {
  const leftUsage = usage.get(left.id)
  const rightUsage = usage.get(right.id)
  if (sortBy === 'usage' && (leftUsage?.count ?? 0) !== (rightUsage?.count ?? 0)) {
    return (rightUsage?.count ?? 0) - (leftUsage?.count ?? 0)
  }
  if (sortBy === 'recent' && (leftUsage?.lastUsedAt ?? '') !== (rightUsage?.lastUsedAt ?? '')) {
    return (rightUsage?.lastUsedAt ?? '').localeCompare(leftUsage?.lastUsedAt ?? '')
  }
  const leftName = left.kind === 'measured' ? left.itemName : left.canonicalLabel
  const rightName = right.kind === 'measured' ? right.itemName : right.canonicalLabel
  return leftName.localeCompare(rightName, 'nb-NO')
}

function usageText(usage: Usage | undefined): string {
  if (!usage) return 'Ikke brukt i beholdte dager'
  const date = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(new Date(usage.lastUsedAt))
  return `Brukt ${usage.count} ${usage.count === 1 ? 'gang' : 'ganger'} · sist ${date}`
}

function EditDefinitionDialog({
  definition, onClose, onUpdate, onDelete, mergeTargets, onMerge,
}: {
  definition: CalorieDefinition
  onClose: () => void
  onUpdate: (draft: DefinitionDraft) => Promise<void>
  onDelete: () => Promise<void>
  mergeTargets: CalorieDefinition[]
  onMerge: (targetId: string) => Promise<void>
}) {
  const basis = definition.kind === 'measured' ? definition.measure : 'custom-count'
  const [name, setName] = useState(definition.kind === 'measured' ? definition.itemName : definition.canonicalLabel)
  const [calories, setCalories] = useState(String(definition.kind === 'measured' ? definition.caloriesPerBaseUnit : definition.caloriesPerUnit).replace('.', ','))
  const [aliases, setAliases] = useState(definition.kind === 'custom-count' ? definition.aliases.join(', ') : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [confirmMerge, setConfirmMerge] = useState(false)
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
        {basis === 'custom-count' && mergeTargets.length > 0 && (
          <div className="merge-control">
            <label>Slå sammen med<select value={mergeTargetId} onChange={(event) => { setMergeTargetId(event.target.value); setConfirmMerge(false) }}>
              <option value="">Velg mål-definisjon</option>
              {mergeTargets.map((target) => {
                if (target.kind !== 'custom-count') return null
                return <option key={target.id} value={target.id}>{target.canonicalLabel} · {target.caloriesPerUnit.toLocaleString('nb-NO')} kcal</option>
              })}
            </select></label>
            {!confirmMerge ? (
              <button type="button" className="button button--secondary" disabled={!mergeTargetId || busy} onClick={() => setConfirmMerge(true)}>Forbered sammenslåing</button>
            ) : (
              <div className="inline-confirm" role="alert">
                <p>Mål-definisjonens navn og kaloriverdi beholdes. «{name}» og aliasene flyttes dit. Historiske innlegg endres ikke.</p>
                <div className="modal__actions"><button type="button" className="button button--secondary" onClick={() => setConfirmMerge(false)}>Avbryt</button><button type="button" className="button" disabled={busy} onClick={() => { setBusy(true); void onMerge(mergeTargetId).catch((caught: unknown) => { setError(errorMessage(caught)); setBusy(false) }) }}>Slå sammen</button></div>
              </div>
            )}
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!confirmDelete ? (
          <div className="modal__actions modal__actions--spread">
            <button type="button" className="button button--danger-quiet" disabled={busy} onClick={() => setConfirmDelete(true)}>Slett</button>
            <div className="action-group"><button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>Avbryt</button><button type="submit" className="button" disabled={busy}>Lagre</button></div>
          </div>
        ) : (
          <div className="inline-confirm" role="alert">
            <p>Slette definisjonen? Gamle innlegg beholdes, og du kan angre i ti sekunder.</p>
            <div className="modal__actions"><button type="button" className="button button--secondary" onClick={() => setConfirmDelete(false)}>Behold</button><button type="button" className="button button--danger-quiet" disabled={busy} onClick={() => { setBusy(true); void onDelete().catch((caught: unknown) => { setError(errorMessage(caught)); setBusy(false) }) }}>Slett definisjon</button></div>
          </div>
        )}
      </form>
    </Modal>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Noe gikk galt.'
}
