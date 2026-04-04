'use client';

import { GuidanceActionList } from '@/components/guidance/GuidanceActionList';
import { GuidanceCurrentRead } from '@/components/guidance/GuidanceCurrentRead';
import {
  buildGuidanceCopyProfile,
  getGuidanceCtaPromise,
  getGuidanceDomainLexicon,
} from '@/src/components/guidance/guidance-copy-personalization';
import {
  type GuidanceCurrentReadPresentation,
  type GuidanceRightRailViewModel,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import {
  createEnvelopeFirstPresenterContext,
  buildEnvelopeFirstSafeResultContent,
  shouldPrioritizeTrainerContent,
} from '@/src/lib/guidance-session/envelope-first-presenter-helpers';

interface GuidanceResultPanelProps {
  section: GuidanceRightRailViewModel['result'];
  zoneProfile: GuidanceZoneProfile;
}

export function GuidanceResultPanel({
  zoneProfile,
  section,
}: GuidanceResultPanelProps) {
  const density = zoneProfile.contentDensity ?? 'guided';
  const intent = zoneProfile.microcopyIntent ?? 'confirm';
  const rhythm = zoneProfile.surfaceRhythm ?? 'steady';
  const continuity = zoneProfile.transitionContinuity ?? 'persist';
  const weight = zoneProfile.visualWeight ?? 'balanced';
  const { currentRead, panel } = section;
  const { result, isLoading, lastGeneratedAt, detectedDomain, activeMode, shouldOfferDossier } = panel;
  
  // Envelope-first presenter context creation
  // Note: This creates a temporary session from panel data for envelope-first validation
  // In a full migration, this would come from the presenter layer
  const tempSession = result ? {
    id: 'temp-session',
    initialInput: 'temp input',
    detectedDomain: detectedDomain || 'decision',
    activeMode: activeMode || 'decision',
    intakeAnswers: {},
    result: {
      summary: result.summary,
      nextStep: result.next_step,
      suggestedTasks: result.suggested_tasks,
    },
    createdAt: new Date().toISOString(),
    shouldOfferDossier: shouldOfferDossier || false,
  } as any : null;
  
  const envelopeContext = createEnvelopeFirstPresenterContext(tempSession);
  const safeResultContent = envelopeContext ? buildEnvelopeFirstSafeResultContent(envelopeContext) : {
    summary: null,
    nextStep: null,
    suggestedTasks: null,
    isDegraded: false,
  };
  
  // Legacy fallback for compatibility
  const modeConfig = activeMode ? getGuidanceModeConfig(activeMode) : null;
  const copyProfile = buildGuidanceCopyProfile({
    detectedDomain,
    activeMode,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  const isMinimal = density === 'minimal';
  const isExpanded = density === 'expanded';
  const sectionReflection = safeResultContent.summary 
    ? 'Here is what we found based on your situation.'
    : 'Share your situation to get clear guidance.';
  const nextStepSupport = intent === 'deepen'
    ? `This next step is based on the strongest signals already clarified, so it can ${getGuidanceCtaPromise(copyProfile)}.`
    : shouldOfferDossier
      ? `This next step is grounded in what the current read already confirmed, so it has enough shape to become a tracked working thread if you want to ${lexicon.executionBridge}.`
      : `This next step keeps the useful parts of the current read intact, so you can keep refining here before you commit it to a longer execution thread.`;
  const suggestedTasksIntro = intent === 'deepen'
    ? `These tasks unpack the current read into a clearer path without changing the underlying ${copyProfile.domainFamily === 'clarity' ? 'position' : copyProfile.domainFamily === 'structure' ? 'plan' : 'direction'} you already confirmed.`
    : `These tasks are based on the current read and show the first concrete work it already unlocked, while staying scoped to the ${lexicon.resultFocus} above.`;
  const emptyStateCopy = 'Describe your situation above to receive personalized guidance, see what became clearer about it, and get next steps.';
  const bodySpacingClass = rhythm === 'spacious'
    ? 'space-y-7 p-6 sm:p-7'
    : rhythm === 'compact'
      ? 'space-y-4 p-4 sm:p-5'
      : 'space-y-6 p-5 sm:p-6';
  const continuityClass = continuity === 'advance'
    ? 'shadow-[0_16px_34px_rgba(5,12,22,0.18)]'
    : continuity === 'settle'
      ? 'opacity-92 ring-1 ring-[rgba(255,255,255,0.04)]'
      : 'ring-1 ring-[rgba(109,156,255,0.08)]';
  const titleClass = weight === 'strong'
    ? 'text-[1.35rem] font-semibold tracking-[-0.04em]'
    : weight === 'subtle'
      ? 'text-lg font-semibold tracking-[-0.02em]'
      : 'text-xl font-semibold tracking-[-0.03em]';

  return (
    <div className={`ui-surface-primary overflow-hidden border-[rgba(109,156,255,0.15)] ${continuityClass}`.trim()}>
      <div className="border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(109,156,255,0.08),transparent_85%)] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Guidance
            </p>
            <span className="sr-only">Result panel</span>
            <h2 className={`mt-2 ${titleClass} text-[var(--text-primary)]`}>
              {safeResultContent.summary
                ? intent === 'deepen'
                  ? `You now have a ${lexicon.resultFocus}`
                  : shouldOfferDossier
                    ? copyProfile.domainFamily === 'structure'
                      ? 'You now have a plan you can act on'
                      : 'You now have a direction you can act on'
                    : 'You now have a usable guidance read'
              : 'First universal guidance read'}
            </h2>
            {safeResultContent.summary ? (
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {`Based on the current read, you now have a ${lexicon.resultFocus} you can trust.`}
              </p>
            ) : null}
            {!isMinimal ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                {safeResultContent.summary ? sectionReflection : emptyStateCopy}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="ui-chip ui-chip-accent">
              {detectedDomain ? formatLabel(detectedDomain) : 'No domain yet'}
            </span>
            <span className="ui-chip">{modeConfig ? modeConfig.label : 'No mode yet'}</span>
          </div>
        </div>
      </div>

      <div className={`${bodySpacingClass} ${isMinimal && rhythm !== 'spacious' ? 'space-y-4 p-4 sm:p-5' : ''}`}>
        <GuidanceCurrentRead label={currentRead.label} summary={currentRead.summary} density={density} />

        {isLoading ? (
          <div className="ui-surface-secondary space-y-4 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.026)] px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Generating universal guidance...</span>
                {!isMinimal ? (
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Just a moment
                  </span>
                ) : null}
              </div>
            <div className="space-y-2">
              <div className="ui-skeleton h-3 w-28" />
              <div className="ui-skeleton h-6 w-4/5" />
              <div className="ui-skeleton h-5 w-full" />
              <div className="ui-skeleton h-5 w-3/4" />
            </div>
          </div>
        ) : safeResultContent.summary ? (
          <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(280px,0.84fr)]">
              <div className="rounded-[22px] border border-[rgba(109,156,255,0.12)] bg-[linear-gradient(180deg,rgba(109,156,255,0.07),rgba(255,255,255,0.02))] p-[1px]">
                <GuidanceCurrentRead summary={safeResultContent.summary || 'No summary available'} label="Situation" />
              </div>

              <div className="ui-surface-accent space-y-4 border-[rgba(109,156,255,0.24)] px-5 py-5 shadow-[0_12px_24px_rgba(17,41,84,0.14)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                  {intent === 'deepen' ? 'Next step with momentum' : 'Next step'}
                </p>
                <p className="text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                  {safeResultContent.nextStep || 'No next step available'}
                </p>
                {!isMinimal ? (
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {nextStepSupport}
                  </p>
                ) : null}
                {lastGeneratedAt && isExpanded && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
                    Last refreshed at {lastGeneratedAt}
                  </p>
                )}
              </div>
            </div>

            <div className={`ui-surface-secondary border-[rgba(158,175,198,0.18)] ${isMinimal ? 'space-y-3 p-4' : 'space-y-5 p-5'}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Suggested tasks
              </p>
              {!isMinimal ? (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {suggestedTasksIntro}
                </p>
              ) : null}
            </div>

            <GuidanceActionList actions={safeResultContent.suggestedTasks || []} nextStep={safeResultContent.nextStep || ''} density={density} />
          </>
        ) : (
          <div className="ui-surface-secondary space-y-3 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Awaiting first run
            </p>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              {emptyStateCopy}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}
