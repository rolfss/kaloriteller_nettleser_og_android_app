export class ApplicationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApplicationError'
  }
}

export class PersistenceError extends ApplicationError {
  constructor(message = 'Lokale data kunne ikke leses trygt.') {
    super(message)
    this.name = 'PersistenceError'
  }
}
