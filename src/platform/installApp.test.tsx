import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useAppInstall } from './installApp'

function InstallHarness() {
  const install = useAppInstall()
  return (
    <div>
      <span>{install.status}</span>
      <button type="button" onClick={() => { void install.requestInstall() }}>Install</button>
    </div>
  )
}

describe('browser app installation', () => {
  it('captures and uses the browser install prompt', async () => {
    const prompt = vi.fn(() => Promise.resolve())
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>
    }
    event.prompt = prompt
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
    window.dispatchEvent(event)

    const user = userEvent.setup()
    render(<InstallHarness />)
    expect(screen.getByText('available')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Install' }))
    expect(prompt).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.getByText('instructions')).toBeVisible())
  })
})
