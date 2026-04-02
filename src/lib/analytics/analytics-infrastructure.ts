// Production Analytics Schema and Infrastructure
// Complete measurement plumbing for operational use

// 1. EVENT SCHEMA DEFINITIONS
export interface AnalyticsEventSchema {
  // Core session events
  intake_started: {
    sessionId: string;
    timestamp: number;
    userAgent: string;
    hasDomainDetection: boolean;
    detectedDomain?: string;
    inputLength: number;
  };
  
  intake_completed: {
    sessionId: string;
    timestamp: number;
    timeToComplete: number;
    success: boolean;
    finalDomain?: string;
    submissionCount: number;
    error?: string;
  };
  
  intake_abandoned: {
    sessionId: string;
    timestamp: number;
    timeSpent: number;
    step: string;
    inputLength: number;
    lastDomainDetected?: string;
  };
  
  // Domain detection events
  domain_detected: {
    sessionId: string;
    timestamp: number;
    domain: string;
    confidence: number;
    inputLength: number;
    isDomainChange: boolean;
    previousDomain?: string;
  };
  
  domain_changed: {
    sessionId: string;
    timestamp: number;
    fromDomain: string;
    toDomain: string;
    confidenceChange: number;
  };
  
  // User interaction events
  preview_hovered: {
    sessionId: string;
    timestamp: number;
    duration: number;
    domain: string;
    confidence: number;
  };
  
  preview_clicked: {
    sessionId: string;
    timestamp: number;
    target: string;
    domain: string;
    confidence: number;
  };
  
  // Performance events
  typing_pattern: {
    sessionId: string;
    timestamp: number;
    inputLength: number;
    typingSpeed: number;
    pauseDuration: number;
    isFastTyper: boolean;
    hasLongPauses: boolean;
  };
  
  responsiveness_perceived: {
    sessionId: string;
    timestamp: number;
    debounceMs: number;
    userSatisfaction: number; // 1-5 scale (collected via feedback)
  };
}

// 2. DATA PIPELINE CONFIGURATION
export interface AnalyticsPipeline {
  // Event collection
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  retryAttempts: number;
  
  // Data storage
  storage: {
    events: 'database' | 'file' | 'third-party';
    retention: number; // days
    compression: boolean;
  };
  
  // Real-time processing
  streaming: {
    enabled: boolean;
    windowSize: number; // minutes
    aggregationInterval: number; // seconds
  };
}

// 3. DASHBOARD AND VISUALIZATION REQUIREMENTS
export interface DashboardConfig {
  // Real-time metrics
  realtime: {
    activeSessions: number;
    currentCompletionRate: number;
    averageTimeToComplete: number;
    domainStabilityScore: number;
  };
  
  // Conversion funnel
  funnel: {
    intakeStarted: number;
    domainDetected: number;
    previewInteracted: number;
    intakeCompleted: number;
    dropOffPoints: Record<string, number>;
  };
  
  // Domain detection performance
  domainPerformance: {
    accuracy: Record<string, number>;
    confidenceDistribution: Record<string, number[]>;
    changeFrequency: number;
    userSatisfaction: number;
  };
  
  // Experiment results
  experiments: {
    variant: string;
    metrics: Record<string, number>;
    statisticalSignificance: boolean;
    confidence: number;
  }[];
}

// 4. ALERT THRESHOLDS AND GUARDRAILS
export interface AlertThresholds {
  // Performance alerts
  completionRate: {
    warning: number; // % drop from baseline
    critical: number; // % drop from baseline
  };
  
  dropOffRate: {
    warning: number; // % increase from baseline
    critical: number; // % increase from baseline
  };
  
  domainStability: {
    warning: number; // minimum stability score
    critical: number; // minimum stability score
  };
  
  errorRate: {
    warning: number; // % of sessions
    critical: number; // % of sessions
  };
}

// 5. EXPERIMENT DESIGN SPECIFICATION
export interface ExperimentDesign {
  // Assignment logic
  assignment: {
    method: 'random' | 'hash' | 'cookie';
    trafficSplit: Record<string, number>; // variant: percentage
    stickiness: 'session' | 'user' | 'persistent';
  };
  
  // Duration and sampling
  duration: {
    minimumDays: number;
    maximumDays: number;
    minimumSampleSize: number;
  };
  
  // Guardrails
  guardrails: {
    maxDropOffIncrease: number; // %
    maxCompletionDecrease: number; // %
    minStatisticalPower: number; // 0-1
    minDetectableEffect: number; // %
  };
  
  // Success criteria
  success: {
    primaryMetric: string;
    improvementThreshold: number; // %
    confidenceLevel: number; // 0-1
    requireStatisticalSignificance: boolean;
  };
  
  // Stop conditions
  stopConditions: {
    earlySuccess: boolean;
    earlyFailure: boolean;
    budgetLimit: number; // sessions
    timeLimit: number; // days
  };
}

// 6. PRODUCTION CONFIGURATION
export const PRODUCTION_ANALYTICS_CONFIG: {
  pipeline: AnalyticsPipeline;
  dashboard: DashboardConfig;
  alerts: AlertThresholds;
  experiments: ExperimentDesign;
} = {
  pipeline: {
    endpoint: '/api/analytics/events',
    batchSize: 50,
    flushInterval: 5000, // 5 seconds
    retryAttempts: 3,
    storage: {
      events: 'database',
      retention: 90, // 90 days
      compression: true,
    },
    streaming: {
      enabled: true,
      windowSize: 5, // 5 minutes
      aggregationInterval: 30, // 30 seconds
    },
  },
  dashboard: {
    realtime: {
      activeSessions: 0,
      currentCompletionRate: 0,
      averageTimeToComplete: 0,
      domainStabilityScore: 0,
    },
    funnel: {
      intakeStarted: 0,
      domainDetected: 0,
      previewInteracted: 0,
      intakeCompleted: 0,
      dropOffPoints: {},
    },
    domainPerformance: {
      accuracy: {},
      confidenceDistribution: {},
      changeFrequency: 0,
      userSatisfaction: 0,
    },
    experiments: [],
  },
  alerts: {
    completionRate: {
      warning: 5, // 5% drop
      critical: 10, // 10% drop
    },
    dropOffRate: {
      warning: 10, // 10% increase
      critical: 20, // 20% increase
    },
    domainStability: {
      warning: 0.8, // 80% stability
      critical: 0.7, // 70% stability
    },
    errorRate: {
      warning: 5, // 5% error rate
      critical: 10, // 10% error rate
    },
  },
  experiments: {
    assignment: {
      method: 'hash',
      trafficSplit: {
        control: 40,
        variant_a: 30,
        variant_b: 30,
      },
      stickiness: 'session',
    },
    duration: {
      minimumDays: 7,
      maximumDays: 14,
      minimumSampleSize: 1000,
    },
    guardrails: {
      maxDropOffIncrease: 15, // 15%
      maxCompletionDecrease: 5, // 5%
      minStatisticalPower: 0.8, // 80%
      minDetectableEffect: 3, // 3%
    },
    success: {
      primaryMetric: 'intake_completion_rate',
      improvementThreshold: 3, // 3% improvement
      confidenceLevel: 0.95, // 95% confidence
      requireStatisticalSignificance: true,
    },
    stopConditions: {
      earlySuccess: true,
      earlyFailure: true,
      budgetLimit: 10000, // 10k sessions
      timeLimit: 14, // 14 days
    },
  },
};

// 7. BASELINE COLLECTION PROTOCOL
export interface BaselineProtocol {
  // Collection period
  duration: {
    minimumDays: 7;
    targetDays: 14;
  };
  
  // Sample size requirements
  sampleSize: {
    minimumSessions: 1000;
    targetSessions: 5000;
  };
  
  // Metrics to establish
  baselineMetrics: [
    'intake_completion_rate',
    'time_to_first_submission',
    'drop_off_after_detection',
    'domain_stability_score',
    'user_engagement_rate',
    'manual_override_rate',
  ];
  
  // Quality checks
  qualityChecks: {
    dataFreshness: number; // hours
    missingDataThreshold: number; // %
    outlierThreshold: number; // standard deviations
  };
}

// 8. LEADING vs LAGGING INDICATORS
export const INDICATOR_TYPES = {
  // Leading indicators (diagnostic, early warning)
  leading: [
    'preview_hover_rate',
    'preview_click_rate',
    'domain_change_frequency',
    'typing_pattern_anomalies',
    'confidence_volatility',
  ],
  
  // Lagging indicators (outcomes, decisions)
  lagging: [
    'intake_completion_rate',
    'time_to_first_submission',
    'drop_off_after_detection',
    'manual_override_rate',
    'user_satisfaction_score',
  ],
} as const;

// 9. IMPLEMENTATION STATUS
export const IMPLEMENTATION_STATUS = {
  // Complete
  eventSchema: 'DEFINED',
  typescriptInterfaces: 'COMPLETE',
  
  // Framework only (needs implementation)
  dataPipeline: 'FRAMEWORK_ONLY',
  storageBackend: 'NOT_IMPLEMENTED',
  dashboard: 'NOT_IMPLEMENTED',
  alerting: 'NOT_IMPLEMENTED',
  
  // Ready for development
  experimentDesign: 'SPECIFIED',
  baselineProtocol: 'DEFINED',
} as const;
