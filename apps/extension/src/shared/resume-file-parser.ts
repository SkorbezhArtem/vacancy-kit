import type { ResumeProfile } from '@vacancy-kit/shared'
import mammoth from 'mammoth'
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const MAX_BYTES = 10 * 1024 * 1024

export function isSupportedResumeFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.pdf') || name.endsWith('.docx')
}

async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .slice(0, 16)
    .join('')
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const parts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    parts.push(line)
  }
  return parts.join('\n\n')
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

function guessTitle(lines: string[]): string | null {
  for (const line of lines.slice(0, 12)) {
    if (line.length >= 4 && line.length <= 90 && !/@/.test(line) && !/^\+?\d/.test(line)) {
      return line
    }
  }
  return null
}

function guessName(lines: string[]): string | null {
  const first = lines[0]
  if (!first || first.length > 60) return null
  if (/@|https?:\/\//i.test(first)) return null
  return first
}

function buildProfileFromText(
  rawText: string,
  id: string,
  fileName: string,
): ResumeProfile {
  const normalized = rawText.replace(/\r\n/g, '\n').trim()
  const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean)

  return {
    site: 'upload',
    id,
    url: `https://vacancy-kit.local/upload/${id}`,
    title: guessTitle(lines),
    fullName: guessName(lines),
    summary: normalized.slice(0, 800) || null,
    skills: [],
    experience: [],
    education: [],
    languages: [],
    rawText: normalized.slice(0, 14000),
    sourceFileName: fileName,
  }
}

export async function parseResumeFile(file: File): Promise<ResumeProfile> {
  if (!isSupportedResumeFile(file)) {
    throw new Error('Поддерживаются только PDF и DOCX (до 10 МБ).')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Файл больше 10 МБ.')
  }

  const buffer = await file.arrayBuffer()
  const id = await hashBuffer(buffer)
  const lower = file.name.toLowerCase()

  let rawText = ''
  if (lower.endsWith('.pdf')) {
    rawText = await extractPdfText(buffer)
  } else {
    rawText = await extractDocxText(buffer)
  }

  rawText = rawText.replace(/\u0000/g, '').trim()
  if (rawText.length < 80) {
    throw new Error('Не удалось извлечь достаточно текста из файла.')
  }

  return buildProfileFromText(rawText, id, file.name)
}
