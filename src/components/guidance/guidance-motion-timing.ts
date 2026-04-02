import {
  type GuidanceProgressMessageState,
  type GuidanceSurfaceVariant,
  type GuidanceZoneProfile,
  type GuidanceZoneProfilesPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { getGuidanceDominantZoneProfile } from '@/src/components/guidance/guidance-zone-profile-selectors';

export type GuidanceMotionTimingProfile =
  | 'instant'
  | 'smooth'
  | 'deliberate';

interface GuidanceZoneMotionTimingInput {
  progressState: GuidanceProgressMessageState;
  surfaceVariant: GuidanceSurfaceVariant;
  zoneProfile: GuidanceZoneProfile;
}

export function getGuidanceZoneMotionTimingProfile({
  progressState,
  surfaceVariant,
  zoneProfile,
}: GuidanceZoneMotionTimingInput): GuidanceMotionTimingProfile {
  const dominantProfile = getBaseDominantTimingProfile(progressState, surfaceVariant, zoneProfile);

  if (zoneProfile.isDominant || zoneProfile.focusState === 'dominant') {
    return dominantProfile;
  }

  return slowDownTimingProfile(dominantProfile);
}

export function getGuidanceProgressMotionTimingProfile(input: {
  progressState: GuidanceProgressMessageState;
  surfaceVariant: GuidanceSurfaceVariant;
  zoneProfiles: GuidanceZoneProfilesPresentation;
}): GuidanceMotionTimingProfile {
  return getGuidanceZoneMotionTimingProfile({
    progressState: input.progressState,
    surfaceVariant: input.surfaceVariant,
    zoneProfile: getGuidanceDominantZoneProfile(input.zoneProfiles),
  });
}

export function getGuidanceMotionClassName(profile: GuidanceMotionTimingProfile) {
  switch (profile) {
    case 'instant':
      return 'motion-safe:transform-gpu motion-safe:origin-top motion-safe:transition-[opacity,transform,box-shadow,border-color,background-color,filter] motion-safe:duration-100 motion-safe:ease-out';
    case 'deliberate':
      return 'motion-safe:transform-gpu motion-safe:origin-top motion-safe:transition-[opacity,transform,box-shadow,border-color,background-color,filter] motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]';
    case 'smooth':
    default:
      return 'motion-safe:transform-gpu motion-safe:origin-top motion-safe:transition-[opacity,transform,box-shadow,border-color,background-color,filter] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]';
  }
}

export function getGuidanceButtonMotionClassName(profile: GuidanceMotionTimingProfile) {
  switch (profile) {
    case 'instant':
      return 'motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-100 motion-safe:ease-out hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99]';
    case 'deliberate':
      return 'motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-[360ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99]';
    case 'smooth':
    default:
      return 'motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99]';
  }
}

function getBaseDominantTimingProfile(
  progressState: GuidanceProgressMessageState,
  surfaceVariant: GuidanceSurfaceVariant,
  zoneProfile: GuidanceZoneProfile
): GuidanceMotionTimingProfile {
  switch (progressState) {
    case 'fresh_submit_loading':
      return 'instant';
    case 'clarifying_continue_loading':
      return 'smooth';
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return 'deliberate';
    case 'dossier_conversion_loading':
      return 'deliberate';
    default:
      break;
  }

  if (surfaceVariant === 'commit_surface' && zoneProfile.zone === 'execution') {
    return zoneProfile.transitionContinuity === 'persist' ? 'deliberate' : 'smooth';
  }

  if (surfaceVariant === 'degraded_understand_surface') {
    return 'smooth';
  }

  if (zoneProfile.transitionContinuity === 'persist') {
    return 'deliberate';
  }

  return 'smooth';
}

function slowDownTimingProfile(profile: GuidanceMotionTimingProfile): GuidanceMotionTimingProfile {
  if (profile === 'instant') {
    return 'smooth';
  }

  return 'deliberate';
}
