// Domain Detection Metrics Framework
// Tracks user behavior and system performance for continuous optimization

export interface DomainDetectionMetrics {
  // Primary metrics
  intakeCompletionRate: number; // % of users who complete intake after seeing domain detection
  timeToFirstSubmission: number; // Average time from first domain detection to submission
  dropOffAfterDetection: number; // % of users who leave after seeing detection
  
  // Behavioral metrics
  domainChangeFrequency: number; // How often domain prediction changes during typing
  confidenceStability: number; // % of time confidence stays above threshold
  interactionLatency: number; // Perceived responsiveness of detection updates
  
  // Trust signals
  correctionRate: number; // % of users who manually override detected domain
  engagementDepth: number; // How much users interact with detected signals
}

interface ExperimentConfig {
  debounceMs: number;
  confidenceThreshold: number;
  visualStyle: 'subtle' | 'prominent' | 'minimal';
  labelVariant: 'preview' | 'analysis' | 'system';
}

// Current production config
export const PRODUCTION_CONFIG: ExperimentConfig = {
  debounceMs: 500,
  confidenceThreshold: 0.6,
  visualStyle: 'subtle',
  labelVariant: 'system',
};

// Alternative configs for A/B testing
export const EXPERIMENT_VARIANTS: Record<string, ExperimentConfig> = {
  responsive: {
    debounceMs: 300,
    confidenceThreshold: 0.5,
    visualStyle: 'subtle',
    labelVariant: 'system',
  },
  conservative: {
    debounceMs: 800,
    confidenceThreshold: 0.7,
    visualStyle: 'minimal',
    labelVariant: 'preview',
  },
  prominent: {
    debounceMs: 500,
    confidenceThreshold: 0.6,
    visualStyle: 'prominent',
    labelVariant: 'analysis',
  },
};

// Success criteria for experiments
export const SUCCESS_CRITERIA = {
  // Primary: Must improve without hurting other metrics
  intakeCompletionRate: { improvement: 0.05, maxRegression: 0.02 }, // 5% improvement, 2% max regression
  timeToFirstSubmission: { improvement: -0.10, maxRegression: 0.05 }, // 10% faster, 5% max slower
  
  // Secondary: Should maintain stability
  domainChangeFrequency: { maxIncrease: 0.10 }, // Max 10% increase in domain hopping
  confidenceStability: { minMaintain: 0.80 }, // Must maintain 80% stability
  interactionLatency: { maxIncrease: 0.20 }, // Max 20% slower perceived response
  
  // Trust: Should not create confusion
  correctionRate: { maxIncrease: 0.15 }, // Max 15% increase in manual corrections
  dropOffAfterDetection: { maxIncrease: 0.10 }, // Max 10% increase in drop-offs
};

// Metrics collection functions
export function trackIntakeCompletion(event: 'start' | 'complete' | 'abandon', metadata?: any) {
  // Implementation for analytics tracking
  console.log(`[METRICS] Intake ${event}:`, metadata);
}

export function trackDomainDetection(domain: string, confidence: number, previousDomain?: string) {
  // Implementation for domain detection tracking
  console.log(`[METRICS] Domain detected: ${domain} (${confidence})`, { previousDomain });
}

export function trackUserInteraction(action: 'hover' | 'click' | 'override', target: string) {
  // Implementation for interaction tracking
  console.log(`[METRICS] User interaction: ${action} on ${target}`);
}

// Experiment evaluation function
export function evaluateExperiment(metrics: DomainDetectionMetrics, control: DomainDetectionMetrics, variant: ExperimentConfig): boolean {
  const success = Object.entries(SUCCESS_CRITERIA).every(([key, criteria]) => {
    const metricValue = metrics[key as keyof DomainDetectionMetrics];
    const controlValue = control[key as keyof DomainDetectionMetrics];
    
    if (typeof criteria === 'object' && criteria !== null) {
      if ('improvement' in criteria) {
        const improvement = (metricValue - controlValue) / controlValue;
        return improvement >= criteria.improvement! && improvement <= criteria.maxRegression!;
      }
      if ('maxIncrease' in criteria) {
        return metricValue <= criteria.maxIncrease!;
      }
      if ('minMaintain' in criteria) {
        return metricValue >= criteria.minMaintain!;
      }
    }
    
    return true;
  });
  
  console.log(`[EXPERIMENT] Variant ${JSON.stringify(variant)}: ${success ? 'SUCCESS' : 'FAILED'}`);
  return success;
}
