import {
  type GuidanceActiveFocusPresentation,
  type GuidanceContentDensityPresentation,
  type GuidanceFocusZone,
  type GuidanceMicrocopyIntentPresentation,
  type GuidancePrimaryCtaContext,
  type GuidanceSectionOutcomePresentation,
  type GuidanceSectionVisibilityPresentation,
  type GuidanceSurfaceRhythmPresentation,
  type GuidanceTransitionContinuityPresentation,
  type GuidanceVisualWeight,
  type GuidanceVisualWeightPresentation,
  type GuidanceZoneProfile,
  type GuidanceZoneProfilesPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceZoneProfilesInput {
  activeFocus: GuidanceActiveFocusPresentation;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
  contentDensity: GuidanceContentDensityPresentation;
  microcopyIntent: GuidanceMicrocopyIntentPresentation;
  sectionOutcome: GuidanceSectionOutcomePresentation;
  surfaceRhythm: GuidanceSurfaceRhythmPresentation;
  transitionContinuity: GuidanceTransitionContinuityPresentation;
  visualWeight: GuidanceVisualWeightPresentation;
}

const ZONE_NAMES: GuidanceFocusZone[] = ['intake', 'onboarding', 'result', 'trainer', 'execution'];

const WEIGHT_RANK: Record<GuidanceVisualWeight, number> = {
  subtle: 0,
  balanced: 1,
  strong: 2,
};

const PRIMARY_CTA_ZONE_BY_CONTEXT: Record<Exclude<GuidancePrimaryCtaContext, 'none'>, GuidanceFocusZone> = {
  submit: 'intake',
  follow_up: 'onboarding',
  trainer: 'trainer',
  dossier_convert: 'execution',
};

const ZONE_DEFAULTS: Record<GuidanceFocusZone, Omit<GuidanceZoneProfile, 'zone' | 'visibility' | 'focusState' | 'isDominant' | 'primaryCta'>> = {
  intake: {
    contentDensity: 'guided',
    microcopyIntent: 'orient',
    sectionOutcome: 'capture',
    surfaceRhythm: 'steady',
    transitionContinuity: 'persist',
    visualWeight: 'balanced',
  },
  onboarding: {
    contentDensity: 'guided',
    microcopyIntent: 'orient',
    sectionOutcome: 'clarify',
    surfaceRhythm: 'steady',
    transitionContinuity: 'persist',
    visualWeight: 'balanced',
  },
  result: {
    contentDensity: 'guided',
    microcopyIntent: 'confirm',
    sectionOutcome: 'understand',
    surfaceRhythm: 'steady',
    transitionContinuity: 'persist',
    visualWeight: 'balanced',
  },
  trainer: {
    contentDensity: 'guided',
    microcopyIntent: 'deepen',
    sectionOutcome: 'explore',
    surfaceRhythm: 'steady',
    transitionContinuity: 'settle',
    visualWeight: 'balanced',
  },
  execution: {
    contentDensity: 'expanded',
    microcopyIntent: 'activate',
    sectionOutcome: 'commit',
    surfaceRhythm: 'spacious',
    transitionContinuity: 'advance',
    visualWeight: 'strong',
  },
};

export function presentGuidanceZoneProfiles(
  input: PresentGuidanceZoneProfilesInput
): GuidanceZoneProfilesPresentation {
  const mappedProfiles = ZONE_NAMES.reduce<GuidanceZoneProfilesPresentation>((profiles, zone) => {
    const visibility = input.sectionVisibility[zone];
    const isDominant = visibility !== 'suppressed' && zone === input.activeFocus.dominantZone;

    profiles[zone] = {
      zone,
      visibility,
      focusState: visibility === 'suppressed'
        ? 'hidden'
        : isDominant
          ? 'dominant'
          : 'secondary',
      isDominant,
      primaryCta: mapPrimaryCtaToZone(zone, input.activeFocus.primaryCta),
      contentDensity: input.contentDensity[zone],
      microcopyIntent: input.microcopyIntent[zone],
      sectionOutcome: input.sectionOutcome[zone],
      surfaceRhythm: input.surfaceRhythm[zone],
      transitionContinuity: input.transitionContinuity[zone],
      visualWeight: input.visualWeight[zone],
    };

    return profiles;
  }, {} as GuidanceZoneProfilesPresentation);

  return normalizeGuidanceZoneProfiles(mappedProfiles);
}

function normalizeGuidanceZoneProfiles(
  zoneProfiles: GuidanceZoneProfilesPresentation
): GuidanceZoneProfilesPresentation {
  const normalized = ZONE_NAMES.reduce<GuidanceZoneProfilesPresentation>((profiles, zone) => {
    profiles[zone] = normalizeZoneProfile(zoneProfiles[zone]);
    return profiles;
  }, {} as GuidanceZoneProfilesPresentation);

  const dominantZone = resolveDominantZone(normalized);

  for (const zone of ZONE_NAMES) {
    const profile = normalized[zone];
    if (profile.visibility === 'suppressed') {
      normalized[zone] = normalizeSuppressedZoneProfile(profile);
      continue;
    }

    normalized[zone] = {
      ...profile,
      isDominant: zone === dominantZone,
      focusState: zone === dominantZone ? 'dominant' : 'secondary',
    };
  }

  const strongestSecondaryWeight = getStrongestSecondaryWeight(normalized);
  if (
    dominantZone
    && strongestSecondaryWeight === 'strong'
    && normalized[dominantZone].visualWeight !== 'strong'
  ) {
    normalized[dominantZone] = {
      ...normalized[dominantZone],
      visualWeight: 'strong',
    };
  }

  return normalized;
}

function normalizeZoneProfile(profile: GuidanceZoneProfile): GuidanceZoneProfile {
  if (profile.visibility === 'suppressed') {
    return normalizeSuppressedZoneProfile(profile);
  }

  const defaults = ZONE_DEFAULTS[profile.zone];
  const normalizedProfile: GuidanceZoneProfile = {
    ...profile,
    contentDensity: profile.contentDensity ?? defaults.contentDensity,
    microcopyIntent: profile.microcopyIntent ?? defaults.microcopyIntent,
    sectionOutcome: profile.sectionOutcome ?? defaults.sectionOutcome,
    surfaceRhythm: profile.surfaceRhythm ?? defaults.surfaceRhythm,
    transitionContinuity: profile.transitionContinuity ?? defaults.transitionContinuity,
    visualWeight: profile.visualWeight ?? defaults.visualWeight,
  };

  if (normalizedProfile.sectionOutcome === 'commit' && normalizedProfile.zone !== 'execution') {
    normalizedProfile.sectionOutcome = 'understand';
  }

  if (normalizedProfile.zone === 'execution' && normalizedProfile.sectionOutcome === 'commit') {
    normalizedProfile.microcopyIntent = 'activate';
    normalizedProfile.visualWeight = 'strong';
  }

  if (
    normalizedProfile.microcopyIntent === 'activate'
    && normalizedProfile.sectionOutcome === 'understand'
  ) {
    normalizedProfile.microcopyIntent = normalizedProfile.zone === 'execution'
      ? 'activate'
      : 'confirm';
  }

  if (
    normalizedProfile.microcopyIntent === 'activate'
    && normalizedProfile.zone !== 'execution'
  ) {
    normalizedProfile.microcopyIntent = normalizedProfile.sectionOutcome === 'explore'
      ? 'deepen'
      : 'confirm';
  }

  if (normalizedProfile.primaryCta && normalizedProfile.visibility === 'suppressed') {
    normalizedProfile.primaryCta = null;
  }

  if (normalizedProfile.transitionContinuity === 'advance' && normalizedProfile.visibility === 'suppressed') {
    normalizedProfile.transitionContinuity = null;
  }

  return normalizedProfile;
}

function normalizeSuppressedZoneProfile(profile: GuidanceZoneProfile): GuidanceZoneProfile {
  return {
    zone: profile.zone,
    visibility: 'suppressed',
    focusState: 'hidden',
    isDominant: false,
    primaryCta: null,
    contentDensity: null,
    microcopyIntent: null,
    sectionOutcome: null,
    surfaceRhythm: null,
    transitionContinuity: null,
    visualWeight: null,
  };
}

function resolveDominantZone(
  zoneProfiles: GuidanceZoneProfilesPresentation
): GuidanceFocusZone | null {
  const visibleDominant = ZONE_NAMES.find((zone) => {
    const profile = zoneProfiles[zone];
    return profile.visibility !== 'suppressed' && profile.isDominant;
  });

  if (visibleDominant) {
    return visibleDominant;
  }

  return ZONE_NAMES.find((zone) => zoneProfiles[zone].visibility !== 'suppressed') ?? null;
}

function getStrongestSecondaryWeight(
  zoneProfiles: GuidanceZoneProfilesPresentation
): GuidanceVisualWeight | null {
  let strongest: GuidanceVisualWeight | null = null;

  for (const zone of ZONE_NAMES) {
    const profile = zoneProfiles[zone];
    if (profile.visibility === 'suppressed' || profile.isDominant || profile.visualWeight === null) {
      continue;
    }

    if (strongest === null || WEIGHT_RANK[profile.visualWeight] > WEIGHT_RANK[strongest]) {
      strongest = profile.visualWeight;
    }
  }

  return strongest;
}

function mapPrimaryCtaToZone(
  zone: GuidanceFocusZone,
  primaryCta: GuidancePrimaryCtaContext
): GuidancePrimaryCtaContext | null {
  if (primaryCta === 'none') {
    return null;
  }

  return PRIMARY_CTA_ZONE_BY_CONTEXT[primaryCta] === zone ? primaryCta : null;
}
