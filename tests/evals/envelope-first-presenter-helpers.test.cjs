require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  createEnvelopeFirstPresenterContext,
  buildEnvelopeFirstResultPanelPresentation,
  buildEnvelopeFirstTrainerSectionPresentation,
  shouldPrioritizeTrainerContent,
  buildEnvelopeFirstSafeResultContent,
  createLegacyCompatiblePresenterContext,
} = require('../../src/lib/guidance-session/envelope-first-presenter-helpers.ts');
const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');
const { buildAuthoritativeGuidanceDecisionEnvelope, degradeGuidanceDecisionEnvelope } = require('../../src/lib/guidance-session/guidance-decision-envelope.ts');

function runEnvelopeFirstPresenterHelpersTests() {
  // Test createEnvelopeFirstPresenterContext with authoritative envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: ['Task 1', 'Task 2'],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);

    assert(context !== null);
    assert.equal(context.trustState.authority.level, 'authoritative');
    assert.equal(context.trustState.authority.source, 'server_first_pass');
    assert.equal(context.trustState.isDegraded, false);
    assert(context.capabilityGates !== null);
    assert.equal(context.result, session.result);
    assert.equal(context.initialInput, session.initialInput);
    assert.equal(context.detectedDomain, session.detectedDomain);
    assert.equal(context.activeMode, session.activeMode);
    assert.deepEqual(context.intakeAnswers, session.intakeAnswers);
    assert.equal(context.shouldOfferDossier, session.shouldOfferDossier);
    assert(context.copyProfile !== null);
    assert(context.lexicon !== null);
    assert(context.modeConfig !== null);
  }

  // Test createEnvelopeFirstPresenterContext with degraded envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: ['Task 1', 'Task 2'],
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

    const context = createEnvelopeFirstPresenterContext(sessionWithDegradedEnvelope);

    assert(context !== null);
    assert.equal(context.trustState.authority.level, 'degraded');
    assert.equal(context.trustState.authority.source, 'client_fallback_legacy_continuation');
    assert.equal(context.trustState.isDegraded, true);
    assert.equal(context.capabilityGates.canShowTrainerRecommendation, false);
  }

  // Test createEnvelopeFirstPresenterContext with no envelope (legacy behavior)
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
        suggestedTasks: ['Task 1', 'Task 2'],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
      // No decision envelope - this is the legacy case
    };

    const context = createEnvelopeFirstPresenterContext(session);

    assert(context !== null);
    assert.equal(context.trustState.authority, null);
    assert.equal(context.trustState.isDegraded, false);
    assert.equal(context.trustState.hasAuthoritativeEnvelope, false);
    assert.equal(context.result, session.result);
    assert.equal(context.initialInput, session.initialInput);
  }

  // Test createEnvelopeFirstPresenterContext with null session
  {
    const context = createEnvelopeFirstPresenterContext(null);
    assert.equal(context, null);
  }

  // Test createEnvelopeFirstPresenterContext with insufficient data
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

    const context = createEnvelopeFirstPresenterContext(session);
    assert.equal(context, null);
  }

  // Test buildEnvelopeFirstResultPanelPresentation with authoritative envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: ['Task 1', 'Task 2'],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);
    const legacyPanel = {
      result: session.result,
      isLoading: false,
      lastGeneratedAt: '4:15 PM',
    };

    const presentation = buildEnvelopeFirstResultPanelPresentation(
      context,
      legacyPanel,
      false,
      '4:15 PM'
    );

    assert(presentation !== null);
    assert.equal(presentation.result, session.result);
    assert.equal(presentation.isLoading, false);
    assert.equal(presentation.lastGeneratedAt, '4:15 PM');
    assert.equal(presentation.detectedDomain, session.detectedDomain);
    assert.equal(presentation.activeMode, session.activeMode);
    assert.equal(presentation.shouldOfferDossier, session.shouldOfferDossier);
  }

  // Test buildEnvelopeFirstTrainerSectionPresentation with authoritative envelope
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
        suggestedTasks: ['Task 1', 'Task 2'],
      },
      trainerRecommendation: {
        topTrainer: 'communication',
        orderedTrainers: ['communication', 'strategy', 'risk', 'execution'],
        confidenceLabel: 'high',
        rationaleSummary: 'Communication is the best fit for this session',
        inlineActions: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
    };

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
      trainerRecommendation: session.trainerRecommendation,
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);

    const presentation = buildEnvelopeFirstTrainerSectionPresentation(
      context,
      'communication',
      null,
      null
    );

    assert(presentation !== null);
    assert.equal(presentation.nextPath.guidanceSession, sessionWithEnvelope);
    assert.equal(presentation.nextPath.activeTrainer, 'communication');
    assert.equal(presentation.nextPath.trainerLoading, null);
    assert.equal(presentation.response.response, null);
    assert.equal(presentation.response.error, null);
    assert.equal(presentation.response.loadingTrainer, null);
  }

  // Test buildEnvelopeFirstTrainerSectionPresentation with degraded envelope
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
        suggestedTasks: ['Task 1', 'Task 2'],
      },
      trainerRecommendation: {
        topTrainer: 'communication',
        orderedTrainers: ['communication', 'strategy', 'risk', 'execution'],
        confidenceLabel: 'high',
        rationaleSummary: 'Communication is the best fit for this session',
        inlineActions: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
    };

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
      trainerRecommendation: session.trainerRecommendation,
    });

    const degradedDecision = degradeGuidanceDecisionEnvelope(decision, {
      source: 'client_fallback_legacy_continuation',
      degradedReason: 'legacy_continuation_contract',
    });

    const sessionWithDegradedEnvelope = { ...session, decision: degradedDecision };

    const context = createEnvelopeFirstPresenterContext(sessionWithDegradedEnvelope);

    const presentation = buildEnvelopeFirstTrainerSectionPresentation(
      context,
      'communication',
      null,
      null
    );

    // Should return trainer section even when trainer recommendation capability is blocked
    // Note: After envelope-first migration, trainer section is shown when there's a guidance session
    // regardless of trainer recommendation capability
    assert(presentation !== null);
    assert.equal(presentation.nextPath.guidanceSession, sessionWithDegradedEnvelope);
  }

  // Test shouldPrioritizeTrainerContent with authoritative envelope
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
        suggestedTasks: ['Task 1', 'Task 2'],
      },
      trainerRecommendation: {
        topTrainer: 'communication',
        orderedTrainers: ['communication', 'strategy', 'risk', 'execution'],
        confidenceLabel: 'high',
        rationaleSummary: 'Communication is the best fit for this session',
        inlineActions: [],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
    };

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
      trainerRecommendation: session.trainerRecommendation,
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);

    const shouldPrioritize = shouldPrioritizeTrainerContent(
      context,
      'explore',
      'trainer response',
      null,
      null
    );

    assert.equal(shouldPrioritize, true);
  }

  // Test shouldPrioritizeTrainerContent with degraded envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: ['Task 1', 'Task 2'],
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

    const context = createEnvelopeFirstPresenterContext(sessionWithDegradedEnvelope);

    const shouldPrioritize = shouldPrioritizeTrainerContent(
      context,
      'explore',
      'trainer response',
      null,
      null
    );

    // Should not prioritize when trainer recommendation capability is blocked
    assert.equal(shouldPrioritize, false);
  }

  // Test shouldPrioritizeTrainerContent with no envelope (legacy behavior)
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
        suggestedTasks: ['Task 1', 'Task 2'],
      },
      createdAt: '2026-03-22T14:00:00.000Z',
      shouldOfferDossier: false,
      // No decision envelope - this is the legacy case
    };

    const context = createEnvelopeFirstPresenterContext(session);

    const shouldPrioritize = shouldPrioritizeTrainerContent(
      context,
      'explore',
      'trainer response',
      null,
      null
    );

    // Should use legacy behavior when no envelope
    assert.equal(shouldPrioritize, true);
  }

  // Test buildEnvelopeFirstSafeResultContent with authoritative envelope
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: ['Task 1', 'Task 2'],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);
    const safeContent = buildEnvelopeFirstSafeResultContent(context);

    assert(safeContent !== null);
    assert.equal(safeContent.summary, 'test summary');
    assert.equal(safeContent.nextStep, 'test next step');
    assert.deepEqual(safeContent.suggestedTasks, ['Task 1', 'Task 2']);
    assert.equal(safeContent.isDegraded, false);
  }

  // Test buildEnvelopeFirstSafeResultContent with no result
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      // No result
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);
    const safeContent = buildEnvelopeFirstSafeResultContent(context);

    assert(safeContent !== null);
    assert.equal(safeContent.summary, null);
    assert.equal(safeContent.nextStep, null);
    assert.equal(safeContent.suggestedTasks, null);
    assert.equal(safeContent.isDegraded, false);
  }

  // Test createLegacyCompatiblePresenterContext
  {
    const session = createGuidanceSession({
      initialInput: 'test input',
      result: {
        summary: 'test summary',
        nextStep: 'test next step',
        suggestedTasks: ['Task 1', 'Task 2'],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const legacyContext = createLegacyCompatiblePresenterContext(sessionWithEnvelope);

    assert(legacyContext !== null);
    assert.equal(legacyContext.result, session.result);
    assert.equal(legacyContext.initialInput, session.initialInput);
    assert.equal(legacyContext.detectedDomain, session.detectedDomain);
    assert.equal(legacyContext.activeMode, session.activeMode);
    assert.deepEqual(legacyContext.intakeAnswers, session.intakeAnswers);
    assert.equal(legacyContext.shouldOfferDossier, session.shouldOfferDossier);
    
    // Should not include trustState or capabilityGates
    assert.equal(legacyContext.trustState, undefined);
    assert.equal(legacyContext.capabilityGates, undefined);
  }

  // Test createLegacyCompatiblePresenterContext with null session
  {
    const legacyContext = createLegacyCompatiblePresenterContext(null);
    assert.equal(legacyContext, null);
  }

  // Test envelope-first context preserves computed helpers
  {
    const session = createGuidanceSession({
      initialInput: 'Need help with a decision',
      detectedDomain: 'decision',
      activeMode: 'decision',
      result: {
        summary: 'Decision guidance summary',
        nextStep: 'Next decision step',
        suggestedTasks: ['Task A', 'Task B'],
      },
    });

    const decision = buildAuthoritativeGuidanceDecisionEnvelope({
      session,
      authoritySource: 'server_first_pass',
    });

    const sessionWithEnvelope = { ...session, decision };

    const context = createEnvelopeFirstPresenterContext(sessionWithEnvelope);

    assert(context !== null);
    assert(context.copyProfile !== null);
    assert(context.lexicon !== null);
    assert(context.modeConfig !== null);
    assert.equal(context.copyProfile.domainFamily, 'clarity'); // 'decision' domain maps to 'clarity' family
    assert(context.lexicon !== null);
    assert(context.modeConfig !== null);
  }
}

module.exports = {
  runEnvelopeFirstPresenterHelpersTests,
};
