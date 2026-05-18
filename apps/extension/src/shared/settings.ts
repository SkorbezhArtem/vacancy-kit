import type { UserSettings } from '@vacancy-kit/shared'

const SETTINGS_KEY = 'vk.settings'

export const DEFAULT_SETTINGS: UserSettings = {
  defaultTone: 'neutral',
  defaultLanguage: 'ru',
  hideOnClosedVacancies: false,
}

function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

export async function getSettings(): Promise<UserSettings> {
  if (!hasStorage()) return DEFAULT_SETTINGS
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  const stored = result[SETTINGS_KEY] as Partial<UserSettings> | undefined
  if (!stored) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function setSettings(settings: UserSettings): Promise<void> {
  if (!hasStorage()) return
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings()
  const next: UserSettings = { ...current, ...patch }
  await setSettings(next)
  return next
}
