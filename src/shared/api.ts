import type { CoverLetterRequest, CoverLetterResult } from './types'
import { generateMockCoverLetter } from './llm/mock'

const USE_MOCK = true

const API_BASE = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE
  ?? 'http://localhost:8000'

export async function generateCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
  if (USE_MOCK) {
    return generateMockCoverLetter(req)
  }

  const response = await fetch(`${API_BASE}/api/v1/generations/cover-letter`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
