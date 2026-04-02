import {
  type GuidanceProgressMessageState,
  type GuidanceSectionOutcomePresentation,
  type GuidanceSectionVisibilityPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceSectionOutcomeInput {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

export function presentGuidanceSectionOutcome(
  input: PresentGuidanceSectionOutcomeInput
): GuidanceSectionOutcomePresentation {
  switch (input.progressState) {
    case 'fresh_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: null,
        result: 'understand',
        trainer: null,
        execution: null,
      });
    case 'fresh_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: null,
        result: 'understand',
        trainer: null,
        execution: null,
      });
    case 'fresh_submit_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: null,
        result: 'understand',
        trainer: null,
        execution: null,
      });
    case 'clarifying_ready':
    case 'clarifying_continue_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: 'clarify',
        result: 'understand',
        trainer: 'explore',
        execution: null,
      });
    case 'refined_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: 'understand',
        result: 'understand',
        trainer: 'explore',
        execution: null,
      });
    case 'trainer_request_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: 'understand',
        result: 'understand',
        trainer: 'explore',
        execution: null,
      });
    case 'trainer_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: 'understand',
        result: 'understand',
        trainer: 'understand',
        execution: null,
      });
    case 'execution_ready':
    case 'dossier_conversion_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: 'understand',
        result: 'understand',
        trainer: null,
        execution: 'commit',
      });
    case 'degraded_result_fallback':
    default:
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'capture',
        onboarding: null,
        result: 'understand',
        trainer: 'explore',
        execution: null,
      });
  }
}

function withSuppressedAsNull(
  visibility: GuidanceSectionVisibilityPresentation,
  outcome: GuidanceSectionOutcomePresentation
): GuidanceSectionOutcomePresentation {
  return {
    intake: visibility.intake === 'suppressed' ? null : outcome.intake,
    onboarding: visibility.onboarding === 'suppressed' ? null : outcome.onboarding,
    result: visibility.result === 'suppressed' ? null : outcome.result,
    trainer: visibility.trainer === 'suppressed' ? null : outcome.trainer,
    execution: visibility.execution === 'suppressed' ? null : outcome.execution,
  };
}
