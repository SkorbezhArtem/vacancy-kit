import { createRoot, type Root } from 'react-dom/client'
import { hhParser } from './parsers/hh'
import { rabotaParser } from './parsers/rabota'
import type { SiteParser } from './parsers/types'
import { ShadowHost } from './ui/ShadowHost'
import { InjectButton } from './ui/InjectButton'
import type { Vacancy } from '@vacancy-kit/shared'

const MOUNT_ID = 'vacancy-kit-button-mount'
const INJECT_DEBOUNCE_MS = 200

function pickParser(host: string): SiteParser | null {
  if (host.endsWith('hh.ru')) return hhParser
  if (host.endsWith('rabota.by')) return rabotaParser
  return null
}

function ensureMount(container: HTMLElement): HTMLElement {
  let mount = document.getElementById(MOUNT_ID) as HTMLElement | null
  if (mount && mount.parentElement === container) return mount

  if (mount) mount.remove()
  mount = document.createElement('span')
  mount.id = MOUNT_ID
  mount.style.display = 'inline-flex'
  mount.style.alignItems = 'center'
  mount.style.marginLeft = '12px'
  mount.style.verticalAlign = 'middle'
  container.appendChild(mount)
  return mount
}

let activeRoot: Root | null = null
let mountedKey: string | null = null
let watchedContainer: HTMLElement | null = null
let containerObserver: MutationObserver | null = null
let injectTimer: ReturnType<typeof setTimeout> | null = null
let injectAttempts = 0
const MAX_INJECT_ATTEMPTS = 40

function mount(vacancy: Vacancy, container: HTMLElement) {
  const key = `${vacancy.site}:${vacancy.id}`
  const existing = document.getElementById(MOUNT_ID)

  if (
    mountedKey === key &&
    existing?.isConnected &&
    existing.parentElement === container
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

  const node = ensureMount(container)
  activeRoot = createRoot(node)
  activeRoot.render(
    <ShadowHost anchor={node}>
      <InjectButton vacancy={vacancy} />
    </ShadowHost>,
  )
  watchActionsContainer(container)
}

function unmount() {
  mountedKey = null
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
    if (record.target instanceof Element && isOurNode(record.target)) {
      continue
    }
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
    if (!document.getElementById(MOUNT_ID)?.isConnected) {
      scheduleInject()
    }
  })
  containerObserver.observe(container, { childList: true })
}

function tryInject(parser: SiteParser) {
  const url = new URL(window.location.href)
  if (!parser.isVacancyPage(url)) {
    unmount()
    return
  }

  const vacancy = parser.parseVacancy(document, url)
  const actions = parser.findActionsContainer(document)
  if (!vacancy || !actions) {
    scheduleInject()
    return
  }

  mount(vacancy, actions)
}

function scheduleInject() {
  if (!activeParser || injectAttempts >= MAX_INJECT_ATTEMPTS) return
  const url = new URL(window.location.href)
  if (!activeParser.isVacancyPage(url)) return
  if (injectTimer) clearTimeout(injectTimer)
  injectTimer = setTimeout(() => {
    injectTimer = null
    injectAttempts += 1
    tryInject(activeParser!)
  }, INJECT_DEBOUNCE_MS)
}

let activeParser: SiteParser | null = null

function onNavigation() {
  if (!activeParser) return

  const url = new URL(window.location.href)
  if (!activeParser.isVacancyPage(url)) {
    unmount()
    return
  }

  injectAttempts = 0
  tryInject(activeParser)
  scheduleInject()
}

function hookSpaNavigation() {
  const notify = () => onNavigation()

  const pushState = history.pushState.bind(history)
  const replaceState = history.replaceState.bind(history)

  history.pushState = (...args) => {
    pushState(...args)
    notify()
  }
  history.replaceState = (...args) => {
    replaceState(...args)
    notify()
  }

  window.addEventListener('popstate', notify)
}

function cleanup() {
  if (injectTimer) clearTimeout(injectTimer)
  injectTimer = null
  injectAttempts = 0
  containerObserver?.disconnect()
  containerObserver = null
  watchedContainer = null
  unmount()
  activeParser = null
}

function start() {
  const w = window as Window & { __vkCleanup?: () => void }
  w.__vkCleanup?.()
  w.__vkCleanup = cleanup

  const parser = pickParser(window.location.host)
  if (!parser) return

  activeParser = parser
  hookSpaNavigation()

  const url = new URL(window.location.href)
  if (!parser.isVacancyPage(url)) return

  injectAttempts = 0
  tryInject(parser)
  scheduleInject()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
