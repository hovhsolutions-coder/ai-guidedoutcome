import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AIResponseOutput, type AITrainerId } from '@/src/lib/ai/types';
import {
  type GuidanceCurrentReadPresentation,
  type GuidanceExecutionHandoffPresentation,
  type GuidanceExecutionProgressPresentation,
  type GuidanceExecutionReadySectionPresentation,
  type GuidanceExecutionTransitionPresentation,
  type GuidanceRightRailViewModel,
} from '@/src/components/guidance/guidance-presentation-contracts';
import {
  buildGuidanceCopyProfile,
  getGuidanceDomainLexicon,
} from '@/src/components/guidance/guidance-copy-personalization';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import {
  canRenderGuidanceExecutionBridge,
  canRenderGuidanceOnboardingShell,
  getGuidanceSessionRouteOutcome,
  getGuidanceSessionProgressionSnapshot,
  getGuidanceSessionNarrative,
  getGuidanceSessionSystemPlan,
  getGuidanceSessionExecutionPlan,
} from '@/src/lib/guidance-session/guidance-decision-envelope';
import {
  createEnvelopeFirstSessionAccess,
  buildEnvelopeFirstExecutionReadySection,
} from '@/src/lib/guidance-session/envelope-first-view-model-builders';
import {
  createEnvelopeFirstPresenterContext,
  buildEnvelopeFirstTrainerSectionPresentation,
} from '@/src/lib/guidance-session/envelope-first-presenter-helpers';

interface BuildGuidanceRightRailViewModelInput {
  guidanceSession: GuidanceSession | null;
  result: AIResponseOutput | null;
  isLoading: boolean;
  lastGeneratedAt: string | null;
  detectedDomain: GuidancePrimaryDomain | null;
  activeMode: GuidanceModeId | null;
  shouldOfferDossier: boolean;
  activeTrainer: AITrainerId | null;
  trainerLoading: AITrainerId | null;
  trainerError: string | null;
}

export function buildGuidanceRightRailViewModel(
  input: BuildGuidanceRightRailViewModelInput
): GuidanceRightRailViewModel {
  // Envelope-first execution section building
  const envelopeFirstAccess = createEnvelopeFirstSessionAccess(input.guidanceSession);
  const onboardingSession = envelopeFirstAccess?.capabilityGates.canShowOnboardingShell 
    ? envelopeFirstAccess.session 
    : null;
  const executionReadySection = envelopeFirstAccess?.capabilityGates.canShowExecutionBridge 
    ? buildEnvelopeFirstExecutionReadySection(envelopeFirstAccess)
    : null;
  const showsExecutionTransition = executionReadySection !== null;
  
  // Use envelope-first presenter helpers for trainer section
  const envelopeContext = createEnvelopeFirstPresenterContext(input.guidanceSession);
  const trainerSection = envelopeContext 
    ? buildEnvelopeFirstTrainerSectionPresentation(
        envelopeContext,
        input.activeTrainer,
        input.trainerLoading,
        input.trainerError
      )
    : null;

  return {
    onboardingSession,
    executionSession: envelopeFirstAccess?.capabilityGates.canShowExecutionBridge 
      ? envelopeFirstAccess.session 
      : null,
    executionReadySection,
    structuredContracts: {
      narrative: getGuidanceSessionNarrative(input.guidanceSession) ?? null,
      systemPlan: getGuidanceSessionSystemPlan(input.guidanceSession) ?? null,
      executionPlan: getGuidanceSessionExecutionPlan(input.guidanceSession) ?? null,
      hasStructuredData: Boolean(
        getGuidanceSessionNarrative(input.guidanceSession) ??
        getGuidanceSessionSystemPlan(input.guidanceSession) ??
        getGuidanceSessionExecutionPlan(input.guidanceSession)
      ),
    },
    result: {
      currentRead: buildCurrentRead(input.detectedDomain, input.activeMode),
      panel: {
        result: input.result,
        isLoading: input.isLoading,
        lastGeneratedAt: input.lastGeneratedAt,
        detectedDomain: input.detectedDomain,
        activeMode: input.activeMode,
        shouldOfferDossier: input.shouldOfferDossier,
      },
    },
    trainer: trainerSection ?? {
      nextPath: {
        guidanceSession: null,
        activeTrainer: input.activeTrainer,
        trainerLoading: input.trainerLoading,
      },
      response: {
        response: input.guidanceSession?.trainerResponse ?? null,
        error: input.trainerError,
        loadingTrainer: input.trainerLoading,
      },
    },
  };
}

function buildOnboardingShellSession(guidanceSession: GuidanceSession | null): GuidanceSession | null {
  return canRenderGuidanceOnboardingShell(guidanceSession)
    ? guidanceSession
    : null;
}

// Legacy execution session builder - preserved for compatibility
// Note: This function is deprecated in favor of envelope-first execution builders
function buildExecutionSession(guidanceSession: GuidanceSession | null): GuidanceSession | null {
  return canRenderGuidanceExecutionBridge(guidanceSession)
    ? guidanceSession
    : null;
}

function buildNextPathSession(input: {
  guidanceSession: GuidanceSession | null;
  suppressForExecution: boolean;
}): GuidanceSession | null {
  if (
    input.suppressForExecution
    || !input.guidanceSession
    || !input.guidanceSession.result
    || !getGuidanceSessionRouteOutcome(input.guidanceSession)
  ) {
    return null;
  }

  return input.guidanceSession;
}

function buildCurrentRead(
  detectedDomain: GuidancePrimaryDomain | null,
  activeMode: GuidanceModeId | null
): GuidanceCurrentReadPresentation {
  if (!detectedDomain || !activeMode) {
    return {
      label: 'Live intake read',
      summary: 'Add raw input to see the detected domain, recommended mode, and dossier signal before you run the first guidance pass.',
    };
  }

  const activeModeConfig = getGuidanceModeConfig(activeMode);
  const copyProfile = buildGuidanceCopyProfile({
    detectedDomain,
    activeMode,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);

  return {
    label: 'Live intake read',
    summary: `Detected a ${formatLabel(detectedDomain)} situation. The current flow will use ${activeModeConfig.label} mode to organize ${lexicon.readout} with a ${activeModeConfig.toneProfile} tone and ${activeModeConfig.prefersShortFlow ? 'a shorter answer shape' : 'full structured guidance'} emphasis, based on the current intake.`,
  };
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}
