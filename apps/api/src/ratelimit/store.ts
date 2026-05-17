export interface RateLimitDecision {
  allowed: boolean
  remaining: number
  resetsAt: number
}

const WINDOW_MS = 24 * 60 * 60 * 1000

const hits = new Map<string, number[]>()

export function check(clientId: string, limit: number): RateLimitDecision {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const past = hits.get(clientId) ?? []
  const recent = past.filter((ts) => ts > windowStart)

  if (recent.length >= limit) {
    const oldest = recent[0]
    return {
      allowed: false,
      remaining: 0,
      resetsAt: oldest + WINDOW_MS,
    }
  }

  recent.push(now)
  hits.set(clientId, recent)

  return {
    allowed: true,
    remaining: Math.max(0, limit - recent.length),
    resetsAt: now + WINDOW_MS,
  }
}

export function peek(clientId: string, limit: number): RateLimitDecision {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  const recent = (hits.get(clientId) ?? []).filter((ts) => ts > windowStart)
  return {
    allowed: recent.length < limit,
    remaining: Math.max(0, limit - recent.length),
    resetsAt: recent.length > 0 ? recent[0] + WINDOW_MS : now + WINDOW_MS,
  }
}

export function reset(clientId: string): void {
  hits.delete(clientId)
}

export function size(): number {
  return hits.size
}
