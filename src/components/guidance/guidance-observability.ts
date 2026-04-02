import {
  type GuidancePrimaryCtaContext,
  type GuidanceSessionPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';

type GuidanceObservedAction = 'submit' | 'follow_up' | 'trainer' | 'convert';

type GuidanceObservedSignal =
  | 'follow_up_hesitation_window'
  | 'repeated_action_attempt'
  | 'abandoned_execution_bridge';

type GuidanceObservedEvent =
  | {
    type: 'presentation_state';
    progressState: GuidanceSessionPresentation['progressMessage']['state'];
    surfaceVariant: GuidanceSessionPresentation['surfaceVariant'];
    dominantZone: GuidanceSessionPresentation['zoneProfiles'][keyof GuidanceSessionPresentation['zoneProfiles']]['zone'] | null;
    rightRailRole: GuidanceSessionPresentation['rightRailProfile']['role'];
    primaryCta: GuidancePrimaryCtaContext;
    generationCount?: number;
    errorPresent?: boolean;
    trainerErrorPresent?: boolean;
  }
  | {
    type: 'action_triggered';
    action: GuidanceObservedAction;
    progressState: GuidanceSessionPresentation['progressMessage']['state'];
    surfaceVariant: GuidanceSessionPresentation['surfaceVariant'];
    dominantZone: GuidanceSessionPresentation['zoneProfiles'][keyof GuidanceSessionPresentation['zoneProfiles']]['zone'] | null;
    rightRailRole: GuidanceSessionPresentation['rightRailProfile']['role'];
    primaryCta: GuidancePrimaryCtaContext;
    attempt: number;
    detail?: string;
  }
  | {
    type: 'soft_signal';
    signal: GuidanceObservedSignal;
    progressState: GuidanceSessionPresentation['progressMessage']['state'];
    surfaceVariant: GuidanceSessionPresentation['surfaceVariant'];
    dominantZone: GuidanceSessionPresentation['zoneProfiles'][keyof GuidanceSessionPresentation['zoneProfiles']]['zone'] | null;
    rightRailRole: GuidanceSessionPresentation['rightRailProfile']['role'];
    primaryCta: GuidancePrimaryCtaContext;
    detail?: string;
  };

declare global {
  interface Window {
    __GUIDANCE_DEBUG_EVENTS__?: Array<GuidanceObservedEvent & { timestamp: string }>;
  }
}

const GUIDANCE_DEBUG_EVENT_NAME = 'guidance:observed';

export function getGuidanceObservabilitySnapshot(
  presentation: GuidanceSessionPresentation
) {
  const dominantZone =
    Object.values(presentation.zoneProfiles).find((profile) => profile.isDominant)?.zone ?? null;
  const primaryCta =
    Object.values(presentation.zoneProfiles).find((profile) => profile.primaryCta !== null)?.primaryCta ?? 'none';

  return {
    progressState: presentation.progressMessage.state,
    surfaceVariant: presentation.surfaceVariant,
    dominantZone,
    rightRailRole: presentation.rightRailProfile.role,
    primaryCta,
  };
}

export function observeGuidancePresentationState(input: {
  presentation: GuidanceSessionPresentation;
  generationCount?: number;
  errorPresent?: boolean;
  trainerErrorPresent?: boolean;
}) {
  emitGuidanceObservedEvent({
    type: 'presentation_state',
    ...getGuidanceObservabilitySnapshot(input.presentation),
    generationCount: input.generationCount,
    errorPresent: input.errorPresent,
    trainerErrorPresent: input.trainerErrorPresent,
  });
}

export function observeGuidanceActionTriggered(input: {
  presentation: GuidanceSessionPresentation;
  action: GuidanceObservedAction;
  attempt: number;
  detail?: string;
}) {
  emitGuidanceObservedEvent({
    type: 'action_triggered',
    ...getGuidanceObservabilitySnapshot(input.presentation),
    action: input.action,
    attempt: input.attempt,
    detail: input.detail,
  });
}

export function observeGuidanceSoftSignal(input: {
  presentation: GuidanceSessionPresentation;
  signal: GuidanceObservedSignal;
  detail?: string;
}) {
  emitGuidanceObservedEvent({
    type: 'soft_signal',
    ...getGuidanceObservabilitySnapshot(input.presentation),
    signal: input.signal,
    detail: input.detail,
  });
}

function emitGuidanceObservedEvent(event: GuidanceObservedEvent) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const enrichedEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const previousEvents = window.__GUIDANCE_DEBUG_EVENTS__ ?? [];
    window.__GUIDANCE_DEBUG_EVENTS__ = [...previousEvents.slice(-49), enrichedEvent];
    window.dispatchEvent(
      new CustomEvent(GUIDANCE_DEBUG_EVENT_NAME, {
        detail: enrichedEvent,
      })
    );
  }

  console.debug('[guidance-observe]', enrichedEvent);
}
