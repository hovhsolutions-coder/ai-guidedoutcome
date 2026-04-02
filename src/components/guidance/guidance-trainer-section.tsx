'use client';

import { GuidanceNextPathPanel } from '@/src/components/guidance/guidance-next-path-panel';
import {
  type GuidanceTrainerSectionPresentation,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { GuidanceTrainerResponseBlock } from '@/src/components/guidance/guidance-trainer-response-block';
import { type AITrainerId } from '@/src/lib/ai/types';
import {
  createEnvelopeFirstPresenterContext,
  shouldPrioritizeTrainerContent,
} from '@/src/lib/guidance-session/envelope-first-presenter-helpers';

interface GuidanceTrainerSectionProps {
  section: GuidanceTrainerSectionPresentation;
  zoneProfile: GuidanceZoneProfile;
  onSelectTrainer: (trainer: AITrainerId) => void;
  onSuccessfulDossierConversion?: () => void;
  progressMessageId?: string;
}

export function GuidanceTrainerSection({
  section,
  zoneProfile,
  onSelectTrainer,
  onSuccessfulDossierConversion,
  progressMessageId,
}: GuidanceTrainerSectionProps) {
  const density = zoneProfile.contentDensity ?? 'guided';
  const intent = zoneProfile.microcopyIntent ?? 'deepen';
  const outcome = zoneProfile.sectionOutcome ?? 'explore';
  const rhythm = zoneProfile.surfaceRhythm ?? 'steady';
  const continuity = zoneProfile.transitionContinuity ?? 'settle';
  const weight = zoneProfile.visualWeight ?? 'balanced';
  
  // Envelope-first presenter context creation
  // Note: This creates a temporary session from section data for envelope-first validation
  // In a full migration, this would come from the presenter layer
  const tempSession = section.nextPath.guidanceSession ? {
    ...section.nextPath.guidanceSession,
    trainerResponse: section.response.response || undefined,
  } : null;
  
  const envelopeContext = createEnvelopeFirstPresenterContext(tempSession);
  
  // Envelope-first trainer prioritization logic
  const shouldPrioritizeTrainerRead = envelopeContext 
    ? shouldPrioritizeTrainerContent(
        envelopeContext,
        outcome,
        section.response.response,
        section.response.error,
        section.response.loadingTrainer
      )
    : outcome === 'explore'
      && (section.response.loadingTrainer !== null || section.response.error !== null || section.response.response !== null);

  // DEBUG: Trace sparse-state failure
  if (process.env.NODE_ENV === 'test') {
    console.log('[DEBUG] GuidanceTrainerSection:', {
      hasGuidanceSession: !!section.nextPath?.guidanceSession,
      guidanceSessionValue: section.nextPath?.guidanceSession,
      shouldPrioritizeTrainerRead,
    });
  }

  const containerSpacing = rhythm === 'spacious'
    ? 'space-y-7'
    : rhythm === 'compact'
      ? 'space-y-4'
      : 'space-y-5';
  const continuityClass = continuity === 'advance'
    ? 'rounded-[24px] bg-[rgba(109,156,255,0.025)] px-1.5 py-1.5'
    : continuity === 'persist'
      ? 'rounded-[24px] ring-1 ring-[rgba(109,156,255,0.08)]'
      : 'rounded-[24px]';
  const weightClass = weight === 'strong'
    ? 'shadow-[0_14px_28px_rgba(5,12,22,0.12)]'
    : weight === 'subtle'
      ? 'opacity-84'
      : '';

  return (
    <div className={`${containerSpacing} ${continuityClass} ${weightClass}`.trim()}>
      {shouldPrioritizeTrainerRead ? (
        <>
          <GuidanceTrainerResponseBlock
            response={section.response.response}
            error={section.response.error}
            loadingTrainer={section.response.loadingTrainer}
            density={density}
            intent={intent}
          />
          {section.nextPath.guidanceSession && (
            <GuidanceNextPathPanel
              guidanceSession={section.nextPath.guidanceSession}
              activeTrainer={section.nextPath.activeTrainer}
              trainerLoading={section.nextPath.trainerLoading}
              density={density}
              intent={intent}
              progressMessageId={progressMessageId}
              onSelectTrainer={onSelectTrainer}
              onSuccessfulDossierConversion={onSuccessfulDossierConversion}
            />
          )}
        </>
      ) : (
        <>
          {section.nextPath.guidanceSession && (
            <GuidanceNextPathPanel
              guidanceSession={section.nextPath.guidanceSession}
              activeTrainer={section.nextPath.activeTrainer}
              trainerLoading={section.nextPath.trainerLoading}
              density={density}
              intent={intent}
              progressMessageId={progressMessageId}
              onSelectTrainer={onSelectTrainer}
              onSuccessfulDossierConversion={onSuccessfulDossierConversion}
            />
          )}
          <GuidanceTrainerResponseBlock
            response={section.response.response}
            error={section.response.error}
            loadingTrainer={section.response.loadingTrainer}
            density={density}
            intent={intent}
          />
        </>
      )}
    </div>
  );
}
