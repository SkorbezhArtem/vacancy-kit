import { hhResumeParser } from './hh'
import type { ResumeSiteParser } from './types'

/** rabota.by uses the same resume DOM as hh.ru */
export const rabotaResumeParser: ResumeSiteParser = {
  site: 'rabota',

  isResumePage(url) {
    return /\/resume\/[^/]+/.test(url.pathname) && !url.pathname.includes('/resumes')
  },

  parseResume(doc, url) {
    const profile = hhResumeParser.parseResume(doc, url)
    if (!profile) return null
    return { ...profile, site: 'rabota', url: url.toString() }
  },

  findActionsContainer(doc) {
    return hhResumeParser.findActionsContainer(doc)
  },
}
