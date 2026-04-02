require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildGuidanceRequest } = require('../../src/lib/ai/build-guidance-request.ts');
const { buildFirstPassGuidanceSession } = require('../../src/lib/guidance-session/build-first-pass-guidance-session.ts');
const { adaptGuidanceSessionToDecisionInput } = require('../../src/lib/recommendations/adapters/from-guidance-session.ts');
const {
  inspectRouteDecision,
  inspectTrainerRecommendationDecision,
} = require('../../src/lib/recommendations/core.ts');
const { adaptTrainerRecommendationInput } = require('../../src/lib/recommendations/adapters/from-trainer-input.ts');
const { getInitialDossierPhase } = require('../../src/lib/dossiers/build-generated-dossier.ts');

function runFirstPassAmbiguityTests() {
  const sparseState = buildServerFirstPassState({
    body: {
      raw_input: 'Need help.',
      main_goal: 'Help',
      intakeAnswers: {
        context_window: 'Soon',
      },
    },
    result: {
      summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
      nextStep: 'Understand the core concern behind the question',
      suggestedTasks: ['Capture the missing context'],
    },
  });

  assert.equal(sparseState.session.domainConfidence, 0.5);
  assert.equal(sparseState.decisionInput.signals.ambiguityState, 'sparse');
  assert.equal(sparseState.routeInspection.decision.type, 'stay_in_guidance');
  assert.equal(sparseState.routeInspection.decision.confidenceLabel, 'medium');
  assert.deepEqual(sparseState.routeInspection.reasonCodes, ['LOW_INFORMATION', 'AMBIGUITY_PRESENT']);
  assert.equal(sparseState.trainerInspection.recommendation.topTrainer, 'strategy');
  assert.equal(sparseState.trainerInspection.recommendation.confidenceLabel, 'guarded');
  assert.ok(sparseState.trainerInspection.reasonCodes.includes('AMBIGUITY_PRESENT'));

  const mixedState = buildServerFirstPassState({
    body: {
      raw_input: 'Need help with this.',
      main_goal: 'Repair the vendor relationship while unblocking the rollout today.',
      intakeAnswers: {
        other_party: 'Vendor account team',
        timeline: 'We need a plan this week',
        blocker: 'Approval is stuck',
      },
    },
    result: {
      summary: 'The path is clearer, but the situation still blends relationship repair, execution pressure, and plan work.',
      nextStep: 'Understand the main friction before changing the rollout sequence',
      suggestedTasks: ['Capture the points of tension', 'List the blocked handoff'],
    },
  });

  assert.equal(mixedState.session.domainConfidence, 0.62);
  assert.equal(mixedState.decisionInput.signals.ambiguityState, 'contradictory');
  assert.equal(mixedState.routeInspection.decision.type, 'continue_in_mode');
  assert.equal(mixedState.routeInspection.decision.confidenceLabel, 'guarded');
  assert.ok(mixedState.routeInspection.reasonCodes.includes('AMBIGUITY_PRESENT'));
  assert.equal(mixedState.trainerInspection.recommendation.topTrainer, 'strategy');
  assert.equal(mixedState.trainerInspection.recommendation.confidenceLabel, 'medium');
  assert.ok(mixedState.trainerInspection.reasonCodes.includes('AMBIGUITY_PRESENT'));

  const clearState = buildServerFirstPassState({
    body: {
      raw_input: 'Need help with this.',
      main_goal: 'Build the onboarding rollout plan and sequence the milestones.',
      intakeAnswers: {
        timeline: 'Launch starts next month',
        resources: 'Two PMs and one engineer',
        constraints: 'Document the checklist',
      },
    },
    result: {
      summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
      nextStep: 'Define the final owner sequence for launch week',
      suggestedTasks: ['Confirm launch owners', 'Lock the checklist', 'Capture the open dependencies'],
    },
  });

  assert.equal(clearState.session.domainConfidence, 0.9);
  assert.equal(clearState.decisionInput.signals.ambiguityState, 'clear');
  assert.equal(clearState.routeInspection.decision.type, 'convert_to_dossier');
  assert.equal(clearState.routeInspection.decision.confidenceLabel, 'high');
  assert.deepEqual(clearState.routeInspection.reasonCodes, ['ACTION_READY', 'DOSSIER_SIGNAL']);
  assert.equal(clearState.trainerInspection.recommendation.topTrainer, 'strategy');
  assert.equal(clearState.trainerInspection.recommendation.confidenceLabel, 'medium');
  assert.ok(!clearState.trainerInspection.reasonCodes.includes('AMBIGUITY_PRESENT'));
}

module.exports = {
  runFirstPassAmbiguityTests,
};

function buildServerFirstPassState({ body, result }) {
  const { session } = buildGuidanceRequest(body);
  const firstPassSession = buildFirstPassGuidanceSession(session, result);
  const decisionInput = adaptGuidanceSessionToDecisionInput(firstPassSession);
  const routeInspection = inspectRouteDecision(decisionInput);
  const trainerInspection = inspectTrainerRecommendationDecision(adaptTrainerRecommendationInput({
    phase: getInitialDossierPhase(firstPassSession.activeMode),
    totalTasks: firstPassSession.result?.suggestedTasks.length ?? 0,
    completedCount: 0,
    currentObjective: firstPassSession.result?.nextStep ?? '',
    currentGuidanceSummary: firstPassSession.result?.summary,
    currentGuidanceNextStep: firstPassSession.result?.nextStep,
    activeMode: firstPassSession.activeMode,
    detectedDomain: firstPassSession.detectedDomain,
    domainConfidence: firstPassSession.domainConfidence,
  }));

  return {
    session: firstPassSession,
    decisionInput,
    routeInspection,
    trainerInspection,
  };
}
