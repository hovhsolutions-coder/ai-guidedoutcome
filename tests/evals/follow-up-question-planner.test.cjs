require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildGuidanceRequest } = require('../../src/lib/ai/build-guidance-request.ts');
const { buildFirstPassGuidanceSession } = require('../../src/lib/guidance-session/build-first-pass-guidance-session.ts');
const { adaptGuidanceSessionToDecisionInput } = require('../../src/lib/recommendations/adapters/from-guidance-session.ts');
const { inspectRouteDecision, inspectTrainerRecommendationDecision } = require('../../src/lib/recommendations/core.ts');
const { adaptTrainerRecommendationInput } = require('../../src/lib/recommendations/adapters/from-trainer-input.ts');
const { getInitialDossierPhase } = require('../../src/lib/dossiers/build-generated-dossier.ts');

function runFollowUpQuestionPlannerTests() {
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

  assert.deepEqual(sparseState.routeInspection.followUpQuestion, {
    intent: 'clarify_goal',
    question: 'What outcome matters most here if we get only one thing right next?',
  });
  assert.deepEqual(sparseState.trainerInspection.followUpQuestion, sparseState.routeInspection.followUpQuestion);

  const mixedState = buildServerFirstPassState({
    body: {
      raw_input: 'Need help with this.',
      main_goal: 'We need a plan for the launch this week.',
      intakeAnswers: {
        timeline: 'This has to move this week.',
        constraints: 'There are approval dependencies and legal review before we send anything.',
      },
    },
    result: {
      summary: 'The path is clearer, but timing pressure and open dependencies still make the next move uncertain.',
      nextStep: 'Understand which dependency matters most before changing the rollout plan',
      suggestedTasks: ['List the open dependencies', 'Capture the rollout constraints'],
    },
  });

  assert.deepEqual(mixedState.routeInspection.followUpQuestion, {
    intent: 'clarify_documentation',
    question: 'What plan, evidence, or structure needs to be captured so the next move is clear?',
  });
  assert.deepEqual(mixedState.trainerInspection.followUpQuestion, mixedState.routeInspection.followUpQuestion);

  const contradictoryState = buildServerFirstPassState({
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

  assert.deepEqual(contradictoryState.routeInspection.followUpQuestion, {
    intent: 'clarify_conflict',
    question: 'Who is the other party here, and what exactly needs to change in that relationship first?',
  });
  assert.deepEqual(contradictoryState.trainerInspection.followUpQuestion, contradictoryState.routeInspection.followUpQuestion);

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

  assert.equal(clearState.routeInspection.followUpQuestion, null);
  assert.equal(clearState.trainerInspection.followUpQuestion, null);
}

module.exports = {
  runFollowUpQuestionPlannerTests,
};

function buildServerFirstPassState({ body, result }) {
  const { session } = buildGuidanceRequest(body);
  const firstPassSession = buildFirstPassGuidanceSession(session, result);
  const routeInspection = inspectRouteDecision(adaptGuidanceSessionToDecisionInput(firstPassSession));
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
    routeInspection,
    trainerInspection,
  };
}
