import {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
  type GuidanceSessionStoreState,
} from '@/src/components/guidance/guidance-session-store';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import { buildCharacterProfile, createInitialProgressionState } from '@/src/lib/progression/progression';

type FixtureGuidanceSession = GuidanceSession & {
  intakeAnswers: Record<string, string>;
  result: NonNullable<GuidanceSession['result']>;
};

export interface GuidancePresentationFixture {
  id: 'fresh' | 'clarifying' | 'refined_direction' | 'execution_ready';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
  expected: {
    submitLabel: string;
    submitDisabled: boolean;
    visible: Array<'onboarding' | 'result' | 'trainer_next_path' | 'execution_ready'>;
    hidden: Array<'onboarding' | 'result' | 'trainer_next_path' | 'execution_ready'>;
    copyMarkers: string[];
    phase?: 'clarifying' | 'refined_direction' | 'execution_ready';
  };
}

export function createGuidancePresentationFixtureMatrix(): GuidancePresentationFixture[] {
  const freshState = createInitialGuidanceSessionStoreState();
  const clarifyingSession = buildGuidanceSession('clarifying');
  const refinedSession = buildGuidanceSession('refined_direction');
  const executionReadySession = buildGuidanceSession('execution_ready');

  return [
    {
      id: 'fresh',
      state: freshState,
      liveRawInput: '',
      expected: {
        submitLabel: 'Generate guidance',
        submitDisabled: true,
        visible: ['result'],
        hidden: ['onboarding', 'trainer_next_path', 'execution_ready'],
        copyMarkers: ['Add raw input to see the detected domain', 'Waiting for input'],
      },
    },
    {
      id: 'clarifying',
      state: buildStoreStateFromSession({
        session: clarifyingSession,
        rawInput: clarifyingSession.initialInput,
        situation: 'Tense partner thread',
        mainGoal: 'Get to a better next move',
        generationCount: 1,
        lastGeneratedAt: '2:55 PM',
      }),
      liveRawInput: clarifyingSession.initialInput,
      expected: {
        submitLabel: 'Regenerate guidance',
        submitDisabled: false,
        visible: ['onboarding', 'result', 'trainer_next_path'],
        hidden: ['execution_ready'],
        copyMarkers: ['conflict', 'Probably not needed yet', 'Live intake read'],
        phase: 'clarifying',
      },
    },
    {
      id: 'refined_direction',
      state: buildStoreStateFromSession({
        session: refinedSession,
        rawInput: refinedSession.initialInput,
        situation: 'Partner decision after clarification',
        mainGoal: 'Land a clean partner decision',
        generationCount: 2,
        lastGeneratedAt: '3:05 PM',
      }),
      liveRawInput: refinedSession.initialInput,
      expected: {
        submitLabel: 'Regenerate guidance',
        submitDisabled: false,
        visible: ['onboarding', 'result', 'trainer_next_path'],
        hidden: ['execution_ready'],
        copyMarkers: ['decision', 'Likely useful later', 'Live intake read'],
        phase: 'refined_direction',
      },
    },
    {
      id: 'execution_ready',
      state: buildStoreStateFromSession({
        session: executionReadySession,
        rawInput: executionReadySession.initialInput,
        situation: 'Launch week planning',
        mainGoal: 'Lock the owner sequence',
        generationCount: 1,
        lastGeneratedAt: '3:10 PM',
      }),
      liveRawInput: executionReadySession.initialInput,
      expected: {
        submitLabel: 'Regenerate guidance',
        submitDisabled: false,
        visible: ['onboarding', 'result', 'execution_ready'],
        hidden: ['trainer_next_path'],
        copyMarkers: ['planning', 'Likely useful later', 'Live intake read'],
        phase: 'execution_ready',
      },
    },
  ];
}

function buildStoreStateFromSession(input: {
  session: FixtureGuidanceSession;
  rawInput: string;
  situation: string;
  mainGoal: string;
  generationCount: number;
  lastGeneratedAt: string;
}): GuidanceSessionStoreState {
  return guidanceSessionStoreReducer(createInitialGuidanceSessionStoreState(), {
    type: 'set_session_result',
    payload: buildSessionResultUpdate({
      rawInput: input.rawInput,
      situation: input.situation,
      mainGoal: input.mainGoal,
      intakeAnswers: input.session.intakeAnswers,
      result: {
        summary: input.session.result.summary,
        next_step: input.session.result.nextStep,
        suggested_tasks: input.session.result.suggestedTasks,
      },
      resultMeta: {
        detectedDomain: input.session.detectedDomain,
        activeMode: input.session.activeMode,
        shouldOfferDossier: input.session.shouldOfferDossier,
      },
      guidanceSession: input.session,
      generationCount: input.generationCount,
      lastGeneratedAt: input.lastGeneratedAt,
    }),
  });
}

function buildGuidanceSession(phase: 'clarifying' | 'refined_direction' | 'execution_ready'): FixtureGuidanceSession {
  if (phase === 'clarifying') {
    return {
      id: 'guidance_clarifying',
      initialInput: 'Need help with a messy partner decision.',
      detectedDomain: 'conflict' as const,
      activeMode: 'conflict' as const,
      intakeAnswers: {} as Record<string, string>,
      result: {
        summary: 'The situation is still mixed enough to benefit from one clarifying answer.',
        nextStep: 'Clarify the partner outcome that matters most before deciding',
        suggestedTasks: ['Capture the strongest open concern'],
      },
      routeOutcome: {
        type: 'stay_in_guidance' as const,
        reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
        confidenceLabel: 'guarded' as const,
        rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
        activeMode: 'conflict' as const,
      },
      trainerRecommendation: {
        orderedTrainers: ['communication', 'strategy', 'risk', 'execution'] as const,
        topTrainer: 'communication' as const,
        confidenceLabel: 'guarded' as const,
        rationaleSummary: 'Communication is a helpful next angle here, but the session could still support more than one specialist read.',
        inlineActions: [{ trainer: 'communication' as const, label: 'Refine message', emphasized: true }],
      },
      followUpQuestion: {
        intent: 'clarify_goal',
        question: 'What outcome matters most if you get only one thing right next?',
      },
      onboardingState: 'intro_plus_followup' as const,
      phase: 'clarifying' as const,
      progressionSnapshot: {
        phase: 'clarifying' as const,
        phaseLabel: 'clarifying',
        phaseSummary: 'The system is clarifying the situation before it pushes you into a heavier path.',
        hasFollowUpHistory: false,
        showsFollowUp: true,
        showsNextStep: false,
      },
      characterProfile: buildCharacterProfile('negotiator'),
      progressionState: createInitialProgressionState(),
      shouldOfferDossier: false,
      createdAt: '2026-03-22T14:00:00.000Z',
    };
  }

  if (phase === 'refined_direction') {
    return {
      id: 'guidance_refined',
      initialInput: 'Need help choosing the right partner path.',
      detectedDomain: 'decision' as const,
      activeMode: 'decision' as const,
      intakeAnswers: {
        follow_up_clarify_goal: 'We need a partner decision that avoids another review cycle.',
      } as Record<string, string>,
      result: {
        summary: 'The decision is clearer now and the direction is ready for a tighter, more grounded move.',
        nextStep: 'Compare the two remaining partner options before committing',
        suggestedTasks: ['List the main tradeoffs', 'Mark the approval risk'],
      },
      routeOutcome: {
        type: 'continue_in_mode' as const,
        reason: 'The current mode already matches the situation and should carry the next refinement pass.',
        confidenceLabel: 'medium' as const,
        rationaleSummary: 'The current mode still fits, but the session may benefit from one more confirming pass.',
        activeMode: 'decision' as const,
      },
      trainerRecommendation: {
        orderedTrainers: ['strategy', 'risk', 'communication', 'execution'] as const,
        topTrainer: 'strategy' as const,
        confidenceLabel: 'medium' as const,
        rationaleSummary: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
        inlineActions: [{ trainer: 'strategy' as const, label: 'Reframe strategy', emphasized: true }],
      },
      onboardingState: 'intro_plus_next_step' as const,
      phase: 'refined_direction' as const,
      progressionSnapshot: {
        phase: 'refined_direction' as const,
        phaseLabel: 'refined direction',
        phaseSummary: 'The direction is now more grounded and personal, and the system is guiding from that refined read.',
        hasFollowUpHistory: true,
        showsFollowUp: false,
        showsNextStep: true,
      },
      characterProfile: buildCharacterProfile('strategist'),
      progressionState: createInitialProgressionState(),
      shouldOfferDossier: true,
      createdAt: '2026-03-22T14:05:00.000Z',
    };
  }

  return {
    id: 'guidance_execution',
    initialInput: 'Need help with the rollout.',
    detectedDomain: 'planning' as const,
    activeMode: 'planning' as const,
    intakeAnswers: {} as Record<string, string>,
    result: {
      summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
      nextStep: 'Define the final owner sequence for launch week',
      suggestedTasks: ['Confirm launch owners', 'Lock the checklist'],
    },
    routeOutcome: {
      type: 'convert_to_dossier' as const,
      reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
      confidenceLabel: 'high' as const,
      rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      activeMode: 'planning' as const,
    },
    trainerRecommendation: {
      orderedTrainers: ['strategy', 'execution', 'risk', 'communication'] as const,
      topTrainer: 'strategy' as const,
      confidenceLabel: 'medium' as const,
      rationaleSummary: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
      inlineActions: [{ trainer: 'strategy' as const, label: 'Reframe strategy', emphasized: true }],
    },
    onboardingState: 'intro_plus_next_step' as const,
    phase: 'execution_ready' as const,
    progressionSnapshot: {
      phase: 'execution_ready' as const,
      phaseLabel: 'execution ready',
      phaseSummary: 'The system sees a clear enough path to move you into real action without extra clarification.',
      hasFollowUpHistory: false,
      showsFollowUp: false,
      showsNextStep: true,
    },
    characterProfile: buildCharacterProfile('builder'),
    progressionState: createInitialProgressionState(),
    shouldOfferDossier: true,
    createdAt: '2026-03-22T14:10:00.000Z',
  };
}
