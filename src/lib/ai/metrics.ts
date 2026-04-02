import { AIExecutionMode } from './types';

type AIMetrics = {
  totalRequests: number;
  providerCalls: number;
  cacheHits: number;
  dedupHits: number;
  coalescedRequests: number;
  rateLimitHits: number;
  failedRequests: number;
};

type MetricsSnapshot = {
  totals: AIMetrics;
  byMode: Record<AIExecutionMode, AIMetrics>;
};

const INITIAL_METRICS: AIMetrics = {
  totalRequests: 0,
  providerCalls: 0,
  cacheHits: 0,
  dedupHits: 0,
  coalescedRequests: 0,
  rateLimitHits: 0,
  failedRequests: 0,
};

const metricsByMode: Record<AIExecutionMode, AIMetrics> = {
  live: { ...INITIAL_METRICS },
  local: { ...INITIAL_METRICS },
};

export function incrementMetric(metric: keyof AIMetrics, mode: AIExecutionMode = 'live'): void {
  metricsByMode[mode][metric] += 1;
}

export function getMetrics(): MetricsSnapshot {
  const totals = (Object.keys(INITIAL_METRICS) as Array<keyof AIMetrics>).reduce<AIMetrics>((accumulator, key) => {
    accumulator[key] = metricsByMode.live[key] + metricsByMode.local[key];
    return accumulator;
  }, { ...INITIAL_METRICS });

  return {
    totals,
    byMode: {
      live: { ...metricsByMode.live },
      local: { ...metricsByMode.local },
    },
  };
}

export function resetMetrics(): void {
  for (const mode of Object.keys(metricsByMode) as AIExecutionMode[]) {
    for (const key of Object.keys(INITIAL_METRICS) as Array<keyof AIMetrics>) {
      metricsByMode[mode][key] = 0;
    }
  }
}
