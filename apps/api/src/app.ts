import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './env'
import { generationRoutes } from './routes/generations'
import { healthRoutes } from './routes/health'
import { quotaRoutes } from './routes/quota'

export function createApp() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', secureHeaders())
  app.use(
    '*',
    cors({
      origin: env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(',').map((s) => s.trim()),
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'x-anon-id'],
      exposeHeaders: ['x-vk-quota-limit', 'x-vk-quota-remaining', 'x-vk-quota-reset'],
      maxAge: 86400,
    }),
  )

  app.onError((err, c) => {
    console.error('unhandled error:', err)
    return c.json({ error: 'internal_error', message: 'Something went wrong' }, 500)
  })

  app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404))

  app.route('/', healthRoutes)
  app.route('/', quotaRoutes)
  app.route('/', generationRoutes)

  return app
}

export type App = ReturnType<typeof createApp>
