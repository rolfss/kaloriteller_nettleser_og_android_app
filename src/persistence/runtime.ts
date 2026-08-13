import { CalorieService } from '../application/calorieService'
import { CalorieDatabase } from './database'

export type StorageMode = 'persistent' | 'memory'

export interface CalorieRuntime {
  database: CalorieDatabase
  service: CalorieService
  storageMode: StorageMode
}

interface RuntimeOptions {
  name?: string
  createPersistentDatabase?: (name: string) => CalorieDatabase
}

export async function createCalorieRuntime(options: RuntimeOptions = {}): Promise<CalorieRuntime> {
  const name = options.name ?? 'kaloriteller'
  const createPersistentDatabase = options.createPersistentDatabase ?? ((databaseName) => new CalorieDatabase(databaseName))

  let persistentDatabase: CalorieDatabase | undefined
  try {
    persistentDatabase = createPersistentDatabase(name)
    await persistentDatabase.open()
    return makeRuntime(persistentDatabase, 'persistent')
  } catch {
    persistentDatabase?.close()
  }

  const memoryDatabase = await createDefaultMemoryDatabase(`${name}-session-${crypto.randomUUID()}`)
  await memoryDatabase.open()
  return makeRuntime(memoryDatabase, 'memory')
}

async function createDefaultMemoryDatabase(name: string): Promise<CalorieDatabase> {
  const { indexedDB, IDBKeyRange } = await import('fake-indexeddb')
  return new CalorieDatabase(name, { indexedDB, IDBKeyRange })
}

function makeRuntime(database: CalorieDatabase, storageMode: StorageMode): CalorieRuntime {
  return {
    database,
    service: new CalorieService(database),
    storageMode,
  }
}
