import { Hono } from 'hono'
import { QuotaSchema } from '@vacancy-kit/shared'
import { env } from '../env'
import { clientIdFromRequest } from '../ratelimit/client-id'
import { setVkQuotaHeaders } from '../ratelimit/headers'
import { peek } from '../ratelimit/store'

export const quotaRoutes = new Hono()

quotaRoutes.get('/api/v1/quota', (c) => {
  const limit = env.RATE_LIMIT_PER_DAY
  const decision = peek(clientIdFromRequest(c), limit)
  const used = limit - decision.remaining

  setVkQuotaHeaders(c, limit, decision.remaining, decision.resetsAt)

  const body = QuotaSchema.parse({
    used,
    limit,
    resetsAt: new Date(decision.resetsAt).toISOString(),
  })

  return c.json(body)
})
