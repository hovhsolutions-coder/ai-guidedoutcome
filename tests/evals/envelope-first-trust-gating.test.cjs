require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  getEnvelopeFirstTrustState,
  getEnvelopeFirstCapabilityGates,
  shouldRenderDegradedSafeUI,
  getSafeTrainerRecommendation,
  getSafeFollowUpQuestion,
  getSafeExecutionReadiness,
  filterContentByAuthority,
} = require('../../src/lib/guidance-session/envelope-first-trust-gating.ts');
const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');
const { buildAuthoritativeGuidanceDecisionEnvelope, degradeGuidanceDecisionEnvelope } = require('../../src/lib/guidance-session/guidance-decision-envelope.ts');

function runEnvelopeFirstTrustGatingTests() {
  // Test getEnvelopeFirstTrustState with authoritative envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const trustState = getEnvelopeFirstTrustState(sessionWithEnvelope);

    assert.equal(trustState.authority.level, 'authoritative');
    assert.equal(trustState.authority.source, 'server_first_pass');
    assert.equal(trustState.isDegraded, false);
    assert.equal(trustState.hasAuthoritativeEnvelope, true);
    assert(trustState.safeUiCapabilities !== null);
  }

  // Test getEnvelopeFirstTrustState with degraded envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const degradedDecision = degradeGuidanceDecisionEnvelope(decision, {
      source: 'client_fallback_legacy_continuation',
      degradedReason: 'legacy_continuation_contract',
    });

    const sessionWithDegradedEnvelope = { ...session, decision: degradedDecision };

    const trustState = getEnvelopeFirstTrustState(sessionWithDegradedEnvelope);

    assert.equal(trustState.authority.level, 'degraded');
    assert.equal(trustState.authority.source, 'client_fallback_legacy_continuation');
    assert.equal(trustState.authority.degradedReason, 'legacy_continuation_contract');
    assert.equal(trustState.isDegraded, true);
    assert.equal(trustState.hasAuthoritativeEnvelope, false);
  }

  // Test getEnvelopeFirstTrustState with no envelope
  {
    const session = {
      id: 'test-session',
      initialInput: 'test input',
      detectedDomain: 'decision',
      activeMode: 'decision',
      intakeAnswers: {},
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
      // No decision envelope - this is the legacy case
    };

    const trustState = getEnvelopeFirstTrustState(session);

    assert.equal(trustState.authority, null);
    assert.equal(trustState.isDegraded, false);
    assert.equal(trustState.hasAuthoritativeEnvelope, false);
    assert.equal(trustState.safeUiCapabilities, null);
  }

  // Test getEnvelopeFirstCapabilityGates with authoritative envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const gates = getEnvelopeFirstCapabilityGates(sessionWithEnvelope);

    // Basic session may not have characterProfile.intro, so onboardingShell might be false
    assert.equal(gates.canShowOnboardingShell, false);
    assert.equal(gates.canShowFollowUpInput, false); // No follow-up question in basic session
    assert.equal(gates.canShowTrainerRecommendation, false); // Basic session may not have trainer recommendation
    assert.equal(gates.canShowExecutionBridge, false); // Not execution ready
    assert.equal(gates.canShowPhaseProgression, false); // Basic session may not have phase and progressionSnapshot
  }

  // Test getEnvelopeFirstCapabilityGates with degraded envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const degradedDecision = degradeGuidanceDecisionEnvelope(decision, {
      source: 'client_fallback_legacy_continuation',
      degradedReason: 'legacy_continuation_contract',
    });

    const sessionWithDegradedEnvelope = { ...session, decision: degradedDecision };

    const gates = getEnvelopeFirstCapabilityGates(sessionWithDegradedEnvelope);

    assert.equal(gates.canShowOnboardingShell, false); // Basic shell still allowed but no characterProfile.intro
    assert.equal(gates.canShowFollowUpInput, false);
    assert.equal(gates.canShowTrainerRecommendation, false);
    assert.equal(gates.canShowExecutionBridge, false);
    assert.equal(gates.canShowPhaseProgression, false);
  }

  // Test getEnvelopeFirstCapabilityGates with no envelope (legacy behavior)
  {
    const session = {
      id: 'test-session',
      initialInput: 'test input',
      detectedDomain: 'decision',
      activeMode: 'decision',
      intakeAnswers: {},
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
      // No decision envelope - this is the legacy case
    };

    const gates = getEnvelopeFirstCapabilityGates(session);

    // Should allow legacy behavior based on field presence
    assert.equal(gates.canShowOnboardingShell, false); // No character profile
    assert.equal(gates.canShowFollowUpInput, false);
    assert.equal(gates.canShowTrainerRecommendation, false);
    assert.equal(gates.canShowExecutionBridge, false);
    assert.equal(gates.canShowPhaseProgression, false);
  }

  // Test shouldRenderDegradedSafeUI
  {
    const session = {
      id: 'test-session',
      initialInput: 'test input',
      detectedDomain: 'decision',
      activeMode: 'decision',
      intakeAnswers: {},
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
      // No decision envelope - this is the legacy case
    };

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const degradedDecision = degradeGuidanceDecisionEnvelope(decision, {
      source: 'client_fallback_legacy_continuation',
      degradedReason: 'legacy_continuation_contract',
    });

    const sessionWithDegradedEnvelope = { ...session, decision: degradedDecision };

    assert.equal(shouldRenderDegradedSafeUI(sessionWithDegradedEnvelope), true);
    assert.equal(shouldRenderDegradedSafeUI({ ...session, decision }), false);
    assert.equal(shouldRenderDegradedSafeUI(session), true);
  }

  // Test getSafeTrainerRecommendation
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const degradedDecision = degradeGuidanceDecisionEnvelope(decision, {
      source: 'client_fallback_legacy_continuation',
      degradedReason: 'legacy_continuation_contract',
    });

    const sessionWithEnvelope = { ...session, decision };
    const sessionWithDegradedEnvelope = { ...session, decision: degradedDecision };

    const trainerRec = getSafeTrainerRecommendation(sessionWithEnvelope);
    const degradedTrainerRec = getSafeTrainerRecommendation(sessionWithDegradedEnvelope);

    // Basic session may not have trainer recommendation, so expect undefined
    assert.equal(trainerRec, undefined);
    assert.equal(degradedTrainerRec, undefined);
  }

  // Test filterContentByAuthority
  {
    const session = {
      id: 'test-session',
      initialInput: 'test input',
      detectedDomain: 'decision',
      activeMode: 'decision',
      intakeAnswers: {},
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
      // No decision envelope - this is the legacy case
    };

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const degradedDecision = degradeGuidanceDecisionEnvelope(decision, {
      source: 'client_fallback_legacy_continuation',
      degradedReason: 'legacy_continuation_contract',
    });

    const sessionWithEnvelope = { ...session, decision };
    const sessionWithDegradedEnvelope = { ...session, decision: degradedDecision };

    const content = { sensitive: 'data' };

    // Should filter when authoritative required but not present
    const filtered1 = filterContentByAuthority(content, session, {
      requireAuthoritative: true,
    });
    assert.equal(filtered1, undefined);

    // Should filter when not allowed in degraded
    const filtered2 = filterContentByAuthority(content, sessionWithDegradedEnvelope, {
      allowedInDegraded: false,
    });
    assert.equal(filtered2, undefined);

    // Should pass content when all conditions met
    const filtered3 = filterContentByAuthority(content, sessionWithEnvelope);
    assert.deepEqual(filtered3, content);
  }
}

module.exports = {
  runEnvelopeFirstTrustGatingTests,
};
