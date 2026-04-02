import {
  type GuidanceProgressMessageState,
  type GuidanceSectionVisibilityPresentation,
  type GuidanceTransitionContinuityPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceTransitionContinuityInput {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

export function presentGuidanceTransitionContinuity(
  input: PresentGuidanceTransitionContinuityInput
): GuidanceTransitionContinuityPresentation {
  switch (input.progressState) {
    case 'fresh_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'advance',
        onboarding: null,
        result: 'settle',
        trainer: null,
        execution: null,
      });
    case 'fresh_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'persist',
        onboarding: null,
        result: 'persist',
        trainer: null,
        execution: null,
      });
    case 'fresh_submit_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'persist',
        onboarding: null,
        result: 'advance',
        trainer: null,
        execution: null,
      });
    case 'clarifying_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'advance',
        result: 'persist',
        trainer: 'settle',
        execution: null,
      });
    case 'clarifying_continue_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'persist',
        result: 'settle',
        trainer: null,
        execution: null,
      });
    case 'refined_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'persist',
        result: 'advance',
        trainer: 'settle',
        execution: null,
      });
    case 'trainer_request_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'settle',
        result: 'persist',
        trainer: 'advance',
        execution: null,
      });
    case 'trainer_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'settle',
        result: 'persist',
        trainer: 'persist',
        execution: null,
      });
    case 'execution_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'settle',
        result: 'persist',
        trainer: null,
        execution: 'advance',
      });
    case 'dossier_conversion_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: 'settle',
        result: 'settle',
        trainer: null,
        execution: 'persist',
      });
    case 'degraded_result_fallback':
    default:
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'settle',
        onboarding: null,
        result: 'persist',
        trainer: 'settle',
        execution: null,
      });
  }
}

function withSuppressedAsNull(
  visibility: GuidanceSectionVisibilityPresentation,
  continuity: GuidanceTransitionContinuityPresentation
): GuidanceTransitionContinuityPresentation {
  return {
    intake: visibility.intake === 'suppressed' ? null : continuity.intake,
    onboarding: visibility.onboarding === 'suppressed' ? null : continuity.onboarding,
    result: visibility.result === 'suppressed' ? null : continuity.result,
    trainer: visibility.trainer === 'suppressed' ? null : continuity.trainer,
    execution: visibility.execution === 'suppressed' ? null : continuity.execution,
  };
}
