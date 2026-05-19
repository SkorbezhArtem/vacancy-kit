import { Hono } from 'hono'
import {
  CoverLetterRequestSchema,
  ResumeAuditRequestSchema,
  buildCoverLetterPrompt,
  buildResumeAuditPrompt,
  mergeResumeAudit,
  runStaticResumeChecks,
} from '@vacancy-kit/shared'
import type { CoverLetterResult } from '@vacancy-kit/shared'
import { rateLimit } from '../middleware/ratelimit'
import { ProviderError, generate } from '../llm'
import { parseResumeAuditLlmPayload, ResumeAuditParseError } from '../llm/parse-resume-audit'

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
    let lastParseError: ResumeAuditParseError | null = null

    for (let attempt = 0; attempt < 2; attempt++) {
      const output = await generate({
        system:
          attempt === 0
            ? system
            : `${system}\n\nКРИТИЧНО: ответ — один валидный JSON-объект. Без markdown, без пояснений до или после.`,
        user,
        temperature: 0.3,
        maxTokens: 8192,
        jsonMode: true,
      })
      try {
        const llmPayload = parseResumeAuditLlmPayload(output.text)
        const result = mergeResumeAudit(
          staticChecks,
          llmPayload,
          output.model,
          parsed.data.mode,
        )
        return c.json(result)
      } catch (err) {
        if (err instanceof ResumeAuditParseError) {
          lastParseError = err
          console.warn(`resume-audit parse attempt ${attempt + 1} failed:`, err.message)
          continue
        }
        throw err
      }
    }

    return c.json(
      {
        error: 'provider_error',
        message: lastParseError?.message ?? 'Model returned invalid audit JSON. Try again.',
      },
      502,
    )
  } catch (err) {
    if (err instanceof ResumeAuditParseError) {
      return c.json(
        {
          error: 'provider_error',
          message: err.message,
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
