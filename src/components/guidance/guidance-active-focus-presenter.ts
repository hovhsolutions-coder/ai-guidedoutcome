import {
  type GuidanceActiveFocusPresentation,
  type GuidanceProgressMessageState,
} from '@/src/components/guidance/guidance-presentation-contracts';

export function presentGuidanceActiveFocus(
  progressState: GuidanceProgressMessageState
): GuidanceActiveFocusPresentation {
  switch (progressState) {
    case 'fresh_ready':
    case 'fresh_retry_ready':
      return {
        target: 'intake',
        dominantZone: 'intake',
        primaryCta: 'submit',
      };
    case 'fresh_submit_loading':
      return {
        target: 'result',
        dominantZone: 'result',
        primaryCta: 'none',
      };
    case 'clarifying_ready':
    case 'clarifying_continue_loading':
      return {
        target: 'follow_up',
        dominantZone: 'onboarding',
        primaryCta: 'follow_up',
      };
    case 'refined_ready':
      return {
        target: 'result',
        dominantZone: 'result',
        primaryCta: 'none',
      };
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return {
        target: 'trainer',
        dominantZone: 'trainer',
        primaryCta: 'trainer',
      };
    case 'execution_ready':
    case 'dossier_conversion_loading':
      return {
        target: 'execution_transition',
        dominantZone: 'execution',
        primaryCta: 'dossier_convert',
      };
    case 'degraded_result_fallback':
    default:
      return {
        target: 'degraded_result',
        dominantZone: 'result',
        primaryCta: 'none',
      };
  }
}
