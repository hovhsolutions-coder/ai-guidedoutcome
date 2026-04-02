import { type AITrainerId } from '@/src/lib/ai/types';

export type GuidanceModeId =
  | 'decision'
  | 'problem_solver'
  | 'conflict'
  | 'planning'
  | 'quick_assist';

export type GuidanceToneProfile =
  | 'calm'
  | 'analytical'
  | 'direct'
  | 'supportive'
  | 'practical';

export type GuidanceSectionId =
  | 'situation_read'
  | 'tradeoffs'
  | 'recommended_path'
  | 'next_move'
  | 'watchpoints'
  | 'execution_steps'
  | 'alignment_notes'
  | 'quick_answer';

export interface GuidanceModeConfig {
  id: GuidanceModeId;
  label: string;
  toneProfile: GuidanceToneProfile;
  trainerPriority: readonly AITrainerId[];
  defaultSections: readonly GuidanceSectionId[];
  allowsDossierCreation: boolean;
  prefersShortFlow: boolean;
}
