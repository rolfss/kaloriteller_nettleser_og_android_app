import type { Transaction } from 'dexie'
import type {
  CalorieDefinition,
  Day,
  DaySummary,
  DefinitionDraft,
  Entry,
  ParsedInput,
  PendingEntry,
} from '../domain/models'
import { localDateString } from '../domain/dates'
import { displayLabel, DomainError, normalizeLabel, assertNonNegativeFinite } from '../domain/normalize'
import { parseEntryInput } from '../domain/parser'
import {
  calculateCalories,
  calorieRate,
  completedDaysToRemove,
  dayTotal,
  matchDefinition,
} from '../domain/rules'
import { isDay, isDefinition, isEntry } from '../domain/validation'
import { CalorieDatabase } from '../persistence/database'
import { PersistenceError } from './errors'
import { isBackupEnvelope, makeBackup, type BackupEnvelope } from './dataExport'

export type EntryMutationResult =
  | { status: 'added'; entry: Entry }
  | { status: 'needs-definition'; pending: PendingEntry }

export interface AppSnapshot {
  active: DaySummary | null
  history: DaySummary[]
  definitions: CalorieDefinition[]
}

interface ServiceOptions {
  now?: () => Date
  id?: () => string
}

export class CalorieService {
  private readonly now: () => Date
  private readonly id: () => string

  constructor(private readonly db: CalorieDatabase, options: ServiceOptions = {}) {
    this.now = options.now ?? (() => new Date())
    this.id = options.id ?? (() => crypto.randomUUID())
  }

  async snapshot(): Promise<AppSnapshot> {
    const [days, entries, definitions] = await Promise.all([
      this.db.days.toArray(),
      this.db.entries.toArray(),
      this.db.definitions.toArray(),
    ])
    if (!days.every(isDay) || !entries.every(isEntry) || !definitions.every(isDefinition)) {
      throw new PersistenceError()
    }

    const activeDays = days.filter((day) => day.status === 'active')
    if (activeDays.length > 1) throw new PersistenceError('Flere aktive dager ble funnet. Ingen data er endret.')
    const buildSummary = (day: Day): DaySummary => {
      const dayEntries = entries
        .filter((entry) => entry.dayId === day.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      return { day, entries: dayEntries, totalCalories: dayTotal(dayEntries) }
    }
    const history = days
      .filter((day) => day.status === 'completed')
      .sort((left, right) =>
        (right.completedAt ?? right.updatedAt).localeCompare(left.completedAt ?? left.updatedAt),
      )
      .map(buildSummary)
    return {
      active: activeDays[0] ? buildSummary(activeDays[0]) : null,
      history,
      definitions: definitions.sort(definitionSort),
    }
  }

  async addEntry(rawText: string): Promise<EntryMutationResult> {
    return this.prepareMutation(parseEntryInput(rawText))
  }

  async editEntry(entryId: string, rawText: string): Promise<EntryMutationResult> {
    const existing = await this.db.entries.get(entryId)
    if (!existing || !isEntry(existing)) throw new DomainError('Innlegget finnes ikke lenger.')
    return this.prepareMutation(parseEntryInput(rawText), existing)
  }

  private async prepareMutation(parsed: ParsedInput, existing?: Entry): Promise<EntryMutationResult> {
    const definitions = await this.getDefinitions()
    const match = matchDefinition(parsed, definitions)
    if (match.status === 'ambiguous') {
      throw new DomainError('Flere definisjoner bruker denne enheten. Rett aliasene under Kaloridefinisjoner.')
    }
    if (match.status === 'missing') {
      return {
        status: 'needs-definition',
        pending: existing ? { parsed, existingEntryId: existing.id } : { parsed },
      }
    }

    const entry = await this.db.transaction('rw', this.db.days, this.db.entries, async () => {
      const day = existing ? await this.requireDay(existing.dayId) : await this.getOrCreateActiveDay()
      return this.writeEntry(parsed, match.definition, day, existing)
    })
    return { status: 'added', entry }
  }

  async resolvePending(pending: PendingEntry, draft: DefinitionDraft): Promise<Entry> {
    const cleanDraft = cleanDefinitionDraft(draft)
    return this.db.transaction(
      'rw',
      this.db.days,
      this.db.entries,
      this.db.definitions,
      async (transaction) => {
        const definition = await this.createDefinition(cleanDraft, transaction)
        const existing = pending.existingEntryId
          ? await this.db.entries.get(pending.existingEntryId)
          : undefined
        if (pending.existingEntryId && (!existing || !isEntry(existing))) {
          throw new DomainError('Innlegget finnes ikke lenger.')
        }
        const day = existing ? await this.requireDay(existing.dayId) : await this.getOrCreateActiveDay()
        const parsed = reinterpretPending(pending.parsed, cleanDraft)
        return this.writeEntry(parsed, definition, day, existing)
      },
    )
  }

  async deleteEntry(entryId: string): Promise<Entry | null> {
    return this.db.transaction('rw', this.db.days, this.db.entries, async () => {
      const entry = await this.db.entries.get(entryId)
      if (!entry) return null
      if (!isEntry(entry)) throw new PersistenceError()
      await this.db.entries.delete(entryId)
      const day = await this.db.days.get(entry.dayId)
      if (day) await this.db.days.update(day.id, { updatedAt: this.now().toISOString() })
      return entry
    })
  }

  async restoreEntry(entry: Entry): Promise<void> {
    if (!isEntry(entry)) throw new DomainError('Innlegget kan ikke gjenopprettes.')
    await this.db.transaction('rw', this.db.days, this.db.entries, async () => {
      await this.requireDay(entry.dayId)
      if (await this.db.entries.get(entry.id)) throw new DomainError('Innlegget finnes allerede.')
      await this.db.entries.add(entry)
      await this.db.days.update(entry.dayId, { updatedAt: this.now().toISOString() })
    })
  }

  async completeActiveDay(): Promise<void> {
    await this.db.transaction('rw', this.db.days, this.db.entries, async () => {
      const active = await this.db.days.where('status').equals('active').toArray()
      if (active.length === 0) return
      if (active.length > 1) throw new PersistenceError('Flere aktive dager ble funnet. Ingen data er endret.')
      const timestamp = this.now().toISOString()
      await this.db.days.update((active[0] as Day).id, {
        status: 'completed',
        completedAt: timestamp,
        updatedAt: timestamp,
      })
      const allDays = await this.db.days.toArray()
      const staleDays = completedDaysToRemove(allDays)
      if (staleDays.length > 0) {
        const staleIds = staleDays.map((day) => day.id)
        await this.db.entries.where('dayId').anyOf(staleIds).delete()
        await this.db.days.bulkDelete(staleIds)
      }
    })
  }

  async updateDefinition(id: string, draft: DefinitionDraft): Promise<void> {
    const cleanDraft = cleanDefinitionDraft(draft)
    await this.db.transaction('rw', this.db.definitions, async (transaction) => {
      const existing = await this.db.definitions.get(id)
      if (!existing || !isDefinition(existing)) throw new DomainError('Definisjonen finnes ikke lenger.')
      await this.assertDefinitionAvailable(cleanDraft, transaction, [id])
      const timestamp = this.now().toISOString()
      const updated = makeDefinition(cleanDraft, id, existing.createdAt, timestamp)
      await this.db.definitions.put(updated)
    })
  }

  async deleteDefinition(id: string): Promise<CalorieDefinition | null> {
    return this.db.transaction('rw', this.db.definitions, async () => {
      const definition = await this.db.definitions.get(id)
      if (!definition) return null
      if (!isDefinition(definition)) throw new PersistenceError()
      await this.db.definitions.delete(id)
      return definition
    })
  }

  async restoreDefinition(definition: CalorieDefinition): Promise<void> {
    if (!isDefinition(definition)) throw new DomainError('Definisjonen kan ikke gjenopprettes.')
    await this.db.transaction('rw', this.db.definitions, async (transaction) => {
      if (await this.db.definitions.get(definition.id)) throw new DomainError('Definisjonen finnes allerede.')
      await this.assertDefinitionAvailable(definitionDraft(definition), transaction)
      await this.db.definitions.add(definition)
    })
  }

  async mergeCustomDefinitions(sourceId: string, targetId: string): Promise<void> {
    if (sourceId === targetId) throw new DomainError('Velg to forskjellige definisjoner.')
    await this.db.transaction('rw', this.db.definitions, async (transaction) => {
      const [source, target] = await Promise.all([
        this.db.definitions.get(sourceId),
        this.db.definitions.get(targetId),
      ])
      if (!source || !target || !isDefinition(source) || !isDefinition(target)) {
        throw new DomainError('En av definisjonene finnes ikke lenger.')
      }
      if (source.kind !== 'custom-count' || target.kind !== 'custom-count') {
        throw new DomainError('Bare egendefinerte enheter kan slås sammen.')
      }
      const aliases = [target.canonicalLabel, ...target.aliases, source.canonicalLabel, ...source.aliases]
      const cleanDraft = cleanDefinitionDraft({
        basis: 'custom-count',
        name: target.canonicalLabel,
        caloriesPerUnit: target.caloriesPerUnit,
        aliases,
      })
      await this.assertDefinitionAvailable(cleanDraft, transaction, [sourceId, targetId])
      const updated = makeDefinition(cleanDraft, target.id, target.createdAt, this.now().toISOString())
      await this.db.definitions.put(updated)
      await this.db.definitions.delete(source.id)
    })
  }

  async createBackup(): Promise<BackupEnvelope> {
    const [days, entries, definitions] = await this.db.transaction(
      'r',
      this.db.days,
      this.db.entries,
      this.db.definitions,
      () => Promise.all([
        this.db.days.toArray(),
        this.db.entries.toArray(),
        this.db.definitions.toArray(),
      ]),
    )
    const backup = makeBackup(days, entries, definitions, this.now().toISOString())
    if (!isBackupEnvelope(backup)) throw new PersistenceError()
    return backup
  }

  async replaceFromBackup(backup: BackupEnvelope): Promise<void> {
    if (!isBackupEnvelope(backup)) throw new DomainError('Sikkerhetskopien er ugyldig.')
    await this.db.transaction(
      'rw',
      this.db.days,
      this.db.entries,
      this.db.definitions,
      async () => {
        await this.db.entries.clear()
        await this.db.days.clear()
        await this.db.definitions.clear()
        await this.db.definitions.bulkAdd(backup.definitions)
        await this.db.days.bulkAdd(backup.days)
        await this.db.entries.bulkAdd(backup.entries)
      },
    )
  }

  async clearAll(): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.days,
      this.db.entries,
      this.db.definitions,
      async () => {
        await this.db.entries.clear()
        await this.db.days.clear()
        await this.db.definitions.clear()
      },
    )
  }

  private async createDefinition(draft: DefinitionDraft, transaction: Transaction): Promise<CalorieDefinition> {
    await this.assertDefinitionAvailable(draft, transaction)
    const timestamp = this.now().toISOString()
    const definition = makeDefinition(draft, this.id(), timestamp, timestamp)
    await this.db.definitions.add(definition)
    return definition
  }

  private async assertDefinitionAvailable(
    draft: DefinitionDraft,
    _transaction: Transaction,
    ignoredIds: string[] = [],
  ): Promise<void> {
    const ignored = new Set(ignoredIds)
    const definitions = (await this.db.definitions.toArray()).filter((definition) => !ignored.has(definition.id))
    if (draft.basis !== 'custom-count') {
      const normalizedName = normalizeLabel(draft.name)
      const collision = definitions.some(
        (definition) => definition.kind === 'measured' &&
          definition.measure === draft.basis && definition.normalizedItemName === normalizedName,
      )
      if (collision) throw new DomainError('Denne målte definisjonen finnes allerede.')
      return
    }

    const proposed = new Set([normalizeLabel(draft.name), ...draft.aliases.map(normalizeLabel)])
    for (const definition of definitions) {
      if (definition.kind !== 'custom-count') continue
      const occupied = [definition.normalizedCanonicalLabel, ...definition.normalizedAliases]
      if (occupied.some((label) => proposed.has(label))) {
        throw new DomainError('Navnet eller et alias brukes allerede av en annen definisjon.')
      }
    }
  }

  private async getDefinitions(): Promise<CalorieDefinition[]> {
    const definitions = await this.db.definitions.toArray()
    if (!definitions.every(isDefinition)) throw new PersistenceError()
    return definitions
  }

  private async getOrCreateActiveDay(): Promise<Day> {
    const active = await this.db.days.where('status').equals('active').toArray()
    if (active.length > 1) throw new PersistenceError('Flere aktive dager ble funnet. Ingen data er endret.')
    const existing = active[0]
    if (existing) {
      if (!isDay(existing)) throw new PersistenceError()
      return existing
    }
    const timestamp = this.now().toISOString()
    const day: Day = {
      id: this.id(),
      logDate: localDateString(this.now()),
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await this.db.days.add(day)
    return day
  }

  private async requireDay(dayId: string): Promise<Day> {
    const day = await this.db.days.get(dayId)
    if (!day || !isDay(day)) throw new DomainError('Dagen finnes ikke lenger.')
    return day
  }

  private async writeEntry(
    parsed: ParsedInput,
    definition: CalorieDefinition,
    day: Day,
    existing?: Entry,
  ): Promise<Entry> {
    const timestamp = this.now().toISOString()
    const rate = calorieRate(definition)
    const common = {
      id: existing?.id ?? this.id(),
      dayId: day.id,
      rawText: parsed.rawText,
      quantity: parsed.quantity,
      definitionId: definition.id,
      caloriesPerBaseUnitSnapshot: rate,
      calculatedCalories: calculateCalories(parsed.quantity, rate),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }
    const entry: Entry = parsed.kind === 'measured'
      ? {
          ...common,
          kind: 'measured',
          itemName: parsed.itemName,
          normalizedItemName: parsed.normalizedItemName,
          standardMeasure: parsed.measure,
        }
      : {
          ...common,
          kind: 'custom-count',
          customLabel: parsed.customLabel,
          normalizedCustomLabel: parsed.normalizedCustomLabel,
        }
    await this.db.entries.put(entry)
    await this.db.days.update(day.id, { updatedAt: timestamp })
    return entry
  }
}

function cleanDefinitionDraft(draft: DefinitionDraft): DefinitionDraft {
  const name = displayLabel(draft.name)
  if (!name) throw new DomainError('Navn eller enhet kan ikke være tom.')
  assertNonNegativeFinite(draft.caloriesPerUnit, 'Kalorier')
  const aliases = draft.basis === 'custom-count'
    ? [...new Map(
        draft.aliases
          .map(displayLabel)
          .filter(Boolean)
          .filter((alias) => normalizeLabel(alias) !== normalizeLabel(name))
          .map((alias) => [normalizeLabel(alias), alias]),
      ).values()]
    : []
  return { ...draft, name, aliases }
}

function makeDefinition(
  draft: DefinitionDraft,
  id: string,
  createdAt: string,
  updatedAt: string,
): CalorieDefinition {
  if (draft.basis === 'custom-count') {
    return {
      id,
      kind: 'custom-count',
      canonicalLabel: draft.name,
      normalizedCanonicalLabel: normalizeLabel(draft.name),
      aliases: draft.aliases,
      normalizedAliases: draft.aliases.map(normalizeLabel),
      caloriesPerUnit: draft.caloriesPerUnit,
      createdAt,
      updatedAt,
    }
  }
  return {
    id,
    kind: 'measured',
    itemName: draft.name,
    normalizedItemName: normalizeLabel(draft.name),
    measure: draft.basis,
    caloriesPerBaseUnit: draft.caloriesPerUnit,
    createdAt,
    updatedAt,
  }
}

function reinterpretPending(parsed: ParsedInput, draft: DefinitionDraft): ParsedInput {
  if (draft.basis === 'custom-count') {
    return {
      kind: 'custom-count',
      rawText: parsed.rawText,
      quantity: parsed.quantity,
      customLabel: draft.name,
      normalizedCustomLabel: normalizeLabel(draft.name),
    }
  }
  return {
    kind: 'measured',
    rawText: parsed.rawText,
    quantity: parsed.quantity,
    itemName: draft.name,
    normalizedItemName: normalizeLabel(draft.name),
    measure: draft.basis,
  }
}

function definitionSort(left: CalorieDefinition, right: CalorieDefinition): number {
  const leftName = left.kind === 'measured' ? left.itemName : left.canonicalLabel
  const rightName = right.kind === 'measured' ? right.itemName : right.canonicalLabel
  return leftName.localeCompare(rightName, 'nb-NO')
}

function definitionDraft(definition: CalorieDefinition): DefinitionDraft {
  return definition.kind === 'measured'
    ? {
        basis: definition.measure,
        name: definition.itemName,
        caloriesPerUnit: definition.caloriesPerBaseUnit,
        aliases: [],
      }
    : {
        basis: 'custom-count',
        name: definition.canonicalLabel,
        caloriesPerUnit: definition.caloriesPerUnit,
        aliases: definition.aliases,
      }
}
