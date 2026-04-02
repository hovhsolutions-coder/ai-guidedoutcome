'use client';

import React from 'react';
import { GuidanceErrorCard } from '@/components/guidance/GuidanceErrorCard';
import { observeGuidanceActionTriggered } from '@/src/components/guidance/guidance-observability';
import { GuidanceProgressMessage } from '@/src/components/guidance/guidance-progress-message';
import { presentGuidanceSessionForProgressStateOverride } from '@/src/components/guidance/guidance-session-presenter';
import { useGuidanceSessionController } from '@/src/components/guidance/use-guidance-session-controller';
import { GuidanceTrainerSection } from '@/src/components/guidance/guidance-trainer-section';
import { GuidanceOnboardingShell } from '@/src/components/guidance/guidance-onboarding-shell';
import { GuidanceExecutionReadySection } from '@/src/components/guidance/guidance-execution-ready-section';
import { GuidanceResultPanel } from '@/src/components/guidance/guidance-result-panel';
import { GuidanceStructuredContractsPanel } from '@/src/components/guidance/guidance-structured-contracts-panel';
import { ModeIntakeForm } from '@/src/components/guidance/mode-intake-form';
import { UniversalIntake } from '@/src/components/guidance/universal-intake';
import {
  getGuidanceButtonMotionClassName,
  getGuidanceMotionClassName,
  getGuidanceProgressMotionTimingProfile,
  getGuidanceZoneMotionTimingProfile,
  type GuidanceMotionTimingProfile,
} from '@/src/components/guidance/guidance-motion-timing';
import {
  getGuidanceZoneAriaLabel,
  GUIDANCE_DISABLED_INTERACTION_CLASS_NAME,
  GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME,
  GUIDANCE_PROGRESS_MESSAGE_ID,
  isGuidanceLoadingProgressState,
  isGuidanceZoneBusy,
  joinAriaDescribedBy,
} from '@/src/components/guidance/guidance-semantic-feedback';
import {
  deriveGuidanceProgressContext,
  getGuidancePrimaryCtaZoneProfile,
} from '@/src/components/guidance/guidance-zone-profile-selectors';
import {
  type GuidanceActiveFocusTarget,
  type GuidanceRightRailProfilePresentation,
  type GuidanceSurfaceVariant,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';

export function GuidanceSessionShell() {
  const controller = useGuidanceSessionController();
  const [isConvertingDossier, setIsConvertingDossier] = React.useState(false);
  const presentation = isConvertingDossier
    ? presentGuidanceSessionForProgressStateOverride({
      baseState: {
        intake: controller.presentation.intake,
        rightRailView: controller.presentation.rightRailView,
      },
      progressState: 'dossier_conversion_loading',
    })
    : controller.presentation;
  const { intake, progressMessage, surfaceVariant, rightRailProfile, zoneProfiles, rightRailView } = presentation;
  const progressContext = deriveGuidanceProgressContext(zoneProfiles, surfaceVariant);
  const primaryCtaZone = getGuidancePrimaryCtaZoneProfile(zoneProfiles);
  const progressMessageId = GUIDANCE_PROGRESS_MESSAGE_ID;
  const submitHelperId = 'guidance-submit-helper';
  const progressTimingProfile = getGuidanceProgressMotionTimingProfile({
    progressState: progressMessage.state,
    surfaceVariant,
    zoneProfiles,
  });
  const submitButtonTimingClassName = getGuidanceButtonMotionClassName(
    getGuidanceZoneMotionTimingProfile({
      progressState: progressMessage.state,
      surfaceVariant,
      zoneProfile: zoneProfiles.intake,
    })
  );
  const hasLoggedDossierConversionRef = React.useRef(false);

  React.useEffect(() => {
    if (!isConvertingDossier) {
      hasLoggedDossierConversionRef.current = false;
      return;
    }

    if (hasLoggedDossierConversionRef.current) {
      return;
    }

    hasLoggedDossierConversionRef.current = true;
    observeGuidanceActionTriggered({
      presentation,
      action: 'convert',
      attempt: 1,
      detail: 'execution transition',
    });
  }, [isConvertingDossier, presentation]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void controller.actions.submitGuidance();
  }

  const leftMainStack = (
    <GuidanceZoneSurface profile={zoneProfiles.intake} progressState={progressMessage.state} surfaceVariant={surfaceVariant}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <UniversalIntake
          rawInput={controller.input.rawInput}
          onRawInputChange={controller.input.setRawInput}
          situation={controller.input.situation}
          onSituationChange={controller.input.setSituation}
          mainGoal={controller.input.mainGoal}
          onMainGoalChange={controller.input.setMainGoal}
          zoneProfile={zoneProfiles.intake}
          presentation={intake.universal}
        />
        <ModeIntakeForm
          selectedMode={controller.input.selectedMode}
          onModeChange={controller.input.setSelectedMode}
          intakeAnswers={controller.input.intakeAnswers}
          onIntakeAnswersChange={controller.input.setIntakeAnswers}
          zoneProfile={zoneProfiles.intake}
          presentation={intake.mode}
        />

        {controller.feedback.error ? <GuidanceErrorCard error={controller.feedback.error} /> : null}

        <div
          data-guidance-cta-context="submit"
          data-guidance-cta-state={primaryCtaZone?.zone === 'intake' ? 'active' : 'secondary'}
          className="border-t border-[var(--border-subtle)] pt-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={intake.submit.disabled}
              aria-disabled={intake.submit.disabled}
              aria-describedby={joinAriaDescribedBy(progressMessageId, submitHelperId)}
              className={`ui-button-primary min-w-[220px] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME} ${submitButtonTimingClassName}`.trim()}
            >
              {intake.submit.label}
            </button>
            <p id={submitHelperId} className="text-sm text-[var(--text-secondary)]">
              {intake.submit.helperText}
            </p>
          </div>
        </div>
      </form>
    </GuidanceZoneSurface>
  );

  const rightRail = (
    <GuidanceRightRailSurface
      profile={rightRailProfile}
      progressContext={progressContext}
      progressMessage={progressMessage}
      progressTimingProfile={progressTimingProfile}
    >
      <GuidanceZoneSurface profile={zoneProfiles.onboarding} ctaContext="follow_up" progressState={progressMessage.state} surfaceVariant={surfaceVariant}>
        <GuidanceOnboardingShell
          guidanceSession={rightRailView.onboardingSession}
          zoneProfile={zoneProfiles.onboarding}
          isSubmittingFollowUp={controller.feedback.isSubmittingFollowUp && !isConvertingDossier}
          onSubmitFollowUp={controller.actions.submitFollowUp}
          progressMessageId={progressMessageId}
        />
      </GuidanceZoneSurface>
      <GuidanceZoneSurface profile={zoneProfiles.execution} ctaContext="dossier_convert" progressState={progressMessage.state} surfaceVariant={surfaceVariant}>
        <GuidanceExecutionReadySection
          guidanceSession={rightRailView.executionSession}
          zoneProfile={zoneProfiles.execution}
          onConversionStateChange={setIsConvertingDossier}
          section={rightRailView.executionReadySection}
          onSuccessfulDossierConversion={controller.actions.handleSuccessfulDossierConversion}
          progressMessageId={progressMessageId}
        />
      </GuidanceZoneSurface>
      <GuidanceZoneSurface profile={zoneProfiles.result} progressState={progressMessage.state} surfaceVariant={surfaceVariant}>
        <GuidanceResultPanel
          section={rightRailView.result}
          zoneProfile={zoneProfiles.result}
        />
      </GuidanceZoneSurface>
      {rightRailView.structuredContracts?.hasStructuredData && (
        <GuidanceStructuredContractsPanel
          narrative={rightRailView.structuredContracts.narrative}
          systemPlan={rightRailView.structuredContracts.systemPlan}
          executionPlan={rightRailView.structuredContracts.executionPlan}
          isMinimal={zoneProfiles.result.focusState !== 'dominant'}
        />
      )}
      <GuidanceZoneSurface profile={zoneProfiles.trainer} ctaContext="trainer" progressState={progressMessage.state} surfaceVariant={surfaceVariant}>
        <GuidanceTrainerSection
          section={rightRailView.trainer}
          zoneProfile={zoneProfiles.trainer}
          onSelectTrainer={controller.actions.selectTrainer}
          onSuccessfulDossierConversion={controller.actions.handleSuccessfulDossierConversion}
          progressMessageId={progressMessageId}
        />
      </GuidanceZoneSurface>
    </GuidanceRightRailSurface>
  );

  return (
    <div className="space-y-8">
      <section
        data-guidance-surface-variant={surfaceVariant}
        className={getSurfaceVariantClassName(surfaceVariant)}
      >
        <div className="border-b border-[var(--border-subtle)] px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary-strong)]">
                Universal Guidance
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
                Turn one messy input into a clear next move.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-[15px]">
                Start with raw context, shape the read with a mode when needed, and get one structured guidance output
                before any dossier conversion or dashboard work begins.
              </p>
            </div>
            <div className="ui-surface-secondary max-w-sm px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Dev execution
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                This page uses local mode automatically outside production so the flow stays testable without provider
                quota.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-7 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(390px,1.02fr)] lg:px-8 lg:py-8">
          {leftMainStack}
          {rightRail}
        </div>
      </section>
    </div>
  );
}

interface GuidanceZoneSurfaceProps {
  profile: GuidanceZoneProfile;
  progressState: React.ComponentProps<typeof GuidanceProgressMessage>['message']['state'];
  surfaceVariant: GuidanceSurfaceVariant;
  ctaContext?: 'follow_up' | 'trainer' | 'dossier_convert';
  children: React.ReactNode;
}

interface GuidanceRightRailSurfaceProps {
  profile: GuidanceRightRailProfilePresentation;
  progressContext: GuidanceActiveFocusTarget;
  progressMessage: React.ComponentProps<typeof GuidanceProgressMessage>['message'];
  progressTimingProfile: GuidanceMotionTimingProfile;
  children: React.ReactNode;
}

function GuidanceRightRailSurface({
  profile,
  progressContext,
  progressMessage,
  progressTimingProfile,
  children,
}: GuidanceRightRailSurfaceProps) {
  return (
    <div
      role="complementary"
      aria-label="Guidance context rail"
      data-guidance-right-rail-visibility={profile.visibility}
      data-guidance-right-rail-role={profile.role}
      data-guidance-right-rail-emphasis={profile.emphasis}
      data-guidance-right-rail-density={profile.density}
      data-guidance-right-rail-continuity={profile.continuity}
      className={getRightRailClassName(profile)}
    >
      <div
        data-guidance-progress-context={progressContext}
        data-guidance-progress-rail-role={profile.role}
        data-guidance-progress-rail-emphasis={profile.emphasis}
        data-guidance-motion-profile={progressTimingProfile}
        className={getProgressBlockClassName(profile)}
      >
        <GuidanceProgressMessage
          message={progressMessage}
          timingProfile={progressTimingProfile}
          messageId={GUIDANCE_PROGRESS_MESSAGE_ID}
          isBusy={isGuidanceLoadingProgressState(progressMessage.state)}
        />
      </div>
      {children}
    </div>
  );
}

function GuidanceZoneSurface({
  profile,
  progressState,
  surfaceVariant,
  ctaContext,
  children,
}: GuidanceZoneSurfaceProps) {
  if (profile.visibility === 'suppressed') {
    return null;
  }

  const motionTimingProfile = getGuidanceZoneMotionTimingProfile({
    progressState,
    surfaceVariant,
    zoneProfile: profile,
  });

  return (
    <div
      role="region"
      aria-label={getGuidanceZoneAriaLabel(profile.zone)}
      aria-current={profile.isDominant ? 'step' : undefined}
      aria-busy={isGuidanceZoneBusy(profile, progressState) ? true : undefined}
      data-guidance-zone={profile.zone}
      data-guidance-motion-profile={motionTimingProfile}
      data-section-visibility={profile.visibility}
      data-content-density={profile.contentDensity}
      data-microcopy-intent={profile.microcopyIntent}
      data-section-outcome={profile.sectionOutcome}
      data-surface-rhythm={profile.surfaceRhythm}
      data-transition-continuity={profile.transitionContinuity}
      data-visual-weight={profile.visualWeight}
      {...(ctaContext
        ? {
          'data-guidance-cta-context': profile.primaryCta ?? 'none',
          'data-guidance-cta-state': profile.primaryCta === ctaContext ? 'active' : 'secondary',
        }
        : {})}
      data-focus-dominance={profile.focusState}
      data-zone-focus-state={profile.focusState}
      data-zone-primary-cta={profile.primaryCta ?? 'none'}
      className={getFocusZoneClassName(profile, motionTimingProfile)}
    >
      {children}
    </div>
  );
}

function getSurfaceVariantClassName(surfaceVariant: GuidanceSurfaceVariant) {
  switch (surfaceVariant) {
    case 'capture_surface':
      return 'ui-surface-primary overflow-hidden';
    case 'clarify_surface':
      return 'ui-surface-primary overflow-hidden';
    case 'explore_surface':
      return 'ui-surface-primary overflow-hidden ring-1 ring-[rgba(109,156,255,0.06)]';
    case 'commit_surface':
      return 'ui-surface-primary overflow-hidden ring-1 ring-[rgba(109,156,255,0.08)]';
    case 'degraded_understand_surface':
      return 'ui-surface-primary overflow-hidden border-[rgba(255,255,255,0.07)]';
    case 'understand_surface':
    default:
      return 'ui-surface-primary overflow-hidden';
  }
}

function getRightRailClassName(profile: GuidanceRightRailProfilePresentation) {
  switch (profile.role) {
    case 'support':
      return 'space-y-4';
    case 'context':
      return 'space-y-5';
    case 'handoff':
      return 'space-y-6';
    case 'deepen':
    default:
      return 'space-y-5';
  }
}

function getProgressBlockClassName(profile: GuidanceRightRailProfilePresentation) {
  if (profile.role === 'handoff') {
    return profile.continuity === 'persist' ? 'pb-2.5 opacity-98' : 'pb-2';
  }

  if (profile.role === 'support') {
    return 'pb-1.5';
  }

  switch (profile.emphasis) {
    case 'subtle':
      return 'pb-1 opacity-92';
    case 'strong':
      return 'pb-1';
    case 'balanced':
    default:
      return 'pb-1';
  }
}

function getFocusZoneClassName(profile: GuidanceZoneProfile, motionTimingProfile: GuidanceMotionTimingProfile) {
  if (profile.visibility === 'suppressed') {
    return 'hidden';
  }

  const motionClassName = getGuidanceMotionClassName(motionTimingProfile);

  if (profile.focusState === 'dominant') {
    if (profile.visualWeight === 'balanced') {
      return `${motionClassName} rounded-[24px] border border-[rgba(109,156,255,0.14)] bg-[linear-gradient(180deg,rgba(109,156,255,0.045),rgba(255,255,255,0.018)_72%)] px-1.5 py-1.5 shadow-[0_12px_24px_rgba(5,12,22,0.12)]`;
    }
    if (profile.transitionContinuity === 'persist') {
      return `${motionClassName} rounded-[24px] border border-[rgba(109,156,255,0.13)] bg-[linear-gradient(180deg,rgba(109,156,255,0.04),rgba(255,255,255,0.018)_72%)] px-1.5 py-1.5 shadow-[0_10px_22px_rgba(5,12,22,0.1)]`;
    }

    return `${motionClassName} rounded-[24px] border border-[rgba(109,156,255,0.16)] bg-[linear-gradient(180deg,rgba(109,156,255,0.055),rgba(255,255,255,0.02)_72%)] px-1.5 py-1.5 shadow-[0_14px_28px_rgba(5,12,22,0.14)]`;
  }

  if (profile.visibility === 'soft_hidden') {
    if (profile.visualWeight === 'balanced') {
      return `${motionClassName} rounded-[24px] opacity-76 saturate-[0.88] contrast-[0.98]`;
    }
    return profile.transitionContinuity === 'persist'
      ? `${motionClassName} rounded-[24px] opacity-74 saturate-[0.84] contrast-[0.97]`
      : `${motionClassName} rounded-[24px] opacity-66 saturate-[0.78] contrast-[0.95]`;
  }

  if (profile.visualWeight === 'subtle') {
    return `${motionClassName} rounded-[24px] opacity-72 saturate-[0.82]`;
  }
  return profile.transitionContinuity === 'settle'
    ? `${motionClassName} rounded-[24px] opacity-75 saturate-[0.84]`
    : `${motionClassName} rounded-[24px] opacity-82 saturate-[0.9]`;
}
