require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { resolveTrainerRecommendations } = require('../../src/lib/trainers/resolve-trainer-recommendations.ts');
const { trainerRecommendationScenarios } = require('./recommendation-scenarios.ts');

function runTrainerRecommendationTests() {
  for (const scenario of trainerRecommendationScenarios) {
    const recommendation = resolveTrainerRecommendations(scenario.input);

    assert.equal(
      recommendation.topTrainer,
      scenario.expected.topTrainer,
      `${scenario.id}: top trainer drifted`
    );
    assert.equal(
      recommendation.confidenceLabel,
      scenario.expected.confidenceLabel,
      `${scenario.id}: trainer confidence drifted`
    );
    assertRationaleIncludes(recommendation.rationaleSummary, scenario.expected.rationaleIncludes, scenario.id);
    assert.equal(
      recommendation.orderedTrainers[0],
      scenario.expected.topTrainer,
      `${scenario.id}: first ranked trainer drifted`
    );
    assert.equal(
      recommendation.inlineActions[0].trainer,
      scenario.expected.topTrainer,
      `${scenario.id}: primary inline trainer drifted`
    );
    assert.equal(recommendation.inlineActions[0].emphasized, true, `${scenario.id}: primary action should stay emphasized`);
  }
}

module.exports = {
  runTrainerRecommendationTests,
};

function assertRationaleIncludes(rationaleSummary, expectedFragments, scenarioId) {
  assert.match(rationaleSummary, /\S/, `${scenarioId}: trainer rationale should not be empty`);

  const normalizedRationale = rationaleSummary.toLowerCase();
  for (const fragment of expectedFragments) {
    assert.match(
      normalizedRationale,
      new RegExp(escapeRegExp(fragment.toLowerCase())),
      `${scenarioId}: trainer rationale no longer includes "${fragment}"`
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
