import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type GuidanceNarrativeContract, type GuidanceSystemPlanContract, type GuidanceExecutionPlanContract } from '@/src/lib/guidance-session/types';
import { type CharacterProfile, type ProgressionState } from '@/src/lib/progression/types';
import { type GeneratedDossier } from '@/src/types/ai';

interface BuildGeneratedDossierInput {
  titleSource: string;
  situation: string;
  mainGoal: string;
  suggestedTasks?: string[];
  phase?: GeneratedDossier['phase'];
  mode?: GuidanceModeId;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
  narrative?: GuidanceNarrativeContract;
  systemPlan?: GuidanceSystemPlanContract;
  executionPlan?: GuidanceExecutionPlanContract;
}

export function buildGeneratedDossier(input: BuildGeneratedDossierInput): GeneratedDossier {
  return {
    title: buildGeneratedDossierTitle(input.titleSource),
    situation: input.situation,
    main_goal: input.mainGoal,
    phase: input.phase ?? getInitialDossierPhase(input.mode),
    suggested_tasks: input.suggestedTasks ?? [],
    characterProfile: input.characterProfile,
    progressionState: input.progressionState,
    narrative: input.narrative,
    systemPlan: input.systemPlan,
    executionPlan: input.executionPlan,
  };
}

export function buildGeneratedDossierTitle(titleSource: string): string {
  const trimmed = titleSource.trim();
  if (!trimmed) {
    return 'New Dossier';
  }

  return trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed;
}

export function getInitialDossierPhase(mode?: GuidanceModeId): GeneratedDossier['phase'] {
  if (mode === 'planning') {
    return 'Structuring';
  }

  return 'Understanding';
}
