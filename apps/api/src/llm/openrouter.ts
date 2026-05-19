import { env } from '../env'
import { ProviderError, type GenerationInput, type GenerationOutput, type LLMProvider } from './types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface OpenRouterResponse {
  choices?: Array<{
    message?: { content?: string }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: { message?: string; code?: number | string }
}

export class OpenRouterProvider implements LLMProvider {
  readonly id = 'openrouter' as const

  isConfigured(): boolean {
    return Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.length > 0)
  }

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    if (!this.isConfigured()) {
      throw new ProviderError('OPENROUTER_API_KEY is not set', this.id)
    }

    let response: Response
    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'content-type': 'application/json',
          'http-referer': 'https://github.com/SkorbezhArtem/vacancy-kit',
          'x-title': 'vacancy-kit',
        },
        body: JSON.stringify({
          model: env.OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens ?? 600,
          ...(input.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      })
    } catch (err) {
      throw new ProviderError(`OpenRouter network error: ${describe(err)}`, this.id, err, true)
    }

    if (!response.ok) {
      const body = await safeJson(response)
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500
      throw new ProviderError(
        `OpenRouter responded ${response.status}: ${body?.error?.message ?? response.statusText}`,
        this.id,
        body,
        retryable,
      )
    }

    const data = (await response.json()) as OpenRouterResponse
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) {
      throw new ProviderError('OpenRouter returned empty completion', this.id, data)
    }

    return {
      text,
      model: env.OPENROUTER_MODEL,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    }
  }
}

async function safeJson(response: Response): Promise<OpenRouterResponse | null> {
  try {
    return (await response.json()) as OpenRouterResponse
  } catch {
    return null
  }
}

function describe(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return String(err)
}
