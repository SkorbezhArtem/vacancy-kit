import { jsPDF } from 'jspdf'
import type {
  ResumeAuditMode,
  ResumeAuditResult,
  ResumeImprovementItem,
  ResumeProfile,
} from '@vacancy-kit/shared'

const MARGIN = 18
const PAGE_W = 210
const LINE_H = 5.5
const MAX_W = PAGE_W - MARGIN * 2

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[]
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > 285) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function writeBlock(
  doc: jsPDF,
  y: number,
  title: string,
  body: string,
  titleSize = 12,
): number {
  y = ensureSpace(doc, y, 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(titleSize)
  doc.text(title, MARGIN, y)
  y += LINE_H + 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const line of wrapText(doc, body, MAX_W)) {
    y = ensureSpace(doc, y, LINE_H)
    doc.text(line, MARGIN, y)
    y += LINE_H
  }
  return y + 3
}

function writeList(doc: jsPDF, y: number, title: string, items: string[]): number {
  if (items.length === 0) return y
  y = ensureSpace(doc, y, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, MARGIN, y)
  y += LINE_H + 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const item of items) {
    for (const line of wrapText(doc, `• ${item}`, MAX_W)) {
      y = ensureSpace(doc, y, LINE_H)
      doc.text(line, MARGIN, y)
      y += LINE_H
    }
  }
  return y + 2
}

function writeImprovements(
  doc: jsPDF,
  y: number,
  title: string,
  items: ResumeImprovementItem[],
): number {
  if (items.length === 0) return y
  y = ensureSpace(doc, y, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, MARGIN, y)
  y += LINE_H + 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  for (const item of items) {
    const block = `Сейчас: ${item.now}\nПроблема: ${item.problem}\nКак исправить: ${item.fix}\nПочему: ${item.why}`
    for (const line of wrapText(doc, block, MAX_W)) {
      y = ensureSpace(doc, y, LINE_H)
      doc.text(line, MARGIN, y)
      y += LINE_H
    }
    y += 2
  }
  return y
}

function modeTitle(mode: ResumeAuditMode): string {
  return mode === 'ats' ? 'ATS-отчёт' : 'Обычный отчёт'
}

export function downloadResumeAuditPdf(
  resume: ResumeProfile,
  result: ResumeAuditResult,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Результаты анализа резюме', MARGIN, y)
  y += 10

  doc.setFontSize(28)
  doc.text(`${result.score}/100`, MARGIN, y)
  y += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Итоговая оценка · ${modeTitle(result.mode)}`, MARGIN, y)
  y += 8

  y = writeBlock(doc, y, 'Короткий вывод', result.summary)

  if (result.mode === 'normal' && result.normalReport) {
    const r = result.normalReport
    y = writeBlock(doc, y, 'Грейд и вывод', r.gradeVerdict)
    y = writeList(doc, y, 'Сильные стороны', result.strengths)
    y = writeList(doc, y, 'Критические проблемы', r.impact.critical.length ? r.impact.critical : ['Не обнаружено'])
    y = writeList(doc, y, 'Серьёзно снижает шансы', r.impact.serious)
    y = writeList(doc, y, 'Немного снижает шансы', r.impact.minor)
    y = writeImprovements(doc, y, 'Критичные улучшения', r.improvements.critical)
    y = writeImprovements(doc, y, 'Важные улучшения', r.improvements.important)
    y = writeImprovements(doc, y, 'Желательные улучшения', r.improvements.optional)
    if (r.metricsExamples?.length) {
      y = writeList(doc, y, 'Есть примеры метрик', r.metricsExamples)
    }
    if (r.closing) {
      y = writeBlock(
        doc,
        y,
        'Финал',
        `Самое важное: ${r.closing.priority}\nПозже: ${r.closing.later}\nСовет: ${r.closing.tip}`,
      )
    }
    if (r.detailedReview?.length) {
      y = ensureSpace(doc, y, 14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Детальная информация', MARGIN, y)
      y += LINE_H + 3
      for (const item of r.detailedReview) {
        y = writeBlock(doc, y, item.title, item.message, 10)
      }
    }
  } else if (result.mode === 'ats' && result.atsReport) {
    const r = result.atsReport
    y = writeBlock(doc, y, 'Совместимость с ATS', r.compatibilityNotes)
    y = writeList(doc, y, 'Сильные ключевые слова', r.keywordStrengths)
    y = writeList(doc, y, 'Пробелы в ключевых словах', r.keywordGaps)
    y = writeList(doc, y, 'Предупреждения по формату', r.formattingWarnings)
    y = writeList(doc, y, 'Рекомендуемые заголовки секций', r.recommendedHeadings)
    y = writeList(doc, y, 'Сильные стороны', result.strengths)
  } else {
    y = writeList(doc, y, 'Сильные стороны', result.strengths)
    y = writeList(doc, y, 'Приоритеты', result.priorities)
    const issues = result.checks.filter((c) => c.severity !== 'ok')
    for (const c of issues) {
      y = writeBlock(
        doc,
        y,
        `[${c.severity}] ${c.title}`,
        `${c.message}${c.fix ? `\n→ ${c.fix}` : ''}`,
        10,
      )
    }
  }

  const footer = new Date(result.generatedAt).toLocaleString('ru-RU')
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${resume.title ?? resume.sourceFileName ?? 'Резюме'} · vacancy-kit · ${footer}`,
      MARGIN,
      292,
    )
  }

  const safeName = (resume.sourceFileName ?? resume.title ?? 'resume')
    .replace(/[^\wа-яА-Я.-]+/gi, '_')
    .slice(0, 40)
  doc.save(`cv_analysis_${safeName}_${result.mode}.pdf`)
}
