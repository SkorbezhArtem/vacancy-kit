import type {
  Content,
  StyleDictionary,
  TDocumentDefinitions,
} from 'pdfmake/interfaces'
import type {
  ResumeAuditCheck,
  ResumeAuditMode,
  ResumeAuditResult,
  ResumeImprovementItem,
  ResumeProfile,
} from '@vacancy-kit/shared'
import { pdfIcon, preparePdfIcons, scoreBadgeImage } from './resume-audit-pdf-icons'

const M = (t: number, r = 0, b = 0, l = 0): [number, number, number, number] => [l, t, r, b]

function modeTitle(mode: ResumeAuditMode): string {
  return mode === 'ats' ? 'ATS-отчёт' : 'Обычный отчёт'
}

function scoreColor(score: number): string {
  if (score >= 75) return '#0d9488'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function sectionHeader(title: string, iconKey: 'section' | 'score' = 'section'): Content {
  const icon = pdfIcon(iconKey, 18)
  return {
    columns: [
      icon,
      { text: title, style: 'h2', margin: M(1, 0, 0, 8) },
    ],
    columnGap: 0,
    margin: M(14, 0, 6, 0),
  }
}

function labeledLine(label: string, value: string, labelColor = '#71717a'): Content {
  return {
    text: [
      { text: `${label}: `, color: labelColor, fontSize: 10 },
      { text: value, fontSize: 10, color: '#27272a' },
    ],
    margin: M(3, 0, 0, 0),
  }
}

/** Bordered card with left accent stripe (via table). */
function cardTable(
  inner: Content,
  opts: { fill?: string; border?: string; margin?: [number, number, number, number] },
): Content {
  const border = opts.border ?? '#e4e4e7'
  return {
    table: {
      widths: [3, '*'],
      body: [
        [
          { text: '', fillColor: border },
          { stack: [inner], margin: M(10, 12, 10, 12) },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[][] } }) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: (i: number) => (i === 0 || i === 2 ? 1 : 0),
      hLineColor: () => border,
      vLineColor: () => border,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    fillColor: opts.fill ?? '#fafafa',
    margin: opts.margin ?? M(0, 0, 8, 0),
  }
}

function fixCard(text: string): Content {
  const inner: Content = {
    columns: [
      pdfIcon('fix'),
      {
        stack: [
          { text: 'Как исправить', style: 'fixTitle' },
          { text, style: 'fixBody' },
        ],
        margin: M(0, 0, 0, 8),
      },
    ],
    columnGap: 0,
  }
  return {
    table: {
      widths: ['*'],
      body: [[{ ...inner, margin: M(8, 10, 8, 10) }]],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#99f6e4',
      vLineColor: () => '#99f6e4',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    fillColor: '#ecfdf5',
    margin: M(8, 0, 0, 0),
  }
}

function remarkCard(
  iconKey: 'critical' | 'warn' | 'info' | 'remark',
  title: string | null,
  lines: Content[],
  border: string,
): Content {
  const body: Content[] = title
    ? [
        {
          columns: [
            pdfIcon(iconKey),
            { text: title, bold: true, fontSize: 11, color: '#18181b', margin: M(0, 0, 0, 8) },
          ],
          margin: M(0, 0, 6, 0),
        },
        { stack: lines, margin: M(0, 0, 0, 24) },
      ]
    : [{ columns: [pdfIcon(iconKey), { stack: lines, margin: M(0, 0, 0, 8) }] }]
  return cardTable({ stack: body }, { fill: '#fafafa', border, margin: M(0, 0, 8, 0) })
}

function improvementCard(
  item: ResumeImprovementItem,
  severity: 'critical' | 'important' | 'optional',
): Content {
  const border =
    severity === 'critical' ? '#fca5a5' : severity === 'important' ? '#fcd34d' : '#d4d4d8'
  const iconKey = severity === 'critical' ? 'critical' : severity === 'important' ? 'warn' : 'info'
  return remarkCard(iconKey, null, [
    labeledLine('Сейчас', item.now),
    labeledLine('Проблема', item.problem),
    fixCard(item.fix),
    labeledLine('Почему', item.why),
  ], border)
}

function bulletList(iconKey: 'check' | 'critical' | 'warn' | 'info', items: string[]): Content[] {
  if (items.length === 0) return []
  return items.map((item) => ({
    columns: [
      pdfIcon(iconKey),
      { text: item, fontSize: 10, color: '#3f3f46', margin: M(0, 0, 0, 8), width: '*' },
    ],
    margin: M(0, 0, 4, 0),
  }))
}

function improvementsSection(
  title: string,
  items: ResumeImprovementItem[],
  severity: 'critical' | 'important' | 'optional',
): Content[] {
  if (items.length === 0) return []
  return [
    { text: title, style: 'h3', margin: M(12, 0, 6, 0) },
    ...items.map((item) => improvementCard(item, severity)),
  ]
}

function checkCard(check: ResumeAuditCheck): Content {
  const severityIcon =
    check.severity === 'critical' ? 'critical' : check.severity === 'warn' ? 'warn' : 'info'
  const border =
    check.severity === 'critical'
      ? '#fca5a5'
      : check.severity === 'warn'
        ? '#fcd34d'
        : '#bbf7d0'

  const lines: Content[] = [
    {
      text: check.message,
      fontSize: 10,
      color: '#52525b',
      margin: M(4, 0, 0, 0),
    },
  ]
  if (check.fix) {
    lines.push(fixCard(check.fix))
  }

  return remarkCard(severityIcon, check.title, lines, border)
}

function scoreHeader(score: number, subtitle: string): Content {
  const color = scoreColor(score)
  return {
    columns: [
      scoreBadgeImage(score, color),
      {
        stack: [
          { text: 'Результаты анализа резюме', style: 'h1', margin: M(0) },
          { text: `${score}/100`, style: 'scoreInline', color },
          { text: subtitle, style: 'meta', margin: M(2, 0, 0, 0) },
        ],
        width: '*',
        margin: M(4, 0, 0, 12),
      },
    ],
    margin: M(0, 0, 14, 0),
  }
}

function buildDocument(resume: ResumeProfile, result: ResumeAuditResult): TDocumentDefinitions {
  const title = resume.title ?? resume.fullName ?? resume.sourceFileName ?? 'Резюме'
  const footer = new Date(result.generatedAt).toLocaleString('ru-RU')
  const subtitle = `Итоговая оценка · ${modeTitle(result.mode)} · ${title}`

  const content: Content[] = [
    scoreHeader(result.score, subtitle),
    sectionHeader('Короткий вывод'),
    { text: result.summary, style: 'body', margin: M(0, 0, 8, 0) },
  ]

  if (result.strengths.length > 0) {
    content.push(sectionHeader('Сильные стороны'), ...bulletList('check', result.strengths))
  }

  if (result.mode === 'normal' && result.normalReport) {
    const r = result.normalReport
    content.push(
      sectionHeader('Грейд и вывод'),
      { text: r.gradeVerdict, style: 'body', margin: M(0, 0, 10, 0) },
    )

    content.push(
      sectionHeader('Влияние на отклики'),
      { text: 'Критические проблемы', style: 'h3', margin: M(8, 0, 4, 0) },
      ...bulletList(
        'critical',
        r.impact.critical.length ? r.impact.critical : ['Не обнаружено'],
      ),
    )
    if (r.impact.serious.length) {
      content.push(
        { text: 'Серьёзно снижает шансы', style: 'h3', margin: M(8, 0, 4, 0) },
        ...bulletList('warn', r.impact.serious),
      )
    }
    if (r.impact.minor.length) {
      content.push(
        { text: 'Немного снижает шансы', style: 'h3', margin: M(8, 0, 4, 0) },
        ...bulletList('info', r.impact.minor),
      )
    }

    content.push(
      sectionHeader('Улучшения'),
      ...improvementsSection('Критичные улучшения', r.improvements.critical, 'critical'),
      ...improvementsSection('Важные улучшения', r.improvements.important, 'important'),
      ...improvementsSection('Желательные улучшения', r.improvements.optional, 'optional'),
    )

    if (r.metricsExamples?.length) {
      content.push(
        sectionHeader('Примеры метрик'),
        ...bulletList('check', r.metricsExamples),
      )
    }

    if (r.closing) {
      content.push(
        sectionHeader('Финал'),
        cardTable(
          {
            stack: [
              labeledLine('Самое важное', r.closing.priority),
              labeledLine('Позже', r.closing.later),
              labeledLine('Совет', r.closing.tip),
            ],
          },
          { fill: '#f8fafc', border: '#cbd5e1' },
        ),
      )
    }

    if (r.detailedReview?.length) {
      content.push(sectionHeader('Детальная информация'))
      for (const item of r.detailedReview) {
        content.push(
          remarkCard(
            'remark',
            item.title,
            [{ text: item.message, fontSize: 10, color: '#52525b', margin: M(4, 0, 0, 0) }],
            '#93c5fd',
          ),
        )
      }
    }
  } else if (result.mode === 'ats' && result.atsReport) {
    const r = result.atsReport
    content.push(
      sectionHeader('Совместимость с ATS'),
      { text: r.compatibilityNotes, style: 'body', margin: M(0, 0, 10, 0) },
      { text: 'Сильные ключевые слова', style: 'h3', margin: M(8, 0, 4, 0) },
      ...bulletList('check', r.keywordStrengths),
      { text: 'Пробелы в ключевых словах', style: 'h3', margin: M(8, 0, 4, 0) },
      ...bulletList('warn', r.keywordGaps),
      { text: 'Предупреждения по формату', style: 'h3', margin: M(8, 0, 4, 0) },
      ...bulletList('warn', r.formattingWarnings),
      { text: 'Рекомендуемые заголовки секций', style: 'h3', margin: M(8, 0, 4, 0) },
      ...bulletList('info', r.recommendedHeadings),
    )
  }

  const issueChecks = result.checks.filter((c) => c.severity !== 'ok')
  if (issueChecks.length > 0) {
    content.push(sectionHeader('Проверки'))
    for (const check of issueChecks) {
      content.push(checkCard(check))
    }
  } else if (!result.normalReport && !result.atsReport) {
    content.push(
      ...bulletList('check', result.priorities.length ? result.priorities : ['—']),
    )
  }

  content.push({
    columns: [pdfIcon('score', 16), { text: `${title} · vacancy-kit · ${footer}`, style: 'footer' }],
    margin: M(18, 0, 0, 0),
    columnGap: 6,
  })

  const styles: StyleDictionary = {
    h1: { fontSize: 18, bold: true, color: '#18181b' },
    scoreInline: { fontSize: 22, bold: true, margin: M(2, 0, 0, 0) },
    meta: { fontSize: 10, color: '#71717a' },
    h2: { fontSize: 13, bold: true, color: '#18181b' },
    h3: { fontSize: 11, bold: true, color: '#3f3f46' },
    body: { fontSize: 11, color: '#3f3f46', lineHeight: 1.4 },
    fixTitle: { fontSize: 10, bold: true, color: '#0f766e', margin: M(0, 0, 2, 0) },
    fixBody: { fontSize: 10, color: '#134e4a', lineHeight: 1.35 },
    footer: { fontSize: 9, color: '#a1a1aa' },
  }

  return {
    content,
    styles,
    defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.35 },
    pageMargins: [44, 44, 44, 52],
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Vector PDF with Roboto (Cyrillic), cards and icons. */
export async function downloadResumeAuditPdf(
  resume: ResumeProfile,
  result: ResumeAuditResult,
): Promise<void> {
  const { getPdfMake } = await import('./pdfmake-client')
  await preparePdfIcons(result.score, scoreColor(result.score))
  const pdfMake = getPdfMake()
  const doc = buildDocument(resume, result)
  const safeName = (resume.sourceFileName ?? resume.title ?? 'resume')
    .replace(/[^\wа-яА-ЯёЁ.-]+/gi, '_')
    .slice(0, 40)
  const filename = `cv_analysis_${safeName}_${result.mode}.pdf`

  const blob = await pdfMake.createPdf(doc).getBlob()
  triggerDownload(blob, filename)
}
