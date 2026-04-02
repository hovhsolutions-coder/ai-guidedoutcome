require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { createGuidanceSession } = require('../../src/lib/guidance-session/create-session.ts');
const {
  applyMeaningfulProgress,
  buildCharacterProfile,
  createInitialProgressionState,
  selectCharacterArchetype,
} = require('../../src/lib/progression/progression.ts');
const { convertGuidanceSessionToDossier } = require('../../src/lib/guidance-session/convert-to-dossier.ts');

function runProgressionSystemTests() {
  const negotiationSession = createGuidanceSession({
    initialInput: 'I need to repair a tense vendor relationship without losing leverage.',
    detectedDomain: 'conflict',
    activeMode: 'conflict',
  });

  assert.equal(negotiationSession.characterProfile.archetypeId, 'negotiator');
  assert.equal(negotiationSession.progressionState.currentLevel, 1);
  assert.deepEqual(negotiationSession.progressionState.unlockedSkills, []);

  const strategistProfile = buildCharacterProfile(selectCharacterArchetype({
    activeMode: 'decision',
    detectedDomain: 'decision',
  }));
  const baseState = createInitialProgressionState();

  const unchangedState = applyMeaningfulProgress(baseState, strategistProfile, {
    completedTasks: 3,
    consistencyCount: 2,
    outcomeCount: 1,
    meaningfulProgress: false,
  });

  assert.deepEqual(
    unchangedState,
    baseState,
    'progression should not increase when meaningful progress has not actually happened'
  );

  const firstAdvance = applyMeaningfulProgress(baseState, strategistProfile, {
    completedTasks: 2,
    consistencyCount: 1,
    outcomeCount: 1,
    meaningfulProgress: true,
  });

  assert.equal(firstAdvance.skillPoints, 5);
  assert.equal(firstAdvance.currentLevel, 2);
  assert.equal(firstAdvance.nextLevel, 3);
  assert.deepEqual(firstAdvance.unlockedSkills, ['decision_making']);

  const cappedAdvance = applyMeaningfulProgress(firstAdvance, strategistProfile, {
    completedTasks: 8,
    consistencyCount: 4,
    outcomeCount: 3,
    meaningfulProgress: true,
  });

  assert.equal(
    cappedAdvance.currentLevel,
    3,
    'progression should not jump more than one level in a single update even with strong valid signals'
  );
  assert.deepEqual(
    cappedAdvance.unlockedSkills,
    ['decision_making', 'communication_meta'],
    'skills should unlock in archetype order as levels are earned'
  );

  const dossierPayload = convertGuidanceSessionToDossier({
    ...negotiationSession,
    result: {
      summary: 'The relationship needs a calmer reset before the next message lands.',
      nextStep: 'Clarify the strongest boundary before you reply',
      suggestedTasks: ['Capture the main tension point'],
    },
  });

  assert.equal(dossierPayload.characterProfile.archetypeId, 'negotiator');
  assert.equal(dossierPayload.progressionState.currentLevel, 1);
}

module.exports = {
  runProgressionSystemTests,
};
