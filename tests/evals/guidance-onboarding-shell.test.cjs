require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const {
  GuidanceOnboardingShell,
  buildGuidanceOnboardingViewModel,
  buildFollowUpGuidanceContext,
} = require('../../src/components/guidance/guidance-onboarding-shell.tsx');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function createOnboardingZoneProfile(overrides = {}) {
  return {
    zone: 'onboarding',
    visibility: 'visible',
    focusState: 'dominant',
    isDominant: true,
    primaryCta: 'follow_up',
    contentDensity: 'guided',
    microcopyIntent: 'orient',
    sectionOutcome: 'clarify',
    surfaceRhythm: 'steady',
    transitionContinuity: 'advance',
    visualWeight: 'strong',
    ...overrides,
  };
}

function runGuidanceOnboardingShellTests() {
  const ambiguousSession = {
    id: 'guidance_ambiguous',
    initialInput: 'Need help.',
    detectedDomain: 'problem_solving',
    activeMode: 'problem_solver',
    intakeAnswers: {},
    result: {
      summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
      nextStep: 'Understand the core concern behind the question',
      suggestedTasks: ['Capture the missing context'],
    },
    routeOutcome: {
      type: 'stay_in_guidance',
      reason: 'The current guidance should stay lightweight until the direction becomes stronger or more durable.',
      confidenceLabel: 'guarded',
      rationaleSummary: 'The session is usable, but the next route is not fully settled yet.',
      activeMode: 'problem_solver',
    },
    trainerRecommendation: {
      orderedTrainers: ['strategy', 'risk', 'communication', 'execution'],
      topTrainer: 'strategy',
      confidenceLabel: 'guarded',
      rationaleSummary: 'Strategy is a helpful next angle here, but the session could still support more than one specialist read.',
      inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
    },
    followUpQuestion: {
      intent: 'clarify_goal',
      question: 'What outcome matters most here if we get only one thing right next?',
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
    characterProfile: buildCharacterProfile('executor'),
    progressionState: createInitialProgressionState(),
    shouldOfferDossier: false,
    createdAt: '2026-03-22T14:00:00.000Z',
  };

  const clearSession = {
    ...ambiguousSession,
    id: 'guidance_clear',
    result: {
      summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
      nextStep: 'Define the final owner sequence for launch week',
      suggestedTasks: ['Confirm launch owners'],
    },
    routeOutcome: {
      type: 'convert_to_dossier',
      reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
      confidenceLabel: 'high',
      rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      activeMode: 'planning',
    },
    followUpQuestion: undefined,
    onboardingState: 'intro_plus_next_step',
    phase: 'execution_ready',
    progressionSnapshot: {
      phase: 'execution_ready',
      phaseLabel: 'execution ready',
      phaseSummary: 'The system sees a clear enough path to move you into real action without extra clarification.',
      hasFollowUpHistory: false,
      showsFollowUp: false,
      showsNextStep: true,
    },
    characterProfile: buildCharacterProfile('builder'),
  };

  const viewModel = buildGuidanceOnboardingViewModel(ambiguousSession);
  assert.equal(viewModel.state, 'intro_plus_followup');
  assert.equal(viewModel.phase, 'clarifying');
  assert.equal(viewModel.title, 'The Executor');
  assert.equal(viewModel.followUpQuestion.question, 'What outcome matters most here if we get only one thing right next?');
  assert.equal(viewModel.nextStep, 'Understand the core concern behind the question');

  const ambiguousMarkup = renderToStaticMarkup(
    React.createElement(GuidanceOnboardingShell, {
      guidanceSession: ambiguousSession,
      zoneProfile: createOnboardingZoneProfile(),
      onSubmitFollowUp: () => {},
    })
  );
  assert.match(ambiguousMarkup, /The Executor/);
  assert.match(ambiguousMarkup, /Clarify next/);
  assert.match(ambiguousMarkup, /What outcome matters most here if we get only one thing right next\?/);
  assert.match(ambiguousMarkup, /Your answer/);
  assert.match(ambiguousMarkup, /Continue guidance/);
  assert.doesNotMatch(ambiguousMarkup, /Start with this move/);

  const refinedClearSession = {
    ...clearSession,
    intakeAnswers: {
      follow_up_clarify_goal: 'The goal is to repair the vendor relationship before Friday.',
    },
  };

  const clearMarkup = renderToStaticMarkup(
    React.createElement(GuidanceOnboardingShell, {
      guidanceSession: refinedClearSession,
      zoneProfile: createOnboardingZoneProfile({
        focusState: 'secondary',
        isDominant: false,
        primaryCta: null,
        microcopyIntent: 'confirm',
        sectionOutcome: 'understand',
      }),
    })
  );
  assert.match(clearMarkup, /The Builder/);
  assert.match(clearMarkup, /Refined onboarding read/);
  assert.match(clearMarkup, /Refined next step/);
  assert.match(clearMarkup, /The direction is holding together/);
  assert.match(clearMarkup, /The current direction is still valid\. This next piece only tightens it around what is already clear and shows what became clearer about how to confirm the plan\./);
  assert.match(clearMarkup, /Current phase/);
  assert.match(clearMarkup, /execution ready/);
  assert.match(clearMarkup, /Define the final owner sequence for launch week/);
  assert.doesNotMatch(clearMarkup, />Your answer</);
  assert.doesNotMatch(clearMarkup, /Clarify next/);

  const firstPassClearMarkup = renderToStaticMarkup(
    React.createElement(GuidanceOnboardingShell, {
      guidanceSession: clearSession,
      zoneProfile: createOnboardingZoneProfile({
        primaryCta: null,
        microcopyIntent: 'confirm',
        sectionOutcome: 'understand',
      }),
    })
  );
  assert.match(firstPassClearMarkup, /First onboarding read/);
  assert.match(firstPassClearMarkup, /Start with this move/);
  assert.doesNotMatch(firstPassClearMarkup, /Refined next step/);

  const followUpContext = buildFollowUpGuidanceContext({
    rawInput: 'Need help.',
    intakeAnswers: {},
    followUpQuestion: ambiguousSession.followUpQuestion,
    answer: 'The goal is to repair the vendor relationship before Friday.',
  });
  assert.match(followUpContext.rawInput, /Clarifying question:/);
  assert.match(followUpContext.rawInput, /Clarifying answer: The goal is to repair the vendor relationship before Friday\./);
  assert.deepEqual(followUpContext.intakeAnswers, {
    follow_up_clarify_goal: 'The goal is to repair the vendor relationship before Friday.',
  });

  const emptyMarkup = renderToStaticMarkup(
    React.createElement(GuidanceOnboardingShell, {
      guidanceSession: null,
      zoneProfile: createOnboardingZoneProfile(),
    })
  );
  assert.equal(emptyMarkup, '');
}

module.exports = {
  runGuidanceOnboardingShellTests,
};
