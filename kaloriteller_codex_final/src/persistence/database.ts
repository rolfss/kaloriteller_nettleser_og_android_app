import Dexie, { type EntityTable } from 'dexie'
import type { CalorieDefinition, Day, Entry } from '../domain/models'

export class CalorieDatabase extends Dexie {
  days!: EntityTable<Day, 'id'>
  entries!: EntityTable<Entry, 'id'>
  definitions!: EntityTable<CalorieDefinition, 'id'>

  constructor(name = 'kaloriteller') {
    super(name)
    this.version(1).stores({
      days: '&id,status,logDate,completedAt',
      entries: '&id,dayId,createdAt',
      definitions: '&id,kind,[normalizedItemName+measure],normalizedCanonicalLabel,*normalizedAliases',
    })
  }
}

export const database = new CalorieDatabase()
