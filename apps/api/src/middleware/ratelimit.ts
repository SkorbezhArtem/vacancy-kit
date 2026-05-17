import type { MiddlewareHandler } from 'hono'
import { env } from '../env'
import { check } from '../ratelimit/store'

function clientId(c: Parameters<MiddlewareHandler>[0]): string {
  const anon = c.req.header('x-anon-id')
  if (anon && anon.length >= 8 && anon.length <= 64) {
    return `anon:${anon}`
  }
  const ip =
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  return `ip:${ip}`
}

export const rateLimit: MiddlewareHandler = async (c, next) => {
  const id = clientId(c)
  const decision = check(id, env.RATE_LIMIT_PER_DAY)

  c.header('x-ratelimit-limit', String(env.RATE_LIMIT_PER_DAY))
  c.header('x-ratelimit-remaining', String(decision.remaining))
  c.header('x-ratelimit-reset', new Date(decision.resetsAt).toISOString())

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
