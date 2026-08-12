import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

if (!Object.hasOwn(HTMLDialogElement.prototype, 'showModal')) {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    value(this: HTMLDialogElement) { this.setAttribute('open', '') },
  })
}
if (!Object.hasOwn(HTMLDialogElement.prototype, 'close')) {
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    value(this: HTMLDialogElement) { this.removeAttribute('open') },
  })
}
