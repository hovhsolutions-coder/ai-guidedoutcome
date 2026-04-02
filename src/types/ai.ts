import {
  type GuidanceNarrativeContract,
  type GuidanceSystemPlanContract,
  type GuidanceExecutionPlanContract,
} from '@/src/lib/guidance-session/types';
import { type CharacterProfile, type ProgressionState } from '@/src/lib/progression/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';

export interface DossierContext {
  situation: string;
  main_goal: string;
  phase: string;
  tasks: string[];
  user_input: string;
}

export interface IntakeData {
  situation: string;
  goal: string;
  urgency: string;
  involved: string;
  blocking: string;
}

export interface GeneratedDossier {
  id?: string;
  title: string;
  situation: string;
  main_goal: string;
  phase: string;
  suggested_tasks: string[];
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
  narrative?: GuidanceNarrativeContract;
  systemPlan?: GuidanceSystemPlanContract;
  executionPlan?: GuidanceExecutionPlanContract;
}
