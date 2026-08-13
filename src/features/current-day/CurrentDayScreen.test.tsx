import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

describe('current day UI', () => {
  it('submits the composer and clears it after a successful add', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn(() => Promise.resolve(true))
    render(
      <CurrentDayScreen
        active={null} error="" busy={false} onAdd={onAdd}
        onSelectEntry={vi.fn()} onHistory={vi.fn()} onDefinitions={vi.fn()} onComplete={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('Hva spiste du?')
    await user.type(input, '15 g tran')
    await user.click(screen.getByRole('button', { name: 'Legg til innlegg' }))
    expect(onAdd).toHaveBeenCalledWith('15 g tran')
    expect(input).toHaveValue('')
  })

  it('shows an old-open-day warning and keeps the composer usable', () => {
    render(
      <CurrentDayScreen
        active={oldActive} error="" busy={false} onAdd={vi.fn(() => Promise.resolve(true))}
        onSelectEntry={vi.fn()} onHistory={vi.fn()} onDefinitions={vi.fn()} onComplete={vi.fn()}
      />,
    )
    expect(screen.getByText(/fortsatt åpen/)).toBeVisible()
    expect(screen.getByLabelText('Hva spiste du?')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Avslutt dag' })).toBeVisible()
  })

  it('associates composer validation with the input', () => {
    const { container } = render(
      <CurrentDayScreen
        active={null} error="Mengden må være et tall større enn 0." busy={false} onAdd={vi.fn(() => Promise.resolve(false))}
        onSelectEntry={vi.fn()} onHistory={vi.fn()} onDefinitions={vi.fn()} onComplete={vi.fn()}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Mengden må være')
    expect(container.querySelector('#food-entry')).toHaveAttribute('aria-describedby', 'composer-error')
  })

  it('starts with an empty composer after the current-day snapshot changes', async () => {
    const user = userEvent.setup()
    const props = {
      active: null,
      error: '',
      busy: false,
      onAdd: vi.fn(() => Promise.resolve(false)),
      onSelectEntry: vi.fn(),
      onHistory: vi.fn(),
      onDefinitions: vi.fn(),
      onComplete: vi.fn(),
    }
    const { rerender } = render(<CurrentDayScreen {...props} />)
    await user.type(screen.getByLabelText('Hva spiste du?'), '2 kjeks')
    rerender(<CurrentDayScreen {...props} active={oldActive} />)
    expect(screen.getByLabelText('Hva spiste du?')).toHaveValue('')
  })
})
