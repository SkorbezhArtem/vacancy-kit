export type SiteId = 'hh' | 'rabota' | 'upload'

export interface Vacancy {
  site: SiteId
  id: string
  url: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  description: string
  keySkills: string[]
}

export interface ResumeSnippet {
  title: string | null
  summary: string | null
  skills: string[]
  experience: string[]
}

export interface CoverLetterRequest {
  vacancy: Vacancy
  resume: ResumeSnippet | null
  tone: 'neutral' | 'friendly' | 'formal'
  language: 'ru' | 'en'
}

export interface CoverLetterResult {
  text: string
  highlights: string[]
  generatedAt: string
  model: string
  cached: boolean
}

export interface Quota {
  used: number
  limit: number
  resetsAt: string | null
}

export type Tone = 'neutral' | 'friendly' | 'formal'
export type Language = 'ru' | 'en'

export interface UserSettings {
  defaultTone: Tone
  defaultLanguage: Language
  hideOnClosedVacancies: boolean
}

export interface HistoryEntry {
  id: string
  text: string
  highlights: string[]
  tone: Tone
  language: Language
  model: string
  generatedAt: string
  vacancy: {
    site: SiteId
    id: string
    url: string
    title: string
    company: string | null
  }
}
