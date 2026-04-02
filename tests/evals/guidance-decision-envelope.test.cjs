require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');
const { buildFirstPassGuidanceSession } = require('../../src/lib/guidance-session/build-first-pass-guidance-session.ts');
const {
  createGuidanceDecisionEnvelopeFromSession,
  degradeGuidanceDecisionEnvelope,
} = require('../../src/lib/guidance-session/guidance-decision-envelope.ts');

function runGuidanceDecisionEnvelopeTests() {
  const baseSession = createGuidanceSession({
    initialInput: 'Need a rollout plan with owners and timing.',
    intakeAnswers: {
      timeline: 'Launch starts next month',
      resources: 'Two PMs and one engineer',
    },
  });

  assert.ok(baseSession.decision, 'create-session should always attach a decision envelope');
  assert.equal(baseSession.decision.authority.level, 'authoritative');
  assert.equal(baseSession.decision.authority.source, 'create_session');
  assert.equal(baseSession.decision.domain.primary, baseSession.detectedDomain);
  assert.equal(baseSession.decision.mode.active, baseSession.activeMode);
  assert.equal(baseSession.decision.safeUiCapabilities.result, true);
  assert.equal(baseSession.decision.safeUiCapabilities.onboardingShell, false);
  assert.equal(baseSession.decision.executionReadiness.isReady, false);

  const firstPassSession = buildFirstPassGuidanceSession(baseSession, {
    summary: 'The rollout plan is stable enough to move into tracked execution.',
    nextStep: 'Define the final owner sequence for launch week',
    suggestedTasks: ['Confirm launch owners', 'Lock the checklist'],
  });

  assert.ok(firstPassSession.decision, 'first-pass session should retain a decision envelope');
  assert.equal(firstPassSession.decision.authority.level, 'authoritative');
  assert.equal(firstPassSession.decision.authority.source, 'server_first_pass');
  assert.equal(firstPassSession.decision.routeOutcome.type, firstPassSession.routeOutcome.type);
  assert.equal(firstPassSession.decision.trainerRecommendation.topTrainer, firstPassSession.trainerRecommendation.topTrainer);
  assert.equal(firstPassSession.decision.phase, firstPassSession.phase);
  assert.deepEqual(firstPassSession.decision.progressionSnapshot, firstPassSession.progressionSnapshot);
  assert.equal(firstPassSession.decision.executionReadiness.isReady, true);
  assert.equal(firstPassSession.decision.safeUiCapabilities.executionBridge, true);
  assert.equal(firstPassSession.decision.safeUiCapabilities.phaseProgression, true);

  const degradedDecision = degradeGuidanceDecisionEnvelope(
    createGuidanceDecisionEnvelopeFromSession(firstPassSession, {
      authoritySource: 'server_first_pass',
    }),
    {
      source: 'client_fallback_recomputed',
      degradedReason: 'missing_authoritative_continuation',
    }
  );

  assert.equal(degradedDecision.authority.level, 'degraded');
  assert.equal(degradedDecision.authority.source, 'client_fallback_recomputed');
  assert.equal(degradedDecision.authority.degradedReason, 'missing_authoritative_continuation');
  assert.equal(degradedDecision.routeOutcome.type, firstPassSession.routeOutcome.type);
  assert.equal(degradedDecision.safeUiCapabilities.executionBridge, true);
}

module.exports = {
  runGuidanceDecisionEnvelopeTests,
};
