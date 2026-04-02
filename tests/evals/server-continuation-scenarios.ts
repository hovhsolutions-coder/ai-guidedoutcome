export const serverContinuationScenarios = [
  {
    id: 'server_low_info_quick_assist',
    title: 'low information guidance stays light while still preferring a strategic specialist angle',
    sessionInput: {
      initialInput: 'What should I look at first?',
      detectedDomain: 'quick_question',
      activeMode: 'quick_assist',
      shouldOfferDossier: false,
      result: {
        summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
        nextStep: 'Understand the core concern behind the question',
        suggestedTasks: ['Capture the missing context'],
      },
      createdAt: '2026-03-22T12:10:00.000Z',
    },
    expected: {
      routeOutcome: {
        type: 'stay_in_guidance',
        confidenceLabel: 'high',
        rationaleIncludes: ['light guidance pass', 'heavier path'],
        reasonCodes: ['LOW_INFORMATION'],
      },
      trainerRecommendation: {
        topTrainer: 'strategy',
        confidenceLabel: 'high',
        rationaleIncludes: ['strategy fits best', 'sharper direction'],
        reasonCodes: ['HAS_TASKS', 'BROAD_OBJECTIVE', 'QUICK_ASSIST_MODE'],
      },
    },
  },
  {
    id: 'server_high_urgency_risk_signals',
    title: 'high urgency and exposure signals keep continuation in trainer flow while risk leads the specialist ranking',
    sessionInput: {
      initialInput: 'We have an urgent compliance issue and need to decide what to do today.',
      detectedDomain: 'business_financial',
      activeMode: 'decision',
      shouldOfferDossier: false,
      result: {
        summary: 'The decision is clearer, but legal exposure and timing still make a specialist pass the best next move.',
        nextStep: 'Understand which compliance risk matters most before choosing',
        suggestedTasks: ['List the main compliance tradeoffs'],
      },
      createdAt: '2026-03-22T12:11:00.000Z',
    },
    expected: {
      routeOutcome: {
        type: 'continue_with_trainer',
        confidenceLabel: 'medium',
        rationaleIncludes: ['specialist continuation', 'remain reasonable'],
        recommendedTrainer: 'strategy',
        reasonCodes: ['LOW_INFORMATION', 'BUSINESS_FINANCIAL_SIGNAL', 'AMBIGUITY_PRESENT', 'DECISION_NEEDS_SPECIALIST'],
      },
      trainerRecommendation: {
        topTrainer: 'risk',
        confidenceLabel: 'guarded',
        rationaleIncludes: ['risk', 'somewhat mixed'],
        reasonCodes: ['HAS_TASKS', 'BROAD_OBJECTIVE', 'BLOCKER_PRESENT', 'RISK_SIGNAL', 'AMBIGUITY_PRESENT', 'DECISION_MODE', 'BUSINESS_FINANCIAL_DOMAIN'],
      },
    },
  },
  {
    id: 'server_conflicting_signals_conflict_mode',
    title: 'conflicting signals in conflict mode keep route and trainer recommendations distinct but stable',
    sessionInput: {
      initialInput: 'We need to repair alignment with the partner, but there are blockers and pressure on the rollout.',
      detectedDomain: 'conflict',
      activeMode: 'conflict',
      shouldOfferDossier: false,
      result: {
        summary: 'The situation is clearer, but the next move still benefits from a specialist pass before heavier execution.',
        nextStep: 'Understand the main friction driving the partner conflict',
        suggestedTasks: ['List the recent points of tension', 'Capture the non-negotiable boundary'],
      },
      createdAt: '2026-03-22T12:12:00.000Z',
    },
    expected: {
      routeOutcome: {
        type: 'continue_with_trainer',
        confidenceLabel: 'medium',
        rationaleIncludes: ['specialist continuation', 'remain reasonable'],
        recommendedTrainer: 'communication',
        reasonCodes: ['LOW_INFORMATION', 'CONFLICT_PRESENT', 'AMBIGUITY_PRESENT'],
      },
      trainerRecommendation: {
        topTrainer: 'strategy',
        confidenceLabel: 'guarded',
        rationaleIncludes: ['helpful next angle', 'more than one specialist read'],
        reasonCodes: ['HAS_TASKS', 'BROAD_OBJECTIVE', 'AMBIGUITY_PRESENT', 'CONFLICT_MODE', 'CONFLICT_DOMAIN'],
      },
    },
  },
  {
    id: 'server_clear_action_ready_convert',
    title: 'clear action-ready work converts to dossier while preserving the current specialist ranking',
    sessionInput: {
      initialInput: 'We need to lock the launch workflow and move it into execution.',
      detectedDomain: 'planning',
      activeMode: 'planning',
      shouldOfferDossier: true,
      result: {
        summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
        nextStep: 'Define the final owner sequence for launch week',
        suggestedTasks: ['Confirm launch owners', 'Lock the checklist', 'Capture the open dependencies'],
      },
      createdAt: '2026-03-22T12:13:00.000Z',
    },
    expected: {
      routeOutcome: {
        type: 'convert_to_dossier',
        confidenceLabel: 'high',
        rationaleIncludes: ['stable enough', 'ready to act on'],
        reasonCodes: ['ACTION_READY', 'DOSSIER_SIGNAL'],
      },
      trainerRecommendation: {
        topTrainer: 'strategy',
        confidenceLabel: 'medium',
        rationaleIncludes: ['strategy', 'remain reasonable'],
        reasonCodes: ['HAS_TASKS', 'PLANNING_MODE', 'PLANNING_DOMAIN'],
      },
    },
  },
] as const;
