import { z } from 'zod'
import { LanguageSchema, SiteIdSchema } from './schemas'

export const ResumeAuditModeSchema = z.enum(['normal', 'ats'])

export const AuditSeveritySchema = z.enum(['ok', 'warn', 'critical'])
export const AuditCategorySchema = z.enum([
  'structure',
  'content',
  'ats',
  'impact',
  'grammar',
  'completeness',
])

export const ResumeProfileSchema = z.object({
  site: SiteIdSchema,
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().nullable(),
  fullName: z.string().nullable(),
  summary: z.string().nullable(),
  skills: z.array(z.string()),
  experience: z.array(z.string()),
  education: z.array(z.string()),
  languages: z.array(z.string()),
  rawText: z.string().min(1),
  sourceFileName: z.string().nullable().optional(),
})

export const ResumeAuditCheckSchema = z.object({
  id: z.string().min(1),
  category: AuditCategorySchema,
  severity: AuditSeveritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  fix: z.string().nullable(),
})

export const ResumeImprovementItemSchema = z.object({
  now: z.string().min(1),
  problem: z.string().min(1),
  fix: z.string().min(1),
  why: z.string().min(1),
})

export const ResumeAuditNormalReportSchema = z.object({
  gradeVerdict: z.string().min(1),
  impact: z.object({
    critical: z.array(z.string()),
    serious: z.array(z.string()),
    minor: z.array(z.string()),
  }),
  improvements: z.object({
    critical: z.array(ResumeImprovementItemSchema),
    important: z.array(ResumeImprovementItemSchema),
    optional: z.array(ResumeImprovementItemSchema),
  }),
  metricsExamples: z.array(z.string()).optional(),
  closing: z
    .object({
      priority: z.string().min(1),
      later: z.string().min(1),
      tip: z.string().min(1),
    })
    .optional(),
  detailedReview: z
    .array(
      z.object({
        title: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .optional(),
})

export const ResumeAuditAtsReportSchema = z.object({
  compatibilityNotes: z.string().min(1),
  keywordStrengths: z.array(z.string()),
  keywordGaps: z.array(z.string()),
  formattingWarnings: z.array(z.string()),
  recommendedHeadings: z.array(z.string()),
})

export const ResumeAuditRequestSchema = z.object({
  resume: ResumeProfileSchema,
  language: LanguageSchema,
  mode: ResumeAuditModeSchema.default('normal'),
})

export const ResumeAuditResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z.enum(['weak', 'fair', 'good', 'excellent']),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  priorities: z.array(z.string()),
  checks: z.array(ResumeAuditCheckSchema).min(1),
  generatedAt: z.string().datetime(),
  model: z.string().min(1),
  mode: ResumeAuditModeSchema,
  normalReport: ResumeAuditNormalReportSchema.optional(),
  atsReport: ResumeAuditAtsReportSchema.optional(),
})

export const LlmResumeAuditPayloadSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  grade: z.enum(['weak', 'fair', 'good', 'excellent']),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  priorities: z.array(z.string()),
  checks: z.array(ResumeAuditCheckSchema).min(6),
  normalReport: ResumeAuditNormalReportSchema.optional(),
  atsReport: ResumeAuditAtsReportSchema.optional(),
})
