import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type GuidanceRouteOutcome } from '@/src/lib/guidance-session/types';
import { type AITrainerId } from '@/src/lib/ai/types';
import { type CharacterArchetypeId } from '@/src/lib/progression/types';
import {
  type FollowUpQuestionPlan,
  type NormalizedDecisionInput,
  type TrainerRecommendation,
} from '@/src/lib/recommendations/types';

const BASE_ORDER_BY_PHASE: Record<string, AITrainerId[]> = {
  Understanding: ['strategy', 'risk', 'communication', 'execution'],
  Structuring: ['strategy', 'execution', 'communication', 'risk'],
  Action: ['execution', 'risk', 'communication', 'strategy'],
};

export type RouteDecisionReasonCode =
  | 'PRE_RESULT'
  | 'ACTION_READY'
  | 'DOSSIER_SIGNAL'
  | 'CONFLICT_PRESENT'
  | 'BUSINESS_FINANCIAL_SIGNAL'
  | 'DECISION_NEEDS_SPECIALIST'
  | 'QUICK_ASSIST_SHORT_FLOW'
  | 'MODE_FIT'
  | 'LOW_INFORMATION'
  | 'NEEDS_CONFIRMING_PASS'
  | 'AMBIGUITY_PRESENT';

export type TrainerDecisionReasonCode =
  | 'NO_TASKS'
  | 'HAS_TASKS'
  | 'MOMENTUM_PRESENT'
  | 'OVERLOADED'
  | 'BROAD_OBJECTIVE'
  | 'EXECUTION_READY'
  | 'BLOCKER_PRESENT'
  | 'RISK_SIGNAL'
  | 'COMMUNICATION_PRESENT'
  | 'UNDERSTANDING_PHASE'
  | 'ACTION_PHASE'
  | 'PLANNING_MODE'
  | 'DECISION_MODE'
  | 'PROBLEM_SOLVER_MODE'
  | 'CONFLICT_MODE'
  | 'QUICK_ASSIST_MODE'
  | 'CONFLICT_DOMAIN'
  | 'DECISION_DOMAIN'
  | 'PLANNING_DOMAIN'
  | 'BUSINESS_FINANCIAL_DOMAIN'
  | 'PROBLEM_SOLVING_DOMAIN'
  | 'AMBIGUITY_PRESENT';

export type RouteDecisionResult =
  | GuidanceRouteOutcome
  | {
      kind: 'gated_pre_result';
      activeMode?: GuidanceModeId;
    };

export function resolveRouteDecision(input: NormalizedDecisionInput): RouteDecisionResult {
  return inspectRouteDecision(input).decision;
}

export function inspectRouteDecision(input: NormalizedDecisionInput): {
  decision: RouteDecisionResult;
  reasonCodes: RouteDecisionReasonCode[];
  followUpQuestion: FollowUpQuestionPlan | null;
} {
  const followUpQuestion = planFollowUpQuestion(input);

  if (!input.resultExists) {
    return {
      decision: {
        kind: 'gated_pre_result',
        activeMode: input.activeMode,
      },
      reasonCodes: ['PRE_RESULT'],
      followUpQuestion: null,
    };
  }

  if (!input.activeMode) {
    throw new Error('activeMode is required to resolve a route decision once a result exists.');
  }

  const modeConfig = getGuidanceModeConfig(input.activeMode);
  const suggestedTaskCount = input.suggestedTaskCount ?? 0;
  const nextStepLooksExecutable = input.signals?.actionReady ?? false;
  const topTrainer = modeConfig.trainerPriority[0];
  const reasonCodes: RouteDecisionReasonCode[] = [];

  if (nextStepLooksExecutable) {
    reasonCodes.push('ACTION_READY');
  } else {
    reasonCodes.push('LOW_INFORMATION');
  }

  if (input.shouldOfferDossier) {
    reasonCodes.push('DOSSIER_SIGNAL');
  }

  if (input.signals?.conflictPresent || input.activeMode === 'conflict') {
    reasonCodes.push('CONFLICT_PRESENT');
  }

  if (input.detectedDomain === 'business_financial') {
    reasonCodes.push('BUSINESS_FINANCIAL_SIGNAL');
  }

  if (input.signals?.ambiguityState && input.signals.ambiguityState !== 'clear') {
    reasonCodes.push('AMBIGUITY_PRESENT');
  }

  if (input.shouldOfferDossier && nextStepLooksExecutable) {
    const decisionType: GuidanceRouteOutcome['type'] = 'convert_to_dossier';
    const confidenceLabel = calibrateRouteConfidence({
      decisionType,
      activeMode: input.activeMode,
      detectedDomain: input.detectedDomain,
      nextStepLooksExecutable,
      suggestedTaskCount,
      ambiguityState: input.signals?.ambiguityState,
    });
    const explanation = shapeRouteExplanation({
      decisionType,
      confidenceLabel,
      reasonCodes,
      activeMode: input.activeMode,
      topTrainer,
      nextStepLooksExecutable,
      suggestedTaskCount,
    });

    return {
      decision: {
        type: decisionType,
        reason: explanation.reason,
        confidenceLabel,
        rationaleSummary: explanation.rationaleSummary,
        activeMode: input.activeMode,
      },
      reasonCodes,
      followUpQuestion,
    };
  }

  if (shouldContinueWithTrainer(input, nextStepLooksExecutable, suggestedTaskCount)) {
    const decisionType: GuidanceRouteOutcome['type'] = 'continue_with_trainer';
    const confidenceLabel = calibrateRouteConfidence({
      decisionType,
      activeMode: input.activeMode,
      detectedDomain: input.detectedDomain,
      nextStepLooksExecutable,
      suggestedTaskCount,
      ambiguityState: input.signals?.ambiguityState,
    });

    if (input.activeMode === 'decision' && !nextStepLooksExecutable) {
      reasonCodes.push('DECISION_NEEDS_SPECIALIST');
    }

    if (input.activeMode === 'quick_assist' && suggestedTaskCount === 0) {
      reasonCodes.push('QUICK_ASSIST_SHORT_FLOW');
    }
    const explanation = shapeRouteExplanation({
      decisionType,
      confidenceLabel,
      reasonCodes,
      activeMode: input.activeMode,
      topTrainer,
      nextStepLooksExecutable,
      suggestedTaskCount,
    });

    return {
      decision: {
        type: decisionType,
        reason: explanation.reason,
        confidenceLabel,
        rationaleSummary: explanation.rationaleSummary,
        activeMode: input.activeMode,
        recommendedTrainer: topTrainer,
      },
      reasonCodes,
      followUpQuestion,
    };
  }

  if (!modeConfig.prefersShortFlow && (suggestedTaskCount >= 2 || nextStepLooksExecutable)) {
    const decisionType: GuidanceRouteOutcome['type'] = 'continue_in_mode';
    const confidenceLabel = calibrateRouteConfidence({
      decisionType,
      activeMode: input.activeMode,
      detectedDomain: input.detectedDomain,
      nextStepLooksExecutable,
      suggestedTaskCount,
      ambiguityState: input.signals?.ambiguityState,
    });
    reasonCodes.push('MODE_FIT');
    if (!nextStepLooksExecutable) {
      reasonCodes.push('NEEDS_CONFIRMING_PASS');
    }
    const explanation = shapeRouteExplanation({
      decisionType,
      confidenceLabel,
      reasonCodes,
      activeMode: input.activeMode,
      topTrainer,
      nextStepLooksExecutable,
      suggestedTaskCount,
    });

    return {
      decision: {
        type: decisionType,
        reason: explanation.reason,
        confidenceLabel,
        rationaleSummary: explanation.rationaleSummary,
        activeMode: input.activeMode,
      },
      reasonCodes,
      followUpQuestion,
    };
  }

  const decisionType: GuidanceRouteOutcome['type'] = 'stay_in_guidance';
  const confidenceLabel = calibrateRouteConfidence({
    decisionType,
    activeMode: input.activeMode,
    detectedDomain: input.detectedDomain,
    nextStepLooksExecutable,
    suggestedTaskCount,
    ambiguityState: input.signals?.ambiguityState,
  });
  const explanation = shapeRouteExplanation({
    decisionType,
    confidenceLabel,
    reasonCodes,
    activeMode: input.activeMode,
    topTrainer,
    nextStepLooksExecutable,
    suggestedTaskCount,
  });

  return {
    decision: {
      type: decisionType,
      reason: explanation.reason,
      confidenceLabel,
      rationaleSummary: explanation.rationaleSummary,
      activeMode: input.activeMode,
    },
    reasonCodes,
    followUpQuestion,
  };
}

export function resolveTrainerRecommendationFromDecisionInput(
  input: NormalizedDecisionInput
): TrainerRecommendation {
  return inspectTrainerRecommendationDecision(input).recommendation;
}

export function inspectTrainerRecommendationDecision(input: NormalizedDecisionInput): {
  recommendation: TrainerRecommendation;
  reasonCodes: TrainerDecisionReasonCode[];
  followUpQuestion: FollowUpQuestionPlan | null;
} {
  const followUpQuestion = planFollowUpQuestion(input);
  const interpreted = interpretTrainerSignals(input);
  const baseOrder = BASE_ORDER_BY_PHASE[input.phase ?? ''] ?? ['strategy', 'execution', 'risk', 'communication'];
  const scores = new Map<AITrainerId, number>(
    baseOrder.map((trainer, index) => [trainer, baseOrder.length - index])
  );
  const reasonCodes: TrainerDecisionReasonCode[] = [];

  if (interpreted.hasTasks) {
    reasonCodes.push('HAS_TASKS');
  } else {
    reasonCodes.push('NO_TASKS');
  }

  if (interpreted.hasMomentum) {
    reasonCodes.push('MOMENTUM_PRESENT');
  }

  if (interpreted.overloaded) {
    reasonCodes.push('OVERLOADED');
  }

  if (interpreted.objectiveLooksBroad) {
    reasonCodes.push('BROAD_OBJECTIVE');
  }

  if (interpreted.objectiveLooksExecutionReady) {
    reasonCodes.push('EXECUTION_READY');
  }

  if (interpreted.looksBlocked) {
    reasonCodes.push('BLOCKER_PRESENT');
  }

  if (interpreted.looksRiskSensitive) {
    reasonCodes.push('RISK_SIGNAL');
  }

  if (interpreted.looksCommunicationHeavy) {
    reasonCodes.push('COMMUNICATION_PRESENT');
  }

  if (input.signals?.ambiguityState && input.signals.ambiguityState !== 'clear') {
    reasonCodes.push('AMBIGUITY_PRESENT');
  }

  if (!interpreted.hasTasks || interpreted.objectiveLooksBroad) {
    boost(scores, 'strategy', 3);
  }

  if (interpreted.overloaded) {
    boost(scores, 'strategy', 2);
  }

  if (interpreted.hasTasks && (interpreted.objectiveLooksExecutionReady || interpreted.hasMomentum || input.phase === 'Action')) {
    boost(scores, 'execution', 3);
  }

  if (interpreted.looksBlocked || interpreted.looksRiskSensitive) {
    boost(scores, 'risk', 4);
  }

  if (interpreted.looksCommunicationHeavy) {
    boost(scores, 'communication', 3);
  }

  if (input.phase === 'Understanding' && !interpreted.hasTasks) {
    reasonCodes.push('UNDERSTANDING_PHASE');
    boost(scores, 'strategy', 2);
    boost(scores, 'risk', 1);
  }

  if (input.phase === 'Action' && interpreted.hasMomentum) {
    reasonCodes.push('ACTION_PHASE');
    boost(scores, 'execution', 2);
  }

  if (input.activeMode === 'planning') {
    reasonCodes.push('PLANNING_MODE');
    boost(scores, 'strategy', 2);
    boost(scores, 'execution', 1);
  }

  if (input.activeMode === 'decision') {
    reasonCodes.push('DECISION_MODE');
    boost(scores, 'strategy', 2);
    boost(scores, 'risk', 1);
  }

  if (input.activeMode === 'problem_solver') {
    reasonCodes.push('PROBLEM_SOLVER_MODE');
    boost(scores, 'execution', 2);
  }

  if (input.activeMode === 'conflict') {
    reasonCodes.push('CONFLICT_MODE');
    boost(scores, 'communication', 2);
    boost(scores, 'risk', 2);
  }

  if (input.activeMode === 'quick_assist') {
    reasonCodes.push('QUICK_ASSIST_MODE');
    boost(scores, 'execution', 1);
    boost(scores, 'communication', 1);
  }

  if (input.detectedDomain === 'conflict') {
    reasonCodes.push('CONFLICT_DOMAIN');
    boost(scores, 'communication', 2);
    boost(scores, 'risk', 2);
  }

  if (input.detectedDomain === 'decision') {
    reasonCodes.push('DECISION_DOMAIN');
    boost(scores, 'strategy', 2);
  }

  if (input.detectedDomain === 'planning') {
    reasonCodes.push('PLANNING_DOMAIN');
    boost(scores, 'strategy', 1);
    boost(scores, 'execution', 1);
  }

  if (input.detectedDomain === 'business_financial') {
    reasonCodes.push('BUSINESS_FINANCIAL_DOMAIN');
    boost(scores, 'risk', 2);
  }

  if (input.detectedDomain === 'problem_solving') {
    reasonCodes.push('PROBLEM_SOLVING_DOMAIN');
    boost(scores, 'execution', 1);
  }

  const preferredTrainer = getPreferredTrainerForArchetype(input.characterProfile?.archetypeId);
  if (preferredTrainer) {
    boost(scores, preferredTrainer, 0.25);
  }

  const orderedTrainers = [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([trainer]) => trainer);

  const topTrainer = orderedTrainers[0];
  const topScore = scores.get(topTrainer) ?? 0;
  const secondTrainer = orderedTrainers[1];
  const secondScore = secondTrainer ? (scores.get(secondTrainer) ?? 0) : 0;
  const confidenceLabel = calibrateTrainerConfidence({
    topTrainer,
    topScore,
    secondScore,
    activeMode: input.activeMode,
    detectedDomain: input.detectedDomain,
    looksBlocked: interpreted.looksBlocked,
    looksRiskSensitive: interpreted.looksRiskSensitive,
    looksCommunicationHeavy: interpreted.looksCommunicationHeavy,
    objectiveLooksBroad: interpreted.objectiveLooksBroad,
    objectiveLooksExecutionReady: interpreted.objectiveLooksExecutionReady,
    overloaded: interpreted.overloaded,
    ambiguityState: input.signals?.ambiguityState,
  });
  const rationaleSummary = shapeTrainerRationaleSummary({
    topTrainer,
    confidenceLabel,
    reasonCodes,
    activeMode: input.activeMode,
    detectedDomain: input.detectedDomain,
  });

  return {
    recommendation: {
      orderedTrainers,
      topTrainer,
      confidenceLabel,
      rationaleSummary,
      inlineActions: orderedTrainers.map((trainer, index) => ({
        trainer,
        label: getInlineLabel(trainer),
        emphasized: index === 0,
      })),
    },
    reasonCodes,
    followUpQuestion,
  };
}

export function planFollowUpQuestion(input: NormalizedDecisionInput): FollowUpQuestionPlan | null {
  if (!input.resultExists || !input.signals || input.signals.ambiguityState === 'clear') {
    return null;
  }

  const readiness = input.progressionState?.readiness;
  const archetypeId = input.characterProfile?.archetypeId;

  if (input.signals.informationCompleteness === 'low') {
    return {
      intent: 'clarify_goal',
      question: 'What outcome matters most here if we get only one thing right next?',
    };
  }

  if (
    input.signals.conflictPresent
    && (input.signals.ambiguityState === 'contradictory' || archetypeId === 'negotiator' || archetypeId === 'communicator')
  ) {
    return {
      intent: 'clarify_conflict',
      question: 'Who is the other party here, and what exactly needs to change in that relationship first?',
    };
  }

  if ((readiness === 'approaching' || readiness === 'ready') && (input.signals.blockerPresence || input.signals.executionReadiness)) {
    return {
      intent: 'clarify_execution_blocker',
      question: 'What is the main blocker preventing the next move from happening right now?',
    };
  }

  if (input.signals.urgencyLevel !== 'low') {
    return {
      intent: 'clarify_urgency',
      question: 'When does this need to land, and what happens if it slips?',
    };
  }

  if (
    ((input.detectedDomain === 'planning' || input.shouldOfferDossier) && input.signals.needsStructuring)
    || ((archetypeId === 'strategist' || archetypeId === 'builder') && input.signals.needsStructuring)
  ) {
    return {
      intent: 'clarify_documentation',
      question: 'What plan, evidence, or structure needs to be captured so the next move is clear?',
    };
  }

  if (input.signals.blockerPresence || input.signals.executionReadiness) {
    return {
      intent: 'clarify_execution_blocker',
      question: 'What is the main blocker preventing the next move from happening right now?',
    };
  }

  return {
    intent: 'clarify_goal',
    question: 'What outcome matters most here if we get only one thing right next?',
  };
}

function interpretTrainerSignals(input: NormalizedDecisionInput) {
  const summary = `${input.currentObjective ?? ''} ${input.currentGuidanceSummary ?? ''} ${input.currentGuidanceNextStep ?? ''}`.toLowerCase();
  const totalTasks = input.totalTasks ?? 0;
  const completedCount = input.completedCount ?? 0;
  const hasTasks = input.signals?.hasTasks ?? totalTasks > 0;
  const hasMomentum = (input.signals?.momentumState ?? 'none') === 'present';
  const openTasks = Math.max(totalTasks - completedCount, 0);

  return {
    hasTasks,
    hasMomentum,
    openTasks,
    overloaded: totalTasks >= 5 || openTasks >= 4,
    objectiveLooksBroad: input.signals?.needsStructuring ?? isBroadObjective(summary),
    objectiveLooksExecutionReady: input.signals?.executionReadiness ?? isExecutionReady(summary),
    looksBlocked: input.signals?.blockerPresence ?? /(blocked|approval|waiting|stuck|dependency|legal|sign-off|signoff|cannot|can't|urgent|today)/.test(summary),
    looksRiskSensitive: input.signals?.riskSignalPresent ?? /(risk|compliance|legal|privacy|security|safety|exposure|guardrail|verify|verification|audit)/.test(summary),
    looksCommunicationHeavy: input.signals?.communicationPresent ?? /(message|communicat|align|respond|reply|announce|present|position|brief|stakeholder|customer|team|update|send|email)/.test(summary),
  };
}

function shouldContinueWithTrainer(
  input: NormalizedDecisionInput,
  nextStepLooksExecutable: boolean,
  suggestedTaskCount: number
): boolean {
  if (input.shouldOfferDossier) {
    return false;
  }

  if (input.activeMode === 'conflict') {
    return true;
  }

  if (input.activeMode === 'decision' && !nextStepLooksExecutable) {
    return true;
  }

  if (input.activeMode === 'quick_assist' && suggestedTaskCount === 0) {
    return true;
  }

  if (input.detectedDomain === 'business_financial' && !nextStepLooksExecutable) {
    return true;
  }

  return false;
}

function calibrateRouteConfidence(input: {
  decisionType: GuidanceRouteOutcome['type'];
  activeMode?: GuidanceModeId;
  detectedDomain?: GuidancePrimaryDomain;
  nextStepLooksExecutable: boolean;
  suggestedTaskCount: number;
  ambiguityState?: 'clear' | 'sparse' | 'mixed' | 'contradictory';
}): GuidanceRouteOutcome['confidenceLabel'] {
  let confidenceLabel: GuidanceRouteOutcome['confidenceLabel'];

  switch (input.decisionType) {
    case 'convert_to_dossier':
      confidenceLabel = 'high';
      break;
    case 'continue_with_trainer':
      if (input.activeMode === 'conflict' || input.detectedDomain === 'business_financial') {
        confidenceLabel = 'high';
        break;
      }

      if (!input.nextStepLooksExecutable || input.suggestedTaskCount === 0) {
        confidenceLabel = 'medium';
        break;
      }

      confidenceLabel = 'guarded';
      break;
    case 'continue_in_mode':
      confidenceLabel = input.nextStepLooksExecutable || input.suggestedTaskCount >= 3 ? 'high' : 'medium';
      break;
    case 'stay_in_guidance':
      if (!input.nextStepLooksExecutable && input.suggestedTaskCount <= 1) {
        confidenceLabel = 'high';
        break;
      }

      if (input.activeMode === 'quick_assist') {
        confidenceLabel = 'medium';
        break;
      }

      confidenceLabel = 'guarded';
      break;
  }

  return softenConfidenceForAmbiguity(confidenceLabel, input.ambiguityState);
}

function buildStayInGuidanceRationale(
  activeMode: GuidanceModeId,
  confidenceLabel: GuidanceRouteOutcome['confidenceLabel'],
  nextStepLooksExecutable: boolean,
  suggestedTaskCount: number
): string {
  if (confidenceLabel === 'high' && !nextStepLooksExecutable && suggestedTaskCount <= 1) {
    return 'The direction still benefits from another light guidance pass before you commit to a heavier path.';
  }

  if (confidenceLabel === 'medium' && activeMode === 'quick_assist') {
    return 'A short follow-up in guidance can clarify the next move without expanding the session too early.';
  }

  return 'The session is usable, but the next route is not fully settled yet.';
}

function shapeRouteExplanation(input: {
  decisionType: GuidanceRouteOutcome['type'];
  confidenceLabel: GuidanceRouteOutcome['confidenceLabel'];
  reasonCodes: RouteDecisionReasonCode[];
  activeMode: GuidanceModeId;
  topTrainer: AITrainerId;
  nextStepLooksExecutable: boolean;
  suggestedTaskCount: number;
}): Pick<GuidanceRouteOutcome, 'reason' | 'rationaleSummary'> {
  switch (input.decisionType) {
    case 'convert_to_dossier':
      return {
        reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
        rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      };
    case 'continue_with_trainer':
      return {
        reason: 'The current read is usable, but the next highest-value move is a specialist perspective before formal conversion.',
        rationaleSummary:
          input.confidenceLabel === 'high'
            ? 'A specialist continuation fits the current session best before you formalize the work.'
            : 'A specialist continuation is helpful here, though other session-based paths still remain reasonable.',
      };
    case 'continue_in_mode':
      return {
        reason: 'The current mode already matches the situation and should carry the next refinement pass.',
        rationaleSummary:
          input.confidenceLabel === 'high'
            ? 'The current mode still fits well and there is enough structure to keep refining in the same frame.'
            : 'The current mode still fits, but the session may benefit from one more confirming pass.',
      };
    case 'stay_in_guidance':
      return {
        reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
        rationaleSummary: buildStayInGuidanceRationale(
          input.activeMode,
          input.confidenceLabel,
          input.nextStepLooksExecutable,
          input.suggestedTaskCount
        ),
      };
  }
}

function boost(scores: Map<AITrainerId, number>, trainer: AITrainerId, amount: number) {
  scores.set(trainer, (scores.get(trainer) ?? 0) + amount);
}

function isBroadObjective(text: string) {
  return /(strategy|direction|framework|clarity|understand|figure out|what matters|which one|where to start|priority sequence)/.test(text);
}

function isExecutionReady(text: string) {
  return /^(complete|finish|send|write|confirm|remove|capture|draft|ship|deliver)\b/.test(text.trim())
    || /(complete|finish|send|write|confirm|remove|capture|draft|ship|deliver)/.test(text);
}

function getInlineLabel(trainer: AITrainerId) {
  switch (trainer) {
    case 'strategy':
      return 'Reframe strategy';
    case 'execution':
      return 'Make executable';
    case 'risk':
      return 'Check risks';
    case 'communication':
      return 'Shape message';
  }
}

function calibrateTrainerConfidence(input: {
  topTrainer: AITrainerId;
  topScore: number;
  secondScore: number;
  activeMode?: GuidanceModeId;
  detectedDomain?: GuidancePrimaryDomain;
  looksBlocked: boolean;
  looksRiskSensitive: boolean;
  looksCommunicationHeavy: boolean;
  objectiveLooksBroad: boolean;
  objectiveLooksExecutionReady: boolean;
  overloaded: boolean;
  ambiguityState?: 'clear' | 'sparse' | 'mixed' | 'contradictory';
}): TrainerRecommendation['confidenceLabel'] {
  const separation = input.topScore - input.secondScore;
  let confidenceLabel: TrainerRecommendation['confidenceLabel'];

  if (separation >= 4 && trainerHasStrongSignalMatch(input)) {
    confidenceLabel = 'high';
  } else if (separation >= 2 || trainerHasStrongSignalMatch(input)) {
    confidenceLabel = 'medium';
  } else {
    confidenceLabel = 'guarded';
  }

  return softenConfidenceForAmbiguity(confidenceLabel, input.ambiguityState);
}

function trainerHasStrongSignalMatch(input: {
  topTrainer: AITrainerId;
  activeMode?: GuidanceModeId;
  detectedDomain?: GuidancePrimaryDomain;
  looksBlocked: boolean;
  looksRiskSensitive: boolean;
  looksCommunicationHeavy: boolean;
  objectiveLooksBroad: boolean;
  objectiveLooksExecutionReady: boolean;
  overloaded: boolean;
}) {
  switch (input.topTrainer) {
    case 'risk':
      return input.looksBlocked || input.looksRiskSensitive || input.detectedDomain === 'business_financial';
    case 'communication':
      return input.looksCommunicationHeavy || input.activeMode === 'conflict' || input.detectedDomain === 'conflict';
    case 'execution':
      return input.objectiveLooksExecutionReady || input.activeMode === 'problem_solver';
    case 'strategy':
      return input.objectiveLooksBroad || input.overloaded || input.activeMode === 'planning' || input.detectedDomain === 'decision';
  }
}

function shapeTrainerRationaleSummary(input: {
  topTrainer: AITrainerId;
  confidenceLabel: TrainerRecommendation['confidenceLabel'];
  reasonCodes: TrainerDecisionReasonCode[];
  activeMode?: GuidanceModeId;
  detectedDomain?: GuidancePrimaryDomain;
}): string {
  const summaries: Record<AITrainerId, { high: string; medium: string; guarded: string }> = {
    strategy: {
      high: 'Strategy fits best because the session still benefits from sharper direction before you move.',
      medium: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
      guarded: 'Strategy is a helpful next angle here, but the session could still support more than one specialist read.',
    },
    execution: {
      high: 'Execution fits best because the session now points toward turning the next move into concrete action.',
      medium: 'Execution is the clearest specialist angle for the current session, with a few nearby alternatives still in play.',
      guarded: 'Execution is a useful next angle here, though the session is not fully settled on one specialist path.',
    },
    risk: {
      high: 'Risk fits best because the current session shows enough blocker or exposure signals to justify a tighter check.',
      medium: 'Risk is the clearest specialist angle right now, even though other session-based continuations are still possible.',
      guarded: 'Risk is a sensible next angle here, but the specialist recommendation is still somewhat mixed.',
    },
    communication: {
      high: 'Communication fits best because the current session points toward alignment, phrasing, or stakeholder response work.',
      medium: 'Communication is the clearest specialist angle for this session, with a few reasonable alternatives still nearby.',
      guarded: 'Communication is a helpful next angle here, though the session could still support other specialist reads.',
    },
  };

  return summaries[input.topTrainer][input.confidenceLabel];
}

function softenConfidenceForAmbiguity<T extends 'high' | 'medium' | 'guarded'>(
  confidenceLabel: T,
  ambiguityState?: 'clear' | 'sparse' | 'mixed' | 'contradictory'
): T {
  if (!ambiguityState || ambiguityState === 'clear') {
    return confidenceLabel;
  }

  if (confidenceLabel === 'high') {
    return 'medium' as T;
  }

  if (confidenceLabel === 'medium') {
    return 'guarded' as T;
  }

  return confidenceLabel;
}

function getPreferredTrainerForArchetype(archetypeId?: CharacterArchetypeId): AITrainerId | null {
  switch (archetypeId) {
    case 'strategist':
      return 'strategy';
    case 'builder':
      return 'execution';
    case 'negotiator':
      return 'communication';
    case 'communicator':
      return 'communication';
    case 'executor':
      return 'execution';
    default:
      return null;
  }
}
