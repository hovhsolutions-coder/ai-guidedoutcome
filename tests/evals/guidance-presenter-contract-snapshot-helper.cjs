function toGuidancePresenterContractSnapshot(presentation) {
  return {
    progressMessage: {
      state: presentation.progressMessage.state,
      eyebrow: presentation.progressMessage.eyebrow,
      title: presentation.progressMessage.title,
      statusLine: presentation.progressMessage.statusLine,
      tone: presentation.progressMessage.tone,
    },
    activeFocus: {
      target: presentation.activeFocus.target,
      dominantZone: presentation.activeFocus.dominantZone,
      primaryCta: presentation.activeFocus.primaryCta,
    },
    sectionVisibility: { ...presentation.sectionVisibility },
    zoneProfiles: {
      intake: toZoneProfileSnapshot(presentation.zoneProfiles.intake),
      onboarding: toZoneProfileSnapshot(presentation.zoneProfiles.onboarding),
      result: toZoneProfileSnapshot(presentation.zoneProfiles.result),
      trainer: toZoneProfileSnapshot(presentation.zoneProfiles.trainer),
      execution: toZoneProfileSnapshot(presentation.zoneProfiles.execution),
    },
    surfaceVariant: presentation.surfaceVariant,
  };
}

function toZoneProfileSnapshot(profile) {
  return {
    zone: profile.zone,
    visibility: profile.visibility,
    focusState: profile.focusState,
    isDominant: profile.isDominant,
    primaryCta: profile.primaryCta,
    contentDensity: profile.contentDensity,
    microcopyIntent: profile.microcopyIntent,
    sectionOutcome: profile.sectionOutcome,
    surfaceRhythm: profile.surfaceRhythm,
    transitionContinuity: profile.transitionContinuity,
    visualWeight: profile.visualWeight,
  };
}

module.exports = {
  toGuidancePresenterContractSnapshot,
};
