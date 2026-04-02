import {
  type GuidanceProgressMessageState,
  type GuidanceRightRailViewModel,
  type GuidanceSectionVisibilityPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

interface PresentGuidanceSectionVisibilityInput {
  progressState: GuidanceProgressMessageState;
  rightRailView: GuidanceRightRailViewModel;
}

export function presentGuidanceSectionVisibility(
  input: PresentGuidanceSectionVisibilityInput
): GuidanceSectionVisibilityPresentation {
  const hasOnboarding = input.rightRailView.onboardingSession !== null;
  const hasResult = input.rightRailView.result.panel.result !== null || input.progressState === 'fresh_ready' || input.progressState === 'fresh_retry_ready' || input.progressState === 'fresh_submit_loading';
  const hasTrainer = input.rightRailView.trainer.nextPath.guidanceSession !== null || input.rightRailView.trainer.response.response !== null || input.rightRailView.trainer.response.error !== null || input.rightRailView.trainer.response.loadingTrainer !== null;
  const hasExecution = input.rightRailView.executionReadySection !== null;

  switch (input.progressState) {
    case 'fresh_ready':
    case 'fresh_retry_ready':
      return {
        intake: 'visible',
        onboarding: 'suppressed',
        result: hasResult ? 'visible' : 'suppressed',
        trainer: 'suppressed',
        execution: 'suppressed',
      };
    case 'fresh_submit_loading':
      return {
        intake: 'soft_hidden',
        onboarding: 'suppressed',
        result: hasResult ? 'visible' : 'suppressed',
        trainer: 'suppressed',
        execution: 'suppressed',
      };
    case 'clarifying_ready':
      return {
        intake: 'soft_hidden',
        onboarding: hasOnboarding ? 'visible' : 'suppressed',
        result: hasResult ? 'visible' : 'suppressed',
        trainer: hasTrainer ? 'soft_hidden' : 'suppressed',
        execution: 'suppressed',
      };
    case 'clarifying_continue_loading':
      return {
        intake: 'soft_hidden',
        onboarding: hasOnboarding ? 'visible' : 'suppressed',
        result: hasResult ? 'soft_hidden' : 'suppressed',
        trainer: 'suppressed',
        execution: 'suppressed',
      };
    case 'refined_ready':
      return {
        intake: 'soft_hidden',
        onboarding: hasOnboarding ? 'soft_hidden' : 'suppressed',
        result: hasResult ? 'visible' : 'suppressed',
        trainer: hasTrainer ? 'soft_hidden' : 'suppressed',
        execution: 'suppressed',
      };
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return {
        intake: 'soft_hidden',
        onboarding: hasOnboarding ? 'soft_hidden' : 'suppressed',
        result: hasResult ? 'soft_hidden' : 'suppressed',
        trainer: hasTrainer ? 'visible' : 'suppressed',
        execution: 'suppressed',
      };
    case 'execution_ready':
    case 'dossier_conversion_loading':
      return {
        intake: 'soft_hidden',
        onboarding: hasOnboarding ? 'soft_hidden' : 'suppressed',
        result: hasResult ? 'soft_hidden' : 'suppressed',
        trainer: 'suppressed',
        execution: hasExecution ? 'visible' : 'suppressed',
      };
    case 'degraded_result_fallback':
    default:
      return {
        intake: 'soft_hidden',
        onboarding: 'suppressed',
        result: hasResult ? 'visible' : 'suppressed',
        trainer: hasTrainer ? 'soft_hidden' : 'suppressed',
        execution: 'suppressed',
      };
  }
}
