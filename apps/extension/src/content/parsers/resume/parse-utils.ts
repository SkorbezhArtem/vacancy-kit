import type { ResumeProfile, SiteId } from '@vacancy-kit/shared'

export function text(el: Element | null | undefined): string {
  if (!el) return ''
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function firstMatch(doc: Document | Element, selectors: readonly string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel) as HTMLElement | null
    if (el) return el
  }
  return null
}

export function collectBlocks(
  doc: Document,
  selectors: readonly string[],
  max = 12,
  minLength = 8,
): string[] {
  const out: string[] = []
  for (const sel of selectors) {
    const nodes = doc.querySelectorAll<HTMLElement>(sel)
    for (const node of nodes) {
      const line = text(node)
      if (line.length >= minLength) out.push(line)
    }
  }
  return Array.from(new Set(out)).slice(0, max)
}

function normalizeHeading(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function resolveSectionRoot(heading: HTMLElement): HTMLElement {
  let best: HTMLElement = heading.parentElement ?? heading
  let node: HTMLElement | null = heading.parentElement

  for (let depth = 0; depth < 8 && node; depth++) {
    if (
      depth > 0 &&
      node.matches('[data-qa="resume"], [data-qa="resume-wrapper"], [data-qa="resume-view"], main, body')
    ) {
      break
    }
    const hasItems = node.querySelector(
      '[data-qa="resume-block-item-gap"], [data-qa*="education"], [class*="item-gap"], li, .bloko-columns-row',
    )
    if (hasItems) best = node
    node = node.parentElement
  }

  return best
}

function extractListItems(section: HTMLElement, minLength: number): string[] {
  const itemSelectors = [
    '[data-qa="resume-block-item-gap"]',
    '[data-qa*="education-item"]',
    '[data-qa*="item"]',
    '.resume-block__item-gap',
    '.bloko-columns-row',
    'li',
  ]

  for (const sel of itemSelectors) {
    const out: string[] = []
    for (const node of section.querySelectorAll<HTMLElement>(sel)) {
      const line = text(node)
      if (line.length >= minLength) out.push(line)
    }
    if (out.length > 0) return Array.from(new Set(out))
  }

  return []
}

function sectionTextWithoutHeading(section: HTMLElement, heading: HTMLElement): string {
  const full = text(section)
  const h = text(heading)
  if (h && full.startsWith(h)) return full.slice(h.length).trim()
  return full
}

/** Find resume section by visible heading (e.g. «Образование»). */
export function collectSectionByHeading(
  root: Element,
  headings: readonly string[],
  options?: { max?: number; minItemLength?: number },
): string[] {
  const max = options?.max ?? 8
  const minItem = options?.minItemLength ?? 4
  const want = new Set(headings.map(normalizeHeading))

  const titleSel = [
    'h2',
    'h3',
    'h4',
    '[data-qa*="resume-block-title"]',
    '.bloko-header-section__title',
    '[class*="resume-block__title"]',
    '[class*="section-title"]',
  ].join(', ')

  for (const el of root.querySelectorAll<HTMLElement>(titleSel)) {
    const label = normalizeHeading(text(el))
    const match =
      want.has(label) || Array.from(want).some((h) => label === h || label.startsWith(`${h} `))
    if (!match) continue

    const section = resolveSectionRoot(el)
    const items = extractListItems(section, minItem)
    if (items.length > 0) return items.slice(0, max)

    const body = sectionTextWithoutHeading(section, el)
    if (body.length >= minItem) return [body].slice(0, max)
  }

  return []
}

const EDUCATION_ITEM_SELECTORS = [
  '[data-qa="resume-block-education-item"]',
  '[data-qa="resume-education-item"]',
  '[data-qa*="education-item"]',
  '[data-qa="resume-block-education"] [data-qa="resume-block-item-gap"]',
  '[data-qa="resume-education"] [data-qa="resume-block-item-gap"]',
] as const

const EDUCATION_BLOCK_SELECTORS = [
  '[data-qa="resume-block-education"]',
  '[data-qa="resume-education"]',
  '[class*="resume-block-education"]',
  '[class*="resume-education"]',
] as const

export function parseEducationFromDoc(doc: Document): string[] {
  const root = findResumeRoot(doc)

  let items = collectBlocks(doc, [...EDUCATION_ITEM_SELECTORS, ...EDUCATION_BLOCK_SELECTORS], 12, 4)

  if (items.length === 0) {
    const block = firstMatch(root, EDUCATION_BLOCK_SELECTORS)
    if (block) {
      items = extractListItems(block, 4)
      if (items.length === 0) {
        const line = text(block)
        if (line.length >= 4) items = [line]
      }
    }
  }

  if (items.length === 0) {
    items = collectSectionByHeading(root, ['образование', 'education'])
  }

  return items.slice(0, 12)
}

export function resumeIdFromUrl(url: URL): string | null {
  const m = url.pathname.match(/\/resume\/([^/?#]+)/)
  return m?.[1] ?? null
}

export function findResumeRoot(doc: Document): HTMLElement {
  return (
    firstMatch(doc, [
      '[data-qa="resume"]',
      '[data-qa="resume-wrapper"]',
      '[data-qa="resume-view"]',
      '.resume-wrapper',
      '.resume-applicant',
      '[class*="resume-view"]',
      '[class*="resume-wrapper"]',
      'main',
    ]) ?? doc.body
  )
}

export function scrapeResumeRootText(doc: Document): string {
  const root = findResumeRoot(doc)
  return text(root).slice(0, 14000)
}

export function buildFallbackResume(
  doc: Document,
  url: URL,
  site: SiteId,
): ResumeProfile | null {
  const id = resumeIdFromUrl(url)
  if (!id) return null

  const rawText = scrapeResumeRootText(doc)
  if (rawText.length < 80) return null

  const root = findResumeRoot(doc)
  const title =
    text(firstMatch(root, ['[data-qa="resume-block-title-position"]', 'h2', 'h1'])) || null
  const fullName =
    text(firstMatch(root, ['[data-qa="resume-personal-name"]', '[data-qa="resume-block-name"]'])) ||
    null

  const education = parseEducationFromDoc(doc)

  return {
    site,
    id,
    url: url.toString(),
    title,
    fullName,
    summary: rawText.slice(0, 600),
    skills: [],
    experience: [],
    education,
    languages: [],
    rawText,
  }
}
