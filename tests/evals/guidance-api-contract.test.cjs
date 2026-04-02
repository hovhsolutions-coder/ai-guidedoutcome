require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');

const orchestrator = require('../../src/lib/ai/orchestrator.ts');
const { POST } = require('../../app/api/ai/guidance/route.ts');

async function runGuidanceApiContractTests() {
  const originalRunAIOrchestrator = orchestrator.runAIOrchestrator;

  try {
    orchestrator.runAIOrchestrator = async () => ({
      success: true,
      data: {
        summary: 'The work is stable enough to move into tracked execution and the next move is concrete.',
        next_step: 'Define the final owner sequence for launch week',
        suggested_tasks: ['Confirm launch owners', 'Lock the checklist', 'Capture the open dependencies'],
      },
    });

    const clearRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        raw_input: 'Need help with this.',
        main_goal: 'Build the onboarding rollout plan and sequence the milestones.',
        intakeAnswers: {
          timeline: 'Launch starts next month',
          resources: 'Two PMs and one engineer',
          constraints: 'Document the checklist',
        },
        triggerType: 'manual',
      }),
    });

    const clearResponse = await POST(clearRequest);
    assert.equal(clearResponse.status, 200, 'guidance API should return 200 on success');

    const clearBody = await clearResponse.json();
    assert.equal(clearBody.success, true);
    assert.equal(clearBody.data.summary, 'The work is stable enough to move into tracked execution and the next move is concrete.');
    assert.equal(clearBody.data.next_step, 'Define the final owner sequence for launch week');
    assert.deepEqual(clearBody.data.suggested_tasks, ['Confirm launch owners', 'Lock the checklist', 'Capture the open dependencies']);

    assert.ok(clearBody.data.continuation, 'guidance API should include continuation metadata');
    assert.ok(clearBody.data.continuation.decision, 'guidance API should include a decision envelope');
    assert.equal('onboardingState' in clearBody.data.continuation, false);
    assert.equal(clearBody.data.continuation.detectedDomain, 'planning');
    assert.equal(clearBody.data.continuation.activeMode, 'planning');
    assert.equal(clearBody.data.continuation.shouldOfferDossier, true);
    assert.equal(clearBody.data.continuation.decision.authority.level, 'authoritative');
    assert.equal(clearBody.data.continuation.decision.authority.source, 'server_first_pass');
    assert.equal(clearBody.data.continuation.decision.domain.primary, 'planning');
    assert.equal(clearBody.data.continuation.decision.mode.active, 'planning');
    assert.equal(clearBody.data.continuation.routeOutcome.type, 'convert_to_dossier');
    assert.equal(clearBody.data.continuation.routeOutcome.confidenceLabel, 'high');
    assert.equal(clearBody.data.continuation.decision.routeOutcome.type, 'convert_to_dossier');
    assert.equal(clearBody.data.continuation.trainerRecommendation.topTrainer, 'strategy');
    assert.equal(clearBody.data.continuation.trainerRecommendation.confidenceLabel, 'medium');
    assert.equal(clearBody.data.continuation.decision.executionReadiness.isReady, true);
    assert.equal(clearBody.data.continuation.decision.safeUiCapabilities.executionBridge, true);
    assert.equal(clearBody.data.continuation.decision.safeUiCapabilities.phaseProgression, true);
    assert.equal(clearBody.data.continuation.followUpQuestion, undefined);
    assert.equal('characterIntro' in clearBody.data.continuation, false);
    assert.equal(clearBody.data.continuation.characterProfile.archetypeId, 'builder');
    assert.equal(clearBody.data.continuation.characterProfile.intro.title, 'The Builder');
    assert.equal(clearBody.data.continuation.characterProfile.intro.introText, 'You grow by turning vague ambition into working structure that can carry real execution.');
    assert.equal(clearBody.data.continuation.characterProfile.intro.guidanceStyle, 'structured, practical, and systems-oriented');
    assert.equal(clearBody.data.continuation.characterProfile.intro.firstFocus, 'Turn loose intent into a plan that can survive real-world execution.');
    assert.deepEqual(clearBody.data.continuation.characterProfile.intro.recommendedStartingSkills, ['execution_discipline', 'decision_making']);
    assert.equal('introVideoUrl' in clearBody.data.continuation.characterProfile.intro, false);
    assert.equal(clearBody.data.continuation.progressionState.currentLevel, 1);
    assert.deepEqual(clearBody.data.continuation.progressionState.unlockedSkills, []);

    orchestrator.runAIOrchestrator = async () => ({
      success: true,
      data: {
        summary: 'The situation is still light and benefits from another short pass before any heavier continuation.',
        next_step: 'Understand the core concern behind the question',
        suggested_tasks: ['Capture the missing context'],
      },
    });

    const ambiguousRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        raw_input: 'Need help.',
        main_goal: 'Help',
        intakeAnswers: {
          context_window: 'Soon',
        },
        triggerType: 'manual',
      }),
    });

    const ambiguousResponse = await POST(ambiguousRequest);
    assert.equal(ambiguousResponse.status, 200, 'guidance API should return 200 on ambiguous success');

    const ambiguousBody = await ambiguousResponse.json();
    assert.equal(ambiguousBody.success, true);
    assert.ok(ambiguousBody.data.continuation, 'guidance API should include continuation metadata for ambiguous cases');
    assert.ok(ambiguousBody.data.continuation.decision, 'guidance API should include a decision envelope for ambiguous cases');
    assert.equal('onboardingState' in ambiguousBody.data.continuation, false);
    assert.equal(ambiguousBody.data.continuation.routeOutcome.type, 'stay_in_guidance');
    assert.equal(ambiguousBody.data.continuation.decision.routeOutcome.type, 'stay_in_guidance');
    assert.equal(ambiguousBody.data.continuation.trainerRecommendation.topTrainer, 'strategy');
    assert.deepEqual(ambiguousBody.data.continuation.followUpQuestion, {
      intent: 'clarify_goal',
      question: 'What outcome matters most here if we get only one thing right next?',
    });
    assert.equal(ambiguousBody.data.continuation.decision.followUpQuestion.intent, 'clarify_goal');
    assert.equal(ambiguousBody.data.continuation.decision.executionReadiness.isReady, false);
    assert.equal(ambiguousBody.data.continuation.decision.safeUiCapabilities.followUpInput, true);
    assert.equal(ambiguousBody.data.continuation.decision.safeUiCapabilities.onboardingShell, true);
    assert.equal('characterIntro' in ambiguousBody.data.continuation, false);
    assert.equal(ambiguousBody.data.continuation.characterProfile.archetypeId, 'executor');
    assert.equal(ambiguousBody.data.continuation.characterProfile.intro.title, 'The Executor');
    assert.equal(ambiguousBody.data.continuation.characterProfile.intro.introText, 'You grow by converting clarity into motion and proving capability through repeated execution.');
    assert.equal(ambiguousBody.data.continuation.characterProfile.intro.guidanceStyle, 'focused, action-oriented, and resilient');
    assert.equal(ambiguousBody.data.continuation.characterProfile.intro.firstFocus, 'Remove friction between knowing the move and actually making it happen.');
    assert.deepEqual(ambiguousBody.data.continuation.characterProfile.intro.recommendedStartingSkills, ['execution_discipline', 'decision_making']);
    assert.equal('introVideoUrl' in ambiguousBody.data.continuation.characterProfile.intro, false);
    assert.equal(ambiguousBody.data.continuation.progressionState.currentLevel, 1);
    assert.deepEqual(ambiguousBody.data.continuation.progressionState.unlockedSkills, []);

    // Validation tests
    const invalidJsonRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: 'not valid json',
    });

    const invalidJsonResponse = await POST(invalidJsonRequest);
    assert.equal(invalidJsonResponse.status, 400, 'invalid JSON should return 400');
    const invalidJsonBody = await invalidJsonResponse.json();
    assert.equal(invalidJsonBody.success, false);
    assert.match(invalidJsonBody.error, /invalid json/i);

    const nonObjectRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify('not an object'),
    });

    const nonObjectResponse = await POST(nonObjectRequest);
    assert.equal(nonObjectResponse.status, 400, 'non-object body should return 400');
    const nonObjectBody = await nonObjectResponse.json();
    assert.equal(nonObjectBody.success, false);
    assert.match(nonObjectBody.error, /must be an object/i);

    const missingInputRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        main_goal: 'Something',
      }),
    });

    const missingInputResponse = await POST(missingInputRequest);
    assert.equal(missingInputResponse.status, 400, 'missing user_input should return 400');
    const missingInputBody = await missingInputResponse.json();
    assert.equal(missingInputBody.success, false);
    assert.match(missingInputBody.error, /user_input or raw_input is required/i);

    const emptyInputRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        raw_input: '   ',
        main_goal: 'Something',
      }),
    });

    const emptyInputResponse = await POST(emptyInputRequest);
    assert.equal(emptyInputResponse.status, 400, 'empty string input should return 400');
    const emptyInputBody = await emptyInputResponse.json();
    assert.equal(emptyInputBody.success, false);

    const oversizedInput = 'x'.repeat(10000);
    const oversizedRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        raw_input: oversizedInput,
        main_goal: 'Something',
      }),
    });

    const oversizedResponse = await POST(oversizedRequest);
    assert.equal(oversizedResponse.status, 200, 'oversized input should be sanitized and succeed');
    const oversizedBody = await oversizedResponse.json();
    assert.equal(oversizedBody.success, true);

    const invalidIntakeAnswersRequest = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        raw_input: 'Need help with this.',
        main_goal: 'Something',
        intakeAnswers: 'not an object',
      }),
    });

    const invalidIntakeAnswersResponse = await POST(invalidIntakeAnswersRequest);
    assert.equal(invalidIntakeAnswersResponse.status, 200, 'invalid intakeAnswers should be sanitized and succeed');
    const invalidIntakeAnswersBody = await invalidIntakeAnswersResponse.json();
    assert.equal(invalidIntakeAnswersBody.success, true);
  } finally {
    orchestrator.runAIOrchestrator = originalRunAIOrchestrator;
  }
}

module.exports = {
  runGuidanceApiContractTests,
};
