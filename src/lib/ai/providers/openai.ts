import OpenAI from 'openai';
import { config } from '../../../../config';

export const client = new OpenAI({
  apiKey: config.openai.apiKey,
});

export type OpenAIExecutionSettings = {
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  responseFormat?: 'json' | 'text';
};

export async function callOpenAI(prompt: string, settings: OpenAIExecutionSettings = {}): Promise<string> {
  const responsePromise = client.responses.create({
    model: resolveModel(settings.model),
    input: prompt,
    max_output_tokens: settings.maxOutputTokens ?? 600,
    temperature: 0.7,
  });

  const response = settings.timeoutMs
    ? await Promise.race([
        responsePromise,
        createTimeoutPromise(settings.timeoutMs),
      ])
    : await responsePromise;

  return response.output_text ?? '';
}

function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`OpenAI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

function resolveModel(model?: string): string {
  if (!model || model === 'gpt-4') {
    return 'gpt-4.1-mini';
  }

  return model;
}
