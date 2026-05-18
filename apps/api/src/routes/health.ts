import { Hono } from 'hono'

const startedAt = Date.now()

export const healthRoutes = new Hono()

healthRoutes.get('/', (c) => c.text('vacancy-kit api'))

healthRoutes.get('/health', (c) =>
  c.json({
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  }),
)

healthRoutes.get('/version', (c) =>
  c.json({
    name: 'vacancy-kit-api',
    version: '0.0.1',
    commit: process.env.GIT_SHA ?? null,
  }),
)
