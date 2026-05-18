import type { HistoryEntry } from '@vacancy-kit/shared'

const HISTORY_KEY = 'vk.history'
const MAX_HISTORY = 20

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export async function getHistory(): Promise<HistoryEntry[]> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(HISTORY_KEY)
    const stored = result[HISTORY_KEY] as HistoryEntry[] | undefined
    return Array.isArray(stored) ? stored : []
  }
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
    } catch {
      return []
    }
  }
  return []
}

async function saveHistory(items: HistoryEntry[]): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [HISTORY_KEY]: items })
    return
  }
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
    } catch {
      /* noop */
    }
  }
}

export async function addToHistory(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const current = await getHistory()
  const next = [entry, ...current.filter((x) => x.id !== entry.id)].slice(0, MAX_HISTORY)
  await saveHistory(next)
  return next
}

export async function deleteFromHistory(id: string): Promise<HistoryEntry[]> {
  const current = await getHistory()
  const next = current.filter((x) => x.id !== id)
  await saveHistory(next)
  return next
}

export async function clearHistory(): Promise<void> {
  await saveHistory([])
}

export function makeHistoryId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
