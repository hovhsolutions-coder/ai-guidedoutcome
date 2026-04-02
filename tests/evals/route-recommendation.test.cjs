require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { resolveNextGuidanceRoute } = require('../../src/lib/guidance-session/resolve-next-route.ts');
const { routeRecommendationScenarios } = require('./recommendation-scenarios.ts');

function runRouteRecommendationTests() {
  for (const scenario of routeRecommendationScenarios) {
    const outcome = resolveNextGuidanceRoute(scenario.session);

    assert.equal(outcome.type, scenario.expected.type, `${scenario.id}: route type drifted`);
    assert.equal(
      outcome.confidenceLabel,
      scenario.expected.confidenceLabel,
      `${scenario.id}: route confidence drifted`
    );
    assertRationaleIncludes(outcome.rationaleSummary, scenario.expected.rationaleIncludes, scenario.id);
    assert.match(outcome.reason, /\S/, `${scenario.id}: route reason should not be empty`);

    if ('recommendedTrainer' in scenario.expected) {
      assert.equal(
        outcome.recommendedTrainer,
        scenario.expected.recommendedTrainer,
        `${scenario.id}: recommended trainer drifted`
      );
    } else {
      assert.equal(outcome.recommendedTrainer, undefined, `${scenario.id}: unexpected trainer recommendation`);
    }
  }
}

module.exports = {
  runRouteRecommendationTests,
};

function assertRationaleIncludes(rationaleSummary, expectedFragments, scenarioId) {
  assert.match(rationaleSummary, /\S/, `${scenarioId}: route rationale should not be empty`);

  const normalizedRationale = rationaleSummary.toLowerCase();
  for (const fragment of expectedFragments) {
    assert.match(
      normalizedRationale,
      new RegExp(escapeRegExp(fragment.toLowerCase())),
      `${scenarioId}: route rationale no longer includes "${fragment}"`
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
