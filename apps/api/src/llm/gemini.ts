import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { env } from '../env'
import { ProviderError, type GenerationInput, type GenerationOutput, type LLMProvider } from './types'

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini' as const

  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0)
  }

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    if (!this.isConfigured()) {
      throw new ProviderError('GEMINI_API_KEY is not set', this.id)
    }

    const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })

    try {
      const result = await generateText({
        model: google(env.GEMINI_MODEL),
        system: input.system,
        prompt: input.user,
        temperature: input.temperature ?? 0.7,
        maxTokens: input.maxTokens ?? 1200,
        providerOptions: {
          google: {
            // Gemini 2.5 Flash burns output tokens on "thinking" by default; skip it for cover letters.
            thinkingConfig: { thinkingBudget: 0 },
            ...(input.jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        },
      })

      return {
        text: result.text.trim(),
        model: env.GEMINI_MODEL,
        usage: {
          promptTokens: result.usage?.promptTokens,
          completionTokens: result.usage?.completionTokens,
          totalTokens: result.usage?.totalTokens,
        },
      }
    } catch (err) {
      const retryable = isRetryable(err)
      throw new ProviderError(
        `Gemini generation failed: ${describe(err)}`,
        this.id,
        err,
        retryable,
      )
    }
  }
}

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const message = 'message' in err && typeof err.message === 'string' ? err.message.toLowerCase() : ''
  return (
    message.includes('rate') ||
    message.includes('timeout') ||
    message.includes('overload') ||
    message.includes('temporar') ||
    message.includes('unavailable')
  )
}

function describe(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return String(err)
}
