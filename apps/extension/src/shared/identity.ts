const ANON_ID_KEY = 'vk.anonId'

let cached: string | null = null

function randomId(): string {
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getAnonId(): Promise<string> {
  if (cached) return cached

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    cached = randomId()
    return cached
  }

  const stored = await chrome.storage.local.get(ANON_ID_KEY)
  const existing = stored[ANON_ID_KEY]
  if (typeof existing === 'string' && existing.length >= 16) {
    cached = existing
    return existing
  }

  const next = randomId()
  await chrome.storage.local.set({ [ANON_ID_KEY]: next })
  cached = next
  return next
}
