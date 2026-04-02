import { callOpenAI } from './providers/openai';

export type AIRunnerExecutionSettings = {
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  responseFormat?: 'json' | 'text';
  retry?: {
    maxTries: number;
    delayMs: number;
  };
};

export interface AIRawRunnerResult {
  success: boolean;
  rawText?: string;
  error?: string;
  rateLimited?: boolean;
}

export async function runAI(prompt: string, settings: AIRunnerExecutionSettings = {}): Promise<AIRawRunnerResult> {
  const maxTries = settings.retry?.maxTries ?? 2;
  const retryDelayMs = settings.retry?.delayMs ?? 500;

  for (let attempt = 1; attempt <= maxTries; attempt += 1) {
    try {
      const rawText = await callOpenAI(prompt, {
        model: settings.model,
        timeoutMs: settings.timeoutMs,
        maxOutputTokens: settings.maxOutputTokens,
        responseFormat: settings.responseFormat,
      });

      return {
        success: true,
        rawText,
      };
    } catch (error) {
      if (isRateLimitError(error)) {
        if (attempt < maxTries) {
          await delay(retryDelayMs);
          continue;
        }

        return {
          success: false,
          error: getErrorMessage(error),
          rateLimited: true,
        };
      }

      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  return {
    success: false,
    error: 'AI runner failed unexpectedly',
  };
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error && error.message.toLowerCase().includes('timed out')) {
    return false;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { status?: number; message?: string };
  const message = maybeError.message?.toLowerCase() ?? '';

  return maybeError.status === 429 || message.includes('rate limit');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown AI error occurred';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
