import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import type { DaySummary } from '../../domain/models'
import { CurrentDayScreen } from './CurrentDayScreen'

const oldActive: DaySummary = {
  day: {
    id: 'day', logDate: '2020-01-01', status: 'active',
    createdAt: '2020-01-01T08:00:00.000Z', updatedAt: '2020-01-01T08:00:00.000Z',
  },
  entries: [],
  totalCalories: 0,
}

function props(overrides: Partial<ComponentProps<typeof CurrentDayScreen>> = {}): ComponentProps<typeof CurrentDayScreen> {
  return {
    active: null,
    error: '',
    busy: false,
    draft: '',
    retentionDay: null,
    exporting: false,
    onAdd: vi.fn(() => Promise.resolve(true)),
    onDraftChange: vi.fn(),
    onSelectEntry: vi.fn(),
    onHistory: vi.fn(),
    onDefinitions: vi.fn(),
    onData: vi.fn(),
    onExportHistory: vi.fn(() => Promise.resolve()),
    onComplete: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}

describe('current day UI', () => {
  it('submits the controlled composer and requests clearing after a successful add', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn(() => Promise.resolve(true))
    const onDraftChange = vi.fn()
    render(<CurrentDayScreen {...props({ draft: '15 g tran', onAdd, onDraftChange })} />)

    await user.click(screen.getByRole('button', { name: 'Legg til innlegg' }))
    expect(onAdd).toHaveBeenCalledWith('15 g tran')
    expect(onDraftChange).toHaveBeenCalledWith('')
  })

  it('shows an old-open-day warning and keeps the composer usable', () => {
    render(<CurrentDayScreen {...props({ active: oldActive })} />)
    expect(screen.getByText(/fortsatt åpen/)).toBeVisible()
    expect(screen.getByLabelText('Hva spiste du?')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Avslutt dag' })).toBeVisible()
  })

  it('associates composer validation with the input', () => {
    const { container } = render(<CurrentDayScreen {...props({ error: 'Mengden må være et tall større enn 0.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Mengden må være')
    expect(container.querySelector('#food-entry')).toHaveAttribute('aria-describedby', 'composer-error')
  })

  it('preserves a draft when the active-day snapshot changes', () => {
    const baseProps = props({ draft: '2 kjeks' })
    const { rerender } = render(<CurrentDayScreen {...baseProps} />)
    rerender(<CurrentDayScreen {...baseProps} active={oldActive} />)
    expect(screen.getByLabelText('Hva spiste du?')).toHaveValue('2 kjeks')
  })

  it('fills the composer from a deterministic example without supplying calories', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    render(<CurrentDayScreen {...props({ onDraftChange })} />)
    await user.click(screen.getByRole('button', { name: '1,5 dl melk' }))
    expect(onDraftChange).toHaveBeenCalledWith('1,5 dl melk')
  })

  it('warns which retained day will be removed and offers export first', async () => {
    const user = userEvent.setup()
    const onExportHistory = vi.fn(() => Promise.resolve())
    const retainedDay: DaySummary = {
      day: { ...oldActive.day, id: 'old', status: 'completed', completedAt: '2020-01-01T20:00:00.000Z' },
      entries: [],
      totalCalories: 0,
    }
    render(<CurrentDayScreen {...props({ active: oldActive, retentionDay: retainedDay, onExportHistory })} />)
    await user.click(screen.getByRole('button', { name: 'Avslutt dag' }))
    expect(screen.getByText(/Historikken er full/)).toBeVisible()
    expect(screen.getByText(/1. januar 2020/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Eksporter historikken først' }))
    expect(onExportHistory).toHaveBeenCalledOnce()
  })
})
