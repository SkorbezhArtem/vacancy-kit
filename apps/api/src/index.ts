import { serve } from '@hono/node-server'
import { createApp } from './app'
import { env } from './env'

const app = createApp()

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.info(
    `vacancy-kit api listening on http://localhost:${info.port} (${env.NODE_ENV}, rate limit ${env.RATE_LIMIT_PER_DAY}/day)`,
  )
})

export default app
