require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  continueGuidanceSessionFromFollowUp,
  requestGuidanceTrainerResponse,
  submitGuidanceSessionRequest,
} = require('../../src/components/guidance/guidance-session-service.ts');
const {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
} = require('../../src/components/guidance/guidance-session-store.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

async function runGuidanceSessionServiceTests() {
  const guidanceResponse = buildGuidanceResponse();
  let recordedGuidanceRequest = null;

  const guidanceResult = await submitGuidanceSessionRequest(
    {
      rawInput: 'Need a rollout plan.',
      situation: 'We are shipping in two weeks.',
      mainGoal: 'Lock the launch owner sequence',
      intakeAnswers: {
        main_goal: ' Lock the launch owner sequence ',
        empty_field: '   ',
      },
      selectedMode: 'planning',
    },
    {
      fetchImpl: async (url, options) => {
        recordedGuidanceRequest = { url, options };
        return createJsonResponse({
          success: true,
          data: guidanceResponse,
        });
      },
    }
  );

  assert.equal(recordedGuidanceRequest.url, '/api/ai/guidance');
  assert.equal(recordedGuidanceRequest.options.method, 'POST');
  const parsedGuidanceBody = JSON.parse(recordedGuidanceRequest.options.body);
  assert.equal(parsedGuidanceBody.raw_input, 'Need a rollout plan.');
  assert.deepEqual(parsedGuidanceBody.intakeAnswers, {
    main_goal: 'Lock the launch owner sequence',
  });
  assert.equal(guidanceResult.result.summary, guidanceResponse.summary);
  assert.ok(guidanceResult.hydratedState.guidanceSession.decision);
  assert.equal(guidanceResult.hydratedState.guidanceSession.decision.authority.level, 'authoritative');
  assert.equal(guidanceResult.hydratedState.guidanceSession.phase, 'execution_ready');
  assert.equal(guidanceResult.hydratedState.guidanceSession.routeOutcome.type, 'convert_to_dossier');
  assert.equal(guidanceResult.hydratedState.resultMeta.activeMode, 'planning');

  const nextState = guidanceSessionStoreReducer(
    createInitialGuidanceSessionStoreState(),
    {
      type: 'set_session_result',
      payload: buildSessionResultUpdate({
        rawInput: guidanceResult.submission.rawInput,
        situation: guidanceResult.submission.situation,
        mainGoal: guidanceResult.submission.mainGoal,
        intakeAnswers: guidanceResult.submission.intakeAnswers,
        result: guidanceResult.result,
        resultMeta: guidanceResult.hydratedState.resultMeta,
        guidanceSession: guidanceResult.hydratedState.guidanceSession,
        generationCount: 1,
        lastGeneratedAt: '2:30 PM',
      }),
    }
  );
  assert.equal(nextState.session.guidanceSession.phase, 'execution_ready');
  assert.equal(nextState.session.result.next_step, guidanceResponse.next_step);
  assert.deepEqual(nextState.input.intakeAnswers, {
    main_goal: 'Lock the launch owner sequence',
  });

  let recordedFollowUpRequest = null;
  const followUpResult = await continueGuidanceSessionFromFollowUp(
    {
      rawInput: 'Need help with a messy partner decision.',
      situation: '',
      mainGoal: 'Get to a clear next move',
      intakeAnswers: {},
      selectedMode: 'auto',
      followUpQuestion: {
        intent: 'clarify_goal',
        question: 'What outcome matters most if you get only one thing right next?',
      },
      answer: ' We need a partner decision that avoids another review cycle. ',
    },
    {
      fetchImpl: async (url, options) => {
        recordedFollowUpRequest = { url, options };
        return createJsonResponse({
          success: true,
          data: buildGuidanceResponse({
            continuation: {
              ...guidanceResponse.continuation,
              decision: {
                ...guidanceResponse.continuation.decision,
                domain: {
                  ...guidanceResponse.continuation.decision.domain,
                  primary: 'planning',
                  shouldOfferDossier: false,
                },
                mode: {
                  active: 'decision',
                },
                routeOutcome: {
                  type: 'continue_with_trainer',
                  reason: 'The current read is usable, but the next highest-value move is a specialist perspective before formal conversion.',
                  confidenceLabel: 'medium',
                  rationaleSummary: 'A specialist continuation is helpful here, though other session-based paths still remain reasonable.',
                  activeMode: 'decision',
                  recommendedTrainer: 'strategy',
                },
                trainerRecommendation: {
                  ...guidanceResponse.continuation.decision.trainerRecommendation,
                },
                onboardingState: 'intro_plus_next_step',
                phase: 'refined_direction',
                progressionSnapshot: {
                  phase: 'refined_direction',
                  phaseLabel: 'refined direction',
                  phaseSummary: 'The system has enough shape to guide you with a clearer direction without forcing execution too early.',
                  hasFollowUpHistory: true,
                  showsFollowUp: false,
                  showsNextStep: true,
                },
                executionReadiness: {
                  isReady: false,
                  reason: 'needs_refinement',
                },
                safeUiCapabilities: {
                  result: true,
                  onboardingShell: true,
                  trainerRecommendation: true,
                  executionBridge: false,
                  followUpInput: false,
                  phaseProgression: true,
                },
              },
              routeOutcome: {
                type: 'continue_with_trainer',
                reason: 'The current read is usable, but the next highest-value move is a specialist perspective before formal conversion.',
                confidenceLabel: 'medium',
                rationaleSummary: 'A specialist continuation is helpful here, though other session-based paths still remain reasonable.',
                activeMode: 'decision',
                recommendedTrainer: 'strategy',
              },
              activeMode: 'decision',
              shouldOfferDossier: false,
            },
            summary: 'The direction is clearer after the clarification pass.',
            next_step: 'Compare the two remaining partner options before committing',
            suggested_tasks: ['List the main tradeoffs'],
          }),
        });
      },
    }
  );

  assert.equal(recordedFollowUpRequest.url, '/api/ai/guidance');
  const parsedFollowUpBody = JSON.parse(recordedFollowUpRequest.options.body);
  assert.match(parsedFollowUpBody.raw_input, /Clarifying question:/);
  assert.match(parsedFollowUpBody.raw_input, /Clarifying answer: We need a partner decision that avoids another review cycle\./);
  assert.equal(
    parsedFollowUpBody.intakeAnswers.follow_up_clarify_goal,
    'We need a partner decision that avoids another review cycle.'
  );
  assert.equal(followUpResult.submission.intakeAnswers.follow_up_clarify_goal, 'We need a partner decision that avoids another review cycle.');
  assert.equal(followUpResult.hydratedState.guidanceSession.routeOutcome.type, 'continue_with_trainer');
  assert.ok(followUpResult.hydratedState.guidanceSession.decision);

  const trainerSession = guidanceResult.hydratedState.guidanceSession;
  let recordedTrainerRequest = null;
  const trainerResponse = await requestGuidanceTrainerResponse(
    {
      session: trainerSession,
      trainer: 'strategy',
    },
    {
      fetchImpl: async (url, options) => {
        recordedTrainerRequest = { url, options };
        return createJsonResponse({
          success: true,
          data: {
            trainer: 'strategy',
            focus_label: 'Strategy',
            headline: 'Sharpen the decision frame',
            key_insight: 'The core tradeoff is now visible enough to compare directly.',
            recommendation: 'Constrain the decision to the two strongest paths.',
            next_move: 'List the tradeoffs side by side before you commit.',
            support_points: ['Keep the comparison narrow', 'Use the owner sequence as the tie-breaker'],
            confidence_label: 'medium',
          },
        });
      },
    }
  );

  assert.equal(recordedTrainerRequest.url, '/api/ai/trainer');
  const parsedTrainerBody = JSON.parse(recordedTrainerRequest.options.body);
  assert.equal(parsedTrainerBody.trainer, 'strategy');
  assert.equal(parsedTrainerBody.current_objective, 'Define the final owner sequence for launch week');
  assert.equal(trainerResponse.trainer, 'strategy');
  assert.equal(trainerResponse.next_move, 'List the tradeoffs side by side before you commit.');
}

function buildGuidanceResponse(overrides = {}) {
  const characterProfile = buildCharacterProfile('strategist');
  const progressionState = createInitialProgressionState();

  return {
    summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
    next_step: 'Define the final owner sequence for launch week',
    suggested_tasks: ['Confirm launch owners', 'Lock the checklist'],
    continuation: {
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
          responseDepth: 'guided',
        },
        routeOutcome: {
          type: 'convert_to_dossier',
          reason: 'The session already signals dossier-worthiness and the next move is concrete enough to track as ongoing work.',
          confidenceLabel: 'high',
          rationaleSummary: 'The current session is stable enough for tracked execution and the next move is ready to act on.',
          activeMode: 'planning',
        },
        trainerRecommendation: {
          orderedTrainers: ['strategy', 'execution', 'communication', 'risk'],
          topTrainer: 'strategy',
          confidenceLabel: 'medium',
          rationaleSummary: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
          inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
        },
        onboardingState: 'direct_next_step',
        phase: 'execution_ready',
        progressionSnapshot: {
          phase: 'execution_ready',
          phaseLabel: 'execution ready',
          phaseSummary: 'The system sees a clear enough path to move you into real action without extra clarification.',
          hasFollowUpHistory: false,
          showsFollowUp: false,
          showsNextStep: true,
        },
        executionReadiness: {
          isReady: true,
          reason: 'route_ready',
        },
        safeUiCapabilities: {
          result: true,
          onboardingShell: true,
          trainerRecommendation: true,
          executionBridge: true,
          followUpInput: false,
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
        orderedTrainers: ['strategy', 'execution', 'communication', 'risk'],
        topTrainer: 'strategy',
        confidenceLabel: 'medium',
        rationaleSummary: 'Strategy is the clearest next specialist angle, though other continuations also remain reasonable.',
        inlineActions: [{ trainer: 'strategy', label: 'Reframe strategy', emphasized: true }],
      },
      characterProfile,
      progressionState,
    },
    ...overrides,
  };
}

function createJsonResponse(body) {
  return {
    ok: true,
    async json() {
      return body;
    },
  };
}

module.exports = {
  runGuidanceSessionServiceTests,
};
