import type { CoverLetterRequest, CoverLetterResult } from '@vacancy-kit/shared'
import { getAnonId } from './identity'
import { generateMockCoverLetter } from './llm/mock'

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

const USE_MOCK = (env.VITE_USE_MOCK ?? 'false').toLowerCase() === 'true'
const API_BASE = env.VITE_API_BASE ?? 'http://localhost:8000'

export async function generateCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
  if (USE_MOCK) {
    return generateMockCoverLetter(req)
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
