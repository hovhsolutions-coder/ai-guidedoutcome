require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const { GuidanceExecutionTransitionCard } = require('../../src/components/guidance/guidance-execution-transition.tsx');
const { submitGuidanceSessionDossierConversion } = require('../../src/components/guidance/submit-guidance-session-dossier-conversion.ts');
const { buildGuidanceRightRailViewModel } = require('../../src/lib/guidance-session/build-guidance-right-rail-view-model.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

async function runGuidanceExecutionTransitionTests() {
  const baseSession = {
    id: 'guidance_execution',
    initialInput: 'Need help with rollout.',
    detectedDomain: 'planning',
    activeMode: 'planning',
    intakeAnswers: {},
    result: {
      summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
      nextStep: 'Define the final owner sequence for launch week',
      suggestedTasks: ['Confirm launch owners', 'Lock the checklist'],
    },
    routeOutcome: {
      type: 'convert_to_dossier',
      reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
      confidenceLabel: 'high',
      rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
      activeMode: 'planning',
    },
    trainerRecommendation: {
      orderedTrainers: ['strategy', 'execution', 'risk', 'communication'],
      topTrainer: 'strategy',
      confidenceLabel: 'medium',
      rationaleSummary: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
      inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
    },
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
    progressionState: createInitialProgressionState(),
    shouldOfferDossier: true,
    createdAt: '2026-03-22T14:10:00.000Z',
  };

  const executionView = buildGuidanceRightRailViewModel({
    guidanceSession: baseSession,
    result: {
      summary: baseSession.result.summary,
      next_step: baseSession.result.nextStep,
      suggested_tasks: baseSession.result.suggestedTasks,
    },
    isLoading: false,
    lastGeneratedAt: '2:15 PM',
    detectedDomain: 'planning',
    activeMode: 'planning',
    shouldOfferDossier: true,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });

  assert.ok(executionView.executionReadySection);
  assert.equal(executionView.executionReadySection.transition.nextStep, 'Define the final owner sequence for launch week');
  assert.match(executionView.executionReadySection.transition.continueSummary, /2 supporting tasks/);
  assert.equal(executionView.trainer.nextPath.guidanceSession, null);

  const executionMarkup = renderToStaticMarkup(
    React.createElement(GuidanceExecutionTransitionCard, {
      transition: executionView.executionReadySection.transition,
      isConverting: false,
      conversionError: null,
      conversionStatus: null,
      onConvertToDossier: () => {},
    })
  );
  assert.match(executionMarkup, /Your plan is ready to move into mission control/);
  assert.match(executionMarkup, /Continue from this guidance state/);
  assert.match(executionMarkup, /Convert into dossier when ready/);
  assert.match(executionMarkup, /Convert to dossier/);
  assert.match(executionMarkup, /Define the final owner sequence for launch week/);
  assert.match(executionMarkup, /2 supporting tasks/);

  const clarifyingView = buildGuidanceRightRailViewModel({
    guidanceSession: {
      ...baseSession,
      phase: 'clarifying',
      onboardingState: 'intro_plus_followup',
      progressionSnapshot: {
        phase: 'clarifying',
        phaseLabel: 'clarifying',
        phaseSummary: 'The system is clarifying the situation before it pushes you into a heavier path.',
        hasFollowUpHistory: false,
        showsFollowUp: true,
        showsNextStep: false,
      },
      followUpQuestion: {
        intent: 'clarify_goal',
        question: 'What outcome matters most here if we get only one thing right next?',
      },
    },
    result: {
      summary: baseSession.result.summary,
      next_step: baseSession.result.nextStep,
      suggested_tasks: baseSession.result.suggestedTasks,
    },
    isLoading: false,
    lastGeneratedAt: '2:15 PM',
    detectedDomain: 'planning',
    activeMode: 'planning',
    shouldOfferDossier: true,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });
  assert.equal(clarifyingView.executionReadySection, null);
  assert.ok(clarifyingView.trainer.nextPath.guidanceSession);

  const refinedView = buildGuidanceRightRailViewModel({
    guidanceSession: {
      ...baseSession,
      phase: 'refined_direction',
      progressionSnapshot: {
        phase: 'refined_direction',
        phaseLabel: 'refined direction',
        phaseSummary: 'The direction is now more grounded and personal, and the system is guiding from that refined read.',
        hasFollowUpHistory: true,
        showsFollowUp: false,
        showsNextStep: true,
      },
    },
    result: {
      summary: baseSession.result.summary,
      next_step: baseSession.result.nextStep,
      suggested_tasks: baseSession.result.suggestedTasks,
    },
    isLoading: false,
    lastGeneratedAt: '2:15 PM',
    detectedDomain: 'planning',
    activeMode: 'planning',
    shouldOfferDossier: true,
    activeTrainer: null,
    trainerLoading: null,
    trainerError: null,
  });
  assert.equal(refinedView.executionReadySection, null);
  assert.ok(refinedView.trainer.nextPath.guidanceSession);

  const previousFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, '/api/dossiers');
    assert.equal(options.method, 'POST');
    return {
      ok: true,
      async json() {
        return {
          success: true,
          data: { id: 'dossier_123' },
        };
      },
    };
  };

  try {
    const conversion = await submitGuidanceSessionDossierConversion(baseSession);
    assert.equal(conversion.id, 'dossier_123');
  } finally {
    global.fetch = previousFetch;
  }

  const emptyMarkup = renderToStaticMarkup(
    executionView.executionReadySection
      ? React.createElement(GuidanceExecutionTransitionCard, {
        transition: executionView.executionReadySection.transition,
        isConverting: true,
        conversionError: null,
        conversionStatus: 'Creating a dossier from this guidance read: "Define the final owner sequence for launch week"',
        onConvertToDossier: () => {},
      })
      : null
  );
  assert.doesNotMatch(emptyMarkup, /Creating a dossier from this guidance read/);
  assert.match(emptyMarkup, /Creating dossier\.\.\./);
}

module.exports = {
  runGuidanceExecutionTransitionTests,
};
