import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('vacancy-kit api'))

const port = Number(process.env.PORT ?? 8000)

serve({ fetch: app.fetch, port }, (info) => {
  console.info(`vacancy-kit api listening on http://localhost:${info.port}`)
})

export default app
