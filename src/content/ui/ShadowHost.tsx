import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import contentCss from '@/content/styles.css?inline'

const HOST_ID = 'vacancy-kit-root'

/**
 * Mounts children into a closed shadow root attached to <body>.
 * Host site styles can't leak in; our styles can't leak out.
 */
export function ShadowHost({ children }: PropsWithChildren) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [shadowMount, setShadowMount] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    let host = document.getElementById(HOST_ID) as HTMLDivElement | null
    if (!host) {
      host = document.createElement('div')
      host.id = HOST_ID
      host.className = 'vk-host'
      document.body.appendChild(host)
    }
    hostRef.current = host

    let shadow = host.shadowRoot
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' })
      const style = document.createElement('style')
      style.textContent = contentCss
      shadow.appendChild(style)
    }

    let mount = shadow.querySelector<HTMLDivElement>('div.vk-root')
    if (!mount) {
      mount = document.createElement('div')
      mount.className = 'vk-root'
      shadow.appendChild(mount)
    }

    setShadowMount(mount)
  }, [])

  if (!shadowMount) return null
  return createPortal(children, shadowMount)
}
