require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceActiveFocus } = require('../../src/components/guidance/guidance-active-focus-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceActiveFocusMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { target: 'intake', dominantZone: 'intake', primaryCta: 'submit' }],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { target: 'result', dominantZone: 'result', primaryCta: 'none' }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { target: 'follow_up', dominantZone: 'onboarding', primaryCta: 'follow_up' }],
    [interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), { target: 'follow_up', dominantZone: 'onboarding', primaryCta: 'follow_up' }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { target: 'result', dominantZone: 'result', primaryCta: 'none' }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { target: 'trainer', dominantZone: 'trainer', primaryCta: 'trainer' }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { target: 'execution_transition', dominantZone: 'execution', primaryCta: 'dossier_convert' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { target: 'degraded_result', dominantZone: 'result', primaryCta: 'none' }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing active-focus fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.activeFocus, expected, `${fixture.id}: active focus drifted`);
  }

  const dossierConversionFocus = presentGuidanceActiveFocus('dossier_conversion_loading');
  assert.deepEqual(dossierConversionFocus, {
    target: 'execution_transition',
    dominantZone: 'execution',
    primaryCta: 'dossier_convert',
  });
}

module.exports = {
  runGuidanceActiveFocusMatrixTests,
};
