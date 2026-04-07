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
  coachId?: string;
  coachName?: string;
}

export interface IntakeFormValues {
  category: string;
  situationDetails: string;
  goal: string;
  urgency: string;
  involved: string;
  blocking: string;
  coachId: string;
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

export interface PersistedDossierIdentity {
  id: string;
  href: string;
}

export interface DossierPersistenceResult {
  status: 'saved' | 'save_failed';
  id?: string;
  href?: string;
  error?: string;
}

export interface CreateDossierResponseData {
  dossier: GeneratedDossier;
  persistence: DossierPersistenceResult;
  usedFallback: boolean;
}

export interface CreateDossierResponse {
  success: boolean;
  data?: CreateDossierResponseData;
  error?: string;
}

export interface SaveDossierResponse {
  success: boolean;
  data?: PersistedDossierIdentity;
  error?: string;
}
