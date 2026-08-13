import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CalorieDatabase } from '../persistence/database'
import { CalorieService } from './calorieService'

let db: CalorieDatabase
let service: CalorieService
let sequence: number
let currentDate: Date

beforeEach(() => {
  sequence = 0
  currentDate = new Date(2026, 7, 12, 10, 0, 0)
  db = new CalorieDatabase(`test-${crypto.randomUUID()}`)
  service = new CalorieService(db, {
    now: () => currentDate,
    id: () => `id-${++sequence}`,
  })
})

afterEach(async () => {
  await db.delete()
})

async function teach(rawText: string, name: string, rate: number, aliases: string[] = []) {
  const result = await service.addEntry(rawText)
  expect(result.status).toBe('needs-definition')
  if (result.status !== 'needs-definition') throw new Error('Expected pending definition')
  return service.resolvePending(result.pending, {
    basis: result.pending.parsed.kind === 'measured' ? result.pending.parsed.measure : 'custom-count',
    name,
    caloriesPerUnit: rate,
    aliases,
  })
}

describe('calorie application service', () => {
  it('stores an unknown measured definition and reuses it', async () => {
    const first = await teach('15 g tran', 'tran', 9)
    expect(first.calculatedCalories).toBe(135)
    const second = await service.addEntry('10 gram tran')
    expect(second).toMatchObject({ status: 'added', entry: { calculatedCalories: 90 } })
    expect((await service.snapshot()).active?.totalCalories).toBe(225)
  })

  it('stores and matches an explicit custom plural alias', async () => {
    await teach('1 flaske', 'flaske', 150, ['flasker'])
    const result = await service.addEntry('3 flasker')
    expect(result).toMatchObject({ status: 'added', entry: { calculatedCalories: 450 } })
  })

  it('allows zero-calorie definitions', async () => {
    const entry = await teach('1 vann', 'vann', 0)
    expect(entry.calculatedCalories).toBe(0)
  })

  it('prevents duplicate custom aliases', async () => {
    await teach('1 flaske', 'flaske', 150, ['flasker'])
    const pending = await service.addEntry('1 kartong')
    if (pending.status !== 'needs-definition') throw new Error('Expected pending definition')
    await expect(service.resolvePending(pending.pending, {
      basis: 'custom-count', name: 'kartong', caloriesPerUnit: 400, aliases: ['flasker'],
    })).rejects.toThrow(/brukes allerede/)
    expect((await service.snapshot()).active?.entries).toHaveLength(1)
  })

  it('keeps historical snapshots after definition correction', async () => {
    await teach('2 flasker', 'flaske', 150, ['flasker'])
    await service.completeActiveDay()
    const definition = (await service.snapshot()).definitions[0]
    if (!definition) throw new Error('Expected definition')
    await service.updateDefinition(definition.id, {
      basis: 'custom-count', name: 'flaske', caloriesPerUnit: 160, aliases: ['flasker'],
    })
    const oldDay = (await service.snapshot()).history[0]
    expect(oldDay?.totalCalories).toBe(300)
    expect(await service.addEntry('2 flasker')).toMatchObject({
      status: 'added', entry: { calculatedCalories: 320 },
    })
  })

  it('edits and deletes entries while deriving totals', async () => {
    const first = await teach('1 kjeks', 'kjeks', 56)
    await service.addEntry('2 kjeks')
    expect((await service.snapshot()).active?.totalCalories).toBe(168)
    await service.editEntry(first.id, '3 kjeks')
    expect((await service.snapshot()).active?.totalCalories).toBe(280)
    await service.deleteEntry(first.id)
    expect((await service.snapshot()).active?.totalCalories).toBe(112)
  })

  it('keeps an active day open across midnight', async () => {
    await teach('1 kjeks', 'kjeks', 56)
    currentDate = new Date(2026, 7, 13, 9, 0, 0)
    await service.addEntry('2 kjeks')
    const active = (await service.snapshot()).active
    expect(active?.day.logDate).toBe('2026-08-12')
    expect(active?.entries).toHaveLength(2)
  })

  it('completes explicitly and transactionally retains only seven days', async () => {
    await teach('1 kjeks', 'kjeks', 56)
    for (let dayIndex = 0; dayIndex < 8; dayIndex += 1) {
      if (dayIndex > 0) await service.addEntry('1 kjeks')
      await service.completeActiveDay()
      currentDate = new Date(2026, 7, 13 + dayIndex, 10, 0, 0)
    }
    const snapshot = await service.snapshot()
    expect(snapshot.history).toHaveLength(7)
    expect(snapshot.history.flatMap((day) => day.entries)).toHaveLength(7)
    expect(snapshot.definitions).toHaveLength(1)
    expect(snapshot.active).toBeNull()
  })

  it('persists data across service instances', async () => {
    await teach('1 elefant', 'elefant', 900)
    const reopened = new CalorieService(db)
    expect((await reopened.snapshot()).active?.totalCalories).toBe(900)
  })

  it('restores recently deleted entries and definitions without changing snapshots', async () => {
    const entry = await teach('1 kjeks', 'kjeks', 56)
    const definition = (await service.snapshot()).definitions[0]
    if (!definition) throw new Error('Expected definition')

    const deletedEntry = await service.deleteEntry(entry.id)
    expect((await service.snapshot()).active?.totalCalories).toBe(0)
    if (!deletedEntry) throw new Error('Expected deleted entry')
    await service.restoreEntry(deletedEntry)
    expect((await service.snapshot()).active?.totalCalories).toBe(56)

    const deletedDefinition = await service.deleteDefinition(definition.id)
    expect((await service.snapshot()).definitions).toHaveLength(0)
    if (!deletedDefinition) throw new Error('Expected deleted definition')
    await service.restoreDefinition(deletedDefinition)
    expect((await service.snapshot()).definitions).toEqual([definition])
  })

  it('exports, clears, and transactionally restores a complete backup', async () => {
    await teach('2 flasker', 'flaske', 150, ['flasker'])
    const backup = await service.createBackup()

    await service.clearAll()
    expect(await service.snapshot()).toEqual({ active: null, history: [], definitions: [] })

    await service.replaceFromBackup(backup)
    const restored = await service.snapshot()
    expect(restored.active?.totalCalories).toBe(300)
    expect(restored.definitions).toHaveLength(1)
  })

  it('explicitly merges custom labels while preserving the target rate and history', async () => {
    const historical = await teach('1 kjeks', 'kjeks', 56, ['kjeksene'])
    await service.completeActiveDay()
    await teach('1 cookie', 'cookie', 60, ['cookies'])
    const definitions = await service.snapshot().then((snapshot) => snapshot.definitions)
    const source = definitions.find((definition) => definition.kind === 'custom-count' && definition.canonicalLabel === 'kjeks')
    const target = definitions.find((definition) => definition.kind === 'custom-count' && definition.canonicalLabel === 'cookie')
    if (!source || !target) throw new Error('Expected definitions')

    await service.mergeCustomDefinitions(source.id, target.id)

    expect(await service.addEntry('2 kjeks')).toMatchObject({
      status: 'added', entry: { calculatedCalories: 120, definitionId: target.id },
    })
    const snapshot = await service.snapshot()
    expect(snapshot.definitions).toHaveLength(1)
    expect(snapshot.definitions[0]).toMatchObject({
      kind: 'custom-count', canonicalLabel: 'cookie', caloriesPerUnit: 60,
    })
    expect(snapshot.history[0]?.entries[0]).toMatchObject({
      id: historical.id, calculatedCalories: 56, definitionId: source.id,
    })
  })
})
