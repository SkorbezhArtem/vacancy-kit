import type { ResumeProfile, SiteId } from '@vacancy-kit/shared'

export interface ResumeSiteParser {
  site: SiteId
  isResumePage: (url: URL) => boolean
  parseResume: (doc: Document, url: URL) => ResumeProfile | null
  findActionsContainer: (doc: Document) => HTMLElement | null
}
