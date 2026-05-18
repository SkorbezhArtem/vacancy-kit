import { env } from '../env'
import { GeminiProvider } from './gemini'
import { OpenRouterProvider } from './openrouter'
import { ProviderError, type GenerationInput, type GenerationOutput, type LLMProvider } from './types'

export { ProviderError } from './types'
export type { GenerationInput, GenerationOutput, LLMProvider } from './types'

const gemini = new GeminiProvider()
const openrouter = new OpenRouterProvider()

function pickProviders(): LLMProvider[] {
  if (env.LLM_PROVIDER === 'gemini') return [gemini]
  if (env.LLM_PROVIDER === 'openrouter') return [openrouter]
  // 'auto': try gemini first, fall back to openrouter
  const chain: LLMProvider[] = []
  if (gemini.isConfigured()) chain.push(gemini)
  if (openrouter.isConfigured()) chain.push(openrouter)
  return chain
}

export async function generate(input: GenerationInput): Promise<GenerationOutput> {
  const providers = pickProviders().filter((p) => p.isConfigured())

  if (providers.length === 0) {
    throw new ProviderError(
      'No LLM provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.',
      'none',
    )
  }

  const errors: ProviderError[] = []
  for (const provider of providers) {
    try {
      const result = await provider.generate(input)
      if (errors.length > 0) {
        console.warn(
          `provider ${provider.id} succeeded after ${errors.length} fallback(s):`,
          errors.map((e) => `${e.provider}: ${e.message}`).join('; '),
        )
      }
      return result
    } catch (err) {
      const pe = err instanceof ProviderError ? err : new ProviderError(String(err), provider.id, err)
      console.warn(`provider ${provider.id} failed: ${pe.message}`)
      errors.push(pe)
      if (!pe.retryable && providers.length === 1) {
        throw pe
      }
    }
  }

  throw new ProviderError(
    `All providers failed: ${errors.map((e) => `${e.provider} (${e.message})`).join(', ')}`,
    errors[errors.length - 1]?.provider ?? 'unknown',
    errors,
  )
}
