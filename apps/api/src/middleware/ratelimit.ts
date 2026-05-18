import type { MiddlewareHandler } from 'hono'
import { env } from '../env'
import { clientIdFromRequest } from '../ratelimit/client-id'
import { setVkQuotaHeaders } from '../ratelimit/headers'
import { check } from '../ratelimit/store'

export const rateLimit: MiddlewareHandler = async (c, next) => {
  const id = clientIdFromRequest(c)
  const decision = check(id, env.RATE_LIMIT_PER_DAY)

  setVkQuotaHeaders(c, env.RATE_LIMIT_PER_DAY, decision.remaining, decision.resetsAt)

  if (!decision.allowed) {
    return c.json(
      {
        error: 'rate_limited',
        message: 'Free quota exceeded for today. Try again later or upgrade.',
        resetsAt: new Date(decision.resetsAt).toISOString(),
      },
      429,
    )
  }

  await next()
}
