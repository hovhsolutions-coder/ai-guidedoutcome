require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
  restoreStoreStateFromPersistedSnapshot,
  shouldClearPersistedStateBeforeFreshRun,
} = require('../../src/components/guidance/guidance-session-store.ts');
const { GUIDANCE_SESSION_STORAGE_VERSION } = require('../../src/lib/guidance-session/persist-guidance-session-state.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function runGuidanceSessionStoreTests() {
  const initialState = createInitialGuidanceSessionStoreState();
  assert.equal(initialState.input.rawInput, '');
  assert.equal(initialState.feedback.isLoading, false);
  assert.equal(initialState.session.guidanceSession, null);
  assert.equal(initialState.meta.generationCount, 0);

  const inputUpdatedState = guidanceSessionStoreReducer(initialState, {
    type: 'set_raw_input',
    payload: 'Need help with rollout.',
  });
  assert.equal(inputUpdatedState.input.rawInput, 'Need help with rollout.');

  const restored = restoreStoreStateFromPersistedSnapshot({
    version: GUIDANCE_SESSION_STORAGE_VERSION,
    savedAt: 1000,
    rawInput: 'Need help.',
    situation: '',
    mainGoal: '',
    selectedMode: 'auto',
    intakeAnswers: {},
    result: {
      summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
      next_step: 'Understand the core concern behind the question',
      suggested_tasks: ['Capture the missing context'],
    },
    resultMeta: {
      detectedDomain: 'problem_solving',
      activeMode: 'problem_solver',
      shouldOfferDossier: false,
    },
    guidanceSession: {
      id: 'guidance_ambiguous',
      initialInput: 'Need help.',
      detectedDomain: 'problem_solving',
      activeMode: 'problem_solver',
      intakeAnswers: {},
      result: {
        summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
        nextStep: 'Understand the core concern behind the question',
        suggestedTasks: ['Capture the missing context'],
      },
      routeOutcome: {
        type: 'stay_in_guidance',
        reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
        confidenceLabel: 'guarded',
        rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
        activeMode: 'problem_solver',
      },
      trainerRecommendation: {
        orderedTrainers: ['strategy', 'risk', 'communication', 'execution'],
        topTrainer: 'strategy',
        confidenceLabel: 'guarded',
        rationaleSummary: 'Strategy is a helpful next angle here, but the session could still support more than one specialist read.',
        inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
      },
      onboardingState: 'intro_plus_followup',
      phase: 'clarifying',
      progressionSnapshot: {
        phase: 'clarifying',
        phaseLabel: 'clarifying',
        phaseSummary: 'The system is clarifying the situation before it pushes you into a heavier path.',
        hasFollowUpHistory: false,
        showsFollowUp: true,
        showsNextStep: false,
      },
      characterProfile: buildCharacterProfile('executor'),
      progressionState: createInitialProgressionState(),
      shouldOfferDossier: false,
      createdAt: '2026-03-22T14:00:00.000Z',
    },
    activeTrainer: null,
    generationCount: 1,
    lastGeneratedAt: '2:10 PM',
  });

  const restoredState = guidanceSessionStoreReducer(initialState, {
    type: 'restore',
    payload: restored,
  });
  assert.equal(restoredState.input.rawInput, 'Need help.');
  assert.equal(restoredState.session.guidanceSession.phase, 'clarifying');
  assert.equal(restoredState.meta.generationCount, 1);

  const sessionResultUpdate = buildSessionResultUpdate({
    rawInput: 'Need help with rollout.',
    situation: '',
    mainGoal: '',
    intakeAnswers: {},
    result: {
      summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
      next_step: 'Define the final owner sequence for launch week',
      suggested_tasks: ['Confirm launch owners'],
    },
    resultMeta: {
      detectedDomain: 'planning',
      activeMode: 'planning',
      shouldOfferDossier: true,
    },
    guidanceSession: {
      ...restored.guidanceSession,
      id: 'guidance_execution_ready',
      initialInput: 'Need help with rollout.',
      detectedDomain: 'planning',
      activeMode: 'planning',
      result: {
        summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
        nextStep: 'Define the final owner sequence for launch week',
        suggestedTasks: ['Confirm launch owners'],
      },
      routeOutcome: {
        type: 'convert_to_dossier',
        reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
        confidenceLabel: 'high',
        rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
        activeMode: 'planning',
      },
      followUpQuestion: undefined,
      onboardingState: 'intro_plus_next_step',
      phase: 'execution_ready',
      progressionSnapshot: {
        phase: 'execution_ready',
        phaseLabel: 'execution ready',
        phaseSummary: 'The system sees a clear enough path to move you into real action without extra clarification.',
        hasFollowUpHistory: true,
        showsFollowUp: false,
        showsNextStep: true,
      },
      characterProfile: buildCharacterProfile('builder'),
    },
    generationCount: 2,
    lastGeneratedAt: '2:15 PM',
  });

  const updatedState = guidanceSessionStoreReducer(restoredState, {
    type: 'set_session_result',
    payload: sessionResultUpdate,
  });
  assert.equal(updatedState.session.guidanceSession.phase, 'execution_ready');
  assert.equal(updatedState.session.resultMeta.activeMode, 'planning');
  assert.equal(updatedState.meta.generationCount, 2);
  assert.equal(updatedState.session.activeTrainer, null);

  const trainerLoadingState = guidanceSessionStoreReducer(updatedState, {
    type: 'start_trainer_loading',
    payload: 'strategy',
  });
  assert.equal(trainerLoadingState.session.activeTrainer, 'strategy');
  assert.equal(trainerLoadingState.session.trainerLoading, 'strategy');

  const trainerResponseState = guidanceSessionStoreReducer(trainerLoadingState, {
    type: 'set_trainer_response',
    payload: {
      trainer: 'strategy',
      focus_label: 'Strategic framing',
      headline: 'Tighten the path',
      key_insight: 'The current direction is usable.',
      recommendation: 'Keep the plan narrow.',
      next_move: 'Lock the next owner sequence.',
      support_points: ['Stay focused'],
      confidence_label: 'medium',
    },
  });
  assert.equal(trainerResponseState.session.guidanceSession.trainerResponse.trainer, 'strategy');

  assert.equal(
    shouldClearPersistedStateBeforeFreshRun({
      result: null,
      guidanceSession: null,
    }),
    true
  );
}

module.exports = {
  runGuidanceSessionStoreTests,
};
