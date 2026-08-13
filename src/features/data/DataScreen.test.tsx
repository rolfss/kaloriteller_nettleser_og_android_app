import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataScreen } from './DataScreen'

describe('data and privacy UI', () => {
  it('explains demo lifetime and exposes local export controls', () => {
    render(
      <DataScreen
        storageMode="demo"
        busy={false}
        installStatus="instructions"
        onInstall={vi.fn(() => Promise.resolve())}
        onBack={vi.fn()}
        onBackup={vi.fn(() => Promise.resolve())}
        onCsv={vi.fn(() => Promise.resolve())}
        onImport={vi.fn(() => Promise.resolve())}
        onClear={vi.fn(() => Promise.resolve())}
      />,
    )
    expect(screen.getByText(/Demomodus bruker bare minnet/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sikkerhetskopi (JSON)' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Regnearkdata (CSV)' })).toBeVisible()
    expect(screen.getAllByText(/sendes ikke til en server/)).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Last ned Android APK' })).toHaveAttribute('href', expect.stringContaining('kaloriteller-android-test.apk'))
    expect(screen.getByText(/Installer fra Chrome/)).toBeVisible()
  })

  it('requires an in-app confirmation before clearing all data', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn(() => Promise.resolve())
    render(
      <DataScreen
        storageMode="persistent"
        busy={false}
        installStatus="instructions"
        onInstall={vi.fn(() => Promise.resolve())}
        onBack={vi.fn()}
        onBackup={vi.fn(() => Promise.resolve())}
        onCsv={vi.fn(() => Promise.resolve())}
        onImport={vi.fn(() => Promise.resolve())}
        onClear={onClear}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Slett alt' }))
    expect(onClear).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Slett alle data' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('uses the browser installation prompt when it is available', async () => {
    const user = userEvent.setup()
    const onInstall = vi.fn(() => Promise.resolve())
    render(
      <DataScreen
        storageMode="persistent"
        busy={false}
        installStatus="available"
        onInstall={onInstall}
        onBack={vi.fn()}
        onBackup={vi.fn(() => Promise.resolve())}
        onCsv={vi.fn(() => Promise.resolve())}
        onImport={vi.fn(() => Promise.resolve())}
        onClear={vi.fn(() => Promise.resolve())}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Installer appen' }))
    expect(onInstall).toHaveBeenCalledOnce()
  })
})
