import { afterEach, describe, expect, it, vi } from 'vitest'
import { CalorieDatabase } from './database'
import { createCalorieRuntime, type CalorieRuntime } from './runtime'

let runtime: CalorieRuntime | undefined

afterEach(async () => {
  if (runtime) {
    await runtime.database.delete()
    runtime = undefined
  }
})

describe('browser storage runtime', () => {
  it('uses persistent browser storage when IndexedDB opens', async () => {
    runtime = await createCalorieRuntime({ name: `persistent-${crypto.randomUUID()}` })

    expect(runtime.storageMode).toBe('persistent')
  })

  it('keeps the app usable in memory when persistent storage is blocked', async () => {
    const blockedDatabase = new CalorieDatabase(`blocked-${crypto.randomUUID()}`)
    vi.spyOn(blockedDatabase, 'open').mockRejectedValueOnce(new Error('Storage is blocked'))

    runtime = await createCalorieRuntime({
      name: `fallback-${crypto.randomUUID()}`,
      createPersistentDatabase: () => blockedDatabase,
    })

    expect(runtime.storageMode).toBe('memory')
    const pending = await runtime.service.addEntry('1 kjeks')
    expect(pending.status).toBe('needs-definition')
    if (pending.status !== 'needs-definition') throw new Error('Expected a pending definition')
    await runtime.service.resolvePending(pending.pending, {
      basis: 'custom-count',
      name: 'kjeks',
      caloriesPerUnit: 56,
      aliases: [],
    })
    expect((await runtime.service.snapshot()).active?.totalCalories).toBe(56)
  })

  it('starts an isolated demo without attempting persistent storage', async () => {
    const createPersistentDatabase = vi.fn(() => new CalorieDatabase('should-not-open'))

    runtime = await createCalorieRuntime({
      name: `demo-${crypto.randomUUID()}`,
      forceMemory: true,
      createPersistentDatabase,
    })

    expect(runtime.storageMode).toBe('demo')
    expect(createPersistentDatabase).not.toHaveBeenCalled()
    expect((await runtime.service.snapshot()).active).toBeNull()
  })
})
