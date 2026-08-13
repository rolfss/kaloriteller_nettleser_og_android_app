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
  })

  it('requires an in-app confirmation before clearing all data', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn(() => Promise.resolve())
    render(
      <DataScreen
        storageMode="persistent"
        busy={false}
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
})
