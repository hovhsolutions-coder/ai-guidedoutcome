import { type AITrainerId, type AITrainerRequestInput } from '@/src/lib/ai/types';

interface BuildTrainerRequestFromDossierContextInput {
  trainer: AITrainerId;
  situation: string;
  mainGoal: string;
  phase: string;
  tasks: string[];
  currentObjective?: string;
  guidanceNextStep?: string;
}

export function buildTrainerRequestFromDossierContext(
  input: BuildTrainerRequestFromDossierContextInput
): AITrainerRequestInput {
  return {
    trainer: input.trainer,
    situation: input.situation,
    main_goal: input.mainGoal,
    phase: input.phase,
    tasks: input.tasks,
    current_objective: input.currentObjective ?? '',
    guidance_next_step: input.guidanceNextStep ?? '',
  };
}
