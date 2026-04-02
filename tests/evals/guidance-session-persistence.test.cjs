require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  clearPersistedGuidanceShellState,
  GUIDANCE_SESSION_STORAGE_MAX_AGE_MS,
  GUIDANCE_SESSION_STORAGE_KEY,
  GUIDANCE_SESSION_STORAGE_VERSION,
  isPersistedGuidanceShellStateFresh,
  loadPersistedGuidanceShellState,
  parsePersistedGuidanceShellState,
  savePersistedGuidanceShellState,
} = require('../../src/lib/guidance-session/persist-guidance-session-state.ts');
const { buildGuidanceRightRailViewModel } = require('../../src/lib/guidance-session/build-guidance-right-rail-view-model.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function runGuidanceSessionPersistenceTests() {
  const storage = createMemoryStorage();

  const clarifyingState = {
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
      followUpQuestion: {
        intent: 'clarify_goal',
        question: 'What outcome matters most here if we get only one thing right next?',
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

  savePersistedGuidanceShellState(storage, clarifyingState, 1000);
  const restoredClarifyingState = loadPersistedGuidanceShellState(storage, 1000 + GUIDANCE_SESSION_STORAGE_MAX_AGE_MS - 1);
  assert.equal(restoredClarifyingState.guidanceSession.phase, 'clarifying');
  assert.equal(restoredClarifyingState.guidanceSession.followUpQuestion.intent, 'clarify_goal');
  assert.equal(restoredClarifyingState.savedAt, 1000);
  assert.equal(isPersistedGuidanceShellStateFresh(restoredClarifyingState, 1000 + GUIDANCE_SESSION_STORAGE_MAX_AGE_MS - 1), true);

  const clarifyingView = buildGuidanceRightRailViewModel({
    guidanceSession: restoredClarifyingState.guidanceSession,
    result: restoredClarifyingState.result,
    isLoading: false,
    lastGeneratedAt: restoredClarifyingState.lastGeneratedAt,
    detectedDomain: restoredClarifyingState.resultMeta.detectedDomain,
    activeMode: restoredClarifyingState.resultMeta.activeMode,
    shouldOfferDossier: restoredClarifyingState.resultMeta.shouldOfferDossier,
    activeTrainer: restoredClarifyingState.activeTrainer,
    trainerLoading: null,
    trainerError: null,
  });
  assert.equal(clarifyingView.executionReadySection, null);
  assert.equal(clarifyingView.onboardingSession.phase, 'clarifying');
  assert.equal(clarifyingView.trainer.nextPath.guidanceSession.id, 'guidance_ambiguous');

  const executionReadyState = {
    ...clarifyingState,
    rawInput: 'Need help with rollout.',
    result: {
      summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
      next_step: 'Define the final owner sequence for launch week',
      suggested_tasks: ['Confirm launch owners', 'Lock the checklist'],
    },
    resultMeta: {
      detectedDomain: 'planning',
      activeMode: 'planning',
      shouldOfferDossier: true,
    },
    guidanceSession: {
      ...clarifyingState.guidanceSession,
      id: 'guidance_execution_ready',
      initialInput: 'Need help with rollout.',
      detectedDomain: 'planning',
      activeMode: 'planning',
      result: {
        summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
        nextStep: 'Define the final owner sequence for launch week',
        suggestedTasks: ['Confirm launch owners', 'Lock the checklist'],
      },
      routeOutcome: {
        type: 'convert_to_dossier',
        reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
        confidenceLabel: 'high',
        rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
        activeMode: 'planning',
      },
      trainerRecommendation: {
        orderedTrainers: ['strategy', 'execution', 'risk', 'communication'],
        topTrainer: 'strategy',
        confidenceLabel: 'medium',
        rationaleSummary: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
        inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
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
      progressionState: createInitialProgressionState(),
      shouldOfferDossier: true,
      createdAt: '2026-03-22T14:10:00.000Z',
    },
    generationCount: 2,
    lastGeneratedAt: '2:15 PM',
  };

  savePersistedGuidanceShellState(storage, executionReadyState, 2000);
  const restoredExecutionReadyState = loadPersistedGuidanceShellState(storage, 2000);
  assert.equal(restoredExecutionReadyState.guidanceSession.phase, 'execution_ready');
  assert.equal(restoredExecutionReadyState.generationCount, 2);

  const executionReadyView = buildGuidanceRightRailViewModel({
    guidanceSession: restoredExecutionReadyState.guidanceSession,
    result: restoredExecutionReadyState.result,
    isLoading: false,
    lastGeneratedAt: restoredExecutionReadyState.lastGeneratedAt,
    detectedDomain: restoredExecutionReadyState.resultMeta.detectedDomain,
    activeMode: restoredExecutionReadyState.resultMeta.activeMode,
    shouldOfferDossier: restoredExecutionReadyState.resultMeta.shouldOfferDossier,
    activeTrainer: restoredExecutionReadyState.activeTrainer,
    trainerLoading: null,
    trainerError: null,
  });
  assert.ok(executionReadyView.executionReadySection);
  assert.equal(executionReadyView.executionReadySection.handoff.nextStep, 'Define the final owner sequence for launch week');
  assert.equal(executionReadyView.trainer.nextPath.guidanceSession, null);
  assert.match(executionReadyView.result.currentRead.summary, /planning mode/i);

  clearPersistedGuidanceShellState(storage);
  assert.equal(loadPersistedGuidanceShellState(storage), null);

  storage.setItem('ai-guided-outcome.guidance-session.v1', '{invalid');
  assert.equal(loadPersistedGuidanceShellState(storage), null);

  assert.equal(parsePersistedGuidanceShellState({
    savedAt: 1000,
    ...clarifyingState,
    version: 999,
  }), null);

  // Partial data should parse with safe defaults (schema resilience)
  const partialResult = parsePersistedGuidanceShellState({
    version: GUIDANCE_SESSION_STORAGE_VERSION,
    savedAt: 1000,
    rawInput: 'Need help.',
  });
  assert.ok(partialResult, 'Partial data should parse with safe defaults');
  assert.equal(partialResult.rawInput, 'Need help.', 'Should preserve provided fields');
  assert.equal(partialResult.situation, '', 'Missing fields should default to safe values');
  assert.equal(partialResult.selectedMode, 'auto', 'Missing selectedMode should default to auto');

  storage.setItem('ai-guided-outcome.guidance-session.v1', JSON.stringify({
    savedAt: 1000,
    ...clarifyingState,
    version: 999,
  }));
  assert.equal(loadPersistedGuidanceShellState(storage), null);

  // Malformed guidanceSession should default to null (safe fallback)
  const now = Date.now();
  storage.setItem('ai-guided-outcome.guidance-session.v1', JSON.stringify({
    version: GUIDANCE_SESSION_STORAGE_VERSION,
    savedAt: now,
    rawInput: 'Need help.',
    situation: '',
    mainGoal: '',
    selectedMode: 'auto',
    intakeAnswers: {},
    result: null,
    resultMeta: null,
    guidanceSession: {
      id: 'broken',
    },
    activeTrainer: null,
    generationCount: 1,
    lastGeneratedAt: null,
  }));
  // Should load successfully with malformed guidanceSession defaulted to null
  const malformedLoaded = loadPersistedGuidanceShellState(storage, now);
  assert.ok(malformedLoaded, 'Should load with malformed guidanceSession defaulted to null');
  assert.equal(malformedLoaded.guidanceSession, null, 'Malformed guidanceSession should be null');

  savePersistedGuidanceShellState(storage, clarifyingState, 3000);
  assert.equal(loadPersistedGuidanceShellState(storage, 3000 + GUIDANCE_SESSION_STORAGE_MAX_AGE_MS + 1), null);

  savePersistedGuidanceShellState(storage, clarifyingState, 4000);
  assert.ok(storage.getItem(GUIDANCE_SESSION_STORAGE_KEY));
  clearPersistedGuidanceShellState(storage);
  assert.equal(storage.getItem(GUIDANCE_SESSION_STORAGE_KEY), null);

  // Test quota exceeded handling with graceful retry
  const quotaStorage = createFailingQuotaStorage();
  const result = savePersistedGuidanceShellState(quotaStorage, clarifyingState, 5000);
  assert.equal(result.success, true, 'Should succeed after retry on quota exceeded');
  assert.ok(quotaStorage.getItem(GUIDANCE_SESSION_STORAGE_KEY), 'State should be persisted after retry');

  // Test quota exceeded when retry also fails
  const strictQuotaStorage = createStrictFailingStorage();
  const result2 = savePersistedGuidanceShellState(strictQuotaStorage, clarifyingState, 6000);
  assert.equal(result2.success, false, 'Should fail when retry also fails');
  assert.equal(result2.quotaExceeded, true, 'Should indicate quota was exceeded');
}

function createFailingQuotaStorage() {
  const data = new Map();
  let shouldFail = true;

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      // First call fails with quota error, subsequent calls succeed
      if (shouldFail) {
        shouldFail = false;
        const error = new Error('The quota has been exceeded.');
        error.name = 'QuotaExceededError';
        throw error;
      }
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function createStrictFailingStorage() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      // Always fails with quota error
      const error = new Error('The quota has been exceeded.');
      error.name = 'QuotaExceededError';
      throw error;
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function createMemoryStorageWithQuota(maxSize) {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      const existingSize = data.has(key) ? data.get(key).length : 0;
      const newSize = value.length;
      // Calculate total size of all stored items
      let totalSize = 0;
      for (const [, v] of data) {
        totalSize += v.length;
      }
      // Check if adding/updating this value would exceed quota
      const projectedSize = totalSize - existingSize + newSize;
      if (projectedSize > maxSize) {
        const error = new Error('The quota has been exceeded.');
        error.name = 'QuotaExceededError';
        throw error;
      }
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
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
  runGuidanceSessionPersistenceTests,
};
