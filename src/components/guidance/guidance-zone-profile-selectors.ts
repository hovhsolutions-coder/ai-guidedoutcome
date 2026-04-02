import {
  type GuidanceActiveFocusTarget,
  type GuidanceFocusZone,
  type GuidanceSurfaceVariant,
  type GuidanceZoneProfile,
  type GuidanceZoneProfilesPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

const GUIDANCE_ZONE_ORDER: GuidanceFocusZone[] = ['intake', 'onboarding', 'result', 'trainer', 'execution'];

export function getGuidanceVisibleZoneProfiles(
  zoneProfiles: GuidanceZoneProfilesPresentation
): GuidanceZoneProfile[] {
  return GUIDANCE_ZONE_ORDER
    .map((zone) => zoneProfiles[zone])
    .filter((profile) => profile.visibility !== 'suppressed');
}

export function getGuidanceDominantZoneProfile(
  zoneProfiles: GuidanceZoneProfilesPresentation
): GuidanceZoneProfile {
  return getGuidanceVisibleZoneProfiles(zoneProfiles).find((profile) => profile.isDominant || profile.focusState === 'dominant')
    ?? zoneProfiles.intake;
}

export function getGuidancePrimaryCtaZoneProfile(
  zoneProfiles: GuidanceZoneProfilesPresentation
): GuidanceZoneProfile | null {
  return GUIDANCE_ZONE_ORDER
    .map((zone) => zoneProfiles[zone])
    .find((profile) => profile.primaryCta !== null && profile.primaryCta !== 'none')
    ?? null;
}

export function deriveGuidanceProgressContext(
  zoneProfiles: GuidanceZoneProfilesPresentation,
  surfaceVariant: GuidanceSurfaceVariant
): GuidanceActiveFocusTarget {
  const dominantZone = getGuidanceDominantZoneProfile(zoneProfiles).zone;

  switch (dominantZone) {
    case 'intake':
      return 'intake';
    case 'onboarding':
      return 'follow_up';
    case 'trainer':
      return 'trainer';
    case 'execution':
      return 'execution_transition';
    case 'result':
      return surfaceVariant === 'degraded_understand_surface' ? 'degraded_result' : 'result';
    default:
      return 'result';
  }
}
