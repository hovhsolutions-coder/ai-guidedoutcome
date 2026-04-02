import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { characterArchetypeCatalog } from '@/src/lib/progression/catalog';
import {
  type CharacterArchetypeId,
  type CharacterProfile,
  type ProgressionReadiness,
  type ProgressionState,
  type ProgressionUpdateSignal,
  type SkillId,
} from '@/src/lib/progression/types';

const LEVEL_THRESHOLDS = [0, 4, 8, 13, 19] as const;

export function selectCharacterArchetype(input: {
  activeMode: GuidanceModeId;
  detectedDomain: GuidancePrimaryDomain;
}): CharacterArchetypeId {
  switch (input.activeMode) {
    case 'planning':
      return 'builder';
    case 'decision':
      return 'strategist';
    case 'conflict':
      return 'negotiator';
    case 'quick_assist':
      return 'communicator';
    case 'problem_solver':
      return input.detectedDomain === 'planning' ? 'builder' : 'executor';
  }
}

export function buildCharacterProfile(archetypeId: CharacterArchetypeId): CharacterProfile {
  const definition = characterArchetypeCatalog[archetypeId];

  return {
    archetypeId: definition.id,
    guidanceStyle: definition.guidanceStyle,
    progressionPath: definition.progressionPath,
    recommendedSkills: [...definition.recommendedSkills],
    intro: {
      title: definition.intro.title,
      introVideoUrl: definition.intro.introVideoUrl,
      introText: definition.intro.introText,
      guidanceStyle: definition.intro.guidanceStyle,
      firstFocus: definition.intro.firstFocus,
      recommendedStartingSkills: [...definition.intro.recommendedStartingSkills],
    },
  };
}

export function createInitialProgressionState(): ProgressionState {
  return {
    currentLevel: 1,
    skillPoints: 0,
    unlockedSkills: [],
    readiness: 'building',
    nextLevel: 2,
  };
}

export function applyMeaningfulProgress(
  currentState: ProgressionState,
  characterProfile: CharacterProfile,
  signal: ProgressionUpdateSignal
): ProgressionState {
  if (!signal.meaningfulProgress) {
    return currentState;
  }

  const earnedPoints = calculateEarnedPoints(signal);
  if (earnedPoints <= 0) {
    return currentState;
  }

  const nextPoints = currentState.skillPoints + earnedPoints;
  const targetLevel = resolveLevelForPoints(nextPoints);
  const nextLevel = Math.min(currentState.currentLevel + 1, targetLevel);
  const unlockedSkills = resolveUnlockedSkills(characterProfile.recommendedSkills, nextLevel);

  return {
    currentLevel: nextLevel,
    skillPoints: nextPoints,
    unlockedSkills,
    readiness: resolveReadiness(nextPoints, nextLevel),
    nextLevel: nextLevel + 1,
  };
}

function calculateEarnedPoints(signal: ProgressionUpdateSignal): number {
  const completedTasks = Math.max(signal.completedTasks ?? 0, 0);
  const consistencyCount = Math.max(signal.consistencyCount ?? 0, 0);
  const outcomeCount = Math.max(signal.outcomeCount ?? 0, 0);

  return completedTasks + consistencyCount + (outcomeCount * 2);
}

function resolveLevelForPoints(skillPoints: number): number {
  let resolvedLevel = 1;

  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (skillPoints >= LEVEL_THRESHOLDS[index]) {
      resolvedLevel = index + 1;
    }
  }

  return resolvedLevel;
}

function resolveUnlockedSkills(recommendedSkills: SkillId[], currentLevel: number): SkillId[] {
  const skillUnlockCount = Math.max(currentLevel - 1, 0);
  return recommendedSkills.slice(0, skillUnlockCount);
}

function resolveReadiness(skillPoints: number, currentLevel: number): ProgressionReadiness {
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] ?? (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 6);
  const remaining = nextThreshold - skillPoints;

  if (remaining <= 1) {
    return 'ready';
  }

  if (remaining <= 3) {
    return 'approaching';
  }

  return 'building';
}
