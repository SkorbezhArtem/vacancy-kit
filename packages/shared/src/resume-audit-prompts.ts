import type { ResumeAuditMode, ResumeAuditRequest } from './resume-audit-types'
import { isEducationPresent } from './resume-static-checks'
import type { PromptPair } from './prompts'

const JSON_SCHEMA = `{
  "score": <0-100>,
  "grade": "weak" | "fair" | "good" | "excellent",
  "summary": "<2-3 предложения>",
  "strengths": ["..."],
  "priorities": ["топ-1", "топ-2", "топ-3"],
  "checks": [{ "id", "category", "severity", "title", "message", "fix" }],
  "normalReport": { ... }  // только для mode=normal
  "atsReport": { ... }      // только для mode=ats
}`

const NORMAL_REPORT_SCHEMA = `"normalReport": {
  "gradeVerdict": "<грейд и 2-3 предложения вывода>",
  "impact": {
    "critical": ["..."],
    "serious": ["..."],
    "minor": ["..."]
  },
  "improvements": {
    "critical": [{ "now", "problem", "fix", "why" }],
    "important": [{ "now", "problem", "fix", "why" }],
    "optional": [{ "now", "problem", "fix", "why" }]
  },
  "metricsExamples": ["пример метрики 1", "..."],
  "closing": { "priority", "later", "tip" },
  "detailedReview": [{ "title": "<критерий>", "message": "<оценка>" }]
}`

const ATS_REPORT_SCHEMA = `"atsReport": {
  "compatibilityNotes": "<2-3 предложения о совместимости с ATS>",
  "keywordStrengths": ["..."],
  "keywordGaps": ["..."],
  "formattingWarnings": ["..."],
  "recommendedHeadings": ["Experience", "Skills", ...]
}`

function systemRu(mode: ResumeAuditMode): string {
  if (mode === 'ats') {
    return `Ты — эксперт по ATS (Applicant Tracking System) и резюме для зарубежных вакансий.

Проведи ATS-аудит резюме. Верни ТОЛЬКО валидный JSON без markdown.

Схема:
${JSON_SCHEMA}
${ATS_REPORT_SCHEMA}

Правила ATS-режима:
- Фокус: парсинг автоматикой, ключевые слова на английском, стандартные заголовки секций, plain text, без таблиц/колонок/графики.
- Минимум 10 checks; половина с category "ats".
- Заполни atsReport; normalReport не включай.
- Не выдумывай факты.
- grade: 0-49 weak, 50-69 fair, 70-84 good, 85-100 excellent.`
  }

  return `Ты — карьерный консультант для рынка РФ (hh.ru, rabota.by): оценка для живого рекрутера.

Проведи подробный аудит резюме. Верни ТОЛЬКО валидный JSON без markdown.

Схема:
${JSON_SCHEMA}
${NORMAL_REPORT_SCHEMA}

Правила обычного режима:
- Фокус: рекрутер в РФ, читаемость за 6–7 секунд, конкретика, метрики, отсутствие воды.
- Минимум 10 checks (включая severity "ok" где блок силён).
- Заполни normalReport если успеваешь: impact, improvements (по 1–2 пункта на уровень), detailedReview (6+ критериев). Если не помещается — опусти normalReport, но checks и summary обязательны.
- improvements: каждый пункт с полями now, problem, fix, why.
- Не выдумывай факты.
- grade: 0-49 weak, 50-69 fair, 70-84 good, 85-100 excellent.`
}

function systemEn(mode: ResumeAuditMode): string {
  if (mode === 'ats') {
    return `You are an ATS resume expert. Return ONLY valid JSON.

Schema: score, grade, summary, strengths, priorities, checks (14+), atsReport (required), no normalReport.
Focus: keyword matching, parse-friendly layout, standard headings, no tables/columns. Do not invent facts.`
  }

  return `You are a career coach for recruiter-facing resumes. Return ONLY valid JSON.

Schema: score, grade, summary, strengths, priorities, checks (16+), normalReport (required with impact, improvements, detailedReview 12+ criteria). Do not invent facts.`
}

function formatList(items: string[], emptyLabel: string): string {
  if (items.length === 0) return emptyLabel
  return items.map((s) => `- ${s}`).join('\n')
}

function formatEducation(req: ResumeAuditRequest): string {
  if (req.resume.education.length > 0) return formatList(req.resume.education, '—')
  if (isEducationPresent(req.resume)) {
    return req.language === 'ru'
      ? '(указано на странице — см. полный текст ниже)'
      : '(present on page — see full text below)'
  }
  return '—'
}

function modeLabel(mode: ResumeAuditMode, lang: 'ru' | 'en'): string {
  if (lang === 'ru') return mode === 'ats' ? 'ATS (зарубежные вакансии)' : 'Обычный (рекрутеры РФ)'
  return mode === 'ats' ? 'ATS (international)' : 'Normal (recruiters)'
}

export function buildResumeAuditPrompt(req: ResumeAuditRequest): PromptPair {
  const lang = req.language
  const system = lang === 'ru' ? systemRu(req.mode) : systemEn(req.mode)
  const r = req.resume

  const user =
    lang === 'ru'
      ? `Язык отчёта: русский.
Режим проверки: ${modeLabel(req.mode, 'ru')}

Резюме:
- Источник: ${r.site}${r.sourceFileName ? ` · файл ${r.sourceFileName}` : ''}
- URL: ${r.url}
- Имя: ${r.fullName ?? '—'}
- Желаемая должность: ${r.title ?? '—'}

О себе:
${r.summary?.trim() || '—'}

Навыки:
${formatList(r.skills, '—')}

Опыт:
${formatList(r.experience, '—')}

Образование:
${formatEducation(req)}

Языки:
${formatList(r.languages, '—')}

Полный текст:
"""
${truncate(r.rawText, 8000)}
"""

Верни JSON аудита по схеме из system.`
      : `Report language: English.
Check mode: ${modeLabel(req.mode, 'en')}

Resume:
- Source: ${r.site}${r.sourceFileName ? ` · file ${r.sourceFileName}` : ''}
- URL: ${r.url}
- Name: ${r.fullName ?? '—'}
- Target role: ${r.title ?? '—'}

About:
${r.summary?.trim() || '—'}

Skills:
${formatList(r.skills, '—')}

Experience:
${formatList(r.experience, '—')}

Education:
${formatEducation(req)}

Languages:
${formatList(r.languages, '—')}

Full text:
"""
${truncate(r.rawText, 8000)}
"""

Return audit JSON per the system schema.`

  return { system, user }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max).trimEnd()}…`
}
