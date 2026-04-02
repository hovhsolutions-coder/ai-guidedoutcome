'use client';

import { useEffect, useState } from 'react';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import { mapOnboardingShellCopy } from '@/src/lib/guidance-session/map-onboarding-shell-copy';
import {
  buildGuidanceCopyProfile,
  getGuidanceCtaPromise,
  getGuidanceDomainLexicon,
} from '@/src/components/guidance/guidance-copy-personalization';
import {
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';
import {
  GUIDANCE_DISABLED_INTERACTION_CLASS_NAME,
  GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME,
  joinAriaDescribedBy,
} from '@/src/components/guidance/guidance-semantic-feedback';
import {
  canRenderGuidanceFollowUpInput,
  canRenderGuidanceOnboardingShell,
  canRenderGuidanceTrainerRecommendation,
  canRenderGuidanceExecutionBridge,
  canRenderGuidancePhaseProgression,
  getGuidanceSessionFollowUpQuestion,
  getGuidanceSessionOnboardingState,
  getGuidanceSessionPhase,
  getGuidanceSessionProgressionSnapshot,
  getGuidanceSessionTrainerRecommendation,
  getGuidanceSessionExecutionReadiness,
  getGuidanceDecisionAuthority,
  isGuidanceDecisionDegraded,
} from '@/src/lib/guidance-session/guidance-decision-envelope';
export { buildFollowUpGuidanceContext } from '@/src/components/guidance/build-follow-up-guidance-context';

interface GuidanceOnboardingShellProps {
  guidanceSession: GuidanceSession | null;
  zoneProfile: GuidanceZoneProfile;
  isSubmittingFollowUp?: boolean;
  onSubmitFollowUp?: (answer: string) => void | Promise<void>;
  progressMessageId?: string;
}

interface OnboardingShellViewModel {
  state: NonNullable<GuidanceSession['onboardingState']>;
  phase: NonNullable<GuidanceSession['phase']>;
  title: string;
  introText: string;
  guidanceStyle: string;
  firstFocus: string;
  recommendedStartingSkills: string[];
  hasFollowUpHistory: boolean;
  progressionSnapshot: NonNullable<GuidanceSession['progressionSnapshot']>;
  followUpQuestion?: {
    intent: string;
    question: string;
  };
  nextStep?: string;
  // Envelope-first authority state
  authority: ReturnType<typeof getGuidanceDecisionAuthority>;
  isDegraded: boolean;
  trainerRecommendation?: GuidanceSession['trainerRecommendation'];
}

export function GuidanceOnboardingShell({
  guidanceSession,
  zoneProfile,
  isSubmittingFollowUp = false,
  onSubmitFollowUp,
  progressMessageId,
}: GuidanceOnboardingShellProps) {
  const density = zoneProfile.contentDensity ?? 'guided';
  const intent = zoneProfile.microcopyIntent ?? 'orient';
  const outcome = zoneProfile.sectionOutcome ?? 'clarify';
  const rhythm = zoneProfile.surfaceRhythm ?? 'steady';
  const continuity = zoneProfile.transitionContinuity ?? 'advance';
  const weight = zoneProfile.visualWeight ?? 'strong';
  const viewModel = buildGuidanceOnboardingViewModel(guidanceSession);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  if (!viewModel) {
    return null;
  }

  const showsIntro = viewModel.state !== 'direct_next_step';
  const showsFollowUp = viewModel.state === 'intro_plus_followup';
  const showsNextStep = viewModel.state === 'intro_plus_next_step' || viewModel.state === 'direct_next_step';
  const isMinimal = density === 'minimal';
  const isExpanded = density === 'expanded';
  const copy = mapOnboardingShellCopy({
    phase: viewModel.phase,
    hasFollowUpHistory: viewModel.hasFollowUpHistory,
    showsFollowUp,
  });
  const copyProfile = buildGuidanceCopyProfile({
    rawInput: guidanceSession?.initialInput,
    detectedDomain: guidanceSession?.detectedDomain,
    activeMode: guidanceSession?.activeMode,
    intakeAnswers: guidanceSession?.intakeAnswers,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  const followUpQuestion = viewModel.followUpQuestion;
  const followUpIntent = followUpQuestion?.intent;
  const phaseReflection = viewModel.phase === 'clarifying'
    ? `You are not starting over. You are narrowing the one detail that will help ${lexicon.refinedTarget}, based on what is already clear.`
    : viewModel.phase === 'refined_direction'
      ? `What changed${copyProfile.hasPriorAnswers ? ' from what you already clarified' : ''}: the ${lexicon.resultFocus} is tighter now, so the ${lexicon.nextMove} can be more confident. That is based on what the page already confirmed.`
      : `What changed${copyProfile.hasPriorAnswers ? ' from the refinements already on the page' : ''}: the route is now clear enough to ${lexicon.executionBridge} without reopening the same uncertainty.`;
  const introFraming = intent === 'confirm'
    ? 'The direction is holding together. That read is already grounded enough to keep the thread coherent without pushing you into a heavier move too early.'
    : copy.introFraming;
  const nextSectionDescription = intent === 'confirm'
    ? `The current direction is still valid. This next piece only tightens it around what is already clear and shows what became clearer about how to ${lexicon.refinedTarget}.`
    : intent === 'deepen'
      ? `This section adds more depth to the same direction without changing the underlying thread, so the progress you already made stays intact while it ${getGuidanceCtaPromise(copyProfile)}.`
      : copy.nextSectionDescription;
  const followUpHelper = intent === 'confirm'
    ? `We will fold this in and ${lexicon.refinedTarget} without losing the work already done. The next pass will build on what is already clear.`
    : `We will carry this answer into the next pass, show what became clearer about ${lexicon.readout}, and keep the same guidance context intact.`;
  const prioritizeClarifyBlock = outcome === 'clarify' && showsFollowUp;
  const headerPadding = rhythm === 'spacious'
    ? 'px-6 py-6 sm:px-7 sm:py-7'
    : rhythm === 'compact'
      ? 'px-4 py-4 sm:px-5 sm:py-5'
      : 'px-5 py-5 sm:px-6 sm:py-6';
  const bodySpacing = rhythm === 'spacious'
    ? 'space-y-6 p-6 sm:p-7'
    : rhythm === 'compact'
      ? 'space-y-4 p-4 sm:p-5'
      : 'space-y-5 p-5 sm:p-6';
  const continuityClass = continuity === 'persist'
    ? 'ring-1 ring-[rgba(109,156,255,0.08)]'
    : continuity === 'settle'
      ? 'opacity-92 ring-1 ring-[rgba(255,255,255,0.04)]'
      : 'shadow-[0_14px_30px_rgba(5,12,22,0.16)]';
  const titleClass = weight === 'strong'
    ? 'text-[1.8rem] font-semibold tracking-[-0.05em] sm:text-[1.95rem]'
    : weight === 'subtle'
      ? 'text-[1.45rem] font-semibold tracking-[-0.035em] sm:text-[1.6rem]'
      : 'text-[1.65rem] font-semibold tracking-[-0.045em] sm:text-[1.85rem]';
  const followUpHelperId = 'guidance-follow-up-helper';
  const followUpErrorId = 'guidance-follow-up-error';
  const followUpTextareaId = 'guidance-follow-up-answer';

  useEffect(() => {
    setFollowUpAnswer('');
    setFollowUpError(null);
  }, [followUpIntent]);

  async function handleFollowUpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onSubmitFollowUp || !followUpQuestion) {
      return;
    }

    const sanitizedAnswer = followUpAnswer.trim();
    if (!sanitizedAnswer) {
      setFollowUpError('Add a short answer first so we can continue the guidance read cleanly.');
      return;
    }

    setFollowUpError(null);
    await onSubmitFollowUp(sanitizedAnswer);
  }

  return (
    <div className={`ui-surface-primary overflow-hidden border-[rgba(109,156,255,0.15)] bg-[linear-gradient(180deg,rgba(109,156,255,0.075),rgba(255,255,255,0.02)_28%,transparent_100%)] ${continuityClass}`.trim()}>
      <div className={`border-b border-[var(--border-subtle)] ${headerPadding}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {copy.headerEyebrow}
            </p>
            <div className="space-y-2">
              <h2 className={`${titleClass} text-[var(--text-primary)]`}>
                {showsIntro ? viewModel.title : 'Ready to move'}
              </h2>
              {!isMinimal ? (
                <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                  {introFraming}
                </p>
              ) : null}
              {!isMinimal ? (
                <p className="max-w-xl text-xs leading-6 text-[var(--accent-primary-strong)]">
                  {phaseReflection}
                </p>
              ) : null}
            </div>
          </div>
          <div className="ui-surface-secondary self-start px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Current phase
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {viewModel.progressionSnapshot.phaseLabel}
            </p>
            {!isMinimal ? (
              <p className="mt-1 max-w-[220px] text-xs leading-5 text-[var(--text-secondary)]">
                {viewModel.progressionSnapshot.phaseSummary}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={bodySpacing}>
        {prioritizeClarifyBlock && showsFollowUp && followUpQuestion ? (
          <div className="ui-surface-accent space-y-3 border-[rgba(109,156,255,0.2)] px-5 py-5 shadow-[0_10px_24px_rgba(17,41,84,0.12)] sm:px-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                {copy.nextSectionLabel}
              </p>
              {!isMinimal ? (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {nextSectionDescription}
                </p>
              ) : null}
            </div>
            <p className="text-[15px] leading-7 text-[var(--text-primary)]">{followUpQuestion.question}</p>
            {onSubmitFollowUp ? (
              <form className="space-y-3 pt-2" onSubmit={handleFollowUpSubmit} aria-busy={isSubmittingFollowUp || undefined}>
                <label className="block space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Your answer
                  </span>
                  <textarea
                    id={followUpTextareaId}
                    value={followUpAnswer}
                    onChange={(event) => setFollowUpAnswer(event.target.value)}
                    placeholder="Add the missing detail that should shape the next guidance pass."
                    disabled={isSubmittingFollowUp}
                    aria-invalid={followUpError ? true : undefined}
                    aria-describedby={joinAriaDescribedBy(
                      progressMessageId,
                      !isMinimal ? followUpHelperId : null,
                      followUpError ? followUpErrorId : null
                    )}
                    className={`ui-textarea min-h-[112px] text-[15px] leading-7 ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`.trim()}
                  />
                </label>
                {followUpError ? (
                  <p id={followUpErrorId} className="text-sm leading-6 text-[var(--warning-strong,#f2ca73)]">{followUpError}</p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={isSubmittingFollowUp}
                    aria-disabled={isSubmittingFollowUp}
                    aria-describedby={joinAriaDescribedBy(progressMessageId, !isMinimal ? followUpHelperId : null)}
                    className={`ui-button-primary min-w-[220px] motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`.trim()}
                  >
                    {isSubmittingFollowUp ? 'Continuing guidance...' : 'Continue guidance'}
                  </button>
                  {!isMinimal ? (
                    <p id={followUpHelperId} className="text-sm leading-6 text-[var(--text-secondary)]">
                      {followUpHelper}
                    </p>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {showsIntro ? (
          <div className="rounded-[24px] border border-[rgba(109,156,255,0.16)] bg-[linear-gradient(180deg,rgba(109,156,255,0.09),rgba(255,255,255,0.02)_55%)] p-[1px]">
            <div className="ui-surface-secondary space-y-5 rounded-[23px] border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.026)] px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.8fr)] lg:items-start">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                    {copy.introSectionLabel}
                  </p>
                  <p className="text-[15px] leading-7 text-[var(--text-primary)]">{viewModel.introText}</p>
                </div>
                {!isMinimal ? (
                  <div className="ui-metadata-block space-y-2 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                      Guidance style
                    </p>
                    <p className="text-sm leading-6 text-[var(--text-primary)]">{viewModel.guidanceStyle}</p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.92fr)]">
                <div className="ui-metadata-block px-4 py-4">
                  <p className="text-sm font-medium text-[var(--text-primary)]">First focus</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{viewModel.firstFocus}</p>
                </div>
                {isExpanded ? (
                  <div className="ui-metadata-block px-4 py-4">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Recommended starting skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {viewModel.recommendedStartingSkills.map((skill) => (
                        <span key={skill} className="ui-chip">
                          {formatSkillLabel(skill)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {!prioritizeClarifyBlock && showsFollowUp && followUpQuestion ? (
          <div className="ui-surface-accent space-y-3 border-[rgba(109,156,255,0.2)] px-5 py-5 shadow-[0_10px_24px_rgba(17,41,84,0.12)] sm:px-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                {copy.nextSectionLabel}
              </p>
              {!isMinimal ? (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {nextSectionDescription}
                </p>
              ) : null}
            </div>
            <p className="text-[15px] leading-7 text-[var(--text-primary)]">{followUpQuestion.question}</p>
            {onSubmitFollowUp ? (
              <form className="space-y-3 pt-2" onSubmit={handleFollowUpSubmit} aria-busy={isSubmittingFollowUp || undefined}>
                <label className="block space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Your answer
                  </span>
                  <textarea
                    id={followUpTextareaId}
                    value={followUpAnswer}
                    onChange={(event) => setFollowUpAnswer(event.target.value)}
                    placeholder="Add the missing detail that should shape the next guidance pass."
                    disabled={isSubmittingFollowUp}
                    aria-invalid={followUpError ? true : undefined}
                    aria-describedby={joinAriaDescribedBy(
                      progressMessageId,
                      !isMinimal ? followUpHelperId : null,
                      followUpError ? followUpErrorId : null
                    )}
                    className={`ui-textarea min-h-[112px] text-[15px] leading-7 ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`.trim()}
                  />
                </label>
                {followUpError ? (
                  <p id={followUpErrorId} className="text-sm leading-6 text-[var(--warning-strong,#f2ca73)]">{followUpError}</p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={isSubmittingFollowUp}
                    aria-disabled={isSubmittingFollowUp}
                    aria-describedby={joinAriaDescribedBy(progressMessageId, !isMinimal ? followUpHelperId : null)}
                    className={`ui-button-primary min-w-[220px] motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`.trim()}
                  >
                    {isSubmittingFollowUp ? 'Continuing guidance...' : 'Continue guidance'}
                  </button>
                  {!isMinimal ? (
                    <p id={followUpHelperId} className="text-sm leading-6 text-[var(--text-secondary)]">
                      {followUpHelper}
                    </p>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {showsNextStep && viewModel.nextStep ? (
          <div className="ui-surface-accent space-y-3 border-[rgba(109,156,255,0.2)] px-5 py-5 shadow-[0_10px_24px_rgba(17,41,84,0.12)] sm:px-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                {copy.nextSectionLabel}
              </p>
              {!isMinimal ? (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {nextSectionDescription}
                </p>
              ) : null}
            </div>
            <p className="text-[1.05rem] font-semibold leading-8 tracking-[-0.03em] text-[var(--text-primary)]">
              {viewModel.nextStep}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function buildGuidanceOnboardingViewModel(
  guidanceSession: GuidanceSession | null
): OnboardingShellViewModel | null {
  // Envelope-first trust gating: check decision authority before any field access
  const authority = getGuidanceDecisionAuthority(guidanceSession);
  const isDegraded = isGuidanceDecisionDegraded(guidanceSession);
  
  // Safe UI capabilities check: respect explicit capability gating
  if (!canRenderGuidanceOnboardingShell(guidanceSession)) {
    return null;
  }

  // Envelope-first field access: use decision envelope when available
  const onboardingState = getGuidanceSessionOnboardingState(guidanceSession);
  const phase = getGuidanceSessionPhase(guidanceSession);
  const progressionSnapshot = getGuidanceSessionProgressionSnapshot(guidanceSession);
  const followUpQuestion = canRenderGuidanceFollowUpInput(guidanceSession)
    ? getGuidanceSessionFollowUpQuestion(guidanceSession)
    : undefined;

  if (!onboardingState || !phase || !progressionSnapshot) {
    return null;
  }

  // Authority-aware rendering: degrade gracefully when trust is reduced
  const shouldLimitCapabilities = isDegraded;
  const trainerRecommendation = shouldLimitCapabilities 
    ? undefined 
    : (canRenderGuidanceTrainerRecommendation(guidanceSession) 
        ? getGuidanceSessionTrainerRecommendation(guidanceSession) 
        : undefined);

  return {
    state: onboardingState,
    phase,
    title: guidanceSession?.characterProfile?.intro?.title ?? '',
    introText: guidanceSession?.characterProfile?.intro?.introText ?? '',
    guidanceStyle: guidanceSession?.characterProfile?.intro?.guidanceStyle ?? '',
    firstFocus: guidanceSession?.characterProfile?.intro?.firstFocus ?? '',
    recommendedStartingSkills: guidanceSession?.characterProfile?.intro?.recommendedStartingSkills ?? [],
    hasFollowUpHistory: Object.keys(guidanceSession?.intakeAnswers ?? {}).some((key) => key.startsWith('follow_up_')),
    progressionSnapshot,
    followUpQuestion,
    nextStep: guidanceSession?.result?.nextStep,
    // Expose authority state for UI decisions
    authority,
    isDegraded,
    trainerRecommendation,
  };
}

function formatSkillLabel(skill: string) {
  return skill.replace(/_/g, ' ');
}
