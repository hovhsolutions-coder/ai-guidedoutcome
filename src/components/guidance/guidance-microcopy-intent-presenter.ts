import {
  type GuidanceMicrocopyIntentPresentation,
  type GuidanceProgressMessageState,
  type GuidanceSectionVisibilityPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceMicrocopyIntentInput {
  progressState: GuidanceProgressMessageState;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
}

export function presentGuidanceMicrocopyIntent(
  input: PresentGuidanceMicrocopyIntentInput
): GuidanceMicrocopyIntentPresentation {
  switch (input.progressState) {
    case 'fresh_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'orient',
        onboarding: null,
        result: 'confirm',
        trainer: null,
        execution: null,
      });
    case 'fresh_submit_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: null,
        result: 'confirm',
        trainer: null,
        execution: null,
      });
    case 'fresh_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: null,
        result: 'confirm',
        trainer: null,
        execution: null,
      });
    case 'clarifying_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: 'orient',
        result: 'confirm',
        trainer: 'confirm',
        execution: null,
      });
    case 'clarifying_continue_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: 'orient',
        result: 'confirm',
        trainer: null,
        execution: null,
      });
    case 'refined_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: 'confirm',
        result: 'deepen',
        trainer: 'deepen',
        execution: null,
      });
    case 'trainer_request_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: 'confirm',
        result: 'confirm',
        trainer: 'deepen',
        execution: null,
      });
    case 'trainer_retry_ready':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: 'confirm',
        result: 'confirm',
        trainer: 'confirm',
        execution: null,
      });
    case 'execution_ready':
    case 'dossier_conversion_loading':
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: 'confirm',
        result: 'confirm',
        trainer: null,
        execution: 'activate',
      });
    case 'degraded_result_fallback':
    default:
      return withSuppressedAsNull(input.sectionVisibility, {
        intake: 'confirm',
        onboarding: null,
        result: 'confirm',
        trainer: 'deepen',
        execution: null,
      });
  }
}

function withSuppressedAsNull(
  visibility: GuidanceSectionVisibilityPresentation,
  intent: GuidanceMicrocopyIntentPresentation
): GuidanceMicrocopyIntentPresentation {
  return {
    intake: visibility.intake === 'suppressed' ? null : intent.intake,
    onboarding: visibility.onboarding === 'suppressed' ? null : intent.onboarding,
    result: visibility.result === 'suppressed' ? null : intent.result,
    trainer: visibility.trainer === 'suppressed' ? null : intent.trainer,
    execution: visibility.execution === 'suppressed' ? null : intent.execution,
  };
}
