require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  createEnvelopeFirstSessionAccess,
  buildEnvelopeFirstExecutionProgress,
  buildEnvelopeFirstExecutionHandoff,
  buildEnvelopeFirstExecutionTransition,
  buildEnvelopeFirstExecutionReadySection,
  createLegacyCompatibleSessionAccess,
} = require('../../src/lib/guidance-session/envelope-first-view-model-builders.ts');
const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');
const { buildAuthoritativeGuidanceDecisionEnvelope, degradeGuidanceDecisionEnvelope } = require('../../src/lib/guidance-session/guidance-decision-envelope.ts');

function runEnvelopeFirstViewModelBuildersTests() {
  // Test createEnvelopeFirstSessionAccess with authoritative envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithEnvelope);

    assert(access !== null);
    assert.equal(access.trustState.authority.level, 'authoritative');
    assert.equal(access.trustState.authority.source, 'server_first_pass');
    assert.equal(access.trustState.isDegraded, false);
    assert(access.capabilityGates !== null);
    assert.equal(access.result, session.result);
    assert.equal(access.initialInput, session.initialInput);
    assert.equal(access.detectedDomain, session.detectedDomain);
    assert.equal(access.activeMode, session.activeMode);
    assert.deepEqual(access.intakeAnswers, session.intakeAnswers);
    assert.equal(access.shouldOfferDossier, session.shouldOfferDossier);
  }

  // Test createEnvelopeFirstSessionAccess with degraded envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithDegradedEnvelope);

    assert(access !== null);
    assert.equal(access.trustState.authority.level, 'degraded');
    assert.equal(access.trustState.authority.source, 'client_fallback_legacy_continuation');
    assert.equal(access.trustState.isDegraded, true);
    assert.equal(access.capabilityGates.canShowExecutionBridge, false);
  }

  // Test createEnvelopeFirstSessionAccess with no envelope (legacy behavior)
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

    const access = createEnvelopeFirstSessionAccess(session);

    assert(access !== null);
    assert.equal(access.trustState.authority, null);
    assert.equal(access.trustState.isDegraded, false);
    assert.equal(access.trustState.hasAuthoritativeEnvelope, false);
    assert.equal(access.result, session.result);
    assert.equal(access.initialInput, session.initialInput);
  }

  // Test createEnvelopeFirstSessionAccess with null session
  {
    const access = createEnvelopeFirstSessionAccess(null);
    assert.equal(access, null);
  }

  // Test createEnvelopeFirstSessionAccess with insufficient data
  {
    const session = {
      id: 'test-session',
      initialInput: 'test input',
      detectedDomain: 'decision',
      activeMode: 'decision',
      intakeAnswers: {},
      // No result, no trainerRecommendation, no decision envelope
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
    };

    const access = createEnvelopeFirstSessionAccess(session);
    assert.equal(access, null);
  }

  // Test buildEnvelopeFirstExecutionProgress with authoritative envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithEnvelope);
    const progress = buildEnvelopeFirstExecutionProgress(access);

    // Should return null if execution bridge capability is not available
    assert.equal(progress, null);
  }

  // Test buildEnvelopeFirstExecutionProgress with degraded envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithDegradedEnvelope);
    const progress = buildEnvelopeFirstExecutionProgress(access);

    assert.equal(progress, null);
  }

  // Test buildEnvelopeFirstExecutionHandoff with authoritative envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithEnvelope);
    const handoff = buildEnvelopeFirstExecutionHandoff(access);

    // Should return null if execution bridge capability is not available
    assert.equal(handoff, null);
  }

  // Test buildEnvelopeFirstExecutionTransition with authoritative envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithEnvelope);
    const transition = buildEnvelopeFirstExecutionTransition(access);

    // Should return null if execution bridge capability is not available
    assert.equal(transition, null);
  }

  // Test buildEnvelopeFirstExecutionReadySection with authoritative envelope
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

    const access = createEnvelopeFirstSessionAccess(sessionWithEnvelope);
    const readySection = buildEnvelopeFirstExecutionReadySection(access);

    // Should return null if execution bridge capability is not available
    assert.equal(readySection, null);
  }

  // Test createLegacyCompatibleSessionAccess
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

    const legacyAccess = createLegacyCompatibleSessionAccess(sessionWithEnvelope);

    assert(legacyAccess !== null);
    assert.equal(legacyAccess.result, session.result);
    assert.equal(legacyAccess.initialInput, session.initialInput);
    assert.equal(legacyAccess.detectedDomain, session.detectedDomain);
    assert.equal(legacyAccess.activeMode, session.activeMode);
    assert.deepEqual(legacyAccess.intakeAnswers, session.intakeAnswers);
    assert.equal(legacyAccess.shouldOfferDossier, session.shouldOfferDossier);
    
    // Should not include trustState or capabilityGates
    assert.equal(legacyAccess.trustState, undefined);
    assert.equal(legacyAccess.capabilityGates, undefined);
  }

  // Test createLegacyCompatibleSessionAccess with null session
  {
    const legacyAccess = createLegacyCompatibleSessionAccess(null);
    assert.equal(legacyAccess, null);
  }

  // Test envelope-first access preserves legacy field access
  {
    const session = createGuidanceSession({
      initialInput: 'test input with special content',
      result: {
        summary: 'special summary',
        nextStep: 'special next step',
        suggestedTasks: ['Task 1', 'Task 2'],
      },
      intakeAnswers: {
        timeline: '2 weeks',
        budget: 'moderate',
        team_size: '5-10 people',
      },
      shouldOfferDossier: true,
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const access = createEnvelopeFirstSessionAccess(sessionWithEnvelope);

    assert(access !== null);
    assert.equal(access.result, session.result);
    assert.equal(access.initialInput, 'test input with special content');
    assert.deepEqual(access.intakeAnswers, {
      timeline: '2 weeks',
      budget: 'moderate',
      team_size: '5-10 people',
    });
    assert.equal(access.shouldOfferDossier, true);
    assert.equal(access.result.suggestedTasks.length, 2);
    assert.equal(access.result.suggestedTasks[0], 'Task 1');
    assert.equal(access.result.summary, 'special summary');
  }
}

module.exports = {
  runEnvelopeFirstViewModelBuildersTests,
};
