import { type GuidanceModeConfig, type GuidanceModeId } from '@/src/lib/ai/modes/types';

export const guidanceModeConfig: Record<GuidanceModeId, GuidanceModeConfig> = {
  decision: {
    id: 'decision',
    label: 'Decision',
    toneProfile: 'analytical',
    trainerPriority: ['strategy', 'risk', 'execution', 'communication'],
    defaultSections: ['situation_read', 'tradeoffs', 'recommended_path', 'next_move', 'watchpoints'],
    allowsDossierCreation: true,
    prefersShortFlow: false,
  },
  problem_solver: {
    id: 'problem_solver',
    label: 'Problem Solver',
    toneProfile: 'practical',
    trainerPriority: ['execution', 'strategy', 'risk', 'communication'],
    defaultSections: ['situation_read', 'recommended_path', 'execution_steps', 'next_move', 'watchpoints'],
    allowsDossierCreation: true,
    prefersShortFlow: false,
  },
  conflict: {
    id: 'conflict',
    label: 'Conflict',
    toneProfile: 'calm',
    trainerPriority: ['communication', 'strategy', 'risk', 'execution'],
    defaultSections: ['situation_read', 'alignment_notes', 'recommended_path', 'next_move', 'watchpoints'],
    allowsDossierCreation: true,
    prefersShortFlow: false,
  },
  planning: {
    id: 'planning',
    label: 'Planning',
    toneProfile: 'practical',
    trainerPriority: ['strategy', 'execution', 'risk', 'communication'],
    defaultSections: ['situation_read', 'recommended_path', 'execution_steps', 'next_move'],
    allowsDossierCreation: true,
    prefersShortFlow: false,
  },
  quick_assist: {
    id: 'quick_assist',
    label: 'Quick Assist',
    toneProfile: 'supportive',
    trainerPriority: ['communication', 'strategy', 'execution', 'risk'],
    defaultSections: ['quick_answer', 'next_move'],
    allowsDossierCreation: false,
    prefersShortFlow: true,
  },
};

export function getGuidanceModeConfig(mode: GuidanceModeId): GuidanceModeConfig {
  return guidanceModeConfig[mode];
}
