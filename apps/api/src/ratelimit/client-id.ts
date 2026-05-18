import type { Context } from 'hono'

export function clientIdFromRequest(c: Context): string {
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
