import type { CoverLetterRequest, CoverLetterResult } from '../types'

const OPENINGS_RU = [
  'Добрый день! Увидел вашу вакансию и сразу захотел откликнуться.',
  'Здравствуйте! Хочу предложить свою кандидатуру на позицию',
  'Привет! Прочитал описание вакансии — звучит как именно то, что я ищу.',
]

const OPENINGS_EN = [
  'Hi there — I came across this role and wanted to reach out right away.',
  'Hello! Your job description lined up so closely with what I do that I had to apply.',
  'Hi team, quick note on why I think I would be a strong fit for this position.',
]

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length]
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
}

export async function generateMockCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
  await delay(700 + Math.random() * 900)

  const seed = hashString(`${req.vacancy.id}|${req.vacancy.title}|${req.tone}`)
  const openings = req.language === 'ru' ? OPENINGS_RU : OPENINGS_EN
  const opening = pick(openings, seed)

  const skills = req.vacancy.keySkills.slice(0, 5)
  const skillList = skills.length > 0
    ? skills.join(', ')
    : (req.language === 'ru' ? 'указанным в вакансии стеком' : 'the stack you listed')

  const company = req.vacancy.company ?? (req.language === 'ru' ? 'вашу команду' : 'your team')
  const title = req.vacancy.title

  const body = req.language === 'ru'
    ? `${opening} «${title}» в ${company}.

За последние несколько лет я работал с ${skillList}, и эти инструменты — то, на чём я ежедневно решаю продуктовые задачи. В описании вакансии особенно зацепило то, что вы ищете человека, способного не просто кодить по тикетам, а вникать в продукт — это как раз мой стиль работы.

Готов созвониться в удобное время и подробнее рассказать про релевантные проекты. Спасибо, что прочитали!`
    : `${opening}

Looking at the role at ${company}, the focus on ${skillList} matches what I have been building for the past few years. I tend to dig into product context before reaching for code — and from the description, it sounds like that is exactly how your team works.

Happy to jump on a short call whenever it works for you. Thanks for reading!`

  return {
    text: body,
    highlights: [
      `Matched on: ${skills.slice(0, 3).join(', ') || 'general fit'}`,
      `Tone: ${req.tone}`,
      `Language: ${req.language}`,
    ],
    generatedAt: new Date().toISOString(),
    model: 'mock-v0',
    cached: false,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
