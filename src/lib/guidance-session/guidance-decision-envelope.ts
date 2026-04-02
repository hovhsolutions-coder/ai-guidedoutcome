import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import {
  type GuidanceContinuation,
  type GuidanceExecutionReadiness,
  type GuidanceIntentProfile,
  type GuidanceSafeUiCapabilities,
  type GuidanceSession,
  type GuidanceSessionPhase,
  type GuidanceDecisionAuthority,
  type GuidanceDecisionDegradedReason,
  type GuidanceDecisionEnvelope,
  type GuidanceNarrativeContract,
  type GuidanceSystemPlanContract,
  type GuidanceExecutionPlanContract,
  type GuidanceOnboardingState,
  type GuidanceProgressionSnapshot,
  type GuidanceRouteOutcome,
} from '@/src/lib/guidance-session/types';
import { type TrainerRecommendation } from '@/src/lib/recommendations/types';

interface BuildGuidanceIntentProfileInput {
  initialInput: string;
  intakeAnswers?: Record<string, unknown>;
  detectedDomain: GuidancePrimaryDomain;
  activeMode: GuidanceModeId;
}

interface BuildInitialGuidanceDecisionEnvelopeInput extends BuildGuidanceIntentProfileInput {
  domainConfidence?: number;
  shouldOfferDossier: boolean;
  intentProfile?: GuidanceIntentProfile;
}

interface BuildAuthoritativeGuidanceDecisionEnvelopeInput {
  session: GuidanceSession;
  routeOutcome?: GuidanceRouteOutcome;
  trainerRecommendation?: TrainerRecommendation;
  followUpQuestion?: GuidanceContinuation['followUpQuestion'];
  onboardingState?: GuidanceOnboardingState;
  phase?: GuidanceSessionPhase;
  progressionSnapshot?: GuidanceProgressionSnapshot;
  authoritySource: GuidanceDecisionAuthority['source'];
}

export function buildGuidanceIntentProfile(
  input: BuildGuidanceIntentProfileInput
): GuidanceIntentProfile {
  const intakeAnswerCount = Object.values(input.intakeAnswers ?? {})
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .length;
  const loweredInput = input.initialInput.toLowerCase();
  const primaryIntent = resolvePrimaryIntent(input.detectedDomain, input.activeMode, loweredInput);
  const preferredTone = resolvePreferredTone(input.detectedDomain, input.activeMode);
  const responseDepth = resolveResponseDepth(input.detectedDomain, input.activeMode, intakeAnswerCount, loweredInput);

  return {
    primaryIntent,
    preferredTone,
    responseDepth,
  };
}

export function buildInitialGuidanceDecisionEnvelope(
  input: BuildInitialGuidanceDecisionEnvelopeInput
): GuidanceDecisionEnvelope {
  return {
    decisionVersion: 1,
    authority: {
      level: 'authoritative',
      source: 'create_session',
    },
    domain: {
      primary: input.detectedDomain,
      confidence: input.domainConfidence,
      shouldOfferDossier: input.shouldOfferDossier,
    },
    mode: {
      active: input.activeMode,
      suggested: input.activeMode,
    },
    intentProfile: input.intentProfile ?? buildGuidanceIntentProfile(input),
    executionReadiness: {
      isReady: false,
      reason: 'needs_clarification',
    },
    safeUiCapabilities: {
      result: true,
      onboardingShell: false,
      trainerRecommendation: false,
      executionBridge: false,
      followUpInput: false,
      phaseProgression: false,
    },
  };
}

export function buildAuthoritativeGuidanceDecisionEnvelope(
  input: BuildAuthoritativeGuidanceDecisionEnvelopeInput
): GuidanceDecisionEnvelope {
  const baseDecision = input.session.decision
    ?? buildInitialGuidanceDecisionEnvelope({
      initialInput: input.session.initialInput,
      intakeAnswers: input.session.intakeAnswers,
      detectedDomain: input.session.detectedDomain,
      activeMode: input.session.activeMode,
      domainConfidence: input.session.domainConfidence,
      shouldOfferDossier: input.session.shouldOfferDossier,
    });
  const executionReadiness = buildExecutionReadiness({
    routeOutcome: input.routeOutcome,
    phase: input.phase,
  });
  const safeUiCapabilities = buildSafeUiCapabilities({
    session: input.session,
    routeOutcome: input.routeOutcome,
    trainerRecommendation: input.trainerRecommendation,
    followUpQuestion: input.followUpQuestion,
    onboardingState: input.onboardingState,
    phase: input.phase,
    progressionSnapshot: input.progressionSnapshot,
    executionReadiness,
  });

  return {
    ...baseDecision,
    authority: {
      level: 'authoritative',
      source: input.authoritySource,
    },
    domain: {
      primary: input.session.detectedDomain,
      confidence: input.session.domainConfidence,
      shouldOfferDossier: input.session.shouldOfferDossier,
    },
    mode: {
      active: input.session.activeMode,
      suggested: input.session.decision?.mode.suggested ?? input.session.activeMode,
      userOverride: input.session.decision?.mode.userOverride,
    },
    intentProfile: baseDecision.intentProfile,
    narrative: input.session.result?.narrative,
    systemPlan: input.session.result?.systemPlan,
    executionPlan: input.session.result?.executionPlan,
    routeOutcome: input.routeOutcome,
    trainerRecommendation: input.trainerRecommendation,
    followUpQuestion: input.followUpQuestion,
    onboardingState: input.onboardingState,
    phase: input.phase,
    progressionSnapshot: input.progressionSnapshot,
    executionReadiness,
    safeUiCapabilities,
  };
}

export function degradeGuidanceDecisionEnvelope(
  decision: GuidanceDecisionEnvelope,
  input: {
    source: GuidanceDecisionAuthority['source'];
    degradedReason: GuidanceDecisionDegradedReason;
  }
): GuidanceDecisionEnvelope {
  return {
    ...decision,
    authority: {
      level: 'degraded',
      source: input.source,
      degradedReason: input.degradedReason,
    },
  };
}

export function applyGuidanceDecisionEnvelope(
  session: GuidanceSession,
  decision: GuidanceDecisionEnvelope
): GuidanceSession {
  return {
    ...session,
    detectedDomain: decision.domain.primary,
    domainConfidence: decision.domain.confidence,
    activeMode: decision.mode.active,
    shouldOfferDossier: decision.domain.shouldOfferDossier,
    routeOutcome: decision.routeOutcome,
    trainerRecommendation: decision.trainerRecommendation,
    followUpQuestion: decision.followUpQuestion,
    onboardingState: decision.onboardingState,
    phase: decision.phase,
    progressionSnapshot: decision.progressionSnapshot,
    decision,
    result: session.result
      ? {
          ...session.result,
          narrative: decision.narrative ?? session.result.narrative,
          systemPlan: decision.systemPlan ?? session.result.systemPlan,
          executionPlan: decision.executionPlan ?? session.result.executionPlan,
        }
      : undefined,
  };
}

export function createGuidanceDecisionEnvelopeFromSession(
  session: GuidanceSession,
  input: {
    authoritySource: GuidanceDecisionAuthority['source'];
  }
): GuidanceDecisionEnvelope {
  return buildAuthoritativeGuidanceDecisionEnvelope({
    session,
    routeOutcome: session.routeOutcome,
    trainerRecommendation: session.trainerRecommendation,
    followUpQuestion: session.followUpQuestion,
    onboardingState: session.onboardingState,
    phase: session.phase,
    progressionSnapshot: session.progressionSnapshot,
    authoritySource: input.authoritySource,
  });
}

export function getGuidanceDecisionAuthority(
  session: GuidanceSession | null | undefined
): GuidanceDecisionAuthority | null {
  return session?.decision?.authority ?? null;
}

export function isGuidanceDecisionDegraded(
  session: GuidanceSession | null | undefined
): boolean {
  return session?.decision?.authority.level === 'degraded';
}

export function getGuidanceSafeUiCapabilities(
  session: GuidanceSession | null | undefined
): GuidanceSafeUiCapabilities | null {
  return session?.decision?.safeUiCapabilities ?? null;
}

export function getGuidanceSessionRouteOutcome(
  session: GuidanceSession | null | undefined
): GuidanceRouteOutcome | undefined {
  return session?.decision?.routeOutcome ?? session?.routeOutcome;
}

export function getGuidanceSessionTrainerRecommendation(
  session: GuidanceSession | null | undefined
): TrainerRecommendation | undefined {
  return session?.decision?.trainerRecommendation ?? session?.trainerRecommendation;
}

export function getGuidanceSessionFollowUpQuestion(
  session: GuidanceSession | null | undefined
): GuidanceContinuation['followUpQuestion'] | undefined {
  return session?.decision?.followUpQuestion ?? session?.followUpQuestion;
}

export function getGuidanceSessionOnboardingState(
  session: GuidanceSession | null | undefined
): GuidanceOnboardingState | undefined {
  return session?.decision?.onboardingState ?? session?.onboardingState;
}

export function getGuidanceSessionPhase(
  session: GuidanceSession | null | undefined
): GuidanceSessionPhase | undefined {
  return session?.decision?.phase ?? session?.phase;
}

export function getGuidanceSessionProgressionSnapshot(
  session: GuidanceSession | null | undefined
): GuidanceProgressionSnapshot | undefined {
  return session?.decision?.progressionSnapshot ?? session?.progressionSnapshot;
}

export function getGuidanceSessionNarrative(
  session: GuidanceSession | null | undefined
): GuidanceNarrativeContract | undefined {
  return session?.decision?.narrative ?? session?.result?.narrative;
}

export function getGuidanceSessionSystemPlan(
  session: GuidanceSession | null | undefined
): GuidanceSystemPlanContract | undefined {
  return session?.decision?.systemPlan ?? session?.result?.systemPlan;
}

export function getGuidanceSessionExecutionPlan(
  session: GuidanceSession | null | undefined
): GuidanceExecutionPlanContract | undefined {
  return session?.decision?.executionPlan ?? session?.result?.executionPlan;
}

export function getGuidanceSessionModeSuggestion(
  session: GuidanceSession | null | undefined
): GuidanceModeId | undefined {
  return session?.decision?.mode.suggested;
}

export function hasUserOverriddenMode(
  session: GuidanceSession | null | undefined
): boolean {
  return Boolean(session?.decision?.mode.userOverride);
}

export function getGuidanceSessionExecutionReadiness(
  session: GuidanceSession | null | undefined
): GuidanceExecutionReadiness | null {
  if (!session) {
    return null;
  }

  return session.decision?.executionReadiness ?? buildExecutionReadiness({
    routeOutcome: getGuidanceSessionRouteOutcome(session),
    phase: getGuidanceSessionPhase(session),
  });
}

export function canRenderGuidanceOnboardingShell(
  session: GuidanceSession | null | undefined
): boolean {
  if (!session?.result || !session.characterProfile?.intro) {
    return false;
  }

  const onboardingState = getGuidanceSessionOnboardingState(session);
  const phase = getGuidanceSessionPhase(session);
  const progressionSnapshot = getGuidanceSessionProgressionSnapshot(session);

  if (!onboardingState || !phase || !progressionSnapshot) {
    return false;
  }

  return session.decision
    ? session.decision.safeUiCapabilities.onboardingShell
    : true;
}

export function canRenderGuidanceFollowUpInput(
  session: GuidanceSession | null | undefined
): boolean {
  const followUpQuestion = getGuidanceSessionFollowUpQuestion(session);

  if (!followUpQuestion) {
    return false;
  }

  return session?.decision
    ? session.decision.safeUiCapabilities.followUpInput
    : true;
}

export function canRenderGuidanceTrainerRecommendation(
  session: GuidanceSession | null | undefined
): boolean {
  const trainerRecommendation = getGuidanceSessionTrainerRecommendation(session);

  if (!trainerRecommendation) {
    return false;
  }

  return session?.decision
    ? session.decision.safeUiCapabilities.trainerRecommendation
    : true;
}

export function canRenderGuidanceExecutionBridge(
  session: GuidanceSession | null | undefined
): boolean {
  if (!session?.result) {
    return false;
  }

  const phase = getGuidanceSessionPhase(session);
  const progressionSnapshot = getGuidanceSessionProgressionSnapshot(session);
  const executionReadiness = getGuidanceSessionExecutionReadiness(session);

  if (
    phase !== 'execution_ready'
    || !progressionSnapshot
    || !executionReadiness?.isReady
  ) {
    return false;
  }

  return session.decision
    ? session.decision.safeUiCapabilities.executionBridge
    : true;
}

export function canRenderGuidancePhaseProgression(
  session: GuidanceSession | null | undefined
): boolean {
  if (!session) {
    return false;
  }
  
  const phase = getGuidanceSessionPhase(session);
  const progressionSnapshot = getGuidanceSessionProgressionSnapshot(session);

  if (!phase || !progressionSnapshot) {
    return false;
  }

  return session.decision
    ? session.decision.safeUiCapabilities.phaseProgression
    : true;
}

function buildExecutionReadiness(input: {
  routeOutcome?: GuidanceRouteOutcome;
  phase?: GuidanceSessionPhase;
}): GuidanceExecutionReadiness {
  if (input.phase === 'execution_ready' || input.routeOutcome?.type === 'convert_to_dossier') {
    return {
      isReady: true,
      reason: 'route_ready',
    };
  }

  if (input.phase === 'clarifying') {
    return {
      isReady: false,
      reason: 'needs_clarification',
    };
  }

  return {
    isReady: false,
    reason: 'needs_refinement',
  };
}

function buildSafeUiCapabilities(input: {
  session: GuidanceSession;
  routeOutcome?: GuidanceRouteOutcome;
  trainerRecommendation?: TrainerRecommendation;
  followUpQuestion?: GuidanceContinuation['followUpQuestion'];
  onboardingState?: GuidanceOnboardingState;
  phase?: GuidanceSessionPhase;
  progressionSnapshot?: GuidanceProgressionSnapshot;
  executionReadiness: GuidanceExecutionReadiness;
}): GuidanceSafeUiCapabilities {
  const hasRenderableOnboarding = Boolean(
    input.session.result
    && input.session.characterProfile?.intro
    && input.onboardingState
    && input.phase
    && input.progressionSnapshot
  );

  return {
    result: true,
    onboardingShell: hasRenderableOnboarding,
    trainerRecommendation: Boolean(input.trainerRecommendation),
    executionBridge: input.executionReadiness.isReady && Boolean(input.progressionSnapshot),
    followUpInput: Boolean(input.followUpQuestion),
    phaseProgression: Boolean(input.phase && input.progressionSnapshot),
  };
}

function resolvePrimaryIntent(
  detectedDomain: GuidancePrimaryDomain,
  activeMode: GuidanceModeId,
  loweredInput: string
): GuidanceIntentProfile['primaryIntent'] {
  if (/\b(do|ship|send|finish|execute|launch|fix now)\b/.test(loweredInput)) {
    return 'execute';
  }

  switch (activeMode) {
    case 'planning':
      return 'plan';
    case 'decision':
      return 'decide';
    case 'problem_solver':
      return 'execute';
    case 'conflict':
      return 'stabilize';
    case 'quick_assist':
      return 'understand';
    default:
      switch (detectedDomain) {
        case 'planning':
          return 'plan';
        case 'decision':
        case 'business_financial':
          return 'decide';
        case 'conflict':
        case 'emotional':
          return 'stabilize';
        case 'problem_solving':
          return 'execute';
        case 'quick_question':
        default:
          return 'understand';
      }
  }
}

function resolvePreferredTone(
  detectedDomain: GuidancePrimaryDomain,
  activeMode: GuidanceModeId
): GuidanceIntentProfile['preferredTone'] {
  if (activeMode === 'planning') {
    return 'structured';
  }

  if (activeMode === 'problem_solver' || activeMode === 'decision') {
    return 'direct';
  }

  if (detectedDomain === 'emotional' || detectedDomain === 'conflict') {
    return 'supportive';
  }

  return 'structured';
}

function resolveResponseDepth(
  detectedDomain: GuidancePrimaryDomain,
  activeMode: GuidanceModeId,
  intakeAnswerCount: number,
  loweredInput: string
): GuidanceIntentProfile['responseDepth'] {
  if (activeMode === 'quick_assist' || detectedDomain === 'quick_question') {
    return 'light';
  }

  if (intakeAnswerCount >= 3 || /\b(plan|timeline|sequence|constraints|owners|milestones)\b/.test(loweredInput)) {
    return 'structured';
  }

  return 'guided';
}
