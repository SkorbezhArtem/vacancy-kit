import type { HistoryEntry } from '@vacancy-kit/shared'

const HISTORY_KEY = 'vk.history'
const MAX_HISTORY = 20

function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

export async function getHistory(): Promise<HistoryEntry[]> {
  if (!hasStorage()) return []
  const result = await chrome.storage.local.get(HISTORY_KEY)
  const stored = result[HISTORY_KEY] as HistoryEntry[] | undefined
  return Array.isArray(stored) ? stored : []
}

async function saveHistory(items: HistoryEntry[]): Promise<void> {
  if (!hasStorage()) return
  await chrome.storage.local.set({ [HISTORY_KEY]: items })
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
