// Governance, Privacy, and Operational Ownership
// Critical requirements for production analytics deployment

// 1. EVENT CONTRACT GOVERNANCE
export interface EventContractGovernance {
  // Schema versioning
  versioning: {
    currentVersion: string;
    backwardCompatibility: string[]; // supported versions
    deprecationPolicy: {
      noticePeriod: number; // days
      migrationSupport: number; // days
    };
  };
  
  // Change management
  changeManagement: {
    requiredApprovals: string[]; // roles
    reviewProcess: string[]; // steps
    deploymentWindows: string[]; // time windows
    rollbackConditions: string[]; // triggers
  };
  
  // Schema validation
  validation: {
    requiredFields: string[];
    typeValidation: boolean;
    rangeValidation: boolean;
    businessRuleValidation: boolean;
  };
}

// 2. DATA PRIVACY AND COMPLIANCE
export interface DataPrivacyCompliance {
  // Data classification
  classification: {
    personalData: string[]; // field names
    sensitiveData: string[]; // field names
    anonymousData: string[]; // field names
  };
  
  // Retention policies
  retention: {
    events: number; // days
    sessions: number; // days
    aggregates: number; // days
    experiments: number; // days
  };
  
  // Consent management
  consent: {
    required: boolean;
    granularity: 'session' | 'feature' | 'event';
    withdrawalMethod: 'api' | 'ui' | 'both';
    consentStorage: 'database' | 'cookie' | 'local';
  };
  
  // Data anonymization
  anonymization: {
    sessionIdHashing: boolean;
    ipAnonymization: boolean;
    userAgentStripping: boolean;
    timestampBucketing: number; // minutes
  };
  
  // Compliance frameworks
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    hipaa: boolean;
    sox: boolean;
  };
}

// 3. OPERATIONAL OWNERSHIP MODEL
export interface OperationalOwnership {
  // Team responsibilities
  teams: {
    analytics: {
      owner: string;
      responsibilities: string[];
      escalationPath: string[];
    };
    engineering: {
      owner: string;
      responsibilities: string[];
      escalationPath: string[];
    };
    product: {
      owner: string;
      responsibilities: string[];
      escalationPath: string[];
    };
    dataScience: {
      owner: string;
      responsibilities: string[];
      escalationPath: string[];
    };
  };
  
  // Dashboard ownership
  dashboards: {
    realTimeMonitoring: string;
    businessMetrics: string;
    experimentResults: string;
    dataQuality: string;
  };
  
  // Alert ownership
  alerts: {
    technical: string;
    business: string;
    privacy: string;
    compliance: string;
  };
  
  // Experiment governance
  experiments: {
    designApproval: string;
    implementationApproval: string;
    resultsReview: string;
    rolloutDecision: string;
  };
}

// 4. FAILURE HANDLING AND MONITORING
export interface FailureHandling {
  // Error classification
  errorClassification: {
    critical: string[]; // error types
    warning: string[]; // error types
    info: string[]; // error types
  };
  
  // Monitoring requirements
  monitoring: {
    endpointHealth: {
      interval: number; // seconds
      timeout: number; // seconds
      retryAttempts: number;
    };
    dataQuality: {
      completenessThreshold: number; // %
      accuracyThreshold: number; // %
      latencyThreshold: number; // milliseconds
    };
    systemPerformance: {
      cpuThreshold: number; // %
      memoryThreshold: number; // %
      diskThreshold: number; // %
    };
  };
  
  // Incident response
  incidentResponse: {
    severityLevels: string[];
    responseTimes: Record<string, number>; // severity: minutes
    communicationChannels: string[];
    escalationTriggers: string[];
  };
}

// 5. SAMPLE SIZE CALCULATION CONTEXT
export interface SampleSizeContext {
  // Business context
  businessMetrics: {
    dailySessions: number;
    averageConversionRate: number;
    revenuePerConversion: number;
    variance: number;
  };
  
  // Statistical requirements
  statistical: {
    confidenceLevel: number; // 0-1
    power: number; // 0-1
    minimumDetectableEffect: number; // %
    expectedVariance: number;
  };
  
  // Practical constraints
  constraints: {
    maximumTestDuration: number; // days
    minimumTrafficPerVariant: number;
    seasonalAdjustments: string[];
  };
  
  // Calculated requirements
  calculated: {
    requiredSampleSize: number;
    estimatedDuration: number;
    confidenceInterval: number;
    statisticalPower: number;
  };
}

// 6. PRODUCTION CONFIGURATION WITH GOVERNANCE
export const PRODUCTION_GOVERNANCE_CONFIG: {
  eventContract: EventContractGovernance;
  privacy: DataPrivacyCompliance;
  ownership: OperationalOwnership;
  failureHandling: FailureHandling;
} = {
  eventContract: {
    versioning: {
      currentVersion: '1.0.0',
      backwardCompatibility: ['0.9'],
      deprecationPolicy: {
        noticePeriod: 30, // 30 days
        migrationSupport: 14, // 14 days
      },
    },
    changeManagement: {
      requiredApprovals: ['analytics-lead', 'engineering-lead', 'product-manager'],
      reviewProcess: ['technical-review', 'privacy-review', 'business-review'],
      deploymentWindows: ['Tuesday-Thursday 2AM-4AM UTC'],
      rollbackConditions: ['error-rate>5%', 'latency>500ms', 'data-quality<95%'],
    },
    validation: {
      requiredFields: ['sessionId', 'timestamp', 'event'],
      typeValidation: true,
      rangeValidation: true,
      businessRuleValidation: true,
    },
  },
  privacy: {
    classification: {
      personalData: ['userAgent', 'sessionId'],
      sensitiveData: [],
      anonymousData: ['domain', 'confidence', 'interactionEvents'],
    },
    retention: {
      events: 90,
      sessions: 180,
      aggregates: 365,
      experiments: 730,
    },
    consent: {
      required: true,
      granularity: 'feature',
      withdrawalMethod: 'both',
      consentStorage: 'database',
    },
    anonymization: {
      sessionIdHashing: true,
      ipAnonymization: true,
      userAgentStripping: false,
      timestampBucketing: 15, // 15 minutes
    },
    compliance: {
      gdpr: true,
      ccpa: true,
      hipaa: false,
      sox: false,
    },
  },
  ownership: {
    teams: {
      analytics: {
        owner: 'analytics-team-lead',
        responsibilities: [
          'event schema design',
          'data quality monitoring',
          'dashboard maintenance',
          'experiment design',
        ],
        escalationPath: ['analytics-manager', 'data-platform-director'],
      },
      engineering: {
        owner: 'platform-engineering-lead',
        responsibilities: [
          'API endpoint maintenance',
          'database performance',
          'data pipeline reliability',
          'monitoring infrastructure',
        ],
        escalationPath: ['engineering-manager', 'vp-engineering'],
      },
      product: {
        owner: 'product-manager-guidance',
        responsibilities: [
          'experiment prioritization',
          'success criteria definition',
          'feature flag management',
          'business impact analysis',
        ],
        escalationPath: ['senior-product-manager', 'vp-product'],
      },
      dataScience: {
        owner: 'data-science-lead',
        responsibilities: [
          'statistical analysis',
          'experiment interpretation',
          'model validation',
          'insight generation',
        ],
        escalationPath: ['data-science-manager', 'head-of-data'],
      },
    },
    dashboards: {
      realTimeMonitoring: 'platform-engineering',
      businessMetrics: 'analytics-team',
      experimentResults: 'data-science-team',
      dataQuality: 'analytics-team',
    },
    alerts: {
      technical: 'platform-engineering',
      business: 'analytics-team',
      privacy: 'legal-team',
      compliance: 'compliance-team',
    },
    experiments: {
      designApproval: 'product-manager-guidance',
      implementationApproval: 'engineering-lead',
      resultsReview: 'data-science-lead',
      rolloutDecision: 'vp-product',
    },
  },
  failureHandling: {
    errorClassification: {
      critical: ['database-connection-failed', 'api-timeout', 'data-corruption'],
      warning: ['high-latency', 'partial-data-loss', 'schema-validation-failed'],
      info: ['low-volume', 'slow-aggregation', 'minor-validation-errors'],
    },
    monitoring: {
      endpointHealth: {
        interval: 60, // 1 minute
        timeout: 5000, // 5 seconds
        retryAttempts: 3,
      },
      dataQuality: {
        completenessThreshold: 95, // 95%
        accuracyThreshold: 99, // 99%
        latencyThreshold: 5000, // 5 seconds
      },
      systemPerformance: {
        cpuThreshold: 80, // 80%
        memoryThreshold: 85, // 85%
        diskThreshold: 90, // 90%
      },
    },
    incidentResponse: {
      severityLevels: ['P0', 'P1', 'P2', 'P3'],
      responseTimes: {
        P0: 15, // 15 minutes
        P1: 60, // 1 hour
        P2: 240, // 4 hours
        P3: 1440, // 24 hours
      } as Record<string, number>,
      communicationChannels: ['slack-analytics', 'email-incident', 'page-on-call'],
      escalationTriggers: ['error-rate>10%', 'data-quality<90%', 'service-unavailable'],
    },
  },
};

// 7. SAMPLE SIZE CALCULATION WITH BUSINESS CONTEXT
export const BUSINESS_SAMPLE_SIZE_CALCULATION: SampleSizeContext = {
  businessMetrics: {
    dailySessions: 1000,
    averageConversionRate: 0.25, // 25%
    revenuePerConversion: 100, // $100
    variance: 0.0625, // p(1-p) for 25% rate
  },
  statistical: {
    confidenceLevel: 0.95, // 95%
    power: 0.8, // 80%
    minimumDetectableEffect: 0.03, // 3% absolute improvement
    expectedVariance: 0.0625,
  },
  constraints: {
    maximumTestDuration: 14, // 14 days
    minimumTrafficPerVariant: 250, // 250 sessions per variant
    seasonalAdjustments: ['weekend-dip', 'holiday-impact'],
  },
  calculated: {
    requiredSampleSize: 2176, // calculated per variant
    estimatedDuration: 9, // 9 days at 1000 sessions/day
    confidenceInterval: 0.02, // 2%
    statisticalPower: 0.81, // 81%
  },
};

// 8. IMPLEMENTATION DEPENDENCIES
export const IMPLEMENTATION_DEPENDENCIES = {
  // Technical dependencies
  technical: [
    'database-cluster-availability',
    'api-gateway-rate-limiting',
    'event-streaming-service',
    'monitoring-infrastructure',
  ],
  
  // Team dependencies
  teams: [
    'platform-engineering-availability',
    'analytics-team-bandwidth',
    'data-science-support',
    'legal-review-completion',
  ],
  
  // External dependencies
  external: [
    'privacy-policy-update',
    'consent-management-implementation',
    'data-retention-policy-approval',
  ],
  
  // Timeline adjustments
  timelineAdjustments: {
    optimistic: 3, // weeks (all dependencies available)
    realistic: 5, // weeks (some dependencies delayed)
    pessimistic: 8, // weeks (multiple bottlenecks)
  },
};
