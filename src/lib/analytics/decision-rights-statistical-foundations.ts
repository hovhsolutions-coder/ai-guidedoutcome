// Decision Rights and Statistical Foundations
// Explicit authority and transparent assumptions for operational clarity

// 1. DECISION RIGHTS FRAMEWORK
export interface DecisionRights {
  // Who can make which decisions
  authorities: {
    // Analytics governance
    analytics: {
      schemaChanges: {
        canApprove: string[];
        canBlock: string[];
        canOverride: string[];
        escalationPath: string[];
      };
      retentionPolicy: {
        canApprove: string[];
        canBlock: string[];
        canOverride: string[];
        escalationPath: string[];
      };
      privacyPolicy: {
        canApprove: string[];
        canBlock: string[];
        canOverride: string[];
        escalationPath: string[];
      };
    };
    
    // Experiment governance
    experiments: {
      designApproval: {
        canApprove: string[];
        canBlock: string[];
        canPause: string[];
        canStop: string[];
      };
      implementationApproval: {
        canApprove: string[];
        canBlock: string[];
        canRollback: string[];
      };
      resultsReview: {
        canApprove: string[];
        canBlock: string[];
        canOverride: string[];
      };
      rolloutDecision: {
        canApprove: string[];
        canBlock: string[];
        canForceRollback: string[];
      };
    };
    
    // Production operations
    operations: {
      deploymentApproval: {
        canApprove: string[];
        canBlock: string[];
        canEmergencyDeploy: string[];
      };
      incidentResponse: {
        canDeclare: string[];
        canEscalate: string[];
        canResolve: string[];
      };
      complianceIssues: {
        canDeclare: string[];
        canBlock: string[];
        canWaive: string[];
      };
    };
  };
  
  // Decision thresholds and constraints
  thresholds: {
    schemaChanges: {
      maxBreakingChangesPerQuarter: number;
      maxDeprecationImpact: number; // % of events
      requiredNoticePeriod: number; // days
    };
    experiments: {
      maxTrafficPerExperiment: number; // % of total
      maxConcurrentExperiments: number;
      minStatisticalPower: number; // 0-1
    };
    operations: {
      maxDowntimePerDeployment: number; // minutes
      maxErrorRate: number; // %
      maxDataLoss: number; // %
    };
  };
}

// 2. STATISTICAL ASSUMPTIONS AND FOUNDATIONS
export interface StatisticalFoundations {
  // Current baseline assumptions (must be validated)
  baselineAssumptions: {
    currentConversionRate: number; // observed baseline
    currentVariance: number; // observed variance
    currentDailySessions: number; // observed average
    currentSessionVariance: number; // observed variance
    seasonalFactors: {
      weekdayVsWeekend: number; // ratio
      holidayImpact: number; // % change
      timeOfDayImpact: number; // % change
    };
  };
  
  // Statistical calculation assumptions
  calculationAssumptions: {
    distribution: 'normal' | 'binomial' | 'poisson';
    varianceStability: boolean; // assume stable variance
    independence: boolean; // assume independent sessions
    sampleRepresentation: boolean; // assume sample represents population
  };
  
  // Business impact assumptions
  businessAssumptions: {
    revenuePerConversion: number; // $ amount
    costPerExperiment: number; // $ amount
    valueOfImprovement: number; // $ per % improvement
    timeToImplement: number; // weeks
    validationRequired: string[]; // validation steps needed
  };
  
  // Risk tolerance
  riskTolerance: {
    maxFalsePositiveRate: number; // 0-1
    maxFalseNegativeRate: number; // 0-1
    maxExperimentDuration: number; // weeks
    maxTrafficRisk: number; // % of total
  };
  
  // Validation requirements
  validationRequirements: {
    baselineValidationPeriod: number; // days
    minimumSampleSize: number; // sessions
    powerCalculationMethod: string;
    confidenceIntervalMethod: string;
  };
}

// 3. METRIC CLASSIFICATION FRAMEWORK
export interface MetricClassification {
  // Product outcome metrics (what users experience)
  productOutcomes: {
    primary: [
      'intake_completion_rate', // Measured via session tracking
      'time_to_first_submission', // Measured via timestamp analysis
      'domain_detection_accuracy', // Measured via manual validation sample
    ];
    secondary: [
      'drop_off_after_detection', // Measured via session funnel analysis
      'manual_override_rate', // Measured via mode selection tracking
      'return_usage_rate', // Measured via repeat session tracking
    ];
  };
  
  // Business outcome metrics (what business cares about)
  businessOutcomes: {
    primary: [
      'conversion_rate_lift', // Measured via A/B test results
      'revenue_per_session', // Requires business data integration
      'customer_acquisition_cost', // Requires marketing data integration
    ];
    secondary: [
      'user_retention_rate', // Requires user tracking system
      'lifetime_value', // Requires business analytics system
      'support_ticket_rate', // Requires support system integration
    ];
  };
  
  // Operational health metrics (what operations team monitors)
  operationalHealth: {
    primary: [
      'event_delivery_rate', // Measured via API monitoring
      'api_response_time', // Measured via performance monitoring
      'data_quality_score', // Measured via validation rules
    ];
    secondary: [
      'system_uptime', // Measured via infrastructure monitoring
      'error_rate', // Measured via error tracking
      'storage_utilization', // Measured via infrastructure metrics
    ];
  };
  
  // Compliance metrics (what legal/compliance monitors)
  complianceMetrics: {
    primary: [
      'consent_collection_rate', // Measured via consent tracking
      'data_retention_compliance', // Measured via retention policy enforcement
      'privacy_policy_adherence', // Measured via policy compliance checks
    ];
    secondary: [
      'audit_completion_rate', // Measured via audit tracking
      'policy_update_coverage', // Measured via policy deployment tracking
      'incident_response_time', // Measured via incident tracking
    ];
  };
  
  // Data collection requirements
  collectionRequirements: {
    // What infrastructure must exist before measurement
    requiredInfrastructure: [
      'session_tracking_system',
      'event_timestamping',
      'user_identification_system',
      'business_data_integration',
    ];
    
    // What validation methods must be implemented
    validationMethods: [
      'manual_validation_sampling',
      'automated_data_quality_checks',
      'cross_system_validation',
      'statistical_validation',
    ];
  };
}

// 4. PRODUCTION DECISION RIGHTS CONFIGURATION
export const PRODUCTION_DECISION_RIGHTS: DecisionRights = {
  authorities: {
    analytics: {
      schemaChanges: {
        canApprove: ['analytics-lead', 'engineering-lead'],
        canBlock: ['legal-team', 'privacy-officer'],
        canOverride: ['vp-engineering', 'cto'],
        escalationPath: ['analytics-lead -> vp-data -> ceo'],
      },
      retentionPolicy: {
        canApprove: ['analytics-lead', 'legal-team'],
        canBlock: ['compliance-officer', 'privacy-officer'],
        canOverride: ['vp-legal', 'cto'],
        escalationPath: ['analytics-lead -> vp-legal -> ceo'],
      },
      privacyPolicy: {
        canApprove: ['legal-team', 'privacy-officer'],
        canBlock: ['compliance-officer', 'board'],
        canOverride: ['ceo', 'board'],
        escalationPath: ['legal-team -> ceo -> board'],
      },
    },
    experiments: {
      designApproval: {
        canApprove: ['product-manager-guidance', 'analytics-lead'],
        canBlock: ['engineering-lead', 'legal-team'],
        canPause: ['product-manager-guidance'],
        canStop: ['vp-product', 'vp-engineering'],
      },
      implementationApproval: {
        canApprove: ['engineering-lead', 'analytics-lead'],
        canBlock: ['platform-architect', 'security-team'],
        canRollback: ['engineering-lead', 'vp-engineering'],
      },
      resultsReview: {
        canApprove: ['data-science-lead', 'product-manager-guidance'],
        canBlock: ['analytics-lead', 'vp-product'],
        canOverride: ['vp-data', 'cto'],
      },
      rolloutDecision: {
        canApprove: ['vp-product', 'vp-engineering'],
        canBlock: ['vp-data', 'legal-team'],
        canForceRollback: ['engineering-lead', 'vp-engineering'], // Operational, not executive
      },
    },
    operations: {
      deploymentApproval: {
        canApprove: ['engineering-lead', 'devops-lead'],
        canBlock: ['security-team', 'compliance-officer'],
        canEmergencyDeploy: ['vp-engineering', 'cto'],
      },
      incidentResponse: {
        canDeclare: ['on-call-engineer', 'devops-lead'],
        canEscalate: ['engineering-lead', 'vp-engineering'],
        canResolve: ['incident-commander', 'vp-engineering'],
      },
      complianceIssues: {
        canDeclare: ['compliance-officer', 'legal-team'],
        canBlock: ['vp-legal', 'ceo'],
        canWaive: ['ceo', 'board'],
      },
    },
  },
  thresholds: {
    schemaChanges: {
      maxBreakingChangesPerQuarter: 2,
      maxDeprecationImpact: 5, // 5% of events
      requiredNoticePeriod: 30, // 30 days
    },
    experiments: {
      maxTrafficPerExperiment: 25, // 25% of total
      maxConcurrentExperiments: 3,
      minStatisticalPower: 0.8, // 80%
    },
    operations: {
      maxDowntimePerDeployment: 5, // 5 minutes
      maxErrorRate: 1, // 1%
      maxDataLoss: 0.1, // 0.1%
    },
  },
};

// 5. STATISTICAL FOUNDATIONS WITH CURRENT ASSUMPTIONS
export const CURRENT_STATISTICAL_FOUNDATIONS: StatisticalFoundations = {
  baselineAssumptions: {
    // NOTE: These must be validated with actual data before experiments
    currentConversionRate: 0.25, // 25% (assumption, needs validation)
    currentVariance: 0.0625, // p(1-p) for 25% rate (assumption)
    currentDailySessions: 1000, // (assumption, needs validation)
    currentSessionVariance: 100, // (assumption, needs validation)
    seasonalFactors: {
      weekdayVsWeekend: 0.8, // 20% lower on weekends (assumption)
      holidayImpact: 0.7, // 30% lower on holidays (assumption)
      timeOfDayImpact: 1.2, // 20% higher during business hours (assumption)
    },
  },
  calculationAssumptions: {
    distribution: 'binomial', // conversion events are binary
    varianceStability: true, // assume stable variance during experiment
    independence: true, // assume independent sessions
    sampleRepresentation: true, // assume sample represents population
  },
  businessAssumptions: {
    revenuePerConversion: 100, // $100 per conversion (REQUIRES VALIDATION)
    costPerExperiment: 5000, // $5000 per experiment (REQUIRES VALIDATION)
    valueOfImprovement: 10000, // $10k per 1% improvement (REQUIRES VALIDATION)
    timeToImplement: 7, // 7 weeks (REQUIRES VALIDATION)
    validationRequired: [
      'revenue_per_conversion_from_business_data',
      'cost_per_experiment_from_engineering_estimates',
      'value_of_improvement_from_business_analysis',
      'time_to_implement_from_resource_planning',
    ],
  },
  riskTolerance: {
    maxFalsePositiveRate: 0.05, // 5% false positive rate
    maxFalseNegativeRate: 0.2, // 20% false negative rate
    maxExperimentDuration: 4, // 4 weeks max
    maxTrafficRisk: 25, // 25% of traffic max
  },
  validationRequirements: {
    baselineValidationPeriod: 14, // 14 days minimum
    minimumSampleSize: 2000, // 2000 sessions minimum
    powerCalculationMethod: 'two-sample-proportion-test',
    confidenceIntervalMethod: 'wilson-score-interval',
  },
};

// 6. METRIC CLASSIFICATION
export const METRIC_CLASSIFICATION: MetricClassification = {
  productOutcomes: {
    primary: [
      'intake_completion_rate', // Measured via session tracking
      'time_to_first_submission', // Measured via timestamp analysis
      'domain_detection_accuracy', // Measured via manual validation sample
    ],
    secondary: [
      'drop_off_after_detection', // Measured via session funnel analysis
      'manual_override_rate', // Measured via mode selection tracking
      'return_usage_rate', // Measured via repeat session tracking
    ],
  },
  businessOutcomes: {
    primary: [
      'conversion_rate_lift', // Measured via A/B test results
      'revenue_per_session', // Requires business data integration
      'customer_acquisition_cost', // Requires marketing data integration
    ],
    secondary: [
      'user_retention_rate', // Requires user tracking system
      'lifetime_value', // Requires business analytics system
      'support_ticket_rate', // Requires support system integration
    ],
  },
  operationalHealth: {
    primary: [
      'event_delivery_rate', // Measured via API monitoring
      'api_response_time', // Measured via performance monitoring
      'data_quality_score', // Measured via validation rules
    ],
    secondary: [
      'system_uptime', // Measured via infrastructure monitoring
      'error_rate', // Measured via error tracking
      'storage_utilization', // Measured via infrastructure metrics
    ],
  },
  complianceMetrics: {
    primary: [
      'consent_collection_rate', // Measured via consent tracking
      'data_retention_compliance', // Measured via retention policy enforcement
      'privacy_policy_adherence', // Measured via policy compliance checks
    ],
    secondary: [
      'audit_completion_rate', // Measured via audit tracking
      'policy_update_coverage', // Measured via policy deployment tracking
      'incident_response_time', // Measured via incident tracking
    ],
  },
  collectionRequirements: {
    requiredInfrastructure: [
      'session_tracking_system',
      'event_timestamping',
      'user_identification_system',
      'business_data_integration',
    ],
    validationMethods: [
      'manual_validation_sampling',
      'automated_data_quality_checks',
      'cross_system_validation',
      'statistical_validation',
    ],
  },
};

// 7. IMPLEMENTATION READINESS STATUS
export const IMPLEMENTATION_READINESS_STATUS = {
  // Complete specifications
  specifications: {
    eventSchema: 'COMPLETE',
    governance: 'COMPLETE',
    privacy: 'COMPLETE',
    decisionRights: 'COMPLETE',
    statisticalFoundations: 'COMPLETE',
    metricClassification: 'COMPLETE',
  },
  
  // Implementation ready
  implementation: {
    technicalDesign: 'READY_FOR_DEVELOPMENT',
    operationalPlan: 'READY_FOR_APPROVAL',
    governanceStructure: 'READY_FOR_IMPLEMENTATION',
  },
  
  // Dependencies and blockers
  dependencies: {
    governanceApproval: 'PENDING',
    legalReview: 'PENDING',
    resourceAllocation: 'PENDING',
    technicalInfrastructure: 'AVAILABLE',
  },
  
  // Risk assessment
  risks: {
    technical: 'LOW',
    operational: 'MEDIUM',
    regulatory: 'MEDIUM',
    business: 'LOW',
  },
} as const;
