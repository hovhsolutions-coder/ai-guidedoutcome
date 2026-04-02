import { buildGuidanceRightRailViewModel } from '@/src/lib/guidance-session/build-guidance-right-rail-view-model';
import {
  type GuidanceActiveFocusPresentation,
  type GuidanceContentDensityPresentation,
  type GuidanceIntakePresentation,
  type GuidanceMicrocopyIntentPresentation,
  type GuidanceProgressMessagePresentation,
  type GuidanceProgressMessageState,
  type GuidanceRightRailProfilePresentation,
  type GuidanceRightRailViewModel,
  type GuidanceSectionOutcomePresentation,
  type GuidanceSectionVisibilityPresentation,
  type GuidanceSessionPresentation,
  type GuidanceSurfaceRhythmPresentation,
  type GuidanceSurfaceVariant,
  type GuidanceTransitionContinuityPresentation,
  type GuidanceVisualWeightPresentation,
  type GuidanceZoneProfilesPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { presentGuidanceActiveFocus } from '@/src/components/guidance/guidance-active-focus-presenter';
import { presentGuidanceContentDensity } from '@/src/components/guidance/guidance-content-density-presenter';
import { presentGuidanceMicrocopyIntent } from '@/src/components/guidance/guidance-microcopy-intent-presenter';
import {
  presentGuidanceProgressMessage,
  presentGuidanceProgressMessageForState,
} from '@/src/components/guidance/guidance-progress-presenter';
import { presentGuidanceSectionOutcome } from '@/src/components/guidance/guidance-section-outcome-presenter';
import { presentGuidanceSectionVisibility } from '@/src/components/guidance/guidance-section-visibility-presenter';
import { presentGuidanceSurfaceRhythm } from '@/src/components/guidance/guidance-surface-rhythm-presenter';
import { presentGuidanceSurfaceVariant } from '@/src/components/guidance/guidance-surface-variant-presenter';
import { presentGuidanceTransitionContinuity } from '@/src/components/guidance/guidance-transition-continuity-presenter';
import { presentGuidanceVisualWeight } from '@/src/components/guidance/guidance-visual-weight-presenter';
import { presentGuidanceZoneProfiles } from '@/src/components/guidance/guidance-zone-profiles-presenter';
import { presentGuidanceIntake } from '@/src/components/guidance/guidance-intake-presenter';
import { presentGuidanceRightRailProfile } from '@/src/components/guidance/guidance-right-rail-profile-presenter';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';

export const GUIDANCE_SESSION_PRESENTATION_PIPELINE_STEPS = [
  'baseState',
  'progressContract',
  'focusVisibility',
  'zoneLevelContracts',
  'unifiedZoneProfiles',
  'surfaceVariant',
  'rightRailProfile',
  'finalInvariantNormalization',
] as const;

interface PresentGuidanceSessionInput {
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

interface GuidanceSessionPresentationBaseStep {
  intake: GuidanceIntakePresentation;
  rightRailView: GuidanceRightRailViewModel;
}

interface GuidanceSessionPresentationProgressStep {
  progressMessage: GuidanceProgressMessagePresentation;
}

interface GuidanceSessionPresentationFocusVisibilityStep {
  activeFocus: GuidanceActiveFocusPresentation;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

interface GuidanceSessionPresentationZoneLevelContractsStep {
  contentDensity: GuidanceContentDensityPresentation;
  microcopyIntent: GuidanceMicrocopyIntentPresentation;
  sectionOutcome: GuidanceSectionOutcomePresentation;
  surfaceRhythm: GuidanceSurfaceRhythmPresentation;
  transitionContinuity: GuidanceTransitionContinuityPresentation;
  visualWeight: GuidanceVisualWeightPresentation;
}

interface GuidanceSessionPresentationUnifiedZoneProfilesStep {
  zoneProfiles: GuidanceZoneProfilesPresentation;
}

interface GuidanceSessionPresentationSurfaceVariantStep {
  surfaceVariant: GuidanceSurfaceVariant;
}

interface GuidanceSessionPresentationRightRailProfileStep {
  rightRailProfile: GuidanceRightRailProfilePresentation;
}

interface GuidanceSessionPresentationFinalNormalizationStep {
  finalPresentation: GuidanceSessionPresentation;
}

export interface GuidanceSessionPresentationPipeline {
  baseState: GuidanceSessionPresentationBaseStep;
  progressContract: GuidanceSessionPresentationProgressStep;
  focusVisibility: GuidanceSessionPresentationFocusVisibilityStep;
  zoneLevelContracts: GuidanceSessionPresentationZoneLevelContractsStep;
  unifiedZoneProfiles: GuidanceSessionPresentationUnifiedZoneProfilesStep;
  surfaceVariant: GuidanceSessionPresentationSurfaceVariantStep;
  rightRailProfile: GuidanceSessionPresentationRightRailProfileStep;
  finalInvariantNormalization: GuidanceSessionPresentationFinalNormalizationStep;
}

interface BuildGuidanceSessionPresentationPipelineInput {
  state: GuidanceSessionStoreState;
  liveRawInput: string;
  progressStateOverride?: GuidanceProgressMessageState;
}

interface BuildGuidanceSessionPresentationPipelineFromBaseStateInput {
  baseState: GuidanceSessionPresentationBaseStep;
  progressState: GuidanceProgressMessageState;
}

export function presentGuidanceSession(
  input: PresentGuidanceSessionInput
): GuidanceSessionPresentation {
  return buildGuidanceSessionPresentationPipeline(input).finalInvariantNormalization.finalPresentation;
}

export function presentGuidanceSessionForProgressStateOverride(
  input: BuildGuidanceSessionPresentationPipelineFromBaseStateInput
): GuidanceSessionPresentation {
  return buildGuidanceSessionPresentationPipelineFromBaseState(input).finalInvariantNormalization.finalPresentation;
}

export function buildGuidanceSessionPresentationPipeline(
  input: BuildGuidanceSessionPresentationPipelineInput
): GuidanceSessionPresentationPipeline {
  const baseState = buildGuidanceSessionPresentationBaseState({
    state: input.state,
    liveRawInput: input.liveRawInput,
  });

  if (input.progressStateOverride) {
    return buildGuidanceSessionPresentationPipelineFromBaseState({
      baseState,
      progressState: input.progressStateOverride,
    });
  }

  const progressContract = buildGuidanceSessionPresentationProgressContract({
    state: input.state,
    rightRailView: baseState.rightRailView,
  });

  return buildGuidanceSessionPresentationPipelineFromComposedSteps({
    baseState,
    progressContract,
  });
}

export function buildGuidanceSessionPresentationPipelineFromBaseState(
  input: BuildGuidanceSessionPresentationPipelineFromBaseStateInput
): GuidanceSessionPresentationPipeline {
  const progressContract = buildGuidanceSessionPresentationProgressContractForState({
    progressState: input.progressState,
    rightRailView: input.baseState.rightRailView,
  });

  return buildGuidanceSessionPresentationPipelineFromComposedSteps({
    baseState: input.baseState,
    progressContract,
  });
}

function buildGuidanceSessionPresentationPipelineFromComposedSteps(input: {
  baseState: GuidanceSessionPresentationBaseStep;
  progressContract: GuidanceSessionPresentationProgressStep;
}): GuidanceSessionPresentationPipeline {
  const focusVisibility = buildGuidanceSessionPresentationFocusVisibilityStep({
    progressState: input.progressContract.progressMessage.state,
    rightRailView: input.baseState.rightRailView,
  });
  const zoneLevelContracts = buildGuidanceSessionPresentationZoneLevelContractsStep({
    progressState: input.progressContract.progressMessage.state,
    sectionVisibility: focusVisibility.sectionVisibility,
  });
  const unifiedZoneProfiles = buildGuidanceSessionPresentationUnifiedZoneProfilesStep({
    activeFocus: focusVisibility.activeFocus,
    sectionVisibility: focusVisibility.sectionVisibility,
    ...zoneLevelContracts,
  });
  const surfaceVariant = buildGuidanceSessionPresentationSurfaceVariantStep({
    progressState: input.progressContract.progressMessage.state,
  });
  const rightRailProfile = buildGuidanceSessionPresentationRightRailProfileStep({
    progressMessage: input.progressContract.progressMessage,
    surfaceVariant: surfaceVariant.surfaceVariant,
    zoneProfiles: unifiedZoneProfiles.zoneProfiles,
  });
  const finalInvariantNormalization = finalizeGuidanceSessionPresentation({
    intake: input.baseState.intake,
    rightRailView: input.baseState.rightRailView,
    progressMessage: input.progressContract.progressMessage,
    activeFocus: focusVisibility.activeFocus,
    sectionVisibility: focusVisibility.sectionVisibility,
    contentDensity: zoneLevelContracts.contentDensity,
    microcopyIntent: zoneLevelContracts.microcopyIntent,
    sectionOutcome: zoneLevelContracts.sectionOutcome,
    surfaceRhythm: zoneLevelContracts.surfaceRhythm,
    transitionContinuity: zoneLevelContracts.transitionContinuity,
    visualWeight: zoneLevelContracts.visualWeight,
    zoneProfiles: unifiedZoneProfiles.zoneProfiles,
    surfaceVariant: surfaceVariant.surfaceVariant,
    rightRailProfile: rightRailProfile.rightRailProfile,
  });

  return {
    baseState: input.baseState,
    progressContract: input.progressContract,
    focusVisibility,
    zoneLevelContracts,
    unifiedZoneProfiles,
    surfaceVariant,
    rightRailProfile,
    finalInvariantNormalization,
  };
}

function buildGuidanceSessionPresentationBaseState(input: PresentGuidanceSessionInput): GuidanceSessionPresentationBaseStep {
  const intake = presentGuidanceIntake({
    state: input.state,
    liveRawInput: input.liveRawInput,
  });
  const activeMode = input.state.input.selectedMode === 'auto'
    ? intake.mode.recommendedMode
    : input.state.input.selectedMode;

  return {
    intake,
    rightRailView: buildGuidanceRightRailViewModel({
      guidanceSession: input.state.session.guidanceSession,
      result: input.state.session.result,
      isLoading: input.state.feedback.isLoading,
      lastGeneratedAt: input.state.meta.lastGeneratedAt,
      detectedDomain: input.state.session.resultMeta?.detectedDomain ?? intake.mode.detectedDomain,
      activeMode: input.state.session.resultMeta?.activeMode ?? activeMode ?? null,
      shouldOfferDossier: intake.mode.shouldOfferDossier,
      activeTrainer: input.state.session.activeTrainer,
      trainerLoading: input.state.session.trainerLoading,
      trainerError: input.state.session.trainerError,
    }),
  };
}

function buildGuidanceSessionPresentationProgressContract(input: {
  state: GuidanceSessionStoreState;
  rightRailView: GuidanceRightRailViewModel;
}): GuidanceSessionPresentationProgressStep {
  return {
    progressMessage: presentGuidanceProgressMessage({
      state: input.state,
      rightRailView: input.rightRailView,
    }),
  };
}

function buildGuidanceSessionPresentationProgressContractForState(input: {
  progressState: GuidanceProgressMessageState;
  rightRailView: GuidanceRightRailViewModel;
}): GuidanceSessionPresentationProgressStep {
  return {
    progressMessage: presentGuidanceProgressMessageForState({
      state: input.progressState,
      rightRailView: input.rightRailView,
    }),
  };
}

function buildGuidanceSessionPresentationFocusVisibilityStep(input: {
  progressState: GuidanceProgressMessageState;
  rightRailView: GuidanceRightRailViewModel;
}): GuidanceSessionPresentationFocusVisibilityStep {
  return {
    activeFocus: presentGuidanceActiveFocus(input.progressState),
    sectionVisibility: presentGuidanceSectionVisibility({
      progressState: input.progressState,
      rightRailView: input.rightRailView,
    }),
  };
}

function buildGuidanceSessionPresentationZoneLevelContractsStep(input: {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}): GuidanceSessionPresentationZoneLevelContractsStep {
  return {
    contentDensity: presentGuidanceContentDensity({
      progressState: input.progressState,
      sectionVisibility: input.sectionVisibility,
    }),
    microcopyIntent: presentGuidanceMicrocopyIntent({
      progressState: input.progressState,
      sectionVisibility: input.sectionVisibility,
    }),
    sectionOutcome: presentGuidanceSectionOutcome({
      progressState: input.progressState,
      sectionVisibility: input.sectionVisibility,
    }),
    surfaceRhythm: presentGuidanceSurfaceRhythm({
      progressState: input.progressState,
      sectionVisibility: input.sectionVisibility,
    }),
    transitionContinuity: presentGuidanceTransitionContinuity({
      progressState: input.progressState,
      sectionVisibility: input.sectionVisibility,
    }),
    visualWeight: presentGuidanceVisualWeight({
      progressState: input.progressState,
      sectionVisibility: input.sectionVisibility,
    }),
  };
}

function buildGuidanceSessionPresentationUnifiedZoneProfilesStep(input: {
  activeFocus: GuidanceActiveFocusPresentation;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
  contentDensity: GuidanceContentDensityPresentation;
  microcopyIntent: GuidanceMicrocopyIntentPresentation;
  sectionOutcome: GuidanceSectionOutcomePresentation;
  surfaceRhythm: GuidanceSurfaceRhythmPresentation;
  transitionContinuity: GuidanceTransitionContinuityPresentation;
  visualWeight: GuidanceVisualWeightPresentation;
}): GuidanceSessionPresentationUnifiedZoneProfilesStep {
  return {
    zoneProfiles: presentGuidanceZoneProfiles(input),
  };
}

function buildGuidanceSessionPresentationSurfaceVariantStep(input: {
  progressState: GuidanceProgressMessageState;
}): GuidanceSessionPresentationSurfaceVariantStep {
  return {
    surfaceVariant: presentGuidanceSurfaceVariant(input.progressState),
  };
}

function buildGuidanceSessionPresentationRightRailProfileStep(input: {
  progressMessage: GuidanceProgressMessagePresentation;
  surfaceVariant: GuidanceSurfaceVariant;
  zoneProfiles: GuidanceZoneProfilesPresentation;
}): GuidanceSessionPresentationRightRailProfileStep {
  return {
    rightRailProfile: presentGuidanceRightRailProfile(input),
  };
}

function finalizeGuidanceSessionPresentation(input: GuidanceSessionPresentation): GuidanceSessionPresentationFinalNormalizationStep {
  const normalizedSurfaceVariant = normalizeGuidanceSurfaceVariant(input.surfaceVariant, input);
  const normalizedRightRailProfile = normalizeGuidanceRightRailProfile(input.rightRailProfile, input, normalizedSurfaceVariant);

  return {
    finalPresentation: {
      intake: input.intake,
      progressMessage: input.progressMessage,
      surfaceVariant: normalizedSurfaceVariant,
      rightRailProfile: normalizedRightRailProfile,
      activeFocus: input.activeFocus,
      sectionVisibility: input.sectionVisibility,
      contentDensity: input.contentDensity,
      microcopyIntent: input.microcopyIntent,
      sectionOutcome: input.sectionOutcome,
      surfaceRhythm: input.surfaceRhythm,
      transitionContinuity: input.transitionContinuity,
      visualWeight: input.visualWeight,
      zoneProfiles: input.zoneProfiles,
      rightRailView: input.rightRailView,
    },
  };
}

function normalizeGuidanceSurfaceVariant(
  surfaceVariant: GuidanceSurfaceVariant,
  presentation: GuidanceSessionPresentation
): GuidanceSurfaceVariant {
  const dominantZone = (
    Object.values(presentation.zoneProfiles).find((profile) => profile.focusState === 'dominant')?.zone
    ?? presentation.activeFocus.dominantZone
  );

  switch (surfaceVariant) {
    case 'commit_surface':
      return dominantZone === 'execution'
        ? surfaceVariant
        : 'understand_surface';
    case 'explore_surface':
      return dominantZone === 'trainer'
        ? surfaceVariant
        : 'understand_surface';
    case 'clarify_surface':
      return dominantZone === 'onboarding'
        ? surfaceVariant
        : 'understand_surface';
    case 'capture_surface':
      return dominantZone === 'intake'
        ? surfaceVariant
        : 'understand_surface';
    case 'degraded_understand_surface':
      return dominantZone === 'result'
        ? surfaceVariant
        : 'understand_surface';
    case 'understand_surface':
    default:
      return surfaceVariant;
  }
}

function normalizeGuidanceRightRailProfile(
  rightRailProfile: GuidanceRightRailProfilePresentation,
  presentation: GuidanceSessionPresentation,
  surfaceVariant: GuidanceSurfaceVariant
): GuidanceRightRailProfilePresentation {
  const dominantZone = (
    Object.values(presentation.zoneProfiles).find((profile) => profile.focusState === 'dominant')?.zone
    ?? presentation.activeFocus.dominantZone
  );

  if (surfaceVariant === 'degraded_understand_surface') {
    return {
      visibility: 'visible',
      role: 'context',
      emphasis: 'subtle',
      density: rightRailProfile.density === 'expanded' ? 'guided' : rightRailProfile.density,
      continuity: 'persist',
    };
  }

  if (dominantZone === 'execution') {
    return {
      visibility: 'visible',
      role: 'handoff',
      emphasis: 'strong',
      density: rightRailProfile.density === 'minimal' ? 'guided' : rightRailProfile.density,
      continuity: rightRailProfile.continuity,
    };
  }

  if (
    dominantZone === 'trainer'
    && presentation.progressMessage.state !== 'trainer_retry_ready'
    && rightRailProfile.role !== 'deepen'
  ) {
    return {
      visibility: 'visible',
      role: 'deepen',
      emphasis: rightRailProfile.emphasis === 'subtle' ? 'balanced' : rightRailProfile.emphasis,
      density: rightRailProfile.density,
      continuity: rightRailProfile.continuity,
    };
  }

  return rightRailProfile;
}
