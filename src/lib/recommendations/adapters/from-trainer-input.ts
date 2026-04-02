import {
  type NormalizedDecisionInput,
  type TrainerRecommendationInput,
} from '@/src/lib/recommendations/types';
import { deriveDecisionSignals } from '@/src/lib/recommendations/derive-decision-signals';

export function adaptTrainerRecommendationInput(
  input: TrainerRecommendationInput
): NormalizedDecisionInput {
  const suggestedTaskCount = input.totalTasks;

  return {
    surface: 'trainer_compatibility',
    resultExists: true,
    detectedDomain: input.detectedDomain,
    domainConfidence: input.domainConfidence,
    activeMode: input.activeMode,
    phase: input.phase,
    suggestedTaskCount,
    totalTasks: input.totalTasks,
    completedCount: input.completedCount,
    currentObjective: input.currentObjective,
    currentGuidanceSummary: input.currentGuidanceSummary,
    currentGuidanceNextStep: input.currentGuidanceNextStep,
    characterProfile: input.characterProfile,
    progressionState: input.progressionState,
    signals: deriveDecisionSignals({
      resultExists: true,
      currentObjective: input.currentObjective,
      currentGuidanceSummary: input.currentGuidanceSummary,
      currentGuidanceNextStep: input.currentGuidanceNextStep,
      suggestedTaskCount,
      totalTasks: input.totalTasks,
      completedCount: input.completedCount,
      activeMode: input.activeMode,
      detectedDomain: input.detectedDomain,
      domainConfidence: input.domainConfidence,
    }),
  };
}
