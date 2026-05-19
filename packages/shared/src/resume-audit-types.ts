import type { Language, SiteId } from './types'

export type ResumeAuditMode = 'normal' | 'ats'

export type AuditSeverity = 'ok' | 'warn' | 'critical'

export type AuditCategory =
  | 'structure'
  | 'content'
  | 'ats'
  | 'impact'
  | 'grammar'
  | 'completeness'

export interface ResumeProfile {
  site: SiteId
  id: string
  url: string
  title: string | null
  fullName: string | null
  summary: string | null
  skills: string[]
  experience: string[]
  education: string[]
  languages: string[]
  /** Plain-text dump for the model when structured fields are sparse. */
  rawText: string
  /** Original filename when uploaded from disk. */
  sourceFileName?: string | null
}

export interface ResumeAuditCheck {
  id: string
  category: AuditCategory
  severity: AuditSeverity
  title: string
  message: string
  fix: string | null
}

export interface ResumeImprovementItem {
  now: string
  problem: string
  fix: string
  why: string
}

/** Detailed report sections (normal / recruiter-focused). */
export interface ResumeAuditNormalReport {
  gradeVerdict: string
  impact: {
    critical: string[]
    serious: string[]
    minor: string[]
  }
  improvements: {
    critical: ResumeImprovementItem[]
    important: ResumeImprovementItem[]
    optional: ResumeImprovementItem[]
  }
  metricsExamples?: string[]
  closing?: {
    priority: string
    later: string
    tip: string
  }
  detailedReview?: Array<{ title: string; message: string }>
}

/** ATS-specific highlights (international / parsing focus). */
export interface ResumeAuditAtsReport {
  compatibilityNotes: string
  keywordStrengths: string[]
  keywordGaps: string[]
  formattingWarnings: string[]
  recommendedHeadings: string[]
}

export interface ResumeAuditRequest {
  resume: ResumeProfile
  language: Language
  mode: ResumeAuditMode
}

export interface ResumeAuditResult {
  score: number
  grade: 'weak' | 'fair' | 'good' | 'excellent'
  summary: string
  strengths: string[]
  priorities: string[]
  checks: ResumeAuditCheck[]
  generatedAt: string
  model: string
  mode: ResumeAuditMode
  normalReport?: ResumeAuditNormalReport
  atsReport?: ResumeAuditAtsReport
}
