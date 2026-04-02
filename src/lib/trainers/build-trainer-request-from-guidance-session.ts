import { getInitialDossierPhase } from '@/src/lib/dossiers/build-generated-dossier';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import { type AITrainerId, type AITrainerRequestInput } from '@/src/lib/ai/types';

export function buildTrainerRequestFromGuidanceSession(
  session: GuidanceSession,
  trainer: AITrainerId
): AITrainerRequestInput {
  return {
    trainer,
    situation: session.result?.summary ?? session.initialInput,
    main_goal: readStringAnswer(session.intakeAnswers, 'main_goal')
      ?? readStringAnswer(session.intakeAnswers, 'goal')
      ?? session.result?.nextStep
      ?? session.initialInput,
    phase: getInitialDossierPhase(session.activeMode),
    tasks: session.result?.suggestedTasks ?? [],
    current_objective: session.result?.nextStep ?? session.initialInput,
    guidance_next_step: session.result?.nextStep ?? '',
  };
}

function readStringAnswer(intakeAnswers: Record<string, unknown>, key: string): string | undefined {
  const value = intakeAnswers[key];
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}
