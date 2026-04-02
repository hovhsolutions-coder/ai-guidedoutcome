require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { adaptGuidanceSessionToDecisionInput } = require('../../src/lib/recommendations/adapters/from-guidance-session.ts');
const { adaptTrainerRecommendationInput } = require('../../src/lib/recommendations/adapters/from-trainer-input.ts');
const {
  resolveRouteDecision,
  resolveTrainerRecommendationFromDecisionInput,
  inspectRouteDecision,
  inspectTrainerRecommendationDecision,
} = require('../../src/lib/recommendations/core.ts');
const {
  routeRecommendationScenarios,
  trainerRecommendationScenarios,
} = require('./recommendation-scenarios.ts');

function runRecommendationCoreTests() {
  const preResultScenario = routeRecommendationScenarios.find((scenario) => scenario.id === 'route_no_result_guarded');
  const preResultInspection = inspectRouteDecision(adaptGuidanceSessionToDecisionInput(preResultScenario.session));
  const preResultDecision = preResultInspection.decision;
  assert.equal(preResultDecision.kind, 'gated_pre_result');
  assert.equal(preResultDecision.activeMode, preResultScenario.session.activeMode);
  assert.deepEqual(preResultInspection.reasonCodes, ['PRE_RESULT']);

  const routeScenario = routeRecommendationScenarios.find((scenario) => scenario.id === 'route_continue_with_trainer_medium');
  const routeInput = adaptGuidanceSessionToDecisionInput(routeScenario.session);
  const routeInspection = inspectRouteDecision(routeInput);
  const routeDecision = routeInspection.decision;
  const resolvedRouteDecision = resolveRouteDecision(routeInput);
  assert.equal(routeDecision.type, routeScenario.expected.type);
  assert.equal(routeDecision.confidenceLabel, routeScenario.expected.confidenceLabel);
  assert.equal(routeDecision.recommendedTrainer, routeScenario.expected.recommendedTrainer);
  assert.equal(
    routeDecision.reason,
    'The current read is usable, but the next highest-value move is a specialist perspective before formal conversion.'
  );
  assert.equal(
    routeDecision.rationaleSummary,
    'A specialist continuation is helpful here, though other session-based paths still remain reasonable.'
  );
  assert.deepEqual(resolvedRouteDecision, routeDecision);
  assert.deepEqual(routeInspection.reasonCodes, ['LOW_INFORMATION', 'DECISION_NEEDS_SPECIALIST']);

  const trainerScenario = trainerRecommendationScenarios.find((scenario) => scenario.id === 'trainer_risk_high');
  const trainerInput = adaptTrainerRecommendationInput(trainerScenario.input);
  const trainerInspection = inspectTrainerRecommendationDecision(trainerInput);
  const trainerDecision = trainerInspection.recommendation;
  const resolvedTrainerDecision = resolveTrainerRecommendationFromDecisionInput(trainerInput);
  assert.equal(trainerDecision.topTrainer, trainerScenario.expected.topTrainer);
  assert.equal(trainerDecision.confidenceLabel, trainerScenario.expected.confidenceLabel);
  assert.equal(trainerDecision.orderedTrainers[0], trainerScenario.expected.topTrainer);
  assert.equal(trainerDecision.inlineActions[0].trainer, trainerScenario.expected.topTrainer);
  assert.equal(
    trainerDecision.rationaleSummary,
    'Risk fits best because the current session shows enough blocker or exposure signals to justify a tighter check.'
  );
  assert.deepEqual(resolvedTrainerDecision, trainerDecision);
  assert.deepEqual(
    trainerInspection.reasonCodes,
    ['HAS_TASKS', 'EXECUTION_READY', 'BLOCKER_PRESENT', 'RISK_SIGNAL', 'DECISION_MODE', 'BUSINESS_FINANCIAL_DOMAIN']
  );

  const continueInModeScenario = routeRecommendationScenarios.find((scenario) => scenario.id === 'route_continue_in_mode_medium_boundary');
  const continueInModeInspection = inspectRouteDecision(adaptGuidanceSessionToDecisionInput(continueInModeScenario.session));
  assert.equal(continueInModeInspection.decision.type, continueInModeScenario.expected.type);
  assert.equal(continueInModeInspection.decision.confidenceLabel, 'guarded');
  assert.equal(
    continueInModeInspection.decision.reason,
    'The current mode already matches the situation and should carry the next refinement pass.'
  );
  assert.equal(
    continueInModeInspection.decision.rationaleSummary,
    'The current mode still fits, but the session may benefit from one more confirming pass.'
  );
  assert.deepEqual(
    continueInModeInspection.reasonCodes,
    ['LOW_INFORMATION', 'AMBIGUITY_PRESENT', 'MODE_FIT', 'NEEDS_CONFIRMING_PASS']
  );
}

module.exports = {
  runRecommendationCoreTests,
};
