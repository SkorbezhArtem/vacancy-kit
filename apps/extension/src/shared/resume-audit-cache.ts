import type {
  Language,
  ResumeAuditMode,
  ResumeAuditResult,
  ResumeProfile,
} from '@vacancy-kit/shared'

const CACHE_KEY = 'vk.resumeAuditCache'
const MAX_ENTRIES = 12

export interface CachedResumeAudit {
  key: string
  resume: ResumeProfile
  mode: ResumeAuditMode
  language: Language
  result: ResumeAuditResult
  savedAt: string
}

export function buildAuditCacheKey(
  resume: ResumeProfile,
  mode: ResumeAuditMode,
  language: Language,
): string {
  return `${resume.site}:${resume.id}:${mode}:${language}`
}

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

async function readAll(): Promise<CachedResumeAudit[]> {
  if (!hasChromeStorage()) return []
  const result = await chrome.storage.local.get(CACHE_KEY)
  const stored = result[CACHE_KEY] as CachedResumeAudit[] | undefined
  return Array.isArray(stored) ? stored : []
}

async function writeAll(entries: CachedResumeAudit[]): Promise<void> {
  if (!hasChromeStorage()) return
  await chrome.storage.local.set({ [CACHE_KEY]: entries.slice(0, MAX_ENTRIES) })
}

export async function getCachedResumeAudit(
  key: string,
): Promise<CachedResumeAudit | null> {
  const all = await readAll()
  return all.find((e) => e.key === key) ?? null
}

export async function saveCachedResumeAudit(entry: CachedResumeAudit): Promise<void> {
  const all = await readAll()
  const next = [entry, ...all.filter((e) => e.key !== entry.key)].slice(0, MAX_ENTRIES)
  await writeAll(next)
}

export async function clearCachedResumeAudit(key: string): Promise<void> {
  const all = await readAll()
  await writeAll(all.filter((e) => e.key !== key))
}
