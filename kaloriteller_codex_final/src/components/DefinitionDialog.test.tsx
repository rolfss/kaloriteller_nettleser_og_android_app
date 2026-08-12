import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PendingEntry } from '../domain/models'
import { DefinitionDialog } from './DefinitionDialog'

const pending: PendingEntry = {
  parsed: {
    kind: 'custom-count', rawText: '3 flasker', quantity: 3,
    customLabel: 'flasker', normalizedCustomLabel: 'flasker',
  },
}

describe('unknown definition dialog', () => {
  it('shows the raw interpretation and submits explicit custom data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => Promise.resolve())
    render(<DefinitionDialog pending={pending} busy={false} error="" onCancel={vi.fn()} onSave={onSave} />)
    expect(screen.getByText(/3 flasker/)).toBeVisible()
    expect(screen.getByLabelText('Beregningsgrunnlag')).toHaveValue('custom-count')
    const name = screen.getByLabelText('Navn på enhet')
    await user.clear(name)
    await user.type(name, 'flaske')
    await user.type(screen.getByLabelText(/Kalorier per 1/), '150')
    await user.type(screen.getByLabelText(/Alias/), 'flasker')
    await user.click(screen.getByRole('button', { name: 'Lagre og legg til' }))
    expect(onSave).toHaveBeenCalledWith({
      basis: 'custom-count', name: 'flaske', caloriesPerUnit: 150, aliases: ['flasker'],
    })
  })
})
