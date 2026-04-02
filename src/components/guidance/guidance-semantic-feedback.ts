import {
  type GuidanceProgressMessagePresentation,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';

export const GUIDANCE_PROGRESS_MESSAGE_ID = 'guidance-progress-message';

export const GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(109,156,255,0.26)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-primary,#08121d)]';

export const GUIDANCE_DISABLED_INTERACTION_CLASS_NAME =
  'disabled:cursor-not-allowed disabled:opacity-60';

const GUIDANCE_LOADING_PROGRESS_STATES = new Set<GuidanceProgressMessagePresentation['state']>([
  'fresh_submit_loading',
  'clarifying_continue_loading',
  'trainer_request_loading',
  'dossier_conversion_loading',
]);

export function isGuidanceLoadingProgressState(
  state: GuidanceProgressMessagePresentation['state']
) {
  return GUIDANCE_LOADING_PROGRESS_STATES.has(state);
}

export function isGuidanceZoneBusy(
  profile: GuidanceZoneProfile,
  progressState: GuidanceProgressMessagePresentation['state']
) {
  return profile.isDominant && isGuidanceLoadingProgressState(progressState);
}

export function getGuidanceZoneAriaLabel(zone: GuidanceZoneProfile['zone']) {
  switch (zone) {
    case 'intake':
      return 'Guidance intake';
    case 'onboarding':
      return 'Guidance clarification';
    case 'result':
      return 'Guidance result';
    case 'trainer':
      return 'Guidance trainer';
    case 'execution':
      return 'Guidance execution transition';
    default:
      return 'Guidance section';
  }
}

export function joinAriaDescribedBy(...ids: Array<string | null | undefined>) {
  const value = ids.filter(Boolean).join(' ').trim();
  return value || undefined;
}
