import type { ResumeProfile } from '@vacancy-kit/shared'
import type { ResumeSiteParser } from './types'
import {
  buildFallbackResume,
  collectBlocks,
  collectSectionByHeading,
  findResumeRoot,
  firstMatch,
  parseEducationFromDoc,
  resumeIdFromUrl,
  scrapeResumeRootText,
  text,
} from './parse-utils'
import { findResumeActionsContainer } from './find-actions'

function parseSkills(doc: Document): string[] {
  const tags = doc.querySelectorAll<HTMLElement>(
    '[data-qa="bloko-tag__text"], [data-qa="resume-block-skills"] span, [data-qa="skills-element"] span, [class*="skill"] span',
  )
  const fromTags = Array.from(tags).map(text).filter(Boolean)
  if (fromTags.length > 0) return Array.from(new Set(fromTags)).slice(0, 40)

  const block = firstMatch(doc, [
    '[data-qa="resume-block-skills"]',
    '[data-qa="resume-skills"]',
    '[class*="resume-block-skills"]',
  ])
  if (!block) return []
  return text(block)
    .split(/[,;·•]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 40)
}

function parseExperience(doc: Document): string[] {
  return collectBlocks(doc, [
    '[data-qa="resume-block-experience-item"]',
    '[data-qa="resume-block-experience"] [data-qa="resume-block-item-gap"]',
    '.resume-block__experience-item',
    '[class*="experience-item"]',
    '[data-qa="resume-block-experience"]',
  ], 20)
}

function parseLanguages(doc: Document): string[] {
  const root = findResumeRoot(doc)
  const fromSelectors = collectBlocks(
    doc,
    [
      '[data-qa="resume-block-language-item"]',
      '[data-qa="resume-block-language"]',
      '[class*="resume-block-language"]',
    ],
    12,
    4,
  )
  if (fromSelectors.length > 0) return fromSelectors
  return collectSectionByHeading(root, ['языки', 'languages'], { minItemLength: 3 })
}

function buildRawText(profile: Omit<ResumeProfile, 'rawText'>, doc: Document): string {
  const parts = [
    profile.title,
    profile.fullName,
    profile.summary,
    ...profile.skills,
    ...profile.experience,
    ...profile.education,
    ...profile.languages,
  ].filter(Boolean) as string[]

  const joined = parts.join('\n\n')
  if (joined.length >= 80) return joined
  return scrapeResumeRootText(doc)
}

export const hhResumeParser: ResumeSiteParser = {
  site: 'hh',

  isResumePage(url) {
    return /\/resume\/[^/?#]+/.test(url.pathname) && !url.pathname.includes('/resumes')
  },

  parseResume(doc, url) {
    const id = resumeIdFromUrl(url)
    if (!id) return null

    const titleEl = firstMatch(doc, [
      '[data-qa="resume-block-title-position"]',
      '[data-qa="resume-block-title"]',
      '[data-qa="resume-title"]',
      'h1',
      'h2',
    ])

    const nameEl = firstMatch(doc, [
      '[data-qa="resume-personal-name"]',
      '[data-qa="resume-block-name"]',
      '[data-qa="resume-header-name"]',
    ])

    const summaryEl = firstMatch(doc, [
      '[data-qa="resume-block-about"]',
      '[data-qa="resume-block-text-about"]',
      '[data-qa="resume-about"]',
      '[class*="resume-block-about"]',
    ])

    const skills = parseSkills(doc)
    const experience = parseExperience(doc)
    const education = parseEducationFromDoc(doc)
    const languages = parseLanguages(doc)

    const title = text(titleEl) || null
    const summary = text(summaryEl) || null

    const base = {
      site: 'hh' as const,
      id,
      url: url.toString(),
      title,
      fullName: text(nameEl) || null,
      summary,
      skills,
      experience,
      education,
      languages,
    }

    const rawText = buildRawText(base, doc)
    if (rawText.length < 80) {
      return buildFallbackResume(doc, url, 'hh')
    }

    return { ...base, rawText }
  },

  findActionsContainer(doc) {
    return findResumeActionsContainer(doc)
  },
}
