require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');
const {
  buildGuidanceProgressionSnapshot,
  planGuidanceSessionPhase,
} = require('../../src/lib/guidance-session/plan-guidance-session-phase.ts');
const { mapOnboardingShellCopy } = require('../../src/lib/guidance-session/map-onboarding-shell-copy.ts');
const { buildGuidanceRightRailViewModel } = require('../../src/lib/guidance-session/build-guidance-right-rail-view-model.ts');

function runGuidancePhaseAndRightRailTests() {
  const ambiguousPhase = planGuidanceSessionPhase({
    routeOutcome: {
      type: 'stay_in_guidance',
      reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
      confidenceLabel: 'guarded',
      rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
      activeMode: 'problem_solver',
    },
    onboardingState: 'intro_plus_followup',
    hasFollowUpHistory: false,
    hasFollowUpQuestion: true,
  });
  assert.equal(ambiguousPhase, 'clarifying');

  const answeredFollowUpPhase = planGuidanceSessionPhase({
    routeOutcome: {
      type: 'continue_in_mode',
      reason: 'The current mode already matches the situation and should carry the next refinement pass.',
      confidenceLabel: 'medium',
      rationaleSummary: 'The current mode still fits, but the session may benefit from one more confirming pass.',
      activeMode: 'planning',
    },
    onboardingState: 'intro_plus_next_step',
    hasFollowUpHistory: true,
    hasFollowUpQuestion: false,
  });
  assert.equal(answeredFollowUpPhase, 'execution_ready');

  const clearFirstPassPhase = planGuidanceSessionPhase({
    routeOutcome: {
      type: 'convert_to_dossier',
      reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
      confidenceLabel: 'high',
      rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      activeMode: 'planning',
    },
    onboardingState: 'intro_plus_next_step',
    hasFollowUpHistory: false,
    hasFollowUpQuestion: false,
  });
  assert.equal(clearFirstPassPhase, 'execution_ready');

  const ambiguousSnapshot = buildGuidanceProgressionSnapshot({
    routeOutcome: {
      type: 'stay_in_guidance',
      reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
      confidenceLabel: 'guarded',
      rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
      activeMode: 'problem_solver',
    },
    onboardingState: 'intro_plus_followup',
    hasFollowUpHistory: false,
    hasFollowUpQuestion: true,
  });
  assert.equal(ambiguousSnapshot.phase, 'clarifying');
  assert.equal(ambiguousSnapshot.showsFollowUp, true);
  assert.equal(ambiguousSnapshot.showsNextStep, false);

  const refinedCopy = mapOnboardingShellCopy({
    phase: 'execution_ready',
    hasFollowUpHistory: true,
    showsFollowUp: false,
  });
  assert.equal(refinedCopy.headerEyebrow, 'Refined onboarding read');
  assert.equal(refinedCopy.nextSectionLabel, 'Refined next step');
  assert.match(refinedCopy.introFraming, /enough signal now to move with confidence/i);

  const clearSession = {
    id: 'guidance_clear',
    initialInput: 'Need help with the rollout.',
    detectedDomain: 'planning',
    activeMode: 'planning',
    intakeAnswers: {},
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
      hasFollowUpHistory: false,
      showsFollowUp: false,
      showsNextStep: true,
    },
    characterProfile: buildCharacterProfile('builder'),
    progressionState: createInitialProgressionState(),
    trainerResponse: undefined,
    shouldOfferDossier: true,
    createdAt: '2026-03-22T14:10:00.000Z',
  };

  const rightRailView = buildGuidanceRightRailViewModel({
    guidanceSession: clearSession,
    result: {
      summary: clearSession.result.summary,
      next_step: clearSession.result.nextStep,
      suggested_tasks: clearSession.result.suggestedTasks,
    },
    isLoading: false,
    lastGeneratedAt: '2:15 PM',
    detectedDomain: 'planning',
    activeMode: 'planning',
    shouldOfferDossier: true,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });

  assert.equal(rightRailView.onboardingSession.phase, 'execution_ready');
  assert.equal(rightRailView.executionSession.phase, 'execution_ready');
  assert.ok(rightRailView.executionReadySection);
  assert.equal(rightRailView.result.currentRead.label, 'Live intake read');
  assert.match(rightRailView.result.currentRead.summary, /planning mode/i);
  assert.equal(rightRailView.executionReadySection.handoff.nextStep, 'Define the final owner sequence for launch week');
  assert.equal(rightRailView.result.panel.shouldOfferDossier, true);
  assert.equal(rightRailView.trainer.nextPath.guidanceSession, null);
  assert.equal(rightRailView.trainer.response.response, null);

  const emptyCurrentReadView = buildGuidanceRightRailViewModel({
    guidanceSession: null,
    result: null,
    isLoading: false,
    lastGeneratedAt: null,
    detectedDomain: null,
    activeMode: null,
    shouldOfferDossier: false,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });
  assert.equal(emptyCurrentReadView.result.currentRead.label, 'Live intake read');
  assert.match(emptyCurrentReadView.result.currentRead.summary, /Add raw input to see the detected domain/i);
  assert.equal(emptyCurrentReadView.executionReadySection, null);
  assert.equal(emptyCurrentReadView.executionSession, null);
  assert.equal(emptyCurrentReadView.trainer.nextPath.guidanceSession, null);
}

module.exports = {
  runGuidancePhaseAndRightRailTests,
};
