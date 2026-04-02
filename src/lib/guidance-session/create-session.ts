import { detectDomain } from '@/src/lib/ai/domain/detect-domain';
import { type DetectedDomain } from '@/src/lib/ai/domain/types';
import { resolveGuidanceModeId } from '@/src/lib/ai/modes/resolve-mode';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import {
  type GuidanceSession,
  type GuidanceSessionCreateInput,
  type GuidanceRouteOutcome,
  type GuidanceSessionResult,
} from '@/src/lib/guidance-session/types';
import {
  buildCharacterProfile,
  createInitialProgressionState,
  selectCharacterArchetype,
} from '@/src/lib/progression/progression';
import {
  applyGuidanceDecisionEnvelope,
  buildInitialGuidanceDecisionEnvelope,
} from '@/src/lib/guidance-session/guidance-decision-envelope';

export function createGuidanceSession(input: GuidanceSessionCreateInput): GuidanceSession {
  const normalizedInitialInput = normalizeInput(input.initialInput);
  const detectedDomainResult = resolveDetectedDomain(input);
  const activeMode = resolveActiveMode(input.activeMode, detectedDomainResult);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const characterProfile = input.characterProfile ?? buildCharacterProfile(selectCharacterArchetype({
    activeMode,
    detectedDomain: input.detectedDomain ?? detectedDomainResult.primaryDomain,
  }));
  const progressionState = input.progressionState ?? createInitialProgressionState();
  const decision = input.decision ?? buildInitialGuidanceDecisionEnvelope({
    initialInput: normalizedInitialInput,
    intakeAnswers: input.intakeAnswers,
    detectedDomain: input.detectedDomain ?? detectedDomainResult.primaryDomain,
    activeMode,
    domainConfidence: input.domainConfidence ?? detectedDomainResult.confidence,
    shouldOfferDossier: input.shouldOfferDossier ?? detectedDomainResult.shouldOfferDossier,
    intentProfile: input.intentProfile,
  });

  return applyGuidanceDecisionEnvelope({
    id: createGuidanceSessionId(normalizedInitialInput, createdAt),
    initialInput: normalizedInitialInput,
    detectedDomain: input.detectedDomain ?? detectedDomainResult.primaryDomain,
    domainConfidence: input.domainConfidence ?? detectedDomainResult.confidence,
    activeMode,
    intakeAnswers: sanitizeIntakeAnswers(input.intakeAnswers),
    result: sanitizeResult(input.result),
    routeOutcome: sanitizeRouteOutcome(input.routeOutcome),
    characterProfile,
    progressionState,
    linkedDossierId: input.linkedDossierId ?? null,
    shouldOfferDossier: input.shouldOfferDossier ?? detectedDomainResult.shouldOfferDossier,
    decision,
    createdAt,
  }, decision);
}

function resolveDetectedDomain(input: GuidanceSessionCreateInput): DetectedDomain {
  const detectionInput = input.domainDetectionInput ?? input.initialInput;

  if (input.detectedDomain) {
    const detected = detectDomain(detectionInput);
    return {
      ...detected,
      primaryDomain: input.detectedDomain,
    };
  }

  return detectDomain(detectionInput);
}

function resolveActiveMode(
  providedMode: GuidanceModeId | undefined,
  detectedDomain: DetectedDomain
): GuidanceModeId {
  return providedMode ?? resolveGuidanceModeId(detectedDomain);
}

function sanitizeIntakeAnswers(intakeAnswers?: Record<string, unknown>): Record<string, unknown> {
  if (!intakeAnswers) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(intakeAnswers).filter(([, value]) => value !== undefined)
  );
}

function sanitizeResult(result?: GuidanceSessionResult): GuidanceSessionResult | undefined {
  if (!result) {
    return undefined;
  }

  return {
    summary: normalizeInput(result.summary),
    nextStep: normalizeInput(result.nextStep),
    suggestedTasks: result.suggestedTasks
      .map((task) => normalizeInput(task))
      .filter((task) => task.length > 0),
  };
}

function sanitizeRouteOutcome(routeOutcome?: GuidanceRouteOutcome): GuidanceRouteOutcome | undefined {
  if (!routeOutcome) {
    return undefined;
  }

  return {
    type: routeOutcome.type,
    reason: normalizeInput(routeOutcome.reason),
    confidenceLabel: routeOutcome.confidenceLabel,
    rationaleSummary: normalizeInput(routeOutcome.rationaleSummary),
    activeMode: routeOutcome.activeMode,
    recommendedTrainer: routeOutcome.recommendedTrainer,
  };
}

function createGuidanceSessionId(initialInput: string, createdAt: string): string {
  const normalizedSeed = `${createdAt}:${initialInput.toLowerCase()}`;
  let hash = 0;

  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = ((hash << 5) - hash + normalizedSeed.charCodeAt(index)) | 0;
  }

  const timestampPart = createdAt.replace(/[^0-9]/g, '').slice(0, 14);
  const hashPart = Math.abs(hash).toString(36).slice(0, 8);

  return `gs_${timestampPart}_${hashPart}`;
}

function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
