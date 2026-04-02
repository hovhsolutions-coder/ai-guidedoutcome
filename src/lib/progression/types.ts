export type CharacterArchetypeId =
  | 'strategist'
  | 'builder'
  | 'negotiator'
  | 'communicator'
  | 'executor';

export type SkillId =
  | 'body_language'
  | 'communication_meta'
  | 'decision_making'
  | 'conflict_handling'
  | 'execution_discipline';

export type ProgressionReadiness = 'building' | 'approaching' | 'ready';

export interface CharacterIntro {
  title: string;
  introVideoUrl?: string;
  introText: string;
  guidanceStyle: string;
  firstFocus: string;
  recommendedStartingSkills: SkillId[];
}

export interface CharacterArchetypeDefinition {
  id: CharacterArchetypeId;
  guidanceStyle: string;
  progressionPath: string;
  recommendedSkills: SkillId[];
  intro: CharacterIntro;
}

export interface CharacterProfile {
  archetypeId: CharacterArchetypeId;
  guidanceStyle: string;
  progressionPath: string;
  recommendedSkills: SkillId[];
  intro: CharacterIntro;
}

export interface ProgressionState {
  currentLevel: number;
  skillPoints: number;
  unlockedSkills: SkillId[];
  readiness: ProgressionReadiness;
  nextLevel: number;
}

export interface ProgressionUpdateSignal {
  completedTasks?: number;
  consistencyCount?: number;
  outcomeCount?: number;
  meaningfulProgress: boolean;
}
