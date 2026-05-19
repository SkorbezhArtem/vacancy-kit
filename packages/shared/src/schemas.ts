import { z } from 'zod'

export const SiteIdSchema = z.enum(['hh', 'rabota', 'upload'])

export const VacancySchema = z.object({
  site: SiteIdSchema,
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  company: z.string().nullable(),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  description: z.string().min(1),
  keySkills: z.array(z.string()).max(50),
})

export const ResumeSnippetSchema = z.object({
  title: z.string().nullable(),
  summary: z.string().nullable(),
  skills: z.array(z.string()),
  experience: z.array(z.string()),
})

export const CoverLetterRequestSchema = z.object({
  vacancy: VacancySchema,
  resume: ResumeSnippetSchema.nullable(),
  tone: z.enum(['neutral', 'friendly', 'formal']),
  language: z.enum(['ru', 'en']),
})

export const CoverLetterResultSchema = z.object({
  text: z.string().min(1),
  highlights: z.array(z.string()),
  generatedAt: z.string().datetime(),
  model: z.string().min(1),
  cached: z.boolean(),
})

export const QuotaSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  resetsAt: z.string().datetime().nullable(),
})

export const ToneSchema = z.enum(['neutral', 'friendly', 'formal'])
export const LanguageSchema = z.enum(['ru', 'en'])

export const UserSettingsSchema = z.object({
  defaultTone: ToneSchema,
  defaultLanguage: LanguageSchema,
  hideOnClosedVacancies: z.boolean(),
})

export const HistoryEntrySchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  highlights: z.array(z.string()),
  tone: ToneSchema,
  language: LanguageSchema,
  model: z.string().min(1),
  generatedAt: z.string().datetime(),
  vacancy: z.object({
    site: SiteIdSchema,
    id: z.string().min(1),
    url: z.string().url(),
    title: z.string().min(1),
    company: z.string().nullable(),
  }),
})
