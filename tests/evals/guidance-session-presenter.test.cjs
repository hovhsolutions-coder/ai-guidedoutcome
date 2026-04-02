require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
} = require('../../src/components/guidance/guidance-session-store.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function runGuidanceSessionPresenterTests() {
  const initialState = createInitialGuidanceSessionStoreState();
  const emptyPresentation = presentGuidanceSession({
    state: initialState,
    liveRawInput: initialState.input.rawInput,
  });

  assert.equal(emptyPresentation.intake.mode.hasPrimaryInput, false);
  assert.equal(emptyPresentation.intake.submit.label, 'Generate guidance');
  assert.equal(emptyPresentation.intake.submit.disabled, true);
  assert.deepEqual(Object.keys(emptyPresentation), ['intake', 'progressMessage', 'surfaceVariant', 'rightRailProfile', 'activeFocus', 'sectionVisibility', 'contentDensity', 'microcopyIntent', 'sectionOutcome', 'surfaceRhythm', 'transitionContinuity', 'visualWeight', 'zoneProfiles', 'rightRailView']);
  assert.deepEqual(Object.keys(emptyPresentation.rightRailView), ['onboardingSession', 'executionSession', 'executionReadySection', 'structuredContracts', 'result', 'trainer']);
  assert.equal(emptyPresentation.rightRailView.executionReadySection, null);
  assert.equal(emptyPresentation.rightRailView.executionSession, null);
  assert.match(emptyPresentation.rightRailView.result.currentRead.summary, /Add raw input to see the detected domain/i);
  assert.equal(emptyPresentation.progressMessage.state, 'fresh_ready');
  assert.equal(emptyPresentation.surfaceVariant, 'capture_surface');
  assert.deepEqual(emptyPresentation.rightRailProfile, {
    visibility: 'visible',
    role: 'support',
    emphasis: 'subtle',
    density: 'guided',
    continuity: 'settle',
  });
  assert.equal(emptyPresentation.activeFocus.target, 'intake');
  assert.equal(emptyPresentation.sectionVisibility.onboarding, 'suppressed');
  assert.equal(emptyPresentation.contentDensity.intake, 'guided');
  assert.equal(emptyPresentation.microcopyIntent.intake, 'orient');
  assert.equal(emptyPresentation.sectionOutcome.intake, 'capture');
  assert.equal(emptyPresentation.surfaceRhythm.intake, 'steady');
  assert.equal(emptyPresentation.transitionContinuity.intake, 'advance');
  assert.equal(emptyPresentation.visualWeight.intake, 'strong');
  assert.equal(emptyPresentation.zoneProfiles.intake.visibility, 'visible');
  assert.equal(emptyPresentation.zoneProfiles.intake.focusState, 'dominant');
  assert.equal(emptyPresentation.zoneProfiles.intake.primaryCta, 'submit');

  const clarifyingSession = buildGuidanceSession('clarifying');
  const clarifyingState = guidanceSessionStoreReducer(
    createInitialGuidanceSessionStoreState(),
    {
      type: 'set_session_result',
      payload: buildSessionResultUpdate({
        rawInput: clarifyingSession.initialInput,
        situation: 'Tense partner thread',
        mainGoal: 'Get to a better next move',
        intakeAnswers: clarifyingSession.intakeAnswers,
        result: {
          summary: clarifyingSession.result.summary,
          next_step: clarifyingSession.result.nextStep,
          suggested_tasks: clarifyingSession.result.suggestedTasks,
        },
        resultMeta: {
          detectedDomain: clarifyingSession.detectedDomain,
          activeMode: clarifyingSession.activeMode,
          shouldOfferDossier: clarifyingSession.shouldOfferDossier,
        },
        guidanceSession: clarifyingSession,
        generationCount: 1,
        lastGeneratedAt: '2:40 PM',
      }),
    }
  );

  const clarifyingPresentation = presentGuidanceSession({
    state: clarifyingState,
    liveRawInput: clarifyingState.input.rawInput,
  });
  assert.equal(clarifyingPresentation.rightRailView.onboardingSession.phase, 'clarifying');
  assert.equal(clarifyingPresentation.rightRailView.executionSession, null);
  assert.equal(clarifyingPresentation.rightRailView.executionReadySection, null);
  assert.ok(clarifyingPresentation.rightRailView.trainer.nextPath.guidanceSession);
  assert.equal(clarifyingPresentation.intake.submit.label, 'Regenerate guidance');
  assert.equal(clarifyingPresentation.progressMessage.state, 'clarifying_ready');
  assert.equal(clarifyingPresentation.surfaceVariant, 'clarify_surface');
  assert.equal(clarifyingPresentation.rightRailProfile.role, 'context');
  assert.equal(clarifyingPresentation.activeFocus.target, 'follow_up');
  assert.equal(clarifyingPresentation.sectionVisibility.onboarding, 'visible');
  assert.equal(clarifyingPresentation.contentDensity.onboarding, 'guided');
  assert.equal(clarifyingPresentation.microcopyIntent.onboarding, 'orient');
  assert.equal(clarifyingPresentation.sectionOutcome.onboarding, 'clarify');
  assert.equal(clarifyingPresentation.surfaceRhythm.onboarding, 'steady');
  assert.equal(clarifyingPresentation.transitionContinuity.onboarding, 'advance');
  assert.equal(clarifyingPresentation.visualWeight.onboarding, 'strong');
  assert.equal(clarifyingPresentation.zoneProfiles.onboarding.focusState, 'dominant');
  assert.equal(clarifyingPresentation.zoneProfiles.onboarding.primaryCta, 'follow_up');

  const executionState = guidanceSessionStoreReducer(
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
        lastGeneratedAt: '2:45 PM',
      }),
    }
  );
  const loadingExecutionState = {
    ...executionState,
    feedback: {
      ...executionState.feedback,
      isLoading: true,
    },
  };

  const executionPresentation = presentGuidanceSession({
    state: loadingExecutionState,
    liveRawInput: loadingExecutionState.input.rawInput,
  });
  assert.equal(executionPresentation.rightRailView.onboardingSession.phase, 'execution_ready');
  assert.equal(executionPresentation.rightRailView.executionSession.phase, 'execution_ready');
  assert.ok(executionPresentation.rightRailView.executionReadySection);
  assert.equal(
    executionPresentation.rightRailView.executionReadySection.handoff.nextStep,
    'Define the final owner sequence for launch week'
  );
  assert.equal(executionPresentation.rightRailView.trainer.nextPath.guidanceSession, null);
  assert.equal(executionPresentation.intake.submit.label, 'Generating guidance...');
  assert.match(executionPresentation.intake.submit.helperText, /fresh structured read/i);
  assert.equal(executionPresentation.progressMessage.state, 'fresh_submit_loading');
  assert.equal(executionPresentation.surfaceVariant, 'understand_surface');
  assert.equal(executionPresentation.rightRailProfile.role, 'support');
  assert.equal(executionPresentation.activeFocus.target, 'result');
  assert.equal(executionPresentation.sectionVisibility.result, 'visible');
  assert.equal(executionPresentation.contentDensity.result, 'guided');
  assert.equal(executionPresentation.microcopyIntent.result, 'confirm');
  assert.equal(executionPresentation.sectionOutcome.result, 'understand');
  assert.equal(executionPresentation.surfaceRhythm.result, 'steady');
  assert.equal(executionPresentation.transitionContinuity.result, 'advance');
  assert.equal(executionPresentation.visualWeight.result, 'strong');
  assert.equal(executionPresentation.zoneProfiles.result.focusState, 'dominant');
  assert.equal(executionPresentation.zoneProfiles.execution.visibility, 'suppressed');
  assert.deepEqual(Object.keys(executionPresentation.rightRailView.executionReadySection), ['progress', 'handoff', 'transition']);
}

function buildGuidanceSession(phase) {
  const characterProfile = buildCharacterProfile(phase === 'execution_ready' ? 'builder' : 'negotiator');

  if (phase === 'clarifying') {
    return {
      id: 'guidance_clarifying',
      initialInput: 'Need help with a messy partner decision.',
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
  runGuidanceSessionPresenterTests,
};
