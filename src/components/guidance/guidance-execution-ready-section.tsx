'use client';

import { GuidanceExecutionHandoff } from '@/src/components/guidance/guidance-execution-handoff';
import {
  GuidanceExecutionTransition,
  GuidanceExecutionTransitionCard,
  buildGuidanceExecutionTransitionDisplayState,
} from '@/src/components/guidance/guidance-execution-transition';
import {
  type GuidanceExecutionReadySectionPresentation,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';

interface GuidanceExecutionReadySectionProps {
  guidanceSession: GuidanceSession | null;
  zoneProfile: GuidanceZoneProfile;
  interactiveTransition?: boolean;
  onConversionStateChange?: (isConverting: boolean) => void;
  onSuccessfulDossierConversion?: () => void;
  section: GuidanceExecutionReadySectionPresentation | null;
  progressMessageId?: string;
}

export function GuidanceExecutionReadySection({
  guidanceSession,
  zoneProfile,
  interactiveTransition = true,
  onConversionStateChange,
  onSuccessfulDossierConversion,
  section,
  progressMessageId,
}: GuidanceExecutionReadySectionProps) {
  const intent = zoneProfile.microcopyIntent ?? 'activate';
  const outcome = zoneProfile.sectionOutcome ?? 'commit';
  const rhythm = zoneProfile.surfaceRhythm ?? 'spacious';
  const continuity = zoneProfile.transitionContinuity ?? 'advance';
  const weight = zoneProfile.visualWeight ?? 'strong';
  if (!section) {
    return null;
  }

  const containerSpacing = rhythm === 'spacious'
    ? 'space-y-5'
    : rhythm === 'compact'
      ? 'space-y-3'
      : 'space-y-4';
  const continuityClass = continuity === 'persist'
    ? 'rounded-[24px] ring-1 ring-[rgba(109,156,255,0.08)]'
    : 'rounded-[24px]';
  const weightClass = weight === 'strong'
    ? 'shadow-[0_16px_30px_rgba(5,12,22,0.14)]'
    : weight === 'subtle'
      ? 'opacity-88'
      : '';

  return (
    <div className={`${containerSpacing} ${continuityClass} ${weightClass}`.trim()}>
      {outcome === 'commit' ? (
        <>
          {interactiveTransition ? (
            <GuidanceExecutionTransition
              guidanceSession={guidanceSession}
              intent={intent}
              onConversionStateChange={onConversionStateChange}
              onSuccessfulDossierConversion={onSuccessfulDossierConversion}
              transition={section.transition}
              progressMessageId={progressMessageId}
            />
          ) : (
            <GuidanceExecutionTransitionCard
              {...buildGuidanceExecutionTransitionDisplayState(section.transition)}
              intent={intent}
              onConvertToDossier={() => {}}
            />
          )}
          <GuidanceExecutionHandoff handoff={section.handoff} />
        </>
      ) : (
        <>
          <GuidanceExecutionHandoff handoff={section.handoff} />
          {interactiveTransition ? (
            <GuidanceExecutionTransition
              guidanceSession={guidanceSession}
              intent={intent}
              onConversionStateChange={onConversionStateChange}
              onSuccessfulDossierConversion={onSuccessfulDossierConversion}
              transition={section.transition}
              progressMessageId={progressMessageId}
            />
          ) : (
            <GuidanceExecutionTransitionCard
              {...buildGuidanceExecutionTransitionDisplayState(section.transition)}
              intent={intent}
              onConvertToDossier={() => {}}
            />
          )}
        </>
      )}
    </div>
  );
}
