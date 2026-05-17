import type { CoverLetterRequest } from './types'

const TONE_HINTS_RU = {
  neutral: 'нейтрально, без излишней эмоциональности',
  friendly: 'дружелюбно, тепло, но без панибратства',
  formal: 'официально, на «вы», без слов-паразитов',
} as const

const TONE_HINTS_EN = {
  neutral: 'neutral, plain, no fluff',
  friendly: 'warm and approachable but professional',
  formal: 'formal, polished, business tone',
} as const

const SYSTEM_RU = `Ты — карьерный консультант, который пишет короткие сопроводительные письма для отклика на вакансию.

Правила:
- 120–180 слов, 3–4 коротких абзаца.
- Без шаблонных фраз вида «энергичный, целеустремлённый, ответственный».
- Без громких заявлений и приукрашиваний. Только то, что реально следует из вакансии и резюме (если оно есть).
- Зацепи 2–3 ключевых требования вакансии и объясни, как кандидат им соответствует. Если резюме нет — опирайся только на стек/обязанности из вакансии и говори от первого лица в духе «работал с …».
- Заверши коротким приглашением на созвон.
- Не выдумывай факты, опыт, проекты или цифры, которых нет в резюме.
- Не упоминай AI, нейросеть, что письмо сгенерировано.
- Никаких эмодзи.

Формат ответа: только текст письма, без заголовков и подписи в стиле «С уважением, …».`

const SYSTEM_EN = `You write short, specific cover letters for job applications.

Rules:
- 120–180 words, 3–4 short paragraphs.
- No cliches like "passionate, motivated, results-driven".
- No exaggeration. Only claims that follow from the vacancy and the resume (if provided).
- Hook on 2–3 key requirements from the vacancy and explain how the candidate matches. If no resume — speak only from the vacancy stack/duties, first-person, like "I've worked with …".
- End with a short call to chat.
- Never invent facts, experience, projects or numbers that aren't in the resume.
- Don't mention AI, language models, or that this was generated.
- No emojis.

Output format: letter body only, no subject line, no sign-off like "Sincerely, …".`

export interface PromptPair {
  system: string
  user: string
}

export function buildCoverLetterPrompt(req: CoverLetterRequest): PromptPair {
  const lang = req.language
  const system = lang === 'ru' ? SYSTEM_RU : SYSTEM_EN
  const toneHint = lang === 'ru' ? TONE_HINTS_RU[req.tone] : TONE_HINTS_EN[req.tone]

  const skills = req.vacancy.keySkills.slice(0, 12).join(', ')
  const description = truncate(req.vacancy.description, 2400)

  const resumeBlock = req.resume
    ? formatResume(req.resume, lang)
    : lang === 'ru'
      ? '(резюме не приложено — опирайся только на вакансию)'
      : '(no resume attached — rely on the vacancy alone)'

  const user = lang === 'ru'
    ? `Тон письма: ${toneHint}.

Вакансия:
- Должность: ${req.vacancy.title}
- Компания: ${req.vacancy.company ?? '—'}
- Локация: ${req.vacancy.location ?? '—'}
- Зарплата: ${req.vacancy.salary ?? '—'}
- Ключевые навыки из вакансии: ${skills || '—'}
- Описание вакансии:
"""
${description}
"""

Резюме кандидата:
${resumeBlock}

Напиши сопроводительное письмо по правилам из system-сообщения.`
    : `Tone: ${toneHint}.

Vacancy:
- Title: ${req.vacancy.title}
- Company: ${req.vacancy.company ?? '—'}
- Location: ${req.vacancy.location ?? '—'}
- Salary: ${req.vacancy.salary ?? '—'}
- Key skills from the vacancy: ${skills || '—'}
- Vacancy description:
"""
${description}
"""

Candidate resume:
${resumeBlock}

Write the cover letter following the rules in the system message.`

  return { system, user }
}

function formatResume(resume: NonNullable<CoverLetterRequest['resume']>, lang: 'ru' | 'en'): string {
  const lines: string[] = []
  if (resume.title) lines.push(lang === 'ru' ? `- Желаемая роль: ${resume.title}` : `- Target role: ${resume.title}`)
  if (resume.summary) lines.push(lang === 'ru' ? `- О себе: ${resume.summary}` : `- About: ${resume.summary}`)
  if (resume.skills.length > 0) {
    lines.push(lang === 'ru' ? `- Навыки: ${resume.skills.join(', ')}` : `- Skills: ${resume.skills.join(', ')}`)
  }
  if (resume.experience.length > 0) {
    const exp = resume.experience.slice(0, 6).map((e) => `  • ${e}`).join('\n')
    lines.push(lang === 'ru' ? `- Опыт:\n${exp}` : `- Experience:\n${exp}`)
  }
  return lines.join('\n') || (lang === 'ru' ? '(резюме пустое)' : '(empty resume)')
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max).trimEnd()}…`
}
