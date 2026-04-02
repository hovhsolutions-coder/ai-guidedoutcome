require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { adaptGuidanceSessionToDecisionInput } = require('../../src/lib/recommendations/adapters/from-guidance-session.ts');
const { adaptTrainerRecommendationInput } = require('../../src/lib/recommendations/adapters/from-trainer-input.ts');
const {
  routeRecommendationScenarios,
  trainerRecommendationScenarios,
} = require('./recommendation-scenarios.ts');

function runRecommendationAdapterTests() {
  const routeWithResult = routeRecommendationScenarios.find((scenario) => scenario.id === 'route_convert_to_dossier_high');
  const routeWithoutResult = routeRecommendationScenarios.find((scenario) => scenario.id === 'route_no_result_guarded');
  const trainerScenario = trainerRecommendationScenarios.find((scenario) => scenario.id === 'trainer_execution_high');

  const normalizedRoute = adaptGuidanceSessionToDecisionInput(routeWithResult.session);
  assert.equal(normalizedRoute.surface, 'universal_guidance');
  assert.equal(normalizedRoute.resultExists, true);
  assert.equal(normalizedRoute.detectedDomain, routeWithResult.session.detectedDomain);
  assert.equal(normalizedRoute.activeMode, routeWithResult.session.activeMode);
  assert.equal(normalizedRoute.shouldOfferDossier, routeWithResult.session.shouldOfferDossier);
  assert.equal(normalizedRoute.suggestedTaskCount, routeWithResult.session.result.suggestedTasks.length);
  assert.equal(normalizedRoute.currentGuidanceNextStep, routeWithResult.session.result.nextStep);
  assert.equal(normalizedRoute.signals.actionReady, true);
  assert.equal(normalizedRoute.signals.executionReadiness, false);
  assert.equal(normalizedRoute.signals.informationCompleteness, 'high');
  assert.equal(normalizedRoute.signals.momentumState, 'none');
  assert.equal(normalizedRoute.signals.conflictPresent, false);

  const normalizedPreResult = adaptGuidanceSessionToDecisionInput(routeWithoutResult.session);
  assert.equal(normalizedPreResult.surface, 'universal_guidance');
  assert.equal(normalizedPreResult.resultExists, false);
  assert.equal(normalizedPreResult.suggestedTaskCount, 0);
  assert.equal(normalizedPreResult.currentGuidanceNextStep, undefined);
  assert.equal(normalizedPreResult.signals.informationCompleteness, 'low');
  assert.equal(normalizedPreResult.signals.actionReady, false);
  assert.equal(normalizedPreResult.signals.executionReadiness, false);

  const normalizedTrainer = adaptTrainerRecommendationInput(trainerScenario.input);
  assert.equal(normalizedTrainer.surface, 'trainer_compatibility');
  assert.equal(normalizedTrainer.resultExists, true);
  assert.equal(normalizedTrainer.phase, trainerScenario.input.phase);
  assert.equal(normalizedTrainer.totalTasks, trainerScenario.input.totalTasks);
  assert.equal(normalizedTrainer.completedCount, trainerScenario.input.completedCount);
  assert.equal(normalizedTrainer.currentObjective, trainerScenario.input.currentObjective);
  assert.equal(normalizedTrainer.currentGuidanceSummary, trainerScenario.input.currentGuidanceSummary);
  assert.equal(normalizedTrainer.signals.actionReady, true);
  assert.equal(normalizedTrainer.signals.executionReadiness, true);
  assert.equal(normalizedTrainer.signals.momentumState, 'present');
  assert.equal(normalizedTrainer.signals.urgencyLevel, 'high');
  assert.equal(normalizedTrainer.signals.hasTasks, true);
}

module.exports = {
  runRecommendationAdapterTests,
};
