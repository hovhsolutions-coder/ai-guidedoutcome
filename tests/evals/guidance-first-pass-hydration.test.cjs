require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { hydrateFirstPassGuidanceState } = require('../../src/lib/guidance-session/hydrate-first-pass-guidance-state.ts');

function runGuidanceFirstPassHydrationTests() {
  const continuation = {
    decision: {
      decisionVersion: 1,
      authority: {
        level: 'authoritative',
        source: 'server_first_pass',
      },
      domain: {
        primary: 'planning',
        shouldOfferDossier: true,
      },
      mode: {
        active: 'planning',
      },
      intentProfile: {
        primaryIntent: 'plan',
        preferredTone: 'structured',
        responseDepth: 'structured',
      },
      routeOutcome: {
        type: 'convert_to_dossier',
        reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
        confidenceLabel: 'high',
        rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
        activeMode: 'planning',
      },
      trainerRecommendation: {
        orderedTrainers: ['execution', 'strategy', 'risk', 'communication'],
        topTrainer: 'execution',
        confidenceLabel: 'medium',
        rationaleSummary: 'Execution is the clearest specialist angle for the current session, with a few nearby alternatives still in play.',
        inlineActions: [
          { trainer: 'execution', label: 'Make executable', emphasized: true },
          { trainer: 'strategy', label: 'Reframe strategy', emphasized: false },
          { trainer: 'risk', label: 'Check risks', emphasized: false },
          { trainer: 'communication', label: 'Shape message', emphasized: false },
        ],
      },
      followUpQuestion: {
        intent: 'clarify_documentation',
        question: 'What plan, evidence, or structure needs to be captured so the next move is clear?',
      },
      onboardingState: 'intro_plus_followup',
      phase: 'clarifying',
      progressionSnapshot: {
        phase: 'clarifying',
        phaseLabel: 'clarifying',
        phaseSummary: 'The system is clarifying the situation before it pushes you into a heavier path.',
        hasFollowUpHistory: false,
        showsFollowUp: true,
        showsNextStep: false,
      },
      executionReadiness: {
        isReady: false,
        reason: 'needs_clarification',
      },
      safeUiCapabilities: {
        result: true,
        onboardingShell: true,
        trainerRecommendation: true,
        executionBridge: false,
        followUpInput: true,
        phaseProgression: true,
      },
    },
    detectedDomain: 'planning',
    activeMode: 'planning',
    shouldOfferDossier: true,
    routeOutcome: {
      type: 'convert_to_dossier',
      reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
      confidenceLabel: 'high',
      rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      activeMode: 'planning',
    },
    trainerRecommendation: {
      orderedTrainers: ['execution', 'strategy', 'risk', 'communication'],
      topTrainer: 'execution',
      confidenceLabel: 'medium',
      rationaleSummary: 'Execution is the clearest specialist angle for the current session, with a few nearby alternatives still in play.',
      inlineActions: [
        { trainer: 'execution', label: 'Make executable', emphasized: true },
        { trainer: 'strategy', label: 'Reframe strategy', emphasized: false },
        { trainer: 'risk', label: 'Check risks', emphasized: false },
        { trainer: 'communication', label: 'Shape message', emphasized: false },
      ],
    },
    followUpQuestion: {
      intent: 'clarify_documentation',
      question: 'What plan, evidence, or structure needs to be captured so the next move is clear?',
    },
    characterProfile: {
      archetypeId: 'builder',
      guidanceStyle: 'structured, practical, and systems-oriented',
      progressionPath: 'Clear plans, durable structures, and reliable progress through complexity.',
      recommendedSkills: ['execution_discipline', 'decision_making', 'communication_meta'],
      intro: {
        title: 'The Builder',
        introText: 'You grow by turning vague ambition into working structure that can carry real execution.',
        guidanceStyle: 'structured, practical, and systems-oriented',
        firstFocus: 'Turn loose intent into a plan that can survive real-world execution.',
        recommendedStartingSkills: ['execution_discipline', 'decision_making'],
      },
    },
    progressionState: {
      currentLevel: 2,
      skillPoints: 5,
      unlockedSkills: ['execution_discipline'],
      readiness: 'approaching',
      nextLevel: 3,
    },
  };

  let fallbackBuildCalled = false;
  const authoritativeState = hydrateFirstPassGuidanceState(
    {
      rawInput: 'We need a launch owner plan for the next release.',
      intakeAnswers: { main_goal: 'Lock the launch operating plan' },
      continuation,
      result: {
        summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
        nextStep: 'Define the final owner sequence for launch week',
        suggestedTasks: ['Confirm launch owners', 'Lock the checklist', 'Capture the open dependencies'],
      },
      fallbackDetectedDomain: 'decision',
      fallbackActiveMode: 'decision',
      fallbackShouldOfferDossier: false,
    },
    {
      buildFirstPassSession: () => {
        fallbackBuildCalled = true;
        throw new Error('Fallback recomputation should not run when authoritative continuation exists.');
      },
    }
  );

  assert.equal(authoritativeState.usedAuthoritativeContinuation, true);
  assert.equal(fallbackBuildCalled, false);
  assert.ok(authoritativeState.guidanceSession.decision, 'authoritative continuation should hydrate a decision envelope');
  assert.equal(authoritativeState.guidanceSession.decision.authority.level, 'authoritative');
  assert.equal(authoritativeState.guidanceSession.decision.authority.source, 'server_continuation');
  assert.equal(authoritativeState.guidanceSession.routeOutcome.type, 'convert_to_dossier');
  assert.equal(authoritativeState.guidanceSession.trainerRecommendation.topTrainer, 'execution');
  assert.deepEqual(authoritativeState.guidanceSession.followUpQuestion, continuation.followUpQuestion);
  assert.equal(authoritativeState.guidanceSession.onboardingState, continuation.decision?.onboardingState);
  assert.equal(authoritativeState.guidanceSession.phase, continuation.decision?.phase);
  assert.deepEqual(authoritativeState.guidanceSession.progressionSnapshot, continuation.decision?.progressionSnapshot);
  assert.deepEqual(authoritativeState.guidanceSession.characterProfile, continuation.characterProfile);
  assert.deepEqual(authoritativeState.guidanceSession.characterProfile.intro, continuation.characterProfile.intro);
  assert.deepEqual(authoritativeState.guidanceSession.progressionState, continuation.progressionState);
  assert.deepEqual(authoritativeState.resultMeta, {
    detectedDomain: 'planning',
    activeMode: 'planning',
    shouldOfferDossier: true,
  });

  let fallbackCalls = 0;
  const fallbackSession = {
    id: 'fallback_session',
    initialInput: 'Fallback input',
    detectedDomain: 'decision',
    activeMode: 'decision',
    intakeAnswers: {},
    result: {
      summary: 'Fallback summary',
      nextStep: 'Fallback next step',
      suggestedTasks: ['Fallback task'],
    },
    routeOutcome: {
      type: 'continue_with_trainer',
      reason: 'Fallback route reason',
      confidenceLabel: 'medium',
      rationaleSummary: 'Fallback route rationale',
      activeMode: 'decision',
      recommendedTrainer: 'strategy',
    },
    trainerRecommendation: {
      orderedTrainers: ['strategy', 'risk', 'communication', 'execution'],
      topTrainer: 'strategy',
      confidenceLabel: 'medium',
      rationaleSummary: 'Fallback trainer rationale',
      inlineActions: [
        { trainer: 'strategy', label: 'Reframe strategy', emphasized: true },
      ],
    },
    onboardingState: 'intro_plus_next_step',
    characterProfile: {
      archetypeId: 'strategist',
      guidanceStyle: 'strategic, composed, and pattern-aware',
      progressionPath: 'Sharper decisions, stronger prioritization, and broader strategic range.',
      recommendedSkills: ['decision_making', 'communication_meta', 'execution_discipline'],
      intro: {
        title: 'The Strategist',
        introText: 'You grow by seeing the right path early, naming what matters, and moving with disciplined intent.',
        guidanceStyle: 'strategic, composed, and pattern-aware',
        firstFocus: 'Clarify the decision frame before you commit energy in the wrong direction.',
        recommendedStartingSkills: ['decision_making', 'communication_meta'],
      },
    },
    progressionState: {
      currentLevel: 1,
      skillPoints: 0,
      unlockedSkills: [],
      readiness: 'building',
      nextLevel: 2,
    },
    trainerResponse: undefined,
    linkedDossierId: null,
    shouldOfferDossier: false,
    createdAt: '2026-03-22T13:00:00.000Z',
  };

  const fallbackState = hydrateFirstPassGuidanceState(
    {
      rawInput: 'Fallback input',
      intakeAnswers: {},
      result: {
        summary: 'Fallback summary',
        nextStep: 'Fallback next step',
        suggestedTasks: ['Fallback task'],
      },
      fallbackDetectedDomain: 'decision',
      fallbackActiveMode: 'decision',
      fallbackShouldOfferDossier: false,
    },
    {
      buildFirstPassSession: () => {
        fallbackCalls += 1;
        return fallbackSession;
      },
    }
  );

  assert.equal(fallbackState.usedAuthoritativeContinuation, false);
  assert.equal(fallbackCalls, 1);
  assert.ok(fallbackState.guidanceSession.decision, 'fallback hydration should still produce a decision envelope');
  assert.equal(fallbackState.guidanceSession.decision.authority.level, 'degraded');
  assert.equal(fallbackState.guidanceSession.decision.authority.source, 'client_fallback_recomputed');
  assert.equal(fallbackState.guidanceSession.decision.authority.degradedReason, 'missing_authoritative_continuation');
  assert.equal(fallbackState.guidanceSession.routeOutcome.type, 'continue_with_trainer');
  assert.equal(fallbackState.guidanceSession.trainerRecommendation.topTrainer, 'strategy');
  assert.equal(fallbackState.guidanceSession.followUpQuestion, undefined);
  assert.equal(fallbackState.guidanceSession.onboardingState, 'intro_plus_next_step');
  assert.equal(fallbackState.guidanceSession.characterProfile.archetypeId, 'strategist');
  assert.equal(fallbackState.guidanceSession.characterProfile.intro.title, 'The Strategist');
  assert.equal(fallbackState.guidanceSession.progressionState.currentLevel, 1);
  assert.deepEqual(fallbackState.resultMeta, {
    detectedDomain: 'decision',
    activeMode: 'decision',
    shouldOfferDossier: false,
  });

  const legacyContinuationState = hydrateFirstPassGuidanceState(
    {
      rawInput: 'Legacy continuation input',
      intakeAnswers: {},
      continuation: {
        detectedDomain: 'decision',
        activeMode: 'decision',
        shouldOfferDossier: true,
        routeOutcome: {
          type: 'continue_with_trainer',
          reason: 'Legacy continuation still points to a specialist continuation.',
          confidenceLabel: 'medium',
          rationaleSummary: 'The old continuation contract still carries enough routing context to keep moving.',
          activeMode: 'decision',
          recommendedTrainer: 'strategy',
        },
        trainerRecommendation: {
          orderedTrainers: ['strategy', 'risk', 'communication', 'execution'],
          topTrainer: 'strategy',
          confidenceLabel: 'medium',
          rationaleSummary: 'Strategy is still the clearest specialist angle in the legacy continuation payload.',
          inlineActions: [
            { trainer: 'strategy', label: 'Reframe strategy', emphasized: true },
          ],
        },
        followUpQuestion: {
          intent: 'clarify_goal',
          question: 'What single outcome matters most here?',
        },
      },
      result: {
        summary: 'Legacy continuation summary',
        nextStep: 'Legacy continuation next step',
        suggestedTasks: ['Legacy continuation task'],
      },
      fallbackDetectedDomain: 'decision',
      fallbackActiveMode: 'decision',
      fallbackShouldOfferDossier: true,
    },
    {
      buildFirstPassSession: () => {
        throw new Error('Legacy continuation should not recompute from scratch when compatibility data exists.');
      },
    }
  );

  assert.equal(legacyContinuationState.usedAuthoritativeContinuation, false);
  assert.ok(legacyContinuationState.guidanceSession.decision, 'legacy continuation should still hydrate a decision envelope');
  assert.equal(legacyContinuationState.guidanceSession.decision.authority.level, 'degraded');
  assert.equal(legacyContinuationState.guidanceSession.decision.authority.source, 'client_fallback_legacy_continuation');
  assert.equal(legacyContinuationState.guidanceSession.decision.authority.degradedReason, 'legacy_continuation_contract');
  assert.equal(legacyContinuationState.guidanceSession.routeOutcome.type, 'continue_with_trainer');
  assert.equal(legacyContinuationState.guidanceSession.trainerRecommendation.topTrainer, 'strategy');
  assert.equal(legacyContinuationState.guidanceSession.followUpQuestion.intent, 'clarify_goal');
  assert.equal(legacyContinuationState.guidanceSession.onboardingState, undefined);
  assert.equal(legacyContinuationState.guidanceSession.phase, undefined);
  assert.equal(legacyContinuationState.guidanceSession.decision.safeUiCapabilities.onboardingShell, false);
}

module.exports = {
  runGuidanceFirstPassHydrationTests,
};
