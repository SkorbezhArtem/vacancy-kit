import { create } from 'zustand'
import type { Quota } from '@vacancy-kit/shared'
import { fetchQuota } from './api'
import { DEFAULT_QUOTA, persistQuota, readStoredQuota } from './quota'

interface AppState {
  quota: Quota
  initialised: boolean
  /** Fetch from API (or mock storage) and update state. */
  refresh: () => Promise<void>
  /** Read chrome.storage only — use from storage.onChanged, no network. */
  applyFromStorage: () => Promise<void>
  consume: (n?: number) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  quota: DEFAULT_QUOTA,
  initialised: false,
  refresh: async () => {
    try {
      const quota = await fetchQuota()
      set({ quota, initialised: true })
    } catch {
      const quota = await readStoredQuota()
      set({ quota, initialised: true })
    }
  },
  applyFromStorage: async () => {
    const quota = await readStoredQuota()
    set({ quota, initialised: true })
  },
  consume: async (n = 1) => {
    const current = get().quota
    const limit = current.limit || DEFAULT_QUOTA.limit
    const next: Quota = {
      ...current,
      used: Math.min(limit, current.used + n),
    }
    await persistQuota(next)
    set({ quota: next })
  },
}))
