require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceMicrocopyIntent } = require('../../src/components/guidance/guidance-microcopy-intent-presenter.ts');
const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceMicrocopyIntentMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { intake: 'orient', onboarding: null, result: 'confirm', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'confirm', onboarding: 'orient', result: 'confirm', trainer: 'confirm', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'confirm', onboarding: 'confirm', result: 'deepen', trainer: 'deepen', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'confirm', onboarding: 'confirm', result: 'confirm', trainer: 'deepen', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'confirm', onboarding: 'confirm', result: 'confirm', trainer: null, execution: 'activate' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'confirm', onboarding: null, result: 'confirm', trainer: null, execution: null }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing microcopy-intent fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.microcopyIntent, expected, `${fixture.id}: microcopy intent drifted`);

    for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
      if (presentation.sectionVisibility[zone] === 'suppressed') {
        assert.equal(presentation.microcopyIntent[zone], null, `${fixture.id}: suppressed ${zone} should not carry intent`);
      }
    }

    const activeZoneIntent = presentation.microcopyIntent[presentation.activeFocus.dominantZone];
    assert.notEqual(activeZoneIntent, null, `${fixture.id}: dominant zone should always carry microcopy intent`);
  }

  const executionPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierIntent = presentGuidanceMicrocopyIntent({
    progressState: 'dossier_conversion_loading',
    sectionVisibility: dossierVisibility,
  });

  assert.equal(dossierIntent.execution, 'activate');
  assert.equal(dossierIntent.result, 'confirm');
}

module.exports = {
  runGuidanceMicrocopyIntentMatrixTests,
};
