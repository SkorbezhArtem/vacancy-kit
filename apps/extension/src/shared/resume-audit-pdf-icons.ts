/** Rasterized PNG icons for pdfmake (JPEG/PNG data URLs only — no SVG). */

const ICONS = {
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#dcfce7"/><path d="M5 8.2 7 10.2 11 6.2" fill="none" stroke="#16a34a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  critical: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#fee2e2"/><path d="M8 4.5v4M8 11h.01" stroke="#dc2626" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  warn: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#fef3c7"/><path d="M8 5v3.2M8 10.5h.01" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#f4f4f5"/><path d="M8 7v4M8 5h.01" stroke="#71717a" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  fix: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#ccfbf1"/><path d="M5.5 10.5 10.5 5.5M6.8 10.5h3.7M5.5 6.8v3.7" fill="none" stroke="#0f766e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  section: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect width="18" height="18" rx="5" fill="#f0fdfa"/><path d="M5 6h8M5 9h8M5 12h5" stroke="#0d9488" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  score: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect width="18" height="18" rx="5" fill="#ecfdf5"/><path d="M9 4.5l1.2 2.5 2.7.4-2 1.9.5 2.7L9 10.4 6.6 12l.5-2.7-2-1.9 2.7-.4L9 4.5z" fill="#14b8a6"/></svg>`,
  remark: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#eff6ff"/><path d="M5.5 5.5h5v5h-1.8L8 11.5 7.3 10.5H5.5V5.5z" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
} as const

export type PdfIconKey = keyof typeof ICONS

const pngCache = new Map<string, string>()
let staticIconsReady = false

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function rasterizeSvg(svg: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unavailable'))
        return
      }
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to rasterize PDF icon'))
    img.src = svgToDataUri(svg)
  })
}

function scoreBadgeSvg(score: number, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="${color}"/><text x="28" y="35" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="700" font-family="Roboto,Arial,sans-serif">${score}</text></svg>`
}

/** Call once before building the PDF document. */
export async function preparePdfIcons(score: number, scoreColor: string): Promise<void> {
  if (!staticIconsReady) {
    const jobs: Array<Promise<void>> = []
    for (const [key, svg] of Object.entries(ICONS) as [PdfIconKey, string][]) {
      for (const size of [16, 18] as const) {
        const cacheKey = `icon:${key}:${size}`
        if (pngCache.has(cacheKey)) continue
        jobs.push(
          rasterizeSvg(svg, size, size).then((png) => {
            pngCache.set(cacheKey, png)
          }),
        )
      }
    }
    await Promise.all(jobs)
    staticIconsReady = true
  }

  const badgeKey = `badge:${score}:${scoreColor}`
  if (!pngCache.has(badgeKey)) {
    pngCache.set(badgeKey, await rasterizeSvg(scoreBadgeSvg(score, scoreColor), 56, 56))
  }
}

export function pdfIcon(
  key: PdfIconKey,
  size = 16,
): { image: string; width: number; height: number } {
  const png = pngCache.get(`icon:${key}:${size}`)
  if (!png) {
    throw new Error('PDF icons not prepared — call preparePdfIcons() first')
  }
  return { image: png, width: size, height: size }
}

export function scoreBadgeImage(
  score: number,
  color: string,
): { image: string; width: number; height: number } {
  const png = pngCache.get(`badge:${score}:${color}`)
  if (!png) {
    throw new Error('PDF score badge not prepared — call preparePdfIcons() first')
  }
  return { image: png, width: 56, height: 56 }
}
