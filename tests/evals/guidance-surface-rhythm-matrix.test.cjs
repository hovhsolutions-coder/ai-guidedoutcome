require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceSurfaceRhythm } = require('../../src/components/guidance/guidance-surface-rhythm-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceSurfaceRhythmMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { intake: 'steady', onboarding: null, result: 'compact', trainer: null, execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { intake: 'compact', onboarding: null, result: 'steady', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'compact', onboarding: 'steady', result: 'steady', trainer: 'compact', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'compact', onboarding: 'compact', result: 'spacious', trainer: 'steady', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'compact', onboarding: 'compact', result: 'compact', trainer: 'spacious', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'compact', onboarding: 'compact', result: 'steady', trainer: null, execution: 'spacious' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'compact', onboarding: null, result: 'steady', trainer: null, execution: null }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing surface-rhythm fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.surfaceRhythm, expected, `${fixture.id}: surface rhythm drifted`);

    for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
      if (presentation.sectionVisibility[zone] === 'suppressed') {
        assert.equal(presentation.surfaceRhythm[zone], null, `${fixture.id}: suppressed ${zone} should not carry rhythm`);
      }
    }

    const dominantZone = presentation.activeFocus.dominantZone;
    const dominantRhythm = presentation.surfaceRhythm[dominantZone];
    assert.notEqual(dominantRhythm, null, `${fixture.id}: dominant zone should always carry rhythm`);
    if (dominantRhythm === 'compact') {
      assert.fail(`${fixture.id}: dominant zone should not collapse to compact rhythm`);
    }
  }

  const executionPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierRhythm = presentGuidanceSurfaceRhythm({
    progressState: 'dossier_conversion_loading',
    sectionVisibility: dossierVisibility,
  });

  assert.equal(dossierRhythm.execution, 'spacious');
  assert.equal(dossierRhythm.result, 'compact');
}

module.exports = {
  runGuidanceSurfaceRhythmMatrixTests,
};
