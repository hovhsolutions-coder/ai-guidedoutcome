require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');
const { planOnboardingState } = require('../../src/lib/guidance-session/plan-onboarding-state.ts');
const { buildFirstPassGuidanceSession } = require('../../src/lib/guidance-session/build-first-pass-guidance-session.ts');
const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');

function runOnboardingStatePlannerTests() {
  const ambiguousState = planOnboardingState({
    routeOutcome: {
      type: 'stay_in_guidance',
      reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
      confidenceLabel: 'guarded',
      rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
      activeMode: 'quick_assist',
    },
    followUpQuestion: {
      intent: 'clarify_goal',
      question: 'What outcome matters most here if we get only one thing right next?',
    },
    characterProfile: buildCharacterProfile('executor'),
    progressionState: createInitialProgressionState(),
  });

  assert.equal(ambiguousState, 'intro_plus_followup');

  const clearBuildingState = planOnboardingState({
    routeOutcome: {
      type: 'convert_to_dossier',
      reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
      confidenceLabel: 'high',
      rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      activeMode: 'planning',
    },
    characterProfile: buildCharacterProfile('builder'),
    progressionState: createInitialProgressionState(),
  });

  assert.equal(clearBuildingState, 'intro_plus_next_step');

  const clearReadyState = planOnboardingState({
    routeOutcome: {
      type: 'continue_in_mode',
      reason: 'The current mode already matches the situation and should carry the next refinement pass.',
      confidenceLabel: 'high',
      rationaleSummary: 'The current mode still fits well and there is enough structure to keep refining in the same frame.',
      activeMode: 'planning',
    },
    characterProfile: buildCharacterProfile('strategist'),
    progressionState: {
      currentLevel: 2,
      skillPoints: 7,
      unlockedSkills: ['decision_making'],
      readiness: 'ready',
      nextLevel: 3,
    },
  });

  assert.equal(clearReadyState, 'direct_next_step');

  const firstPassSession = buildFirstPassGuidanceSession(
    createGuidanceSession({
      initialInput: 'Need help.',
      detectedDomain: 'problem_solving',
      domainConfidence: 0.38,
      activeMode: 'problem_solver',
      shouldOfferDossier: false,
    }),
    {
      summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
      nextStep: 'Understand the core concern behind the question',
      suggestedTasks: ['Capture the missing context'],
    }
  );

  assert.equal(firstPassSession.routeOutcome.type, 'stay_in_guidance');
  assert.equal(firstPassSession.trainerRecommendation.topTrainer, 'strategy');
  assert.equal(firstPassSession.onboardingState, 'intro_plus_followup');
}

module.exports = {
  runOnboardingStatePlannerTests,
};
