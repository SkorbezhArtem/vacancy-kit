import { QuotaSchema, type Quota } from '@vacancy-kit/shared'

export const QUOTA_STORAGE_KEY = 'vk.quota'

export const DEFAULT_QUOTA: Quota = { used: 0, limit: 3, resetsAt: null }

const VK_LIMIT = 'x-vk-quota-limit'
const VK_REMAINING = 'x-vk-quota-remaining'
const VK_RESET = 'x-vk-quota-reset'

/** Clamp invalid numbers; keep limit from API / storage as-is (incl. test values in .env). */
export function normalizeQuota(quota: Quota): Quota {
  let limit = quota.limit
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_QUOTA.limit
  }

  let used = quota.used
  if (!Number.isFinite(used) || used < 0) used = 0
  used = Math.min(used, limit)

  return {
    used,
    limit,
    resetsAt: quota.resetsAt,
  }
}

export async function readStoredQuota(): Promise<Quota> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return DEFAULT_QUOTA
  }
  const result = await chrome.storage.local.get(QUOTA_STORAGE_KEY)
  const raw = result[QUOTA_STORAGE_KEY]
  const parsed = QuotaSchema.safeParse(raw)
  return parsed.success ? normalizeQuota(parsed.data) : DEFAULT_QUOTA
}

function quotaEquals(a: Quota, b: Quota): boolean {
  return a.used === b.used && a.limit === b.limit && a.resetsAt === b.resetsAt
}

/** Persists only when changed — avoids storage.onChanged feedback loops. */
export async function persistQuota(quota: Quota): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return
  const next = normalizeQuota(quota)
  const current = await readStoredQuota()
  if (quotaEquals(current, next)) return
  await chrome.storage.local.set({ [QUOTA_STORAGE_KEY]: next })
}

export function quotaFromVkHeaders(response: Response): Quota | null {
  const limitRaw = response.headers.get(VK_LIMIT)
  const remainingRaw = response.headers.get(VK_REMAINING)
  const reset = response.headers.get(VK_RESET)

  if (limitRaw == null || remainingRaw == null) return null

  const limit = Number(limitRaw)
  const remaining = Number(remainingRaw)
  if (!Number.isFinite(limit) || !Number.isFinite(remaining)) return null

  const parsed = QuotaSchema.safeParse({
    used: Math.max(0, limit - remaining),
    limit,
    resetsAt: reset,
  })

  return parsed.success ? normalizeQuota(parsed.data) : null
}
