const ACTIONS_SELECTORS = [
  '[data-qa="vacancy-actions"]',
  '[class*="vacancy-actions"]',
] as const

function actionsWrapper(link: HTMLElement): HTMLElement | null {
  for (const sel of ACTIONS_SELECTORS) {
    const el = link.closest<HTMLElement>(sel)
    if (el) return el
  }
  const parent = link.parentElement
  return parent instanceof HTMLElement ? parent : null
}

/**
 * Row with the topmost "Откликнуться" on the page (hh.ru / rabota.by).
 * rabota.by often lacks vacancy-response-link-top; fallback by geometry.
 */
export function findTopResponseActionsContainer(doc: Document): HTMLElement | null {
  const topLink = doc.querySelector<HTMLElement>('[data-qa="vacancy-response-link-top"]')
  if (topLink) {
    const wrapper = actionsWrapper(topLink)
    if (wrapper) return wrapper
  }

  const links = Array.from(
    doc.querySelectorAll<HTMLElement>('[data-qa^="vacancy-response-link"]'),
  ).filter((el) => !el.closest('#vacancy-kit-button-mount'))

  if (links.length > 0) {
    let best = links[0]
    let bestY = best.getBoundingClientRect().top

    for (const link of links.slice(1)) {
      const y = link.getBoundingClientRect().top
      if (y < bestY - 2) {
        bestY = y
        best = link
      }
    }

    const fromLink = actionsWrapper(best)
    if (fromLink) return fromLink
  }

  const blocks = doc.querySelectorAll<HTMLElement>(
    '[data-qa="vacancy-actions"], [class*="vacancy-actions"]',
  )
  let bestBlock: HTMLElement | null = null
  let bestBlockY = Infinity

  for (const block of blocks) {
    if (!block.querySelector('[data-qa*="vacancy-response"]')) continue
    const y = block.getBoundingClientRect().top
    if (y < bestBlockY) {
      bestBlockY = y
      bestBlock = block
    }
  }

  return bestBlock
}
