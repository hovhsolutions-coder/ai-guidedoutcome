require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { resolveNextGuidanceRoute } = require('../../src/lib/guidance-session/resolve-next-route.ts');
const { resolveTrainerRecommendations } = require('../../src/lib/trainers/resolve-trainer-recommendations.ts');
const {
  routeRecommendationScenarios,
  trainerRecommendationScenarios,
} = require('./recommendation-scenarios.ts');

function runRecommendationWrapperParityTests() {
  const preResultScenario = routeRecommendationScenarios.find((scenario) => scenario.id === 'route_no_result_guarded');
  const routeOutcome = resolveNextGuidanceRoute(preResultScenario.session);
  assert.equal(routeOutcome.type, 'stay_in_guidance');
  assert.equal(routeOutcome.confidenceLabel, 'guarded');
  assert.equal(routeOutcome.reason, 'No guidance result exists yet, so the session should remain in the guidance loop.');
  assert.equal(routeOutcome.rationaleSummary, 'A route recommendation will become clearer after the first guidance read.');

  const trainerScenario = trainerRecommendationScenarios.find((scenario) => scenario.id === 'trainer_strategy_high');
  const trainerRecommendation = resolveTrainerRecommendations(trainerScenario.input);
  assert.equal(trainerRecommendation.topTrainer, trainerScenario.expected.topTrainer);
  assert.equal(trainerRecommendation.confidenceLabel, trainerScenario.expected.confidenceLabel);
  assert.equal(trainerRecommendation.inlineActions[0].emphasized, true);
}

module.exports = {
  runRecommendationWrapperParityTests,
};
