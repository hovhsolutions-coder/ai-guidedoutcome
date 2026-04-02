import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import {
  type AmbiguityState,
  type InformationCompletenessLevel,
  type MomentumState,
  type NormalizedSemanticSignals,
  type RecommendationUrgencyLevel,
} from '@/src/lib/recommendations/types';

const ACTION_READY_PATTERN = /^(define|choose|complete|write|capture|remove|send|draft|confirm|finish|decide|clarify|identify|turn|group|name|check|list|advance)\b/i;
const EXECUTION_READY_PATTERN = /^(complete|finish|send|write|confirm|remove|capture|draft|ship|deliver)\b/i;
const HIGH_URGENCY_PATTERN = /\b(urgent|asap|immediately|today|deadline|tomorrow|right now)\b/i;
const MEDIUM_URGENCY_PATTERN = /\b(soon|this week|time-sensitive|important|next step)\b/i;
const BLOCKER_PATTERN = /(blocked|approval|waiting|stuck|dependency|legal|sign-off|signoff|cannot|can't|urgent|today)/i;
const RISK_PATTERN = /(risk|compliance|legal|privacy|security|safety|exposure|guardrail|verify|verification|audit)/i;
const COMMUNICATION_PATTERN = /(message|communicat|align|respond|reply|announce|present|position|brief|stakeholder|customer|team|update|send|email)/i;
const STRUCTURING_PATTERN = /(strategy|direction|framework|clarity|understand|figure out|what matters|which one|where to start|priority sequence)/i;
const CONFLICT_PATTERN = /(conflict|argument|fight|tension|disagreement|dispute|friction|clash|misunderstanding|relationship issue)/i;

export function deriveDecisionSignals(input: {
  resultExists: boolean;
  currentObjective?: string;
  currentGuidanceSummary?: string;
  currentGuidanceNextStep?: string;
  suggestedTaskCount?: number;
  totalTasks?: number;
  completedCount?: number;
  activeMode?: GuidanceModeId;
  detectedDomain?: GuidancePrimaryDomain;
  domainConfidence?: number;
}): NormalizedSemanticSignals {
  const combinedText = `${input.currentObjective ?? ''} ${input.currentGuidanceSummary ?? ''} ${input.currentGuidanceNextStep ?? ''}`.trim();
  const suggestedTaskCount = input.suggestedTaskCount ?? 0;
  const totalTasks = input.totalTasks ?? 0;
  const completedCount = input.completedCount ?? 0;
  const nextStep = input.currentGuidanceNextStep?.trim() ?? '';
  const actionReady = ACTION_READY_PATTERN.test(nextStep);
  const executionReadiness = EXECUTION_READY_PATTERN.test(nextStep) || EXECUTION_READY_PATTERN.test(combinedText);
  const conflictPresent =
    input.activeMode === 'conflict'
    || input.detectedDomain === 'conflict'
    || CONFLICT_PATTERN.test(combinedText);
  const blockerPresence = BLOCKER_PATTERN.test(combinedText);
  const needsStructuring = STRUCTURING_PATTERN.test(combinedText);
  const riskSignalPresent = RISK_PATTERN.test(combinedText);
  const communicationPresent = COMMUNICATION_PATTERN.test(combinedText);
  const informationCompleteness = resolveInformationCompleteness({
    resultExists: input.resultExists,
    actionReady,
    suggestedTaskCount,
  });

  return {
    informationCompleteness,
    urgencyLevel: resolveUrgencyLevel(combinedText),
    conflictPresent,
    actionReady,
    executionReadiness,
    blockerPresence,
    momentumState: resolveMomentumState(completedCount),
    needsStructuring,
    riskSignalPresent,
    communicationPresent,
    hasTasks: totalTasks > 0,
    ambiguityState: resolveAmbiguityState({
      informationCompleteness,
      conflictPresent,
      executionReadiness,
      blockerPresence,
      needsStructuring,
      domainConfidence: input.domainConfidence,
    }),
  };
}

function resolveInformationCompleteness(input: {
  resultExists: boolean;
  actionReady: boolean;
  suggestedTaskCount: number;
}): InformationCompletenessLevel {
  if (!input.resultExists) {
    return 'low';
  }

  if (input.actionReady || input.suggestedTaskCount >= 3) {
    return 'high';
  }

  if (input.suggestedTaskCount >= 2) {
    return 'medium';
  }

  return 'low';
}

function resolveUrgencyLevel(text: string): RecommendationUrgencyLevel {
  if (HIGH_URGENCY_PATTERN.test(text)) {
    return 'high';
  }

  if (MEDIUM_URGENCY_PATTERN.test(text)) {
    return 'medium';
  }

  return 'low';
}

function resolveMomentumState(completedCount: number): MomentumState {
  return completedCount > 0 ? 'present' : 'none';
}

function resolveAmbiguityState(input: {
  informationCompleteness: InformationCompletenessLevel;
  conflictPresent: boolean;
  executionReadiness: boolean;
  blockerPresence: boolean;
  needsStructuring: boolean;
  domainConfidence?: number;
}): AmbiguityState {
  const weakDomainConfidence = input.domainConfidence !== undefined && input.domainConfidence < 0.7;
  const signalFamilies = [
    input.conflictPresent,
    input.executionReadiness || input.blockerPresence,
    input.needsStructuring,
  ].filter(Boolean).length;

  if (input.informationCompleteness === 'low' && weakDomainConfidence) {
    return 'sparse';
  }

  if (input.conflictPresent && (input.executionReadiness || input.needsStructuring)) {
    return 'contradictory';
  }

  if (weakDomainConfidence || signalFamilies >= 2) {
    return 'mixed';
  }

  return 'clear';
}
