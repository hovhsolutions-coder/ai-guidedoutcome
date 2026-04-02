import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';

type GuidanceDomainFamily = 'clarity' | 'structure' | 'direction';
type GuidanceIntentStyle = 'support' | 'action' | 'growth';

interface BuildGuidanceCopyProfileInput {
  rawInput?: string | null;
  detectedDomain?: GuidancePrimaryDomain | null;
  activeMode?: GuidanceModeId | null;
  intakeAnswers?: Record<string, unknown> | null;
}

export interface GuidanceCopyProfile {
  domainFamily: GuidanceDomainFamily;
  intentStyle: GuidanceIntentStyle;
  hasPriorAnswers: boolean;
  prefersShortLanguage: boolean;
}

interface GuidanceDomainLexicon {
  coreNoun: string;
  readout: string;
  resultFocus: string;
  nextMove: string;
  refinedTarget: string;
  trainerGain: string;
  executionBridge: string;
  trustFrame: string;
}

export function buildGuidanceCopyProfile(
  input: BuildGuidanceCopyProfileInput
): GuidanceCopyProfile {
  const rawInput = input.rawInput?.trim().toLowerCase() ?? '';
  const hasPriorAnswers = Boolean(input.intakeAnswers && Object.keys(input.intakeAnswers).length > 0);
  const domainFamily = resolveDomainFamily(input.detectedDomain, input.activeMode);
  const intentStyle = resolveIntentStyle(rawInput, domainFamily);

  return {
    domainFamily,
    intentStyle,
    hasPriorAnswers,
    prefersShortLanguage: input.activeMode === 'quick_assist',
  };
}

export function getGuidanceDomainLexicon(
  profile: GuidanceCopyProfile
): GuidanceDomainLexicon {
  switch (profile.domainFamily) {
    case 'clarity':
      return {
        coreNoun: 'position',
        readout: 'clarity, the position, and the risk',
        resultFocus: 'clearer position',
        nextMove: 'safer next move',
        refinedTarget: 'confirm the position',
        trainerGain: 'pressure-test the position',
        executionBridge: 'carry the confirmed position into action',
        trustFrame: 'keep the next move trustworthy',
      };
    case 'direction':
      return {
        coreNoun: 'direction',
        readout: 'direction, understanding, and the next move',
        resultFocus: 'clearer direction',
        nextMove: 'more grounded next move',
        refinedTarget: 'confirm the direction',
        trainerGain: 'add one focused angle',
        executionBridge: 'carry the clearer direction into action',
        trustFrame: 'keep the next move steady',
      };
    case 'structure':
    default:
      return {
        coreNoun: 'structure',
        readout: 'structure, the steps, and the next move',
        resultFocus: 'clearer structure',
        nextMove: 'more executable next move',
        refinedTarget: 'confirm the plan',
        trainerGain: 'stress-test the plan',
        executionBridge: 'carry the plan into action',
        trustFrame: 'keep the plan moving with confidence',
      };
  }
}

export function getGuidancePersonalizedPrefix(profile: GuidanceCopyProfile): string {
  switch (profile.intentStyle) {
    case 'support':
      return 'We are shaping this with you';
    case 'growth':
      return 'We are sharpening this';
    case 'action':
    default:
      return 'We are turning this';
  }
}

export function getGuidanceIntentPromise(profile: GuidanceCopyProfile): string {
  switch (profile.intentStyle) {
    case 'support':
      return 'keep building without losing the thread';
    case 'growth':
      return 'sharpen the next move without adding noise';
    case 'action':
    default:
      return 'move this forward with less friction';
  }
}

export function getGuidanceCtaPromise(profile: GuidanceCopyProfile): string {
  switch (profile.intentStyle) {
    case 'support':
      return 'stay guided and calm';
    case 'growth':
      return 'gain extra sharpness';
    case 'action':
    default:
      return 'move straight into action';
  }
}

function resolveDomainFamily(
  detectedDomain: GuidancePrimaryDomain | null | undefined,
  activeMode: GuidanceModeId | null | undefined
): GuidanceDomainFamily {
  switch (detectedDomain) {
    case 'conflict':
    case 'decision':
    case 'business_financial':
      return 'clarity';
    case 'planning':
    case 'problem_solving':
      return 'structure';
    case 'emotional':
    case 'quick_question':
      return 'direction';
    default:
      break;
  }

  switch (activeMode) {
    case 'conflict':
    case 'decision':
      return 'clarity';
    case 'planning':
    case 'problem_solver':
      return 'structure';
    case 'quick_assist':
    default:
      return 'direction';
  }
}

function resolveIntentStyle(
  rawInput: string,
  domainFamily: GuidanceDomainFamily
): GuidanceIntentStyle {
  if (!rawInput) {
    return domainFamily === 'structure' ? 'action' : 'support';
  }

  if (/\b(grow|improve|better|sharpen|optimi[sz]e|upgrade|stronger|momentum)\b/.test(rawInput)) {
    return 'growth';
  }

  if (/\b(plan|launch|ship|rollout|execute|execution|owner|timeline|solve|fix|decide|decision|move)\b/.test(rawInput)) {
    return 'action';
  }

  if (/\b(help|understand|clarify|stuck|feel|relationship|overwhelmed|unsure|uncertain|messy)\b/.test(rawInput)) {
    return 'support';
  }

  return domainFamily === 'structure' ? 'action' : 'support';
}
