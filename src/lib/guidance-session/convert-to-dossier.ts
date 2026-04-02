import { buildGeneratedDossier } from '@/src/lib/dossiers/build-generated-dossier';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import { type GeneratedDossier } from '@/src/types/ai';

export type GuidanceSessionDossierPayload = GeneratedDossier;

export function convertGuidanceSessionToDossier(session: GuidanceSession): GuidanceSessionDossierPayload {
  const result = session.result;
  const situation = result?.summary || session.initialInput;
  const mainGoal = result?.nextStep || session.initialInput;

  return buildGeneratedDossier({
    titleSource: session.initialInput,
    situation,
    mainGoal,
    mode: session.activeMode,
    suggestedTasks: result?.suggestedTasks ?? [],
    characterProfile: session.characterProfile,
    progressionState: session.progressionState,
    narrative: result?.narrative,
    systemPlan: result?.systemPlan,
    executionPlan: result?.executionPlan,
  });
}
