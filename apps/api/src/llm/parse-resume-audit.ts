import { LlmResumeAuditPayloadSchema } from '@vacancy-kit/shared'
import type { z } from 'zod'
import { parseJsonObject } from './parse-json'

export type ParsedResumeAuditPayload = z.infer<typeof LlmResumeAuditPayloadSchema>

export class ResumeAuditParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResumeAuditParseError'
  }
}

/** Parse and validate LLM resume-audit JSON; tolerates minor schema drift. */
export function parseResumeAuditLlmPayload(text: string): ParsedResumeAuditPayload {
  let data: unknown
  try {
    data = parseJsonObject(text)
  } catch {
    throw new ResumeAuditParseError('Model returned non-JSON audit')
  }

  const parsed = LlmResumeAuditPayloadSchema.safeParse(data)
  if (parsed.success) return parsed.data

  const coerced = coercePayload(data)
  const retry = LlmResumeAuditPayloadSchema.safeParse(coerced)
  if (retry.success) return retry.data

  throw new ResumeAuditParseError('Model returned invalid audit JSON')
}

const CATEGORIES = new Set([
  'structure',
  'content',
  'ats',
  'impact',
  'grammar',
  'completeness',
])
const SEVERITIES = new Set(['ok', 'warn', 'critical'])

function coerceCategory(value: unknown): string {
  return typeof value === 'string' && CATEGORIES.has(value) ? value : 'content'
}

function coerceSeverity(value: unknown): string {
  return typeof value === 'string' && SEVERITIES.has(value) ? value : 'warn'
}

function coercePayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const o = data as Record<string, unknown>

  const checks = Array.isArray(o.checks) ? o.checks : []
  const normalizedChecks = checks
    .filter((c) => c && typeof c === 'object')
    .map((c, i) => {
      const row = c as Record<string, unknown>
      return {
        id: String(row.id ?? `check_${i + 1}`),
        category: coerceCategory(row.category),
        severity: coerceSeverity(row.severity),
        title: String(row.title ?? 'Проверка'),
        message: String(row.message ?? ''),
        fix: row.fix == null ? null : String(row.fix),
      }
    })

  return {
    ...o,
    score: Math.round(Number(o.score ?? 0)),
    grade: o.grade ?? 'fair',
    summary: String(o.summary ?? 'Аудит выполнен.'),
    strengths: Array.isArray(o.strengths) ? o.strengths.map(String) : [],
    priorities: Array.isArray(o.priorities) ? o.priorities.map(String) : [],
    checks: normalizedChecks,
    normalReport: o.normalReport,
    atsReport: o.atsReport,
  }
}
