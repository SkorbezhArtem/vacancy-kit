import type { ResumeAuditCheck, ResumeAuditResult } from './resume-audit-types'

function gradeFromScore(score: number): ResumeAuditResult['grade'] {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'weak'
}

/** Merge static + model checks; static critical issues cap the score. */
export function mergeResumeAudit(
  staticChecks: ResumeAuditCheck[],
  model: Omit<ResumeAuditResult, 'generatedAt' | 'model' | 'mode'> & {
    checks: ResumeAuditCheck[]
  },
  modelName: string,
  mode: ResumeAuditResult['mode'],
): ResumeAuditResult {
  const byId = new Map<string, ResumeAuditCheck>()
  for (const c of staticChecks) byId.set(c.id, c)
  for (const c of model.checks) {
    if (!byId.has(c.id)) byId.set(c.id, c)
  }

  const checks = Array.from(byId.values())
  const critical = checks.filter((c) => c.severity === 'critical').length
  const warn = checks.filter((c) => c.severity === 'warn').length

  let score = model.score
  score -= critical * 12
  score -= warn * 4
  score = Math.max(0, Math.min(100, Math.round(score)))

  const generatedAt = new Date().toISOString()

  return {
    score,
    grade: gradeFromScore(score),
    summary: model.summary,
    strengths: model.strengths.slice(0, 6),
    priorities: model.priorities.slice(0, 5),
    checks,
    generatedAt,
    model: modelName,
    mode,
    normalReport: model.normalReport,
    atsReport: model.atsReport,
  }
}
