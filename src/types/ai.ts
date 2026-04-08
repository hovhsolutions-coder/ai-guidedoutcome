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
  category?: string;
  timeline?: string;
  painPoints?: string;
  impactAreas?: string[];
  impactIfUnresolved?: string;
  shortTermOutcome?: string;
  longTermOutcome?: string;
  triedAlready?: string;
  constraints?: string;
  resources?: string;
  emotionalState?: string;
  supportStyle?: string;
  coachStyle?: string;
  firstPriority?: string;
  intakeAnswers?: Record<string, unknown>;
  coachId?: string;
  coachName?: string;
}

export interface IntakeFormValues {
  category: string;
  situationDetails: string;
  timeline: string;
  painPoints: string;
  impactAreas: string[];
  impactIfUnresolved: string;
  goal: string;
  longTermOutcome: string;
  triedAlready: string;
  urgency: string;
  involved: string;
  blocking: string;
  constraints: string;
  resources: string;
  emotionalState: string;
  supportStyle: string;
  coachStyle: string;
  firstPriority: string;
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
