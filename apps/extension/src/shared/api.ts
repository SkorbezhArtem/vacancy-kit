import {
  QuotaSchema,
  ResumeAuditResultSchema,
  type CoverLetterRequest,
  type CoverLetterResult,
  type Quota,
  type ResumeAuditRequest,
  type ResumeAuditResult,
} from '@vacancy-kit/shared'
import { getAnonId } from './identity'
import { generateMockCoverLetter } from './llm/mock'
import { generateMockResumeAudit } from './llm/mock-audit'
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

let quotaFetchInFlight: Promise<Quota> | null = null

/** Network quota fetch; deduped when popup opens or sync runs in parallel. */
export async function fetchQuotaFromApi(): Promise<Quota> {
  if (USE_MOCK) {
    return readStoredQuota()
  }

  if (quotaFetchInFlight) {
    return quotaFetchInFlight
  }

  quotaFetchInFlight = (async () => {
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
  })().finally(() => {
    quotaFetchInFlight = null
  })

  return quotaFetchInFlight
}

/** @deprecated Use fetchQuotaFromApi — kept for callers expecting this name. */
export const fetchQuota = fetchQuotaFromApi

async function syncQuotaAfterRequest(response: Response): Promise<void> {
  const fromHeaders = quotaFromVkHeaders(response)
  if (fromHeaders) {
    await persistQuota(fromHeaders)
  }
  void fetchQuotaFromApi().catch(() => {})
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

  void syncQuotaAfterRequest(response)

  if (!response.ok) {
    const detail = await safeJson(response)
    throw new Error(`cover-letter request failed (${response.status}): ${detail}`)
  }

  return (await response.json()) as CoverLetterResult
}

export async function auditResume(req: ResumeAuditRequest): Promise<ResumeAuditResult> {
  if (USE_MOCK) {
    const result = await generateMockResumeAudit(req)
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

  const response = await fetch(`${API_BASE}/api/v1/generations/resume-audit`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-anon-id': anonId,
    },
    body: JSON.stringify(req),
  })

  void syncQuotaAfterRequest(response)

  if (!response.ok) {
    const detail = await safeJson(response)
    throw new Error(`resume-audit request failed (${response.status}): ${detail}`)
  }

  return ResumeAuditResultSchema.parse(await response.json())
}

async function safeJson(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return typeof body === 'string' ? body : JSON.stringify(body)
  } catch {
    return response.statusText
  }
}
