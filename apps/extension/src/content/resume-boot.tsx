import { createRoot, type Root } from 'react-dom/client'
import { hhResumeParser } from './parsers/resume/hh'
import { rabotaResumeParser } from './parsers/resume/rabota'
import { buildFallbackResume } from './parsers/resume/parse-utils'
import type { ResumeSiteParser } from './parsers/resume/types'
import { onSpaNavigation } from './spa-navigation'
import { ShadowHost } from './ui/ShadowHost'
import { InjectResumeAuditButton } from './ui/InjectResumeAuditButton'
import type { ResumeProfile } from '@vacancy-kit/shared'

const MOUNT_ID = 'vacancy-kit-resume-audit-mount'
const INJECT_DEBOUNCE_MS = 250
const MAX_INJECT_ATTEMPTS = 80

function pickResumeParser(host: string): ResumeSiteParser | null {
  if (host.endsWith('hh.ru')) return hhResumeParser
  if (host.endsWith('rabota.by')) return rabotaResumeParser
  return null
}

function ensureMount(container: HTMLElement, inline: boolean): HTMLElement {
  let mount = document.getElementById(MOUNT_ID) as HTMLElement | null
  if (mount && mount.parentElement === container) {
    applyLayout(mount, inline)
    return mount
  }

  if (mount) mount.remove()

  mount = document.createElement('span')
  mount.id = MOUNT_ID
  container.appendChild(mount)
  applyLayout(mount, inline)
  return mount
}

function applyLayout(mount: HTMLElement, inline: boolean) {
  mount.style.display = 'inline-flex'
  mount.style.alignItems = 'center'
  mount.style.verticalAlign = 'middle'
  mount.style.flexShrink = '0'

  if (inline) {
    mount.style.position = ''
    mount.style.top = ''
    mount.style.right = ''
    mount.style.marginLeft = '12px'
    mount.style.zIndex = ''
    return
  }

  mount.style.position = 'fixed'
  mount.style.top = '80px'
  mount.style.right = '24px'
  mount.style.marginLeft = '0'
  mount.style.zIndex = '2147483646'
}

let activeRoot: Root | null = null
let mountedKey: string | null = null
let watchedContainer: HTMLElement | null = null
let containerObserver: MutationObserver | null = null
let injectTimer: ReturnType<typeof setTimeout> | null = null
let injectAttempts = 0
let bodyObserver: MutationObserver | null = null
let offNavigation: (() => void) | null = null
let lastInline = false

function parseResume(parser: ResumeSiteParser, url: URL): ResumeProfile | null {
  return parser.parseResume(document, url) ?? buildFallbackResume(document, url, parser.site)
}

function mount(resume: ResumeProfile, container: HTMLElement, inline: boolean) {
  const key = `${resume.site}:${resume.id}`
  const existing = document.getElementById(MOUNT_ID)

  if (
    mountedKey === key &&
    existing?.isConnected &&
    existing.parentElement === container &&
    lastInline === inline
  ) {
    watchActionsContainer(container)
    return
  }

  if (existing) existing.remove()
  if (activeRoot) {
    activeRoot.unmount()
    activeRoot = null
  }

  injectAttempts = 0
  mountedKey = key
  lastInline = inline

  const node = ensureMount(container, inline)
  activeRoot = createRoot(node)
  activeRoot.render(
    <ShadowHost anchor={node}>
      <InjectResumeAuditButton resume={resume} inline={inline} />
    </ShadowHost>,
  )
  watchActionsContainer(container)
}

function unmount() {
  mountedKey = null
  lastInline = false
  watchedContainer = null
  containerObserver?.disconnect()
  containerObserver = null

  if (activeRoot) {
    activeRoot.unmount()
    activeRoot = null
  }
  document.getElementById(MOUNT_ID)?.remove()
}

function isOurNode(node: Node): boolean {
  if (!(node instanceof Element)) return false
  if (node.id === MOUNT_ID || node.classList.contains('vk-host')) return true
  return Boolean(node.closest(`#${MOUNT_ID}, .vk-host`))
}

function mutationsAreOnlyOurs(records: MutationRecord[]): boolean {
  for (const record of records) {
    if (record.target instanceof Element && isOurNode(record.target)) continue
    for (const node of record.addedNodes) {
      if (!isOurNode(node)) return false
    }
    for (const node of record.removedNodes) {
      if (!isOurNode(node)) return false
    }
  }
  return true
}

function watchActionsContainer(container: HTMLElement) {
  if (watchedContainer === container) return
  containerObserver?.disconnect()
  watchedContainer = container
  containerObserver = new MutationObserver((records) => {
    if (mutationsAreOnlyOurs(records)) return
    if (!document.getElementById(MOUNT_ID)?.isConnected && activeResumeParser) {
      scheduleInject(activeResumeParser)
    }
  })
  containerObserver.observe(container, { childList: true })
}

function tryInject(parser: ResumeSiteParser) {
  const url = new URL(window.location.href)
  if (!parser.isResumePage(url)) {
    unmount()
    stopBodyObserver()
    return
  }

  const resume = parseResume(parser, url)
  if (!resume) {
    scheduleInject(parser)
    return
  }

  const actions = parser.findActionsContainer(document)
  if (actions) {
    mount(resume, actions, true)
  } else {
    mount(resume, document.body, false)
  }
}

function scheduleInject(parser: ResumeSiteParser) {
  if (injectAttempts >= MAX_INJECT_ATTEMPTS) return
  if (injectTimer) clearTimeout(injectTimer)
  injectTimer = setTimeout(() => {
    injectTimer = null
    injectAttempts += 1
    tryInject(parser)
  }, INJECT_DEBOUNCE_MS)
}

function startBodyObserver(parser: ResumeSiteParser) {
  if (bodyObserver) return
  bodyObserver = new MutationObserver(() => {
    const url = new URL(window.location.href)
    if (!parser.isResumePage(url)) return

    const mount = document.getElementById(MOUNT_ID)
    const actions = parser.findActionsContainer(document)

    if (actions && (!mount || !actions.contains(mount))) {
      tryInject(parser)
      return
    }

    if (!mount?.isConnected) {
      tryInject(parser)
    }
  })
  bodyObserver.observe(document.body, { childList: true, subtree: true })
}

function stopBodyObserver() {
  bodyObserver?.disconnect()
  bodyObserver = null
}

let activeResumeParser: ResumeSiteParser | null = null

function onNavigation() {
  if (!activeResumeParser) return
  const url = new URL(window.location.href)
  if (!activeResumeParser.isResumePage(url)) {
    unmount()
    stopBodyObserver()
    return
  }
  injectAttempts = 0
  startBodyObserver(activeResumeParser)
  tryInject(activeResumeParser)
  scheduleInject(activeResumeParser)
}

function cleanupResume() {
  if (injectTimer) clearTimeout(injectTimer)
  injectTimer = null
  injectAttempts = 0
  stopBodyObserver()
  containerObserver?.disconnect()
  containerObserver = null
  offNavigation?.()
  offNavigation = null
  unmount()
  activeResumeParser = null
}

export function startResumeInject(): () => void {
  const parser = pickResumeParser(window.location.host)
  if (!parser) return () => {}

  activeResumeParser = parser
  offNavigation = onSpaNavigation(onNavigation)

  const url = new URL(window.location.href)
  if (parser.isResumePage(url)) {
    injectAttempts = 0
    startBodyObserver(parser)
    tryInject(parser)
    scheduleInject(parser)
  }

  return cleanupResume
}
