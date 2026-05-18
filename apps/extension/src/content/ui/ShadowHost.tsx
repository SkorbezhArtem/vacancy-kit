import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import contentCss from '@/content/styles.css?inline'

interface Props {
  /**
   * Element to attach the shadow host to. Defaults to <body>, in which case
   * children render at the end of the document (suitable for fixed-position
   * overlays). Pass a specific element to anchor the shadow inline at that
   * location in the page.
   */
  anchor?: HTMLElement | null
}

/**
 * Mounts children into an open shadow root attached either to <body> or to
 * the provided anchor element. Host site styles can't leak in; our styles
 * can't leak out.
 */
export function ShadowHost({ children, anchor }: PropsWithChildren<Props>) {
  const placeholderRef = useRef<HTMLSpanElement | null>(null)
  const [shadowMount, setShadowMount] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const parent = anchor ?? placeholderRef.current?.parentElement ?? document.body

    let host = parent.querySelector<HTMLDivElement>(':scope > .vk-host')
    if (!host) {
      host = document.createElement('div')
      host.className = 'vk-host'
      parent.appendChild(host)
    }

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
  }, [anchor])

  return (
    <>
      <span ref={placeholderRef} style={{ display: 'none' }} aria-hidden="true" />
      {shadowMount ? createPortal(children, shadowMount) : null}
    </>
  )
}
