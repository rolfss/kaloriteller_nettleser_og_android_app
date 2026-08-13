import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

export const ANDROID_APK_URL = 'https://github.com/rolfss/kaloriteller_nettleser_og_android_app/releases/download/v1.1.0/kaloriteller-android-test.apk'
export const ANDROID_RELEASE_URL = 'https://github.com/rolfss/kaloriteller_nettleser_og_android_app/releases/tag/v1.1.0'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export type InstallStatus = 'installed' | 'available' | 'instructions'
export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notifyListeners()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyListeners()
  })
}

export function useAppInstall(): { status: InstallStatus; requestInstall: () => Promise<InstallOutcome> } {
  const [status, setStatus] = useState<InstallStatus>(getInstallStatus)

  useEffect(() => {
    const update = () => setStatus(getInstallStatus())
    listeners.add(update)
    const media = window.matchMedia?.('(display-mode: standalone)')
    media?.addEventListener?.('change', update)
    return () => {
      listeners.delete(update)
      media?.removeEventListener?.('change', update)
    }
  }, [])

  const requestInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) return 'unavailable'
    const prompt = deferredPrompt
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') deferredPrompt = null
    notifyListeners()
    return choice.outcome
  }, [])

  return { status, requestInstall }
}

function getInstallStatus(): InstallStatus {
  if (Capacitor.isNativePlatform() || isStandalone()) return 'installed'
  return deferredPrompt ? 'available' : 'instructions'
}

function isStandalone(): boolean {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches === true || standaloneNavigator.standalone === true
}
