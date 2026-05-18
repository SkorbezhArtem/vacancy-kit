import type { Vacancy } from '@vacancy-kit/shared'
import type { SiteParser } from './types'

function text(el: Element | null | undefined): string {
  if (!el) return ''
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function firstMatch(doc: Document, selectors: readonly string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel) as HTMLElement | null
    if (el) return el
  }
  return null
}

function vacancyIdFromUrl(url: URL): string | null {
  const m = url.pathname.match(/\/vacancy\/(\d+)/)
  return m?.[1] ?? null
}

export const hhParser: SiteParser = {
  site: 'hh',

  isVacancyPage(url) {
    return /\/vacancy\/\d+/.test(url.pathname)
  },

  isSearchPage(url) {
    return url.pathname.startsWith('/search/vacancy')
  },

  parseVacancy(doc, url) {
    const id = vacancyIdFromUrl(url)
    if (!id) return null

    const titleEl = firstMatch(doc, [
      '[data-qa="vacancy-title"]',
      'h1.vacancy-title',
      'h1[class*="vacancy-title"]',
      'h1',
    ])

    const companyEl = firstMatch(doc, [
      '[data-qa="vacancy-company-name"]',
      'a[data-qa="vacancy-company__details"]',
      '[class*="vacancy-company-name"]',
    ])

    const locationEl = firstMatch(doc, [
      '[data-qa="vacancy-view-location"]',
      '[data-qa="vacancy-view-raw-address"]',
      'p[data-qa="vacancy-view-location"]',
    ])

    const salaryEl = firstMatch(doc, [
      '[data-qa="vacancy-salary"]',
      '[data-qa="vacancy-salary-compensation-type-net"]',
      'span[class*="salary"]',
    ])

    const descriptionEl = firstMatch(doc, [
      '[data-qa="vacancy-description"]',
      '[class*="vacancy-description"]',
      '.vacancy-section',
    ])

    const skillEls = doc.querySelectorAll<HTMLElement>(
      '[data-qa="bloko-tag__text"], [data-qa="skills-element"] span, [class*="vacancy-skill"] span'
    )
    const keySkills = Array.from(skillEls).map(text).filter(Boolean)

    if (!titleEl || !descriptionEl) return null

    const vacancy: Vacancy = {
      site: 'hh',
      id,
      url: url.toString(),
      title: text(titleEl),
      company: text(companyEl) || null,
      location: text(locationEl) || null,
      salary: text(salaryEl) || null,
      description: text(descriptionEl),
      keySkills: Array.from(new Set(keySkills)).slice(0, 25),
    }

    return vacancy
  },

  findVacancyCards(doc) {
    const nodes = doc.querySelectorAll<HTMLElement>(
      '[data-qa="vacancy-serp__vacancy"], div[class*="vacancy-card-default"]'
    )
    return Array.from(nodes)
  },

  findActionsContainer(doc) {
    return firstMatch(doc, [
      '[data-qa="vacancy-response-link-top"]',
      '[data-qa="vacancy-actions"]',
      '[class*="vacancy-actions"]',
    ])
  },
}
