import { create } from 'zustand'
import type { Quota } from '@vacancy-kit/shared'
import { fetchQuotaFromApi } from './api'
import { DEFAULT_QUOTA, persistQuota, readStoredQuota } from './quota'

interface AppState {
  quota: Quota
  quotaSyncing: boolean
  initialised: boolean
  refresh: () => Promise<void>
  applyFromStorage: () => Promise<void>
  consume: (n?: number) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  quota: DEFAULT_QUOTA,
  quotaSyncing: false,
  initialised: false,
  refresh: async () => {
    const cached = await readStoredQuota()
    set({ quota: cached, initialised: true })

    set({ quotaSyncing: true })
    try {
      const fresh = await fetchQuotaFromApi()
      set({ quota: fresh, quotaSyncing: false })
    } catch {
      set({ quotaSyncing: false })
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
