require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const { buildDossierConversionPresentation } = require('./guidance-shell-test-helpers.cjs');

function runGuidanceRightRailProfileTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    ['fresh', 'support', 'subtle'],
    ['clarifying', 'context', 'balanced'],
    ['refined_direction', 'deepen', 'balanced'],
    ['execution_ready', 'handoff', 'strong'],
  ];

  for (const [fixtureId, expectedRole, expectedEmphasis] of cases) {
    const fixture = presentationFixtures.find((entry) => entry.id === fixtureId);
    assert.ok(fixture, `Missing right-rail fixture ${fixtureId}`);
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.equal(presentation.rightRailProfile.visibility, 'visible', `${fixtureId}: right rail should stay visible`);
    assert.equal(presentation.rightRailProfile.role, expectedRole, `${fixtureId}: right-rail role drifted`);
    assert.equal(presentation.rightRailProfile.emphasis, expectedEmphasis, `${fixtureId}: right-rail emphasis drifted`);
    assert.ok(presentation.rightRailProfile.density, `${fixtureId}: right-rail density missing`);
    assert.ok(presentation.rightRailProfile.continuity, `${fixtureId}: right-rail continuity missing`);
  }

  const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
  assert.ok(degradedFixture, 'Missing degraded right-rail fixture');
  const degradedPresentation = presentGuidanceSession({
    state: degradedFixture.state,
    liveRawInput: degradedFixture.liveRawInput,
  });
  assert.equal(degradedPresentation.rightRailProfile.role, 'context');
  assert.equal(degradedPresentation.rightRailProfile.emphasis, 'subtle');
  assert.equal(degradedPresentation.rightRailProfile.continuity, 'persist');

  const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
  assert.ok(executionFixture, 'Missing execution right-rail fixture');
  const executionPresentation = presentGuidanceSession({
    state: executionFixture.state,
    liveRawInput: executionFixture.liveRawInput,
  });
  const dossierPresentation = buildDossierConversionPresentation(executionPresentation);
  assert.equal(dossierPresentation.rightRailProfile.role, 'handoff');
  assert.equal(dossierPresentation.rightRailProfile.continuity, 'persist');
  assert.equal(dossierPresentation.rightRailProfile.emphasis, 'strong');
}

module.exports = {
  runGuidanceRightRailProfileTests,
};
