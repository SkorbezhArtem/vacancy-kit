import type { ResumeAuditCheck, ResumeAuditMode, ResumeProfile } from './resume-audit-types'

const CLICHE_RE =
  /\b(ответственн|коммуникабельн|стрессоустойчив|целеустремл|командн(?:ый|ая) игрок|быстро обучаем)\w*/gi

const EDUCATION_HINT_RE =
  /(университет|институт|академи|колледж|техникум|бакалавр|магистр|специалитет|аспирантур|mba|phd|вуз\b)/i

/** Structured field or plain-text hint that education exists on the page. */
export function isEducationPresent(resume: ResumeProfile): boolean {
  if (resume.education.length > 0) return true
  const raw = resume.rawText
  if (!/образован/i.test(raw)) return false
  return EDUCATION_HINT_RE.test(raw)
}

export function runStaticResumeChecks(
  resume: ResumeProfile,
  mode: ResumeAuditMode = 'normal',
): ResumeAuditCheck[] {
  const checks: ResumeAuditCheck[] = []
  const push = (check: ResumeAuditCheck) => checks.push(check)

  if (!resume.title?.trim()) {
    push({
      id: 'missing_title',
      category: 'completeness',
      severity: 'critical',
      title: 'Нет желаемой должности',
      message: 'Рекрутер не видит, на какую роль вы откликаетесь.',
      fix: 'Укажите целевую позицию в заголовке резюме.',
    })
  }

  const summary = resume.summary?.trim() ?? ''
  if (!summary) {
    push({
      id: 'missing_summary',
      category: 'completeness',
      severity: 'critical',
      title: 'Пустой блок «О себе»',
      message: 'Без краткого питча HR редко читает резюме до конца.',
      fix: 'Добавьте 3–5 предложений: специализация, сильные стороны, тип задач.',
    })
  } else if (summary.length < 120) {
    push({
      id: 'short_summary',
      category: 'content',
      severity: 'warn',
      title: 'Слишком короткое «О себе»',
      message: `Сейчас ~${summary.length} символов — мало контекста для ATS и рекрутера.`,
      fix: 'Расширьте до 400–800 символов с конкретикой по стеку и результатам.',
    })
  } else if (summary.length > 2200) {
    push({
      id: 'long_summary',
      category: 'structure',
      severity: 'warn',
      title: 'Перегруженное «О себе»',
      message: 'Длинный текст в начале снижает конверсию просмотра.',
      fix: 'Сократите до ключевых тезисов, детали перенесите в опыт.',
    })
  }

  if (CLICHE_RE.test(summary)) {
    push({
      id: 'summary_cliches',
      category: 'content',
      severity: 'warn',
      title: 'Шаблонные фразы в «О себе»',
      message: 'Клише вроде «ответственный» и «командный игрок» не выделяют вас.',
      fix: 'Замените на факты: стек, домен, метрики, тип проектов.',
    })
  }

  if (resume.skills.length === 0) {
    push({
      id: 'missing_skills',
      category: 'ats',
      severity: 'critical',
      title: 'Нет ключевых навыков',
      message: 'ATS и поиск hh сопоставляют резюме по навыкам.',
      fix: 'Добавьте 8–15 релевантных hard skills.',
    })
  } else if (resume.skills.length < 5) {
    push({
      id: 'few_skills',
      category: 'ats',
      severity: 'warn',
      title: 'Мало навыков',
      message: `Указано ${resume.skills.length} — часто этого недостаточно для подбора.`,
      fix: 'Добавьте инструменты, фреймворки и доменные теги из целевых вакансий.',
    })
  }

  if (resume.experience.length === 0) {
    push({
      id: 'missing_experience',
      category: 'completeness',
      severity: 'critical',
      title: 'Нет опыта работы',
      message: 'Блок опыта — главный критерий отбора.',
      fix: 'Добавьте места работы с ролью, периодом и результатами.',
    })
  } else {
    const hasDigits = resume.experience.some((e) => /\d/.test(e))
    if (!hasDigits) {
      push({
        id: 'experience_no_metrics',
        category: 'impact',
        severity: 'warn',
        title: 'В опыте нет цифр',
        message: 'Буллеты без метрик слабее убеждают нанимающего менеджера.',
        fix: 'Добавьте %, сроки, объёмы, деньги или масштаб (команда, трафик).',
      })
    }
  }

  if (!isEducationPresent(resume)) {
    push({
      id: 'missing_education',
      category: 'completeness',
      severity: 'warn',
      title: 'Нет образования',
      message: 'Для части работодателей это обязательный блок.',
      fix: 'Укажите вуз/курсы или явно отметьте, если не применимо.',
    })
  }

  if (mode === 'ats') {
    const hasEmail = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(resume.rawText)
    if (!hasEmail) {
      push({
        id: 'ats_missing_email',
        category: 'ats',
        severity: 'warn',
        title: 'Нет email в тексте',
        message: 'ATS и рекрутеры часто ищут контакт по email; для PDF/файла добавьте явно.',
        fix: 'Добавьте email в шапку резюме одной строкой.',
      })
    }
    const hasPhone = /\+?\d[\d\s()-]{8,}/.test(resume.rawText)
    if (!hasPhone) {
      push({
        id: 'ats_missing_phone',
        category: 'ats',
        severity: 'warn',
        title: 'Нет телефона',
        message: 'Телефон повышает шанс быстрого контакта после автоматического скрининга.',
        fix: 'Укажите телефон в международном или локальном формате.',
      })
    }
    if (resume.skills.length < 10) {
      push({
        id: 'ats_keyword_density',
        category: 'ats',
        severity: resume.skills.length < 5 ? 'critical' : 'warn',
        title: 'Мало ATS-ключевых слов',
        message: 'Для зарубежных ATS важен плотный блок skills с точными названиями технологий.',
        fix: 'Добавьте 12–20 hard skills из целевых JD (английские названия).',
      })
    }
  }

  const rawLen = resume.rawText.trim().length
  if (rawLen < 400) {
    push({
      id: 'resume_too_short',
      category: 'structure',
      severity: 'critical',
      title: 'Резюме слишком короткое',
      message: `Собрано ~${rawLen} символов — похоже, парсер не увидел все блоки.`,
      fix: 'Откройте полную страницу резюме на сайте и повторите проверку.',
    })
  }

  return checks
}
