'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  buildGuidanceCopyProfile,
  getGuidanceCtaPromise,
  getGuidanceDomainLexicon,
} from '@/src/components/guidance/guidance-copy-personalization';
import { submitGuidanceSessionDossierConversion } from '@/src/components/guidance/submit-guidance-session-dossier-conversion';
import { type GuidanceMicrocopyIntent } from '@/src/components/guidance/guidance-presentation-contracts';
import {
  GUIDANCE_DISABLED_INTERACTION_CLASS_NAME,
  GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME,
  joinAriaDescribedBy,
} from '@/src/components/guidance/guidance-semantic-feedback';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';

interface GuidanceExecutionTransitionProps {
  guidanceSession: GuidanceSession | null;
  intent?: GuidanceMicrocopyIntent | null;
  onConversionStateChange?: (isConverting: boolean) => void;
  onSuccessfulDossierConversion?: () => void;
  progressMessageId?: string;
  transition: {
    title: string;
    continueLabel: string;
    continueSummary: string;
    dossierLabel: string;
    dossierSummary: string;
    nextStep: string;
    supportingTaskCount: number;
  } | null;
}

interface GuidanceExecutionTransitionCardProps {
  transition: NonNullable<GuidanceExecutionTransitionProps['transition']>;
  intent?: GuidanceMicrocopyIntent | null;
  copyProfile?: ReturnType<typeof buildGuidanceCopyProfile>;
  isConverting: boolean;
  conversionError: string | null;
  conversionStatus: string | null;
  progressMessageId?: string;
  supportDescriptionId?: string;
  onConvertToDossier: () => void;
}

export function GuidanceExecutionTransitionCard({
  transition,
  intent = 'activate',
  copyProfile = buildGuidanceCopyProfile({}),
  isConverting,
  conversionError,
  conversionStatus,
  progressMessageId,
  supportDescriptionId,
  onConvertToDossier,
}: GuidanceExecutionTransitionCardProps) {
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  const headerDescription = intent === 'activate'
    ? `The ${copyProfile.domainFamily === 'structure' ? 'plan' : 'direction'} is clear enough now to act on. It is based on the route already confirmed here, so you can keep moving from this same guidance state or carry it into a dossier when you want a persistent execution workspace.`
    : 'The current direction can keep moving from here without adding a new decision layer.';
  const supportCopy = transition.supportingTaskCount > 0
    ? `This will carry the current next step and ${transition.supportingTaskCount} supporting task${transition.supportingTaskCount === 1 ? '' : 's'} into the dossier workspace, based on the same clarified thread, so the ${copyProfile.domainFamily === 'structure' ? 'plan' : copyProfile.domainFamily === 'clarity' ? 'position' : 'direction'} you shaped here can keep moving.`
    : `This will carry the current guidance state into the dossier workspace without changing the underlying path you already used to ${lexicon.refinedTarget}.`;

  return (
    <div className="ui-surface-primary overflow-hidden border-[rgba(109,156,255,0.16)] bg-[linear-gradient(180deg,rgba(109,156,255,0.065),rgba(255,255,255,0.02)_38%,transparent_100%)] shadow-[0_12px_24px_rgba(5,12,22,0.12)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
            {transition.title}
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Your plan is ready to move into mission control.
          </h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {headerDescription}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-2">
        <div className="ui-metadata-block space-y-3 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{transition.continueLabel}</p>
              <p className="text-xs leading-5 text-[var(--text-secondary)]">{transition.continueSummary}</p>
            </div>
            <span className="ui-chip">Active now</span>
          </div>
          <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Current focus
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{transition.nextStep}</p>
          </div>
        </div>

        <div className="ui-surface-accent space-y-3 border-[rgba(109,156,255,0.22)] px-5 py-5 shadow-[0_10px_22px_rgba(17,41,84,0.12)]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">{transition.dossierLabel}</p>
            <p className="text-xs leading-5 text-[var(--text-secondary)]">{transition.dossierSummary}</p>
          </div>

          <button
            type="button"
            onClick={onConvertToDossier}
            disabled={isConverting}
            aria-disabled={isConverting}
            aria-describedby={joinAriaDescribedBy(progressMessageId, supportDescriptionId)}
            className={`ui-button-primary min-w-[220px] motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-[360ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`.trim()}
          >
            {isConverting ? 'Creating dossier...' : 'Convert to dossier'}
          </button>

          {conversionStatus && !conversionError && !isConverting ? (
            <div className="rounded-[16px] border border-[rgba(114,213,154,0.16)] bg-[var(--success-soft)] px-4 py-3">
              <p className="text-sm leading-6 text-[var(--success-strong)]">{conversionStatus}</p>
            </div>
          ) : null}

          {conversionError ? (
            <div className="rounded-[16px] border border-[rgba(242,202,115,0.16)] bg-[var(--warning-soft)] px-4 py-3">
              <p className="text-sm leading-6 text-[var(--text-primary)]">{conversionError}</p>
            </div>
          ) : null}

          <p id={supportDescriptionId} className="text-[11px] leading-5 text-[var(--text-muted)]">
            {supportCopy} {`This keeps the same thread alive so you can ${getGuidanceCtaPromise(copyProfile)}.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function buildGuidanceExecutionTransitionDisplayState(
  transition: GuidanceExecutionTransitionCardProps['transition']
) {
  return {
    transition,
    isConverting: false,
    conversionError: null,
    conversionStatus: null,
  };
}

export function GuidanceExecutionTransition({
  guidanceSession,
  intent = 'activate',
  onConversionStateChange,
  onSuccessfulDossierConversion,
  progressMessageId,
  transition,
}: GuidanceExecutionTransitionProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);

  if (!guidanceSession?.result || !transition) {
    return null;
  }

  const session = guidanceSession;
  const result = session.result!;
  const executionSupportId = 'guidance-execution-transition-support';
  const copyProfile = buildGuidanceCopyProfile({
    rawInput: session.initialInput,
    detectedDomain: session.detectedDomain,
    activeMode: session.activeMode,
    intakeAnswers: session.intakeAnswers,
  });

  async function handleConvertToDossier() {
    onConversionStateChange?.(true);
    setIsConverting(true);
    setConversionError(null);
    setConversionStatus(`Creating a dossier from this guidance read: "${result.nextStep}"`);

    try {
      const data = await submitGuidanceSessionDossierConversion(session);
      onSuccessfulDossierConversion?.();
      setConversionStatus(`Dossier created from "${result.nextStep}". Opening the workspace now.`);
      router.push(`/dossiers/${data.id}`);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'The dossier could not be created.');
      setConversionStatus(null);
    } finally {
      setIsConverting(false);
      onConversionStateChange?.(false);
    }
  }

  return (
    <GuidanceExecutionTransitionCard
      transition={transition}
      intent={intent}
      copyProfile={copyProfile}
      isConverting={isConverting}
      conversionError={conversionError}
      conversionStatus={conversionStatus}
      progressMessageId={progressMessageId}
      supportDescriptionId={executionSupportId}
      onConvertToDossier={handleConvertToDossier}
    />
  );
}
