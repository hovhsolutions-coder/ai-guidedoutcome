import { type DetectedDomain } from '@/src/lib/ai/domain/types';
import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import { type GuidanceModeConfig, type GuidanceModeId } from '@/src/lib/ai/modes/types';

export function resolveGuidanceMode(detectedDomain: DetectedDomain): GuidanceModeConfig {
  return getGuidanceModeConfig(resolveGuidanceModeId(detectedDomain));
}

export function resolveGuidanceModeId(detectedDomain: DetectedDomain): GuidanceModeId {
  const { primaryDomain, secondarySignals, suggestedMode } = detectedDomain;

  switch (primaryDomain) {
    case 'conflict':
      return 'conflict';
    case 'decision':
      return 'decision';
    case 'planning':
      return 'planning';
    case 'quick_question':
      return 'quick_assist';
    case 'problem_solving':
      return 'problem_solver';
    case 'emotional':
      if (secondarySignals.emotionalIntensity === 'high' && !secondarySignals.practicalExecutionNeeded) {
        return 'quick_assist';
      }

      return secondarySignals.ongoing || secondarySignals.practicalExecutionNeeded
        ? 'problem_solver'
        : 'quick_assist';
    case 'business_financial':
      if (secondarySignals.urgency === 'high' || secondarySignals.stakeLevel === 'high') {
        return 'decision';
      }

      if (secondarySignals.documentationNeeded || secondarySignals.ongoing) {
        return 'planning';
      }

      return 'problem_solver';
    default:
      return suggestedMode;
  }
}
