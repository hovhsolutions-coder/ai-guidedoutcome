import {
  type GuidanceProgressMessageState,
  type GuidanceSectionVisibilityPresentation,
  type GuidanceSurfaceRhythmPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceSurfaceRhythmInput {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

export function presentGuidanceSurfaceRhythm(
  input: PresentGuidanceSurfaceRhythmInput
): GuidanceSurfaceRhythmPresentation {
  switch (input.progressState) {
    case 'fresh_ready':
    case 'fresh_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'steady',
        onboarding: null,
        result: 'compact',
        trainer: null,
        execution: null,
      });
    case 'fresh_submit_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: null,
        result: 'steady',
        trainer: null,
        execution: null,
      });
    case 'clarifying_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: 'steady',
        result: 'steady',
        trainer: 'compact',
        execution: null,
      });
    case 'clarifying_continue_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: 'steady',
        result: 'compact',
        trainer: null,
        execution: null,
      });
    case 'refined_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: 'compact',
        result: 'spacious',
        trainer: 'steady',
        execution: null,
      });
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: 'compact',
        result: 'compact',
        trainer: 'spacious',
        execution: null,
      });
    case 'execution_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: 'compact',
        result: 'steady',
        trainer: null,
        execution: 'spacious',
      });
    case 'dossier_conversion_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: 'compact',
        result: 'compact',
        trainer: null,
        execution: 'spacious',
      });
    case 'degraded_result_fallback':
    default:
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'compact',
        onboarding: null,
        result: 'steady',
        trainer: 'compact',
        execution: null,
      });
  }
}

function withSuppressedAsNull(
  visibility: GuidanceSectionVisibilityPresentation,
  rhythm: GuidanceSurfaceRhythmPresentation
): GuidanceSurfaceRhythmPresentation {
  return {
    intake: visibility.intake === 'suppressed' ? null : rhythm.intake,
    onboarding: visibility.onboarding === 'suppressed' ? null : rhythm.onboarding,
    result: visibility.result === 'suppressed' ? null : rhythm.result,
    trainer: visibility.trainer === 'suppressed' ? null : rhythm.trainer,
    execution: visibility.execution === 'suppressed' ? null : rhythm.execution,
  };
}
