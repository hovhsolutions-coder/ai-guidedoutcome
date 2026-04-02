require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceIntake } = require('../../src/components/guidance/guidance-intake-presenter.ts');
const {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
} = require('../../src/components/guidance/guidance-session-store.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function runGuidanceIntakePresenterTests() {
  const freshState = createInitialGuidanceSessionStoreState();
  const freshPresentation = presentGuidanceIntake({
    state: freshState,
    liveRawInput: '',
  });

  assert.deepEqual(Object.keys(freshPresentation), ['universal', 'mode', 'submit']);
  assert.equal(freshPresentation.mode.hasPrimaryInput, false);
  assert.equal(freshPresentation.mode.domainValue, 'Waiting for input');
  assert.equal(freshPresentation.mode.waitingTitle, 'Mode will appear after the first input');
  assert.equal(freshPresentation.submit.label, 'Generate guidance');
  assert.equal(freshPresentation.submit.disabled, true);

  const clarifyingState = guidanceSessionStoreReducer(
    createInitialGuidanceSessionStoreState(),
    {
      type: 'set_session_result',
      payload: buildSessionResultUpdate({
        rawInput: 'Need help with a tense partner thread.',
        situation: 'Tense partner thread',
        mainGoal: 'Get to a better next move',
        intakeAnswers: {},
        result: {
          summary: 'The situation is still mixed enough to benefit from one clarifying answer.',
          next_step: 'Clarify the partner outcome that matters most before deciding',
          suggested_tasks: ['Capture the strongest open concern'],
        },
        resultMeta: {
          detectedDomain: 'conflict',
          activeMode: 'conflict',
          shouldOfferDossier: false,
        },
        guidanceSession: buildGuidanceSession('clarifying'),
        generationCount: 1,
        lastGeneratedAt: '2:55 PM',
      }),
    }
  );
  const clarifyingPresentation = presentGuidanceIntake({
    state: clarifyingState,
    liveRawInput: clarifyingState.input.rawInput,
  });

  assert.equal(clarifyingPresentation.mode.hasPrimaryInput, true);
  assert.equal(clarifyingPresentation.mode.detectedDomain, 'conflict');
  assert.equal(clarifyingPresentation.mode.domainValue, 'conflict');
  assert.equal(clarifyingPresentation.mode.recommendedMode, 'conflict');
  assert.equal(clarifyingPresentation.mode.dossierValue, 'Probably not needed yet');
  assert.equal(clarifyingPresentation.submit.label, 'Regenerate guidance');
  assert.equal(clarifyingPresentation.submit.disabled, false);

  const loadingExecutionState = {
    ...guidanceSessionStoreReducer(
      createInitialGuidanceSessionStoreState(),
      {
        type: 'set_session_result',
        payload: buildSessionResultUpdate({
          rawInput: 'Need help with the rollout.',
          situation: 'Launch week planning',
          mainGoal: 'Lock the owner sequence',
          intakeAnswers: {},
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
          guidanceSession: buildGuidanceSession('execution_ready'),
          generationCount: 1,
          lastGeneratedAt: '3:00 PM',
        }),
      }
    ),
    feedback: {
      ...createInitialGuidanceSessionStoreState().feedback,
      isLoading: true,
      isSubmittingFollowUp: false,
      error: null,
      generationStatus: null,
    },
  };

  const executionPresentation = presentGuidanceIntake({
    state: loadingExecutionState,
    liveRawInput: loadingExecutionState.input.rawInput,
  });
  assert.equal(executionPresentation.mode.detectedDomain, 'planning');
  assert.equal(executionPresentation.mode.recommendedMode, 'planning');
  assert.equal(executionPresentation.mode.dossierValue, 'Likely useful later');
  assert.equal(executionPresentation.submit.label, 'Generating guidance...');
  assert.match(executionPresentation.submit.helperText, /fresh structured read/i);

  // Domain Insight tests
  assert.ok(freshPresentation.universal.domainInsight, 'fresh state should have domainInsight');
  assert.equal(freshPresentation.universal.domainInsight.hasInput, false, 'fresh state hasInput should be false');
  assert.equal(freshPresentation.universal.domainInsight.insightLabel, 'Waiting for input', 'fresh state shows waiting label');
  assert.equal(freshPresentation.universal.domainInsight.detectedDomain, null, 'fresh state has no detected domain');
  
  assert.ok(clarifyingPresentation.universal.domainInsight, 'clarifying state should have domainInsight');
  assert.equal(clarifyingPresentation.universal.domainInsight.hasInput, true, 'clarifying state hasInput should be true');
  assert.equal(clarifyingPresentation.universal.domainInsight.detectedDomain, 'conflict', 'clarifying state shows detected domain');
  assert.equal(clarifyingPresentation.universal.domainInsight.insightLabel, 'conflict', 'clarifying state shows domain label');
  assert.ok(clarifyingPresentation.universal.domainInsight.insightDescription, 'clarifying state should have insight description');
  assert.match(clarifyingPresentation.universal.domainInsight.insightDescription, /conflict/i, 'description mentions the domain');

  // Mode Suggestion UI tests
  assert.ok(clarifyingPresentation.mode.modeSuggestion, 'clarifying state should have modeSuggestion');
  assert.equal(clarifyingPresentation.mode.modeSuggestion.suggestedMode, 'conflict', 'suggested mode matches detected domain');
  assert.equal(clarifyingPresentation.mode.modeSuggestion.activeMode, 'conflict', 'active mode matches authoritative mode');
  assert.equal(clarifyingPresentation.mode.modeSuggestion.hasUserOverride, false, 'no override when modes match');
  assert.equal(clarifyingPresentation.mode.modeSuggestion.systemLabel, 'System suggestion', 'shows system suggestion label');
  assert.equal(clarifyingPresentation.mode.modeSuggestion.overrideLabel, 'Manual override available', 'shows available override label');
  assert.ok(clarifyingPresentation.mode.modeSuggestion.rationale, 'should have rationale');
  assert.match(clarifyingPresentation.mode.modeSuggestion.rationale, /conflict/i, 'rationale mentions the domain');

  // Test override state
  const overriddenState = guidanceSessionStoreReducer(
    createInitialGuidanceSessionStoreState(),
    {
      type: 'set_session_result',
      payload: buildSessionResultUpdate({
        rawInput: 'Need help with a tense partner thread.',
        situation: 'Tense partner thread',
        mainGoal: 'Get to a better next move',
        intakeAnswers: {},
        result: {
          summary: 'The situation is still mixed enough to benefit from one clarifying answer.',
          next_step: 'Clarify the partner outcome that matters most before deciding',
          suggested_tasks: ['Capture the strongest open concern'],
        },
        resultMeta: {
          detectedDomain: 'conflict',
          activeMode: 'planning', // Different from suggested
          shouldOfferDossier: false,
        },
        guidanceSession: buildGuidanceSession('clarifying'),
        generationCount: 1,
        lastGeneratedAt: '2:55 PM',
      }),
    }
  );
  const overriddenPresentation = presentGuidanceIntake({
    state: overriddenState,
    liveRawInput: overriddenState.input.rawInput,
  });

  assert.equal(overriddenPresentation.mode.modeSuggestion.suggestedMode, 'conflict', 'suggested mode from live detection');
  assert.equal(overriddenPresentation.mode.modeSuggestion.activeMode, 'planning', 'active mode from authoritative');
  assert.equal(overriddenPresentation.mode.modeSuggestion.hasUserOverride, true, 'override detected when modes differ');
  assert.equal(overriddenPresentation.mode.modeSuggestion.overrideLabel, 'Manual override active', 'shows active override label');
}

function buildGuidanceSession(phase) {
  const characterProfile = buildCharacterProfile(phase === 'execution_ready' ? 'builder' : 'negotiator');

  if (phase === 'clarifying') {
    return {
      id: 'guidance_clarifying',
      initialInput: 'Need help with a tense partner thread.',
      detectedDomain: 'conflict',
      activeMode: 'conflict',
      intakeAnswers: {},
      result: {
        summary: 'The situation is still mixed enough to benefit from one clarifying answer.',
        nextStep: 'Clarify the partner outcome that matters most before deciding',
        suggestedTasks: ['Capture the strongest open concern'],
      },
      routeOutcome: {
        type: 'stay_in_guidance',
        reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
        confidenceLabel: 'guarded',
        rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
        activeMode: 'conflict',
      },
      trainerRecommendation: {
        orderedTrainers: ['communication', 'strategy', 'risk', 'execution'],
        topTrainer: 'communication',
        confidenceLabel: 'guarded',
        rationaleSummary: 'Communication is a helpful next angle here, but the session could still support more than one specialist read.',
        inlineActions: [{ trainer: 'communication', label: 'Refine message', emphasized: true }],
      },
      followUpQuestion: {
        intent: 'clarify_goal',
        question: 'What outcome matters most if you get only one thing right next?',
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
      characterProfile,
      progressionState: createInitialProgressionState(),
      shouldOfferDossier: false,
      createdAt: '2026-03-22T14:00:00.000Z',
    };
  }

  return {
    id: 'guidance_execution',
    initialInput: 'Need help with the rollout.',
    detectedDomain: 'planning',
    activeMode: 'planning',
    intakeAnswers: {},
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
    onboardingState: 'intro_plus_next_step',
    phase: 'execution_ready',
    progressionSnapshot: {
      phase: 'execution_ready',
      phaseLabel: 'execution ready',
      phaseSummary: 'The system sees a clear enough path to move you into real action without extra clarification.',
      hasFollowUpHistory: false,
      showsFollowUp: false,
      showsNextStep: true,
    },
    characterProfile,
    progressionState: createInitialProgressionState(),
    shouldOfferDossier: true,
    createdAt: '2026-03-22T14:10:00.000Z',
  };
}

module.exports = {
  runGuidanceIntakePresenterTests,
};
