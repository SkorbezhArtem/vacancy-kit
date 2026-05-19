/** Extract the outermost JSON object from model text (markdown fences, prose prefix). */
export function extractJsonObject(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()

  const start = candidate.indexOf('{')
  if (start < 0) return candidate

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return candidate.slice(start, i + 1)
    }
  }

  return repairTruncatedJson(candidate.slice(start))
}

/** Close dangling arrays/objects when the model hits the token limit mid-JSON. */
export function repairTruncatedJson(fragment: string): string {
  let s = fragment.trim()
  s = s.replace(/,\s*([}\]])/g, '$1')
  s = s.replace(/,\s*$/, '')

  let inString = false
  let escaped = false
  let braces = 0
  let brackets = 0

  for (const ch of s) {
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') braces++
    if (ch === '}') braces--
    if (ch === '[') brackets++
    if (ch === ']') brackets--
  }

  if (inString) s += '"'
  s += ']'.repeat(Math.max(0, brackets))
  s += '}'.repeat(Math.max(0, braces))
  return s
}

export function parseJsonObject(text: string): unknown {
  const raw = extractJsonObject(text)
  try {
    return JSON.parse(raw)
  } catch {
    return JSON.parse(repairTruncatedJson(raw))
  }
}
