import {
  isEducationPresent,
  mergeResumeAudit,
  runStaticResumeChecks,
  type ResumeAuditRequest,
  type ResumeAuditResult,
} from '@vacancy-kit/shared'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateMockResumeAudit(req: ResumeAuditRequest): Promise<ResumeAuditResult> {
  await delay(500 + Math.random() * 400)

  const staticChecks = runStaticResumeChecks(req.resume, req.mode)
  const critical = staticChecks.filter((c) => c.severity === 'critical').length
  const warn = staticChecks.filter((c) => c.severity === 'warn').length

  const baseScore = 78 - critical * 15 - warn * 6
  const score = Math.max(25, Math.min(92, baseScore))

  const modelChecks = [
    {
      id: 'role_focus',
      category: 'content' as const,
      severity: req.resume.title ? ('ok' as const) : ('warn' as const),
      title: req.resume.title ? 'Понятная целевая роль' : 'Слабый фокус роли',
      message: req.resume.title
        ? `Заголовок «${req.resume.title}» задаёт ожидания рекрутера.`
        : 'Без должности в заголовке резюме хуже ранжируется в поиске.',
      fix: req.resume.title ? null : 'Уточните грейд и специализацию в заголовке.',
    },
    {
      id: 'ats_keywords',
      category: 'ats' as const,
      severity: req.resume.skills.length >= 8 ? ('ok' as const) : ('warn' as const),
      title: 'ATS-ключевые слова',
      message:
        req.resume.skills.length >= 8
          ? 'Набор навыков достаточен для автоматического матчинга.'
          : 'Мало ключевых слов для ATS и поиска hh.',
      fix: req.resume.skills.length >= 8 ? null : 'Добавьте стек из 3–5 целевых вакансий.',
    },
    {
      id: 'impact_bullets',
      category: 'impact' as const,
      severity: 'warn' as const,
      title: 'Сила формулировок опыта',
      message: 'Часть буллетов можно усилить глаголами действия и измеримым результатом.',
      fix: 'Начинайте пункты с глагола: «внедрил», «сократил», «увеличил» + метрика.',
    },
    {
      id: 'summary_tone',
      category: 'grammar' as const,
      severity: 'ok' as const,
      title: 'Тон «О себе»',
      message: 'Текст в целом деловой, без явного панибратства.',
      fix: null,
    },
    {
      id: 'education_present',
      category: 'completeness' as const,
      severity: isEducationPresent(req.resume) ? ('ok' as const) : ('warn' as const),
      title: 'Блок образования',
      message: isEducationPresent(req.resume)
        ? 'Образование заполнено.'
        : 'Образование не указано — добавьте при наличии.',
      fix: isEducationPresent(req.resume) ? null : 'Укажите вуз или релевантные курсы.',
    },
    {
      id: 'structure_scan',
      category: 'structure' as const,
      severity: 'ok' as const,
      title: 'Сканируемость',
      message: 'Основные блоки резюме разделены — HR может быстро пробежать глазами.',
      fix: null,
    },
    {
      id: 'language_block',
      category: 'completeness' as const,
      severity: req.resume.languages.length > 0 ? ('ok' as const) : ('warn' as const),
      title: 'Иностранные языки',
      message:
        req.resume.languages.length > 0
          ? 'Языки указаны.'
          : 'Если вакансии требуют English — добавьте уровень.',
      fix: req.resume.languages.length > 0 ? null : 'Укажите язык и уровень (B2, C1…).',
    },
    {
      id: 'contact_visibility',
      category: 'structure' as const,
      severity: 'ok' as const,
      title: 'Контакты',
      message: 'Контактные данные доступны в тексте резюме.',
      fix: null,
    },
  ]

  const normalReport =
    req.mode === 'normal'
      ? {
          gradeVerdict: `Резюме на позицию «${req.resume.title ?? 'не указана'}» — ${score}/100. ${
            critical === 0
              ? 'Критических проблем не обнаружено.'
              : `Есть ${critical} критических замечаний.`
          }`,
          impact: {
            critical: critical > 0 ? ['Устраните критические пробелы из списка проверок.'] : [],
            serious:
              warn > 0
                ? ['Усильте буллеты опыта метриками и бизнес-результатом.']
                : [],
            minor: ['Добавьте 1–2 предложения об архитектурных trade-off в ключевых проектах.'],
          },
          improvements: {
            critical: [
              {
                now: 'Опыт без цифр',
                problem: 'Сложно оценить масштаб вклада',
                fix: 'Добавьте %, сроки, объёмы, пользователей',
                why: 'Метрики повышают доверие рекрутера',
              },
            ],
            important: [
              {
                now: 'Список технологий без контекста',
                problem: 'Неясно, где применялись навыки',
                fix: 'Привяжите стек к конкретным проектам',
                why: 'Рекрутер видит релевантность стека',
              },
            ],
            optional: [],
          },
          metricsExamples: [
            'Время отклика API под нагрузкой',
            'Покрытие тестами критических путей',
            'Количество активных пользователей продукта',
          ],
          closing: {
            priority: 'Усильте 2–3 буллета в опыте измеримыми результатами.',
            later: 'Добавьте ссылку на код или демо, если ещё нет.',
            tip: 'Откликайтесь с тем же заголовком, что в резюме.',
          },
          detailedReview: [
            {
              title: 'Профессиональное саммари',
              message: req.resume.summary
                ? 'Блок «О себе» присутствует и задаёт контекст.'
                : 'Добавьте краткое саммари в начало.',
            },
            {
              title: 'Опыт работы',
              message:
                req.resume.experience.length > 0
                  ? 'Опыт описан; можно усилить метриками.'
                  : 'Опыт не извлечён — проверьте структуру файла.',
            },
          ],
        }
      : undefined

  const atsReport =
    req.mode === 'ats'
      ? {
          compatibilityNotes:
            'Резюме в целом читаемо как plain text. Для международных ATS добавьте английские заголовки секций и расширьте блок Skills.',
          keywordStrengths: req.resume.skills.slice(0, 5),
          keywordGaps: ['Agile', 'Code Review', 'Unit Testing'].filter(
            (k) => !req.resume.rawText.toLowerCase().includes(k.toLowerCase()),
          ),
          formattingWarnings: [
            'Убедитесь, что резюме — один столбец без таблиц',
            'Используйте стандартные заголовки: Experience, Education, Skills',
          ],
          recommendedHeadings: [
            'Summary',
            'Experience',
            'Skills',
            'Education',
            'Languages',
          ],
        }
      : undefined

  return mergeResumeAudit(
    staticChecks,
    {
      score,
      grade: score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'weak',
      summary:
        req.language === 'ru'
          ? `Резюме получило ${score}/100 (режим: ${req.mode === 'ats' ? 'ATS' : 'обычный'}). Критичных: ${critical}, предупреждений: ${warn}.`
          : `Resume scored ${score}/100 (${req.mode} mode).`,
      strengths: [
        req.resume.skills.length >= 5 ? 'Заполнен блок навыков' : 'Есть базовая структура резюме',
        req.resume.experience.length >= 1 ? 'Опыт работы описан' : 'Текст резюме доступен для анализа',
      ],
      priorities: staticChecks
        .filter((c) => c.severity !== 'ok')
        .slice(0, 3)
        .map((c) => c.fix ?? c.title),
      checks: [...staticChecks, ...modelChecks],
      normalReport,
      atsReport,
    },
    'mock-audit-v1',
    req.mode,
  )
}
