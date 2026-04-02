'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import {
  buildGuidanceCopyProfile,
  getGuidanceCtaPromise,
  getGuidanceDomainLexicon,
} from '@/src/components/guidance/guidance-copy-personalization';
import { submitGuidanceSessionDossierConversion } from '@/src/components/guidance/submit-guidance-session-dossier-conversion';
import {
  type GuidanceContentDensity,
  type GuidanceMicrocopyIntent,
} from '@/src/components/guidance/guidance-presentation-contracts';
import {
  GUIDANCE_DISABLED_INTERACTION_CLASS_NAME,
  GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME,
  joinAriaDescribedBy,
} from '@/src/components/guidance/guidance-semantic-feedback';
import { type GuidanceRouteOutcome, type GuidanceRouteOutcomeType, type GuidanceSession } from '@/src/lib/guidance-session/types';
import { type AITrainerId } from '@/src/lib/ai/types';
import {
  getGuidanceSessionRouteOutcome,
  getGuidanceSessionTrainerRecommendation,
} from '@/src/lib/guidance-session/guidance-decision-envelope';
import {
  getEnvelopeFirstTrustState,
  getEnvelopeFirstCapabilityGates,
  getSafeTrainerRecommendation,
} from '@/src/lib/guidance-session/envelope-first-trust-gating';

interface GuidanceNextPathPanelProps {
  guidanceSession: GuidanceSession | null;
  activeTrainer: AITrainerId | null;
  trainerLoading: AITrainerId | null;
  density?: GuidanceContentDensity | null;
  intent?: GuidanceMicrocopyIntent | null;
  progressMessageId?: string;
  onSelectTrainer: (trainer: AITrainerId) => void;
  onSuccessfulDossierConversion?: () => void;
}

type RouteDescriptor = {
  type: GuidanceRouteOutcomeType;
  label: string;
  eyebrow: string;
  summary: string;
  whenToChoose: string;
  support?: string;
  actionLabel?: string;
};

export function GuidanceNextPathPanel({
  guidanceSession,
  activeTrainer,
  trainerLoading,
  density = 'guided',
  intent = 'deepen',
  progressMessageId,
  onSelectTrainer,
  onSuccessfulDossierConversion,
}: GuidanceNextPathPanelProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);

  const routeOutcome = getGuidanceSessionRouteOutcome(guidanceSession);
  
  // Envelope-first trust gating: use centralized trust gating
  const trustState = getEnvelopeFirstTrustState(guidanceSession);
  const capabilityGates = getEnvelopeFirstCapabilityGates(guidanceSession);
  const safeTrainerRecommendation = getSafeTrainerRecommendation(guidanceSession);
  
  const secondaryTrainerOptions = safeTrainerRecommendation?.orderedTrainers.slice(1, 3) ?? [];
  const routeDescriptors = useMemo(() => {
    if (!guidanceSession || !routeOutcome) {
      return [];
    }

    return buildRouteDescriptors(guidanceSession);
  }, [guidanceSession, routeOutcome]);

  const primaryRoute = routeDescriptors.find((route) => route.type === routeOutcome?.type) ?? null;
  const secondaryRoutes = routeDescriptors.filter((route) => route.type !== routeOutcome?.type);
  const isMinimal = density === 'minimal';
  const isExpanded = density === 'expanded';

  // Envelope-first trust gating: do not render if no valid authority
  if (!guidanceSession) {
    return null;
  }

  const copyProfile = buildGuidanceCopyProfile({
    rawInput: guidanceSession?.initialInput,
    detectedDomain: guidanceSession?.detectedDomain,
    activeMode: guidanceSession?.activeMode,
    intakeAnswers: guidanceSession?.intakeAnswers,
  });

  const lexicon = getGuidanceDomainLexicon(copyProfile);

  const headerDescription = intent === 'confirm'
    ? `The current route is already stable enough to keep moving without adding pressure, so the next action can stay simple and confident around the ${lexicon.nextMove}. It is based on what the session already resolved.`
    : `The system has already resolved the strongest next route from the current session${copyProfile.hasPriorAnswers ? ' using what you already clarified' : ''}, so the next action should feel like a natural continuation instead of another fork in the ${copyProfile.domainFamily === 'structure' ? 'plan' : copyProfile.domainFamily === 'clarity' ? 'position' : 'direction'}.`;
  const howToContinueCopy = intent === 'deepen'
    ? primaryRoute?.support ?? `This route adds more structure to the same direction without changing the underlying session logic, so you ${getGuidanceCtaPromise(copyProfile)}. It stays grounded in the same clarified thread.`
    : primaryRoute?.support ?? `This route stays aligned with the current guidance state and keeps building from the same context around ${lexicon.readout}.`;
  const trainerIntro = intent === 'deepen'
    ? `Start with ${safeTrainerRecommendation?.topTrainer} trainer if you want to ${lexicon.trainerGain} before you move.`
    : `The ${safeTrainerRecommendation?.topTrainer} trainer is available if you want one more focused specialist angle on top of current read.`;
  const trainerSupport = intent === 'deepen'
    ? `This specialist layer helps ${lexicon.trainerGain}. It does not replace the main guidance thread you already clarified, and it is based on that same read.`
    : `This is optional. The main guidance read stays primary, and the trainer layer only adds a focused specialist angle on top of the current ${copyProfile.domainFamily === 'structure' ? 'plan' : copyProfile.domainFamily === 'clarity' ? 'position' : 'direction'}.`;
  const primaryRouteSupportId = 'guidance-next-path-primary-route-support';
  const trainerSupportId = 'guidance-next-path-trainer-support';

  async function handleConvertToDossier() {
    const session = guidanceSession;

    if (!session || !session.result) {
      return;
    }

    setIsConverting(true);
    setConversionError(null);
    setConversionStatus(`Creating a dossier from this guidance read: "${session.result.nextStep}"`);

    try {
      const data = await submitGuidanceSessionDossierConversion(session);
      onSuccessfulDossierConversion?.();
      setConversionStatus(`Dossier created from "${session.result.nextStep}". Opening the workspace now.`);
      router.push(`/dossiers/${data.id}`);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'The dossier could not be created.');
      setConversionStatus(null);
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="ui-surface-primary overflow-hidden border-[rgba(109,156,255,0.14)] shadow-[0_10px_24px_rgba(5,12,22,0.1)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Next path
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {guidanceSession?.result?.suggestedTasks?.length === 0 ? 'Recommended first' : 'Recommended continuation'}
          </h2>
          {!isMinimal ? (
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              {headerDescription}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div
          aria-current="step"
          className="ui-surface-accent space-y-4 border-[rgba(109,156,255,0.24)] px-5 py-5 shadow-[0_12px_24px_rgba(17,41,84,0.14)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                {primaryRoute?.eyebrow}
              </p>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                {primaryRoute?.label}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ui-chip ui-chip-accent">Primary route</span>
              <span className="ui-chip">{formatConfidenceLabel(routeOutcome?.confidenceLabel ?? 'guarded')} confidence</span>
            </div>
          </div>

          <p className="text-sm leading-7 text-[var(--text-primary)]">{routeOutcome?.reason}</p>
          {!isMinimal ? (
            <p className="text-xs leading-5 text-[var(--text-secondary)]">{routeOutcome?.rationaleSummary}</p>
          ) : null}

          <div className={`grid gap-3 ${isMinimal ? '' : 'lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]'}`}>
            <div className="ui-metadata-block px-4 py-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">Why this path</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{primaryRoute?.summary}</p>
            </div>
            {!isMinimal ? (
              <div className="ui-metadata-block px-4 py-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">How to continue</p>
                <p id={primaryRouteSupportId} className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                  {howToContinueCopy}
                </p>
              </div>
            ) : null}
          </div>

          {primaryRoute?.type === 'convert_to_dossier' && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConvertToDossier}
                disabled={isConverting}
                aria-disabled={isConverting}
                aria-describedby={joinAriaDescribedBy(progressMessageId, !isMinimal ? primaryRouteSupportId : null)}
                className={`ui-button-primary min-w-[220px] self-start motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-[360ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`.trim()}
              >
                {isConverting ? 'Creating dossier...' : primaryRoute?.actionLabel ?? 'Convert to dossier'}
              </button>

              {conversionStatus && !conversionError && !isConverting && (
                <div className="rounded-[16px] border border-[rgba(114,213,154,0.16)] bg-[var(--success-soft)] px-4 py-3">
                  <p className="text-sm leading-6 text-[var(--success-strong)]">{conversionStatus}</p>
                </div>
              )}

              {conversionError && (
                <div className="rounded-[16px] border border-[rgba(242,202,115,0.16)] bg-[var(--warning-soft)] px-4 py-3">
                  <p className="text-sm leading-6 text-[var(--text-primary)]">{conversionError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {safeTrainerRecommendation ? (
          <div className="ui-metadata-block space-y-3 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Specialist continuation
            </p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {trainerIntro}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-chip">{formatConfidenceLabel(safeTrainerRecommendation.confidenceLabel)} confidence</span>
              {!isMinimal ? (
                <p className="text-xs leading-5 text-[var(--text-secondary)]">{safeTrainerRecommendation.rationaleSummary}</p>
              ) : null}
            </div>
            {!isMinimal ? (
              <p id={trainerSupportId} className="text-xs leading-5 text-[var(--text-secondary)]">
                {trainerSupport}
              </p>
            ) : null}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSelectTrainer(safeTrainerRecommendation.topTrainer)}
                disabled={trainerLoading !== null}
                aria-disabled={trainerLoading !== null}
                aria-describedby={joinAriaDescribedBy(progressMessageId, !isMinimal ? trainerSupportId : null)}
                className={`ui-button-secondary min-w-[220px] motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-[360ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`.trim()}
              >
                {trainerLoading === safeTrainerRecommendation.topTrainer
                  ? `${formatTrainerLabel(safeTrainerRecommendation.topTrainer)} trainer selected`
                  : activeTrainer === safeTrainerRecommendation.topTrainer
                    ? `Refresh ${safeTrainerRecommendation.topTrainer} trainer read`
                    : `Ask ${safeTrainerRecommendation.topTrainer} trainer for extra sharpness`}
              </button>
            </div>
            {secondaryTrainerOptions.length > 0 && isExpanded ? (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Other specialist angles
                </p>
                <div className="flex flex-wrap gap-2">
                  {secondaryTrainerOptions.map((trainer) => (
                    <button
                      key={trainer}
                      type="button"
                      onClick={() => onSelectTrainer(trainer)}
                      disabled={trainerLoading !== null}
                      aria-disabled={trainerLoading !== null}
                      aria-describedby={joinAriaDescribedBy(progressMessageId, !isMinimal ? trainerSupportId : null)}
                      className={`ui-button-secondary min-h-0 px-3 py-2 text-[11px] uppercase tracking-[0.12em] motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-[360ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`.trim()}
                    >
                      {trainerLoading === trainer
                        ? `${formatTrainerLabel(trainer)} selected`
                        : `Ask ${formatTrainerLabel(trainer)}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {density === 'expanded' ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Other ways to continue
              </p>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                You can still choose a different continuation if your intent has shifted. These options stay grounded in
                the same session state.
              </p>
            </div>

            <div className="grid gap-3">
              {secondaryRoutes.map((route) => (
                <div
                  key={route.type}
                  className={cn(
                    'ui-metadata-block flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between',
                    route.type === 'convert_to_dossier' ? 'border-[rgba(109,156,255,0.14)] bg-[rgba(109,156,255,0.04)]' : ''
                  )}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{route.label}</p>
                    <p className="text-xs leading-5 text-[var(--text-secondary)]">{route.summary}</p>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">Choose this if {route.whenToChoose}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildRouteDescriptors(session: GuidanceSession): RouteDescriptor[] {
  const modeConfig = getGuidanceModeConfig(session.activeMode);
  
  // Envelope-first trust gating: use centralized trust state
  const trustState = getEnvelopeFirstTrustState(session);
  const capabilityGates = getEnvelopeFirstCapabilityGates(session);
  
  // Envelope-first field access: use decision envelope when available
  const trainerRecommendation = getGuidanceSessionTrainerRecommendation(session);
  const routeOutcome = getGuidanceSessionRouteOutcome(session);
  const primaryTrainer = trainerRecommendation?.topTrainer ?? modeConfig.trainerPriority[0];
  
  // Safe UI capabilities: respect explicit capability gating
  const includesTrainerRoute =
    capabilityGates.canShowTrainerRecommendation
    || routeOutcome?.type === 'continue_with_trainer';
    
  // Authority-aware route filtering: limit options when trust is degraded
  const safeIncludeTrainerRoute = trustState.isDegraded ? false : includesTrainerRoute;

  const baseRoutes: RouteDescriptor[] = [
    {
      type: 'stay_in_guidance',
      label: 'Stay in guidance',
      eyebrow: 'Refine inside the current loop',
      summary:
        'Use another guidance pass when the main need is still judgment, framing, or reducing uncertainty before formal execution.',
      whenToChoose: 'you want one more clean read before committing this work to a longer track',
      support: 'This keeps the current session lightweight and lets you pressure-test the direction again from the same context.',
    },
    {
      type: 'convert_to_dossier',
      label: 'Convert to dossier',
      eyebrow: 'Move into tracked execution',
      summary:
        'Use this when the work is ready for stored context, a working phase, and a task queue that persists beyond the current read.',
      whenToChoose: 'the direction already feels stable enough to manage as real ongoing work',
      support:
        'This uses the existing guidance session as the source for dossier creation and preserves the mission-control execution workspace.',
      actionLabel: 'Convert to dossier',
    },
    {
      type: 'continue_in_mode',
      label: `Continue this session in ${modeConfig.label} mode`,
      eyebrow: 'Keep the current framing',
      summary:
        'Use this when the resolved mode already fits the situation and you want the next continuation to stay inside that same framing.',
      whenToChoose: `the current ${modeConfig.label} framing still feels right and you want another pass without changing the session logic`,
      support: `The session is already resolved into ${modeConfig.label} mode, so this continuation simply carries forward the same domain and mode context.`,
    },
  ];

  if (safeIncludeTrainerRoute) {
    baseRoutes.splice(2, 0, {
      type: 'continue_with_trainer',
      label: `Ask ${primaryTrainer} trainer next`,
      eyebrow: 'Add a guided specialist pass',
      summary:
        'Use this when current read is usable, but you want next continuation to lean on a sharper specialist angle from this same session.',
      whenToChoose: 'a trainer perspective would improve next move before you formalize or expand work',
      support: `The current mode prioritizes ${primaryTrainer} trainer first, so this stays aligned with session you already generated without implying a separate deep workflow yet.`,
    });
  }

  return baseRoutes;
}

function formatTrainerLabel(trainer: AITrainerId): string {
  return trainer.replace(/_/g, ' ');
}

function formatConfidenceLabel(confidenceLabel: GuidanceRouteOutcome['confidenceLabel']) {
  return confidenceLabel.charAt(0).toUpperCase() + confidenceLabel.slice(1);
}
