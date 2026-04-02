import { AIAction } from './types';

export type AIRetryPolicy = {
  maxTries: number;
  delayMs: number;
};

export type AIActionPolicy = {
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  retry: AIRetryPolicy;
  coalescingEligible: boolean;
  fallbackBehaviorLabel: string;
};

export const aiPolicy: Record<AIAction, AIActionPolicy> = {
  guidance: {
    model: 'gpt-4',
    timeoutMs: 30000,
    maxOutputTokens: 600,
    retry: {
      maxTries: 2,
      delayMs: 500,
    },
    coalescingEligible: true,
    fallbackBehaviorLabel: 'guidance_fallback',
  },
  create_dossier: {
    model: 'gpt-4',
    timeoutMs: 15000,
    maxOutputTokens: 600,
    retry: {
      maxTries: 2,
      delayMs: 500,
    },
    coalescingEligible: false,
    fallbackBehaviorLabel: 'create_dossier_fallback',
  },
};

export function getAIActionPolicy(action: AIAction): AIActionPolicy {
  return aiPolicy[action];
}
