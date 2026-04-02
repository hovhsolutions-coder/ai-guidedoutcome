import { AIAction, AIExecutionMode } from './types';

type ActionCostStats = {
  totalRequests: number;
  providerCalls: number;
  estimatedInputChars: number;
  estimatedOutputChars: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
};

type CostSummary = {
  byAction: Record<AIAction, ActionCostStats>;
  byMode: Record<AIExecutionMode, ActionCostStats>;
  totals: ActionCostStats;
  note: string;
};

const INITIAL_STATS: ActionCostStats = {
  totalRequests: 0,
  providerCalls: 0,
  estimatedInputChars: 0,
  estimatedOutputChars: 0,
  estimatedInputTokens: 0,
  estimatedOutputTokens: 0,
  estimatedCost: 0,
};

const costStats: Record<AIAction, ActionCostStats> = {
  guidance: { ...INITIAL_STATS },
  create_dossier: { ...INITIAL_STATS },
};

const modeCostStats: Record<AIExecutionMode, ActionCostStats> = {
  live: { ...INITIAL_STATS },
  local: { ...INITIAL_STATS },
};

const INPUT_COST_PER_1K_TOKENS = 0.01;
const OUTPUT_COST_PER_1K_TOKENS = 0.03;

export function trackActionRequest(action: AIAction, mode: AIExecutionMode = 'live'): void {
  costStats[action].totalRequests += 1;
  modeCostStats[mode].totalRequests += 1;
}

export function trackProviderUsage(
  action: AIAction,
  inputText: string,
  outputText: string,
  mode: AIExecutionMode = 'live'
): void {
  const inputChars = inputText.length;
  const outputChars = outputText.length;
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  const estimatedCost = ((inputTokens / 1000) * INPUT_COST_PER_1K_TOKENS) + ((outputTokens / 1000) * OUTPUT_COST_PER_1K_TOKENS);

  costStats[action].providerCalls += 1;
  costStats[action].estimatedInputChars += inputChars;
  costStats[action].estimatedOutputChars += outputChars;
  costStats[action].estimatedInputTokens += inputTokens;
  costStats[action].estimatedOutputTokens += outputTokens;
  costStats[action].estimatedCost += estimatedCost;

  modeCostStats[mode].providerCalls += 1;
  modeCostStats[mode].estimatedInputChars += inputChars;
  modeCostStats[mode].estimatedOutputChars += outputChars;
  modeCostStats[mode].estimatedInputTokens += inputTokens;
  modeCostStats[mode].estimatedOutputTokens += outputTokens;
  modeCostStats[mode].estimatedCost += estimatedCost;
}

export function getCostSummary(): CostSummary {
  const totals = (Object.keys(costStats) as AIAction[]).reduce<ActionCostStats>((accumulator, action) => {
    const stats = costStats[action];
    return {
      totalRequests: accumulator.totalRequests + stats.totalRequests,
      providerCalls: accumulator.providerCalls + stats.providerCalls,
      estimatedInputChars: accumulator.estimatedInputChars + stats.estimatedInputChars,
      estimatedOutputChars: accumulator.estimatedOutputChars + stats.estimatedOutputChars,
      estimatedInputTokens: accumulator.estimatedInputTokens + stats.estimatedInputTokens,
      estimatedOutputTokens: accumulator.estimatedOutputTokens + stats.estimatedOutputTokens,
      estimatedCost: accumulator.estimatedCost + stats.estimatedCost,
    };
  }, { ...INITIAL_STATS });

  return {
    byAction: {
      guidance: { ...costStats.guidance },
      create_dossier: { ...costStats.create_dossier },
    },
    byMode: {
      live: { ...modeCostStats.live },
      local: { ...modeCostStats.local },
    },
    totals,
    note: 'Estimated usage only. Token and cost values are heuristic and not billing-accurate.',
  };
}

function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.max(1, Math.ceil(text.length / 4));
}
