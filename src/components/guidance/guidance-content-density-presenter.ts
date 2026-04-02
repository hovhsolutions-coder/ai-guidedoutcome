import {
  type GuidanceContentDensityPresentation,
  type GuidanceProgressMessageState,
  type GuidanceSectionVisibilityPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceContentDensityInput {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

export function presentGuidanceContentDensity(
  input: PresentGuidanceContentDensityInput
): GuidanceContentDensityPresentation {
  switch (input.progressState) {
    case 'fresh_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'guided',
        onboarding: null,
        result: 'minimal',
        trainer: null,
        execution: null,
      });
    case 'fresh_submit_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: null,
        result: 'guided',
        trainer: null,
        execution: null,
      });
    case 'fresh_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'guided',
        onboarding: null,
        result: 'minimal',
        trainer: null,
        execution: null,
      });
    case 'clarifying_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: 'guided',
        result: 'guided',
        trainer: 'minimal',
        execution: null,
      });
    case 'clarifying_continue_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: 'guided',
        result: 'minimal',
        trainer: null,
        execution: null,
      });
    case 'refined_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: 'guided',
        result: 'expanded',
        trainer: 'guided',
        execution: null,
      });
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: 'minimal',
        result: 'guided',
        trainer: 'guided',
        execution: null,
      });
    case 'execution_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: 'minimal',
        result: 'guided',
        trainer: null,
        execution: 'expanded',
      });
    case 'dossier_conversion_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: 'minimal',
        result: 'minimal',
        trainer: null,
        execution: 'expanded',
      });
    case 'degraded_result_fallback':
    default:
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'minimal',
        onboarding: null,
        result: 'guided',
        trainer: 'minimal',
        execution: null,
      });
  }
}

function withSuppressedAsNull(
  visibility: GuidanceSectionVisibilityPresentation,
  density: GuidanceContentDensityPresentation
): GuidanceContentDensityPresentation {
  return {
    intake: visibility.intake === 'suppressed' ? null : density.intake,
    onboarding: visibility.onboarding === 'suppressed' ? null : density.onboarding,
    result: visibility.result === 'suppressed' ? null : density.result,
    trainer: visibility.trainer === 'suppressed' ? null : density.trainer,
    execution: visibility.execution === 'suppressed' ? null : density.execution,
  };
}
