import {
  type GuidanceProgressMessageState,
  type GuidanceSectionVisibilityPresentation,
  type GuidanceVisualWeightPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceVisualWeightInput {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

export function presentGuidanceVisualWeight(
  input: PresentGuidanceVisualWeightInput
): GuidanceVisualWeightPresentation {
  switch (input.progressState) {
    case 'fresh_ready':
    case 'fresh_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'strong',
        onboarding: null,
        result: 'subtle',
        trainer: null,
        execution: null,
      });
    case 'fresh_submit_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: null,
        result: 'strong',
        trainer: null,
        execution: null,
      });
    case 'clarifying_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: 'strong',
        result: 'balanced',
        trainer: 'subtle',
        execution: null,
      });
    case 'clarifying_continue_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: 'strong',
        result: 'subtle',
        trainer: null,
        execution: null,
      });
    case 'refined_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: 'balanced',
        result: 'strong',
        trainer: 'balanced',
        execution: null,
      });
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: 'subtle',
        result: 'subtle',
        trainer: 'strong',
        execution: null,
      });
    case 'execution_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: 'subtle',
        result: 'balanced',
        trainer: null,
        execution: 'strong',
      });
    case 'dossier_conversion_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: 'subtle',
        result: 'subtle',
        trainer: null,
        execution: 'strong',
      });
    case 'degraded_result_fallback':
    default:
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'subtle',
        onboarding: null,
        result: 'balanced',
        trainer: 'subtle',
        execution: null,
      });
  }
}

function withSuppressedAsNull(
  visibility: GuidanceSectionVisibilityPresentation,
  weight: GuidanceVisualWeightPresentation
): GuidanceVisualWeightPresentation {
  return {
    intake: visibility.intake === 'suppressed' ? null : weight.intake,
    onboarding: visibility.onboarding === 'suppressed' ? null : weight.onboarding,
    result: visibility.result === 'suppressed' ? null : weight.result,
    trainer: visibility.trainer === 'suppressed' ? null : weight.trainer,
    execution: visibility.execution === 'suppressed' ? null : weight.execution,
  };
}
