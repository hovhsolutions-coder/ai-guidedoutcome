require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { inspectTrainerRecommendationDecision, planFollowUpQuestion } = require('../../src/lib/recommendations/core.ts');
const { adaptTrainerRecommendationInput } = require('../../src/lib/recommendations/adapters/from-trainer-input.ts');
const { buildCharacterProfile, createInitialProgressionState } = require('../../src/lib/progression/progression.ts');

function runCharacterProgressionInfluenceTests() {
  const neutralTrainerInput = {
    phase: 'Understanding',
    totalTasks: 1,
    completedCount: 0,
    currentObjective: 'Complete the current task cleanly',
    currentGuidanceSummary: 'We need to decide which path matters most before moving.',
    currentGuidanceNextStep: 'Complete the checklist',
    activeMode: 'problem_solver',
    detectedDomain: 'decision',
  };

  const neutralInspection = inspectTrainerRecommendationDecision(adaptTrainerRecommendationInput(neutralTrainerInput));
  assert.equal(neutralInspection.recommendation.topTrainer, 'strategy');

  const executorInspection = inspectTrainerRecommendationDecision(adaptTrainerRecommendationInput({
    ...neutralTrainerInput,
    characterProfile: buildCharacterProfile('executor'),
    progressionState: createInitialProgressionState(),
  }));
  assert.equal(
    executorInspection.recommendation.topTrainer,
    'execution',
    'archetype fit should lightly break a true trainer tie toward the aligned trainer'
  );

  const planningQuestionInput = adaptTrainerRecommendationInput({
    phase: 'Structuring',
    totalTasks: 2,
    completedCount: 0,
    currentObjective: 'Define the rollout framework',
    currentGuidanceSummary: 'There is a blocked approval and a planning dependency.',
    currentGuidanceNextStep: 'Understand the strongest dependency before changing the plan',
    activeMode: 'planning',
    detectedDomain: 'planning',
    domainConfidence: 0.62,
    characterProfile: buildCharacterProfile('builder'),
    progressionState: createInitialProgressionState(),
  });

  assert.deepEqual(planFollowUpQuestion(planningQuestionInput), {
    intent: 'clarify_documentation',
    question: 'What plan, evidence, or structure needs to be captured so the next move is clear?',
  });

  const readyProgressionInput = {
    ...planningQuestionInput,
    progressionState: {
      currentLevel: 2,
      skillPoints: 7,
      unlockedSkills: ['execution_discipline'],
      readiness: 'ready',
      nextLevel: 3,
    },
  };

  assert.deepEqual(planFollowUpQuestion(readyProgressionInput), {
    intent: 'clarify_execution_blocker',
    question: 'What is the main blocker preventing the next move from happening right now?',
  });
}

module.exports = {
  runCharacterProgressionInfluenceTests,
};
