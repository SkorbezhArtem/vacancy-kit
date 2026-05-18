import type { UserSettings } from '@vacancy-kit/shared'

const SETTINGS_KEY = 'vk.settings'

export const DEFAULT_SETTINGS: UserSettings = {
  defaultTone: 'neutral',
  defaultLanguage: 'ru',
  hideOnClosedVacancies: false,
}

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export async function getSettings(): Promise<UserSettings> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(SETTINGS_KEY)
    const stored = result[SETTINGS_KEY] as Partial<UserSettings> | undefined
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...stored }
  }
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return DEFAULT_SETTINGS
      const parsed = JSON.parse(raw) as Partial<UserSettings>
      return { ...DEFAULT_SETTINGS, ...parsed }
    } catch {
      return DEFAULT_SETTINGS
    }
  }
  return DEFAULT_SETTINGS
}

export async function setSettings(settings: UserSettings): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
    return
  }
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      /* noop */
    }
  }
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings()
  const next: UserSettings = { ...current, ...patch }
  await setSettings(next)
  return next
}
