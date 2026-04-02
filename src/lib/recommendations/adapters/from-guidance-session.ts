import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import { deriveDecisionSignals } from '@/src/lib/recommendations/derive-decision-signals';
import { type NormalizedDecisionInput } from '@/src/lib/recommendations/types';

export function adaptGuidanceSessionToDecisionInput(session: GuidanceSession): NormalizedDecisionInput {
  const suggestedTaskCount = session.result?.suggestedTasks.length ?? 0;
  const currentObjective = session.result?.nextStep;
  const currentGuidanceSummary = session.result?.summary;
  const currentGuidanceNextStep = session.result?.nextStep;

  return {
    surface: 'universal_guidance',
    resultExists: Boolean(session.result),
    detectedDomain: session.detectedDomain,
    domainConfidence: session.domainConfidence,
    activeMode: session.activeMode,
    shouldOfferDossier: session.shouldOfferDossier,
    suggestedTaskCount,
    totalTasks: suggestedTaskCount,
    completedCount: 0,
    characterProfile: session.characterProfile,
    progressionState: session.progressionState,
    // Phase 1 compatibility note:
    // this is a best-effort stand-in for objective state, not a separately
    // normalized objective signal from a dedicated decision-input layer.
    currentObjective,
    currentGuidanceSummary,
    currentGuidanceNextStep,
    signals: deriveDecisionSignals({
      resultExists: Boolean(session.result),
      currentObjective,
      currentGuidanceSummary,
      currentGuidanceNextStep,
      suggestedTaskCount,
      totalTasks: suggestedTaskCount,
      completedCount: 0,
      activeMode: session.activeMode,
      detectedDomain: session.detectedDomain,
      domainConfidence: session.domainConfidence,
    }),
  };
}
