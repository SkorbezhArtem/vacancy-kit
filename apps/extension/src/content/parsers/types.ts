import type { SiteId, Vacancy } from '@/shared/types'

export interface SiteParser {
  site: SiteId
  /** Returns true if the current URL looks like a single vacancy page. */
  isVacancyPage: (url: URL) => boolean
  /** Returns true if the current URL looks like a search/listing page. */
  isSearchPage: (url: URL) => boolean
  /** Parse the open vacancy page into a Vacancy. */
  parseVacancy: (doc: Document, url: URL) => Vacancy | null
  /** Find vacancy cards on a search page (for match-score badges). */
  findVacancyCards: (doc: Document) => HTMLElement[]
  /** Container next to which we want to mount the "Generate cover letter" button. */
  findActionsContainer: (doc: Document) => HTMLElement | null
}
