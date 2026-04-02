import {
  type GuidanceProgressMessageState,
  type GuidanceSurfaceVariant,
} from '@/src/components/guidance/guidance-presentation-contracts';

export function presentGuidanceSurfaceVariant(
  progressState: GuidanceProgressMessageState
): GuidanceSurfaceVariant {
  switch (progressState) {
    case 'fresh_ready':
    case 'fresh_retry_ready':
      return 'capture_surface';
    case 'clarifying_ready':
    case 'clarifying_continue_loading':
      return 'clarify_surface';
    case 'trainer_request_loading':
    case 'trainer_retry_ready':
      return 'explore_surface';
    case 'execution_ready':
    case 'dossier_conversion_loading':
      return 'commit_surface';
    case 'degraded_result_fallback':
      return 'degraded_understand_surface';
    case 'fresh_submit_loading':
    case 'refined_ready':
    default:
      return 'understand_surface';
  }
}
