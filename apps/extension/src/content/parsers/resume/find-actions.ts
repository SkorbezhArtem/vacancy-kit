import { firstMatch } from './parse-utils'

/**
 * Row with «Редактировать» / скачать / опубликовать on resume view (hh / rabota).
 */
export function findResumeActionsContainer(doc: Document): HTMLElement | null {
  const explicit = firstMatch(doc, [
    '[data-qa="resume-header-actions"]',
    '[data-qa="resume-action-panel"]',
    '[data-qa="resume-toolbar"]',
    '[data-qa="resume__actions"]',
    '[class*="resume-header__actions"]',
    '[class*="resume-actions"]',
  ])
  if (explicit) return explicit

  const anchor = firstMatch(doc, [
    '[data-qa="resume-edit-link"]',
    '[data-qa="resume-edit-button"]',
    '[data-qa="resume-edit"]',
    'a[href*="/resume/edit"]',
    '[data-qa="resume-download-link"]',
    '[data-qa="resume-download-button"]',
    '[data-qa="resume-download"]',
    'a[href*="resume_converter"]',
    'button[data-qa*="resume-edit"]',
    'a[data-qa*="resume-edit"]',
  ])

  if (anchor) {
    const row =
      anchor.closest<HTMLElement>(
        '[data-qa="resume-header-actions"], [data-qa="resume-action-panel"], [class*="resume-header"], [class*="resume-actions"], [class*="actions"]',
      ) ?? anchor.parentElement
    if (row) return row
  }

  const header = firstMatch(doc, [
    '[data-qa="resume-header"]',
    '[class*="resume-header"]',
    '[class*="ResumeHeader"]',
  ])

  if (header) {
    const inner = firstMatch(header, ['[class*="actions"]', '[data-qa*="action"]'])
    return inner ?? header
  }

  return null
}
