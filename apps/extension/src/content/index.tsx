import { createRoot, type Root } from 'react-dom/client'
import { hhParser } from './parsers/hh'
import { rabotaParser } from './parsers/rabota'
import type { SiteParser } from './parsers/types'
import { ShadowHost } from './ui/ShadowHost'
import { InjectButton } from './ui/InjectButton'
import type { Vacancy } from '@/shared/types'

const MOUNT_ID = 'vacancy-kit-button-mount'

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
  mount.style.display = 'inline-block'
  mount.style.marginLeft = '8px'
  mount.style.verticalAlign = 'middle'
  container.appendChild(mount)
  return mount
}

let activeRoot: Root | null = null

function mount(vacancy: Vacancy, container: HTMLElement) {
  const node = ensureMount(container)
  if (!activeRoot) {
    activeRoot = createRoot(node)
  }
  activeRoot.render(
    <ShadowHost>
      <InjectButton vacancy={vacancy} />
    </ShadowHost>
  )
}

function unmount() {
  if (activeRoot) {
    activeRoot.unmount()
    activeRoot = null
  }
  document.getElementById(MOUNT_ID)?.remove()
}

function tryInject(parser: SiteParser) {
  const url = new URL(window.location.href)
  if (!parser.isVacancyPage(url)) {
    unmount()
    return
  }

  const vacancy = parser.parseVacancy(document, url)
  const actions = parser.findActionsContainer(document)
  if (!vacancy || !actions) return

  mount(vacancy, actions)
}

function start() {
  const parser = pickParser(window.location.host)
  if (!parser) return

  let lastUrl = window.location.href

  const run = () => tryInject(parser)
  run()

  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      unmount()
      run()
      return
    }
    if (!document.getElementById(MOUNT_ID)) {
      run()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('popstate', run)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
