import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

// Always load apps/api/.env (pnpm dev cwd can vary; tsx --env-file is best-effort only).
const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: resolve(apiRoot, '.env') })

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  CORS_ORIGINS: z.string().default('*'),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(['gemini', 'openrouter', 'auto']).default('auto'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-chat:free'),
  RATE_LIMIT_PER_DAY: z.coerce.number().int().positive().default(3),
})

export type Env = z.infer<typeof EnvSchema>

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    console.error('invalid environment configuration:', result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
