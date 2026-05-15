import { create } from 'zustand'
import type { Quota } from './types'

interface AppState {
  quota: Quota
  initialised: boolean
  refresh: () => Promise<void>
  consume: (n?: number) => Promise<void>
}

const QUOTA_KEY = 'vk.quota'
const DEFAULT_QUOTA: Quota = { used: 0, limit: 3, resetsAt: null }

async function loadQuota(): Promise<Quota> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return DEFAULT_QUOTA
  }
  const result = await chrome.storage.local.get(QUOTA_KEY)
  return (result[QUOTA_KEY] as Quota | undefined) ?? DEFAULT_QUOTA
}

async function saveQuota(quota: Quota): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return
  await chrome.storage.local.set({ [QUOTA_KEY]: quota })
}

export const useAppStore = create<AppState>((set, get) => ({
  quota: DEFAULT_QUOTA,
  initialised: false,
  refresh: async () => {
    const quota = await loadQuota()
    set({ quota, initialised: true })
  },
  consume: async (n = 1) => {
    const current = get().quota
    const next: Quota = { ...current, used: current.used + n }
    await saveQuota(next)
    set({ quota: next })
  },
}))
