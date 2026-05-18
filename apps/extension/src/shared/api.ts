import { QuotaSchema, type CoverLetterRequest, type CoverLetterResult, type Quota } from '@vacancy-kit/shared'
import { getAnonId } from './identity'
import { generateMockCoverLetter } from './llm/mock'
import {
  DEFAULT_QUOTA,
  normalizeQuota,
  persistQuota,
  quotaFromVkHeaders,
  readStoredQuota,
} from './quota'

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

const USE_MOCK = (env.VITE_USE_MOCK ?? 'false').toLowerCase() === 'true'
const API_BASE = env.VITE_API_BASE ?? 'http://localhost:8000'

export async function fetchQuota(): Promise<Quota> {
  if (USE_MOCK) {
    return readStoredQuota()
  }

  const anonId = await getAnonId()
  const response = await fetch(`${API_BASE}/api/v1/quota`, {
    headers: { 'x-anon-id': anonId },
  })

  if (!response.ok) {
    const detail = await safeJson(response)
    throw new Error(`quota request failed (${response.status}): ${detail}`)
  }

  const quota = normalizeQuota(QuotaSchema.parse(await response.json()))
  await persistQuota(quota)
  return quota
}

async function syncQuotaAfterRequest(response: Response): Promise<void> {
  try {
    await fetchQuota()
    return
  } catch {
    const quota = quotaFromVkHeaders(response)
    if (quota) await persistQuota(quota)
  }
}

export async function generateCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
  if (USE_MOCK) {
    const result = await generateMockCoverLetter(req)
    const current = await readStoredQuota()
    const limit = current.limit || DEFAULT_QUOTA.limit
    const used = Math.min(limit, current.used + 1)
    await persistQuota({
      used,
      limit,
      resetsAt: current.resetsAt,
    })
    return result
  }

  const anonId = await getAnonId()

  const response = await fetch(`${API_BASE}/api/v1/generations/cover-letter`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-anon-id': anonId,
    },
    body: JSON.stringify(req),
  })

  await syncQuotaAfterRequest(response)

  if (!response.ok) {
    const detail = await safeJson(response)
    throw new Error(`cover-letter request failed (${response.status}): ${detail}`)
  }

  return (await response.json()) as CoverLetterResult
}

async function safeJson(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return typeof body === 'string' ? body : JSON.stringify(body)
  } catch {
    return response.statusText
  }
}
