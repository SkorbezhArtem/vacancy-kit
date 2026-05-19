import { Hono } from 'hono'
import {
  CoverLetterRequestSchema,
  LlmResumeAuditPayloadSchema,
  ResumeAuditRequestSchema,
  buildCoverLetterPrompt,
  buildResumeAuditPrompt,
  mergeResumeAudit,
  runStaticResumeChecks,
} from '@vacancy-kit/shared'
import type { CoverLetterResult } from '@vacancy-kit/shared'
import { rateLimit } from '../middleware/ratelimit'
import { ProviderError, generate } from '../llm'
import { extractJsonObject } from '../llm/parse-json'

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

generationRoutes.post('/api/v1/generations/resume-audit', rateLimit, async (c) => {
  const raw = await c.req.json().catch(() => null)
  if (!raw) {
    return c.json({ error: 'invalid_json', message: 'Body must be valid JSON' }, 400)
  }

  const parsed = ResumeAuditRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json(
      {
        error: 'validation_failed',
        issues: parsed.error.flatten(),
      },
      400,
    )
  }

  const staticChecks = runStaticResumeChecks(parsed.data.resume, parsed.data.mode)
  const { system, user } = buildResumeAuditPrompt(parsed.data)

  try {
    const output = await generate({ system, user, temperature: 0.35, maxTokens: 3200 })
    const jsonText = extractJsonObject(output.text)
    const llmParsed = LlmResumeAuditPayloadSchema.safeParse(JSON.parse(jsonText))

    if (!llmParsed.success) {
      console.warn('resume-audit llm json invalid:', llmParsed.error.flatten())
      return c.json(
        {
          error: 'provider_error',
          message: 'Model returned invalid audit JSON. Try again.',
        },
        502,
      )
    }

    const result = mergeResumeAudit(
      staticChecks,
      llmParsed.data,
      output.model,
      parsed.data.mode,
    )
    return c.json(result)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json(
        {
          error: 'provider_error',
          message: 'Model returned non-JSON audit. Try again.',
        },
        502,
      )
    }
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
