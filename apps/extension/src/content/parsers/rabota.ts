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

export const rabotaParser: SiteParser = {
  site: 'rabota',

  isVacancyPage(url) {
    return /\/vacancy\/\d+/.test(url.pathname)
  },

  isSearchPage(url) {
    return url.pathname.startsWith('/search/vacancy') || url.pathname === '/vacancies'
  },

  parseVacancy(doc, url) {
    const id = vacancyIdFromUrl(url)
    if (!id) return null

    const titleEl = firstMatch(doc, [
      '[data-qa="vacancy-title"]',
      'h1.bloko-header-section-1',
      'h1[class*="vacancy"]',
      'h1',
    ])

    const companyEl = firstMatch(doc, [
      '[data-qa="vacancy-company-name"]',
      'a[data-qa="vacancy-company__details"]',
      '[class*="company-name"]',
    ])

    const locationEl = firstMatch(doc, [
      '[data-qa="vacancy-view-location"]',
      '[data-qa="vacancy-view-raw-address"]',
    ])

    const salaryEl = firstMatch(doc, [
      '[data-qa="vacancy-salary"]',
      '[class*="vacancy-salary"]',
    ])

    const descriptionEl = firstMatch(doc, [
      '[data-qa="vacancy-description"]',
      '[class*="vacancy-description"]',
    ])

    const skillEls = doc.querySelectorAll<HTMLElement>(
      '[data-qa="bloko-tag__text"], [data-qa="skills-element"] span, [class*="vacancy-skill"] span'
    )
    const keySkills = Array.from(skillEls).map(text).filter(Boolean)

    if (!titleEl || !descriptionEl) return null

    return {
      site: 'rabota',
      id,
      url: url.toString(),
      title: text(titleEl),
      company: text(companyEl) || null,
      location: text(locationEl) || null,
      salary: text(salaryEl) || null,
      description: text(descriptionEl),
      keySkills: Array.from(new Set(keySkills)).slice(0, 25),
    }
  },

  findVacancyCards(doc) {
    const nodes = doc.querySelectorAll<HTMLElement>(
      '[data-qa="vacancy-serp__vacancy"], div[class*="vacancy-serp-item"]'
    )
    return Array.from(nodes)
  },

  findActionsContainer(doc) {
    // The top "Откликнуться" link lives inside the actions row that also
    // hosts the favourite/heart button. Mounting our button as a sibling of
    // that link keeps the flex layout intact, instead of nesting inside the
    // <a> and visually colliding with the heart icon.
    const responseLink = doc.querySelector<HTMLElement>(
      '[data-qa="vacancy-response-link-top"]'
    )
    const wrapper = responseLink?.closest<HTMLElement>('[class*="vacancy-actions"]')
    if (wrapper) return wrapper

    return firstMatch(doc, [
      '[data-qa="vacancy-actions"]',
      '[class*="vacancy-actions"]',
    ])
  },
}
