import {
  type GuidanceProgressMessagePresentation,
  type GuidanceRightRailProfilePresentation,
  type GuidanceSurfaceVariant,
  type GuidanceZoneProfilesPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceRightRailProfileInput {
  progressMessage: GuidanceProgressMessagePresentation;
  surfaceVariant: GuidanceSurfaceVariant;
  zoneProfiles: GuidanceZoneProfilesPresentation;
}

export function presentGuidanceRightRailProfile(
  input: PresentGuidanceRightRailProfileInput
): GuidanceRightRailProfilePresentation {
  const profile = mapGuidanceRightRailProfile(input);
  return normalizeGuidanceRightRailProfile(profile, input);
}

function mapGuidanceRightRailProfile(
  input: PresentGuidanceRightRailProfileInput
): GuidanceRightRailProfilePresentation {
  switch (input.progressMessage.state) {
    case 'fresh_ready':
    case 'fresh_retry_ready':
      return {
        visibility: 'visible',
        role: 'support',
        emphasis: 'subtle',
        density: 'guided',
        continuity: 'settle',
      };
    case 'fresh_submit_loading':
      return {
        visibility: 'visible',
        role: 'support',
        emphasis: 'balanced',
        density: 'guided',
        continuity: 'advance',
      };
    case 'clarifying_ready':
      return {
        visibility: 'visible',
        role: 'context',
        emphasis: 'balanced',
        density: 'guided',
        continuity: 'advance',
      };
    case 'clarifying_continue_loading':
      return {
        visibility: 'visible',
        role: 'context',
        emphasis: 'balanced',
        density: 'guided',
        continuity: 'persist',
      };
    case 'refined_ready':
      return {
        visibility: 'visible',
        role: 'deepen',
        emphasis: 'balanced',
        density: 'expanded',
        continuity: 'advance',
      };
    case 'trainer_request_loading':
      return {
        visibility: 'visible',
        role: 'deepen',
        emphasis: 'strong',
        density: 'guided',
        continuity: 'advance',
      };
    case 'trainer_retry_ready':
      return {
        visibility: 'visible',
        role: 'context',
        emphasis: 'balanced',
        density: 'guided',
        continuity: 'persist',
      };
    case 'execution_ready':
      return {
        visibility: 'visible',
        role: 'handoff',
        emphasis: 'strong',
        density: 'expanded',
        continuity: 'advance',
      };
    case 'dossier_conversion_loading':
      return {
        visibility: 'visible',
        role: 'handoff',
        emphasis: 'strong',
        density: 'expanded',
        continuity: 'persist',
      };
    case 'degraded_result_fallback':
    default:
      return {
        visibility: 'visible',
        role: 'context',
        emphasis: 'subtle',
        density: 'guided',
        continuity: 'persist',
      };
  }
}

function normalizeGuidanceRightRailProfile(
  profile: GuidanceRightRailProfilePresentation,
  input: PresentGuidanceRightRailProfileInput
): GuidanceRightRailProfilePresentation {
  const dominantZone = Object.values(input.zoneProfiles).find((zone) => zone.focusState === 'dominant')?.zone ?? 'result';

  if (profile.visibility === 'suppressed') {
    return {
      visibility: 'suppressed',
      role: 'support',
      emphasis: 'subtle',
      density: 'minimal',
      continuity: 'settle',
    };
  }

  if (input.surfaceVariant === 'degraded_understand_surface') {
    return {
      visibility: 'visible',
      role: 'context',
      emphasis: 'subtle',
      density: profile.density === 'expanded' ? 'guided' : profile.density,
      continuity: 'persist',
    };
  }

  if (dominantZone === 'execution') {
    return {
      visibility: 'visible',
      role: 'handoff',
      emphasis: 'strong',
      density: profile.density === 'minimal' ? 'guided' : profile.density,
      continuity: profile.continuity,
    };
  }

  if (dominantZone === 'trainer' && input.progressMessage.state !== 'trainer_retry_ready') {
    return {
      visibility: 'visible',
      role: 'deepen',
      emphasis: profile.emphasis === 'subtle' ? 'balanced' : profile.emphasis,
      density: profile.density,
      continuity: profile.continuity,
    };
  }

  if (dominantZone === 'onboarding' && profile.role === 'handoff') {
    return {
      visibility: 'visible',
      role: 'context',
      emphasis: 'balanced',
      density: 'guided',
      continuity: 'advance',
    };
  }

  return profile;
}
