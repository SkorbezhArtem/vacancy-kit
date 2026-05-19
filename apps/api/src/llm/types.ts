export interface GenerationInput {
  system: string
  user: string
  /** Higher = more creative, lower = more deterministic. */
  temperature?: number
  /** Hard cap on response size. */
  maxTokens?: number
  /** Ask the provider to return JSON only (resume audit, etc.). */
  jsonMode?: boolean
}

export interface GenerationOutput {
  text: string
  model: string
  /** Provider-reported usage if available. */
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

export interface LLMProvider {
  readonly id: 'gemini' | 'openrouter'
  /** Whether this provider has the credentials it needs to run. */
  isConfigured(): boolean
  generate(input: GenerationInput): Promise<GenerationOutput>
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly cause?: unknown,
    readonly retryable = false,
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}
