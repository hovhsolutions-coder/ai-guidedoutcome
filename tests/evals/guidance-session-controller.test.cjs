require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  clearGuidanceSessionAfterSuccessfulDossierConversion,
  restoreControllerStateFromPersistedSnapshot,
  shouldClearPersistedStateBeforeFreshRun,
} = require('../../src/components/guidance/use-guidance-session-controller.ts');
const {
  GUIDANCE_SESSION_STORAGE_KEY,
  GUIDANCE_SESSION_STORAGE_VERSION,
  savePersistedGuidanceShellState,
} = require('../../src/lib/guidance-session/persist-guidance-session-state.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function runGuidanceSessionControllerTests() {
  assert.equal(
    shouldClearPersistedStateBeforeFreshRun({
      result: null,
      guidanceSession: null,
    }),
    true
  );

  assert.equal(
    shouldClearPersistedStateBeforeFreshRun({
      result: {
        summary: 'Existing summary',
        next_step: 'Existing next step',
        suggested_tasks: [],
      },
      guidanceSession: null,
    }),
    false
  );

  const persistedState = {
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
  };

  const restored = restoreControllerStateFromPersistedSnapshot({
    version: GUIDANCE_SESSION_STORAGE_VERSION,
    savedAt: 1000,
    ...persistedState,
  });
  assert.equal(restored.rawInput, 'Need help.');
  assert.equal(restored.guidanceSession.phase, 'clarifying');
  assert.equal(restored.resultMeta.activeMode, 'problem_solver');

  assert.equal(restoreControllerStateFromPersistedSnapshot(null), null);

  const storage = createMemoryStorage();
  const previousWindow = global.window;
  global.window = { localStorage: storage };
  savePersistedGuidanceShellState(storage, persistedState, 1000);
  assert.ok(storage.getItem(GUIDANCE_SESSION_STORAGE_KEY));
  clearGuidanceSessionAfterSuccessfulDossierConversion();
  assert.equal(storage.getItem(GUIDANCE_SESSION_STORAGE_KEY), null);
  global.window = previousWindow;
}

function createMemoryStorage() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

module.exports = {
  runGuidanceSessionControllerTests,
};
