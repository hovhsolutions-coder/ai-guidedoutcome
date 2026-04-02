require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');
const { buildGuidanceRightRailViewModel } = require('../../src/lib/guidance-session/build-guidance-right-rail-view-model.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
} = require('../../src/components/guidance/guidance-session-store.ts');

function runGuidanceEnvelopeConsumerMigrationTests() {
  const blockedClarifyingSession = buildCapabilityBlockedClarifyingSession();
  const blockedClarifyingView = buildGuidanceRightRailViewModel({
    guidanceSession: blockedClarifyingSession,
    result: {
      summary: blockedClarifyingSession.result.summary,
      next_step: blockedClarifyingSession.result.nextStep,
      suggested_tasks: blockedClarifyingSession.result.suggestedTasks,
    },
    isLoading: false,
    lastGeneratedAt: '4:10 PM',
    detectedDomain: blockedClarifyingSession.detectedDomain,
    activeMode: blockedClarifyingSession.activeMode,
    shouldOfferDossier: blockedClarifyingSession.shouldOfferDossier,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });

  assert.equal(blockedClarifyingView.onboardingSession, null, 'capability-blocked clarifying: onboarding shell should be suppressed');
  assert.equal(blockedClarifyingView.executionSession, null, 'capability-blocked clarifying: execution carrier should stay absent');
  assert.equal(blockedClarifyingView.executionReadySection, null, 'capability-blocked clarifying: execution section should stay absent');
  assert.ok(blockedClarifyingView.trainer.nextPath.guidanceSession, 'capability-blocked clarifying: next path should remain available');

  const blockedExecutionSession = buildCapabilityBlockedExecutionSession();
  const blockedExecutionView = buildGuidanceRightRailViewModel({
    guidanceSession: blockedExecutionSession,
    result: {
      summary: blockedExecutionSession.result.summary,
      next_step: blockedExecutionSession.result.nextStep,
      suggested_tasks: blockedExecutionSession.result.suggestedTasks,
    },
    isLoading: false,
    lastGeneratedAt: '4:15 PM',
    detectedDomain: blockedExecutionSession.detectedDomain,
    activeMode: blockedExecutionSession.activeMode,
    shouldOfferDossier: blockedExecutionSession.shouldOfferDossier,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });

  assert.equal(blockedExecutionView.executionSession, null, 'capability-blocked execution: execution carrier should be suppressed');
  assert.equal(blockedExecutionView.executionReadySection, null, 'capability-blocked execution: execution section should be suppressed');
  assert.ok(blockedExecutionView.trainer.nextPath.guidanceSession, 'capability-blocked execution: safe continuation should remain available');

  const blockedPresentation = presentGuidanceSession({
    state: buildStateFromSession(blockedClarifyingSession),
    liveRawInput: blockedClarifyingSession.initialInput,
  });

  assert.equal(blockedPresentation.progressMessage.state, 'degraded_result_fallback', 'capability-blocked clarifying: progress should fall back to degraded-safe state');
  assert.equal(blockedPresentation.sectionVisibility.onboarding, 'suppressed', 'capability-blocked clarifying: onboarding zone should be suppressed');
  assert.equal(blockedPresentation.sectionVisibility.trainer, 'soft_hidden', 'capability-blocked clarifying: continuation zone should remain softly visible');
  assert.equal(blockedPresentation.rightRailView.onboardingSession, null, 'capability-blocked clarifying: presenter should null onboarding carrier');
}

function buildStateFromSession(session) {
  return guidanceSessionStoreReducer(createInitialGuidanceSessionStoreState(), {
    type: 'set_session_result',
    payload: buildSessionResultUpdate({
      rawInput: session.initialInput,
      situation: 'Capability-gated session',
      mainGoal: 'Keep only trusted surfaces visible',
      intakeAnswers: session.intakeAnswers,
      result: {
        summary: session.result.summary,
        next_step: session.result.nextStep,
        suggested_tasks: session.result.suggestedTasks,
      },
      resultMeta: {
        detectedDomain: session.detectedDomain,
        activeMode: session.activeMode,
        shouldOfferDossier: session.shouldOfferDossier,
      },
      guidanceSession: session,
      generationCount: 1,
      lastGeneratedAt: '4:20 PM',
    }),
  });
}

function buildCapabilityBlockedClarifyingSession() {
  const routeOutcome = {
    type: 'stay_in_guidance',
    reason: 'The route still needs one light refinement before it becomes heavier.',
    confidenceLabel: 'guarded',
    rationaleSummary: 'The route is usable, but phase-specific UI should stay off until continuity is safer.',
    activeMode: 'conflict',
  };
  const trainerRecommendation = {
    orderedTrainers: ['communication', 'strategy', 'risk', 'execution'],
    topTrainer: 'communication',
    confidenceLabel: 'guarded',
    rationaleSummary: 'Communication is the closest specialist angle once the main route is stable enough.',
    inlineActions: [{ trainer: 'communication', label: 'Refine message', emphasized: true }],
  };
  const followUpQuestion = {
    intent: 'clarify_goal',
    question: 'What outcome matters most if you only get one thing right next?',
  };
  const progressionSnapshot = {
    phase: 'clarifying',
    phaseLabel: 'clarifying',
    phaseSummary: 'The system is still clarifying one missing point before it escalates the route.',
    hasFollowUpHistory: false,
    showsFollowUp: true,
    showsNextStep: false,
  };

  return {
    id: 'guidance_blocked_clarifying',
    initialInput: 'Need help with a tense partner decision.',
    detectedDomain: 'conflict',
    activeMode: 'conflict',
    intakeAnswers: {},
    result: {
      summary: 'The current read is usable, but one point is still unresolved.',
      nextStep: 'Clarify the one partner outcome that matters most',
      suggestedTasks: ['Capture the single missing detail'],
    },
    routeOutcome,
    trainerRecommendation,
    followUpQuestion,
    onboardingState: 'intro_plus_followup',
    phase: 'clarifying',
    progressionSnapshot,
    characterProfile: buildCharacterProfile('negotiator'),
    progressionState: createInitialProgressionState(),
    shouldOfferDossier: false,
    decision: {
      decisionVersion: 1,
      authority: {
        level: 'authoritative',
        source: 'server_continuation',
      },
      domain: {
        primary: 'conflict',
        shouldOfferDossier: false,
      },
      mode: {
        active: 'conflict',
      },
      intentProfile: {
        primaryIntent: 'stabilize',
        preferredTone: 'supportive',
        responseDepth: 'guided',
      },
      routeOutcome,
      trainerRecommendation,
      followUpQuestion,
      onboardingState: 'intro_plus_followup',
      phase: 'clarifying',
      progressionSnapshot,
      executionReadiness: {
        isReady: false,
        reason: 'needs_clarification',
      },
      safeUiCapabilities: {
        result: true,
        onboardingShell: false,
        trainerRecommendation: true,
        executionBridge: false,
        followUpInput: false,
        phaseProgression: false,
      },
    },
    createdAt: '2026-03-23T15:00:00.000Z',
  };
}

function buildCapabilityBlockedExecutionSession() {
  const routeOutcome = {
    type: 'convert_to_dossier',
    reason: 'The route is concrete enough for tracked execution.',
    confidenceLabel: 'high',
    rationaleSummary: 'Execution can continue, but the execution bridge itself is not trusted enough to render here.',
    activeMode: 'planning',
  };
  const trainerRecommendation = {
    orderedTrainers: ['strategy', 'execution', 'risk', 'communication'],
    topTrainer: 'strategy',
    confidenceLabel: 'medium',
    rationaleSummary: 'Strategy is still the closest adjacent angle if the user wants another read.',
    inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
  };
  const progressionSnapshot = {
    phase: 'execution_ready',
    phaseLabel: 'execution ready',
    phaseSummary: 'The route is stable enough to act on.',
    hasFollowUpHistory: true,
    showsFollowUp: false,
    showsNextStep: true,
  };

  return {
    id: 'guidance_blocked_execution',
    initialInput: 'Need help turning the rollout into action.',
    detectedDomain: 'planning',
    activeMode: 'planning',
    intakeAnswers: {
      follow_up_clarify_goal: 'Lock the owner sequence before launch week.',
    },
    result: {
      summary: 'The route is stable and ready for real execution.',
      nextStep: 'Define the final owner sequence for launch week',
      suggestedTasks: ['Confirm owners', 'Lock the checklist'],
    },
    routeOutcome,
    trainerRecommendation,
    onboardingState: 'intro_plus_next_step',
    phase: 'execution_ready',
    progressionSnapshot,
    characterProfile: buildCharacterProfile('builder'),
    progressionState: createInitialProgressionState(),
    shouldOfferDossier: true,
    decision: {
      decisionVersion: 1,
      authority: {
        level: 'authoritative',
        source: 'server_continuation',
      },
      domain: {
        primary: 'planning',
        shouldOfferDossier: true,
      },
      mode: {
        active: 'planning',
      },
      intentProfile: {
        primaryIntent: 'plan',
        preferredTone: 'structured',
        responseDepth: 'structured',
      },
      routeOutcome,
      trainerRecommendation,
      onboardingState: 'intro_plus_next_step',
      phase: 'execution_ready',
      progressionSnapshot,
      executionReadiness: {
        isReady: true,
        reason: 'route_ready',
      },
      safeUiCapabilities: {
        result: true,
        onboardingShell: false,
        trainerRecommendation: true,
        executionBridge: false,
        followUpInput: false,
        phaseProgression: false,
      },
    },
    createdAt: '2026-03-23T15:05:00.000Z',
  };
}

module.exports = {
  runGuidanceEnvelopeConsumerMigrationTests,
};
