require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { adaptGuidanceSessionToDecisionInput } = require('../../src/lib/recommendations/adapters/from-guidance-session.ts');
const { adaptTrainerRecommendationInput } = require('../../src/lib/recommendations/adapters/from-trainer-input.ts');
const { getInitialDossierPhase } = require('../../src/lib/dossiers/build-generated-dossier.ts');
const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');
const { inspectRouteDecision, inspectTrainerRecommendationDecision } = require('../../src/lib/recommendations/core.ts');
const { serverContinuationScenarios } = require('./server-continuation-scenarios.ts');

function runServerContinuationTests() {
  for (const scenario of serverContinuationScenarios) {
    const session = createGuidanceSession(scenario.sessionInput);
    const routeInspection = inspectRouteDecision(adaptGuidanceSessionToDecisionInput(session));
    const trainerInspection = inspectTrainerRecommendationDecision(adaptTrainerRecommendationInput({
      phase: getInitialDossierPhase(session.activeMode),
      totalTasks: session.result?.suggestedTasks.length ?? 0,
      completedCount: 0,
      currentObjective: session.result?.nextStep ?? '',
      currentGuidanceSummary: session.result?.summary,
      currentGuidanceNextStep: session.result?.nextStep,
      activeMode: session.activeMode,
      detectedDomain: session.detectedDomain,
    }));
    const routeOutcome = routeInspection.decision;
    const trainerRecommendation = trainerInspection.recommendation;

    if ('kind' in routeOutcome) {
      throw new Error(`${scenario.id}: expected a concrete route outcome, received gated pre-result state`);
    }

    assert.equal(routeOutcome.type, scenario.expected.routeOutcome.type, `${scenario.id}: server route type drifted`);
    assert.equal(
      routeOutcome.confidenceLabel,
      scenario.expected.routeOutcome.confidenceLabel,
      `${scenario.id}: server route confidence drifted`
    );
    assertRationaleIncludes(
      routeOutcome.rationaleSummary,
      scenario.expected.routeOutcome.rationaleIncludes,
      `${scenario.id}: route`
    );
    assert.deepEqual(routeInspection.reasonCodes, scenario.expected.routeOutcome.reasonCodes, `${scenario.id}: route reason codes drifted`);

    if ('recommendedTrainer' in scenario.expected.routeOutcome) {
      assert.equal(
        routeOutcome.recommendedTrainer,
        scenario.expected.routeOutcome.recommendedTrainer,
        `${scenario.id}: server recommended trainer drifted`
      );
    } else {
      assert.equal(routeOutcome.recommendedTrainer, undefined, `${scenario.id}: unexpected server recommended trainer`);
    }

    assert.equal(
      trainerRecommendation.topTrainer,
      scenario.expected.trainerRecommendation.topTrainer,
      `${scenario.id}: server trainer top choice drifted`
    );
    assert.equal(
      trainerRecommendation.confidenceLabel,
      scenario.expected.trainerRecommendation.confidenceLabel,
      `${scenario.id}: server trainer confidence drifted`
    );
    assertRationaleIncludes(
      trainerRecommendation.rationaleSummary,
      scenario.expected.trainerRecommendation.rationaleIncludes,
      `${scenario.id}: trainer`
    );
    assert.deepEqual(
      trainerInspection.reasonCodes,
      scenario.expected.trainerRecommendation.reasonCodes,
      `${scenario.id}: trainer reason codes drifted`
    );
    assert.equal(
      trainerRecommendation.orderedTrainers[0],
      scenario.expected.trainerRecommendation.topTrainer,
      `${scenario.id}: server trainer ordering drifted`
    );
  }
}

module.exports = {
  runServerContinuationTests,
};

function assertRationaleIncludes(rationaleSummary, expectedFragments, label) {
  assert.match(rationaleSummary, /\S/, `${label}: rationale should not be empty`);

  const normalizedRationale = rationaleSummary.toLowerCase();
  for (const fragment of expectedFragments) {
    assert.match(
      normalizedRationale,
      new RegExp(escapeRegExp(fragment.toLowerCase())),
      `${label}: rationale no longer includes "${fragment}"`
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
