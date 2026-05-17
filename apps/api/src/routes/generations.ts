import { Hono } from 'hono'
import { CoverLetterRequestSchema, buildCoverLetterPrompt } from '@vacancy-kit/shared'
import type { CoverLetterResult } from '@vacancy-kit/shared'
import { rateLimit } from '../middleware/ratelimit'
import { ProviderError, generate } from '../llm'

export const generationRoutes = new Hono()

generationRoutes.post('/api/v1/generations/cover-letter', rateLimit, async (c) => {
  const raw = await c.req.json().catch(() => null)
  if (!raw) {
    return c.json({ error: 'invalid_json', message: 'Body must be valid JSON' }, 400)
  }

  const parsed = CoverLetterRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json(
      {
        error: 'validation_failed',
        issues: parsed.error.flatten(),
      },
      400,
    )
  }

  const { system, user } = buildCoverLetterPrompt(parsed.data)

  try {
    const output = await generate({ system, user, temperature: 0.7, maxTokens: 600 })

    const result: CoverLetterResult = {
      text: output.text,
      highlights: extractHighlights(output.text),
      generatedAt: new Date().toISOString(),
      model: output.model,
      cached: false,
    }

    return c.json(result)
  } catch (err) {
    if (err instanceof ProviderError) {
      const status = err.retryable ? 503 : 502
      return c.json(
        {
          error: 'provider_error',
          provider: err.provider,
          message: err.message,
        },
        status,
      )
    }
    throw err
  }
})

function extractHighlights(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 180)

  return sentences.slice(0, 3)
}
