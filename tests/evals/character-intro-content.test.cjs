require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { characterArchetypeCatalog } = require('../../src/lib/progression/catalog.ts');
const { buildCharacterProfile } = require('../../src/lib/progression/progression.ts');

function runCharacterIntroContentTests() {
  const archetypeIds = ['strategist', 'builder', 'negotiator', 'communicator', 'executor'];

  for (const archetypeId of archetypeIds) {
    const definition = characterArchetypeCatalog[archetypeId];
    const profile = buildCharacterProfile(archetypeId);

    assert.ok(definition, `catalog entry should exist for ${archetypeId}`);
    assert.ok(definition.intro.title.trim().length > 0, `${archetypeId} should expose an intro title`);
    assert.ok(definition.intro.introText.trim().length > 0, `${archetypeId} should expose intro text`);
    assert.ok(definition.intro.guidanceStyle.trim().length > 0, `${archetypeId} should expose guidance style`);
    assert.ok(definition.intro.firstFocus.trim().length > 0, `${archetypeId} should expose first focus`);
    assert.ok(
      Array.isArray(definition.intro.recommendedStartingSkills) && definition.intro.recommendedStartingSkills.length >= 2,
      `${archetypeId} should expose recommended starting skills`
    );

    assert.equal(profile.archetypeId, archetypeId);
    assert.equal(profile.intro.title, definition.intro.title, `${archetypeId} profile intro title should match catalog`);
    assert.equal(profile.intro.introText, definition.intro.introText, `${archetypeId} profile intro text should match catalog`);
    assert.equal(profile.intro.guidanceStyle, definition.intro.guidanceStyle, `${archetypeId} profile intro style should match catalog`);
    assert.equal(profile.intro.firstFocus, definition.intro.firstFocus, `${archetypeId} profile intro focus should match catalog`);
    assert.equal(profile.intro.introVideoUrl, definition.intro.introVideoUrl, `${archetypeId} profile intro video should match catalog`);
    assert.deepEqual(
      profile.intro.recommendedStartingSkills,
      definition.recommendedSkills.slice(0, profile.intro.recommendedStartingSkills.length),
      `${archetypeId} intro starting skills should align with its recommended skills path`
    );
  }
}

module.exports = {
  runCharacterIntroContentTests,
};
