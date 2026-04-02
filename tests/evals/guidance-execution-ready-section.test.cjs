require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const { GuidanceExecutionReadySection } = require('../../src/components/guidance/guidance-execution-ready-section.tsx');
const { buildGuidanceRightRailViewModel } = require('../../src/lib/guidance-session/build-guidance-right-rail-view-model.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function createExecutionZoneProfile(overrides = {}) {
  return {
    zone: 'execution',
    visibility: 'visible',
    focusState: 'dominant',
    isDominant: true,
    primaryCta: 'dossier_convert',
    contentDensity: 'expanded',
    microcopyIntent: 'activate',
    sectionOutcome: 'commit',
    surfaceRhythm: 'spacious',
    transitionContinuity: 'advance',
    visualWeight: 'strong',
    ...overrides,
  };
}

function runGuidanceExecutionReadySectionTests() {
  const baseSession = {
    id: 'guidance_execution_ready',
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
  assert.equal(executionView.executionReadySection.progress.eyebrow, 'Plan ready');
  assert.equal(executionView.executionReadySection.handoff.nextStep, 'Define the final owner sequence for launch week');
  assert.equal(executionView.executionReadySection.transition.dossierLabel, 'Convert into dossier when ready');
  assert.equal(executionView.trainer.nextPath.guidanceSession, null);

  const markup = renderToStaticMarkup(
    React.createElement(GuidanceExecutionReadySection, {
      guidanceSession: baseSession,
      zoneProfile: createExecutionZoneProfile(),
      interactiveTransition: false,
      section: executionView.executionReadySection,
    })
  );
  assert.match(markup, /Execution handoff/);
  assert.match(markup, /Your plan is ready to move into mission control/);
  assert.match(markup, /Define the final owner sequence for launch week/);
  assert.doesNotMatch(markup, /Plan ready/);

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

  const emptyMarkup = renderToStaticMarkup(
    React.createElement(GuidanceExecutionReadySection, {
      guidanceSession: baseSession,
      zoneProfile: createExecutionZoneProfile(),
      interactiveTransition: false,
      section: null,
    })
  );
  assert.equal(emptyMarkup, '');
}

module.exports = {
  runGuidanceExecutionReadySectionTests,
};
