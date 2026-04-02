require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceVisualWeight } = require('../../src/components/guidance/guidance-visual-weight-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceVisualWeightMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { intake: 'strong', onboarding: null, result: 'subtle', trainer: null, execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { intake: 'subtle', onboarding: null, result: 'strong', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'subtle', onboarding: 'strong', result: 'balanced', trainer: 'subtle', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'subtle', onboarding: 'balanced', result: 'strong', trainer: 'balanced', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'subtle', onboarding: 'subtle', result: 'subtle', trainer: 'strong', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'subtle', onboarding: 'subtle', result: 'balanced', trainer: null, execution: 'strong' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'subtle', onboarding: null, result: 'balanced', trainer: null, execution: null }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing visual-weight fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.visualWeight, expected, `${fixture.id}: visual weight drifted`);

    for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
      if (presentation.sectionVisibility[zone] === 'suppressed') {
        assert.equal(presentation.visualWeight[zone], null, `${fixture.id}: suppressed ${zone} should not carry weight`);
      }
    }

    const dominantWeight = presentation.visualWeight[presentation.activeFocus.dominantZone];
    assert.notEqual(dominantWeight, null, `${fixture.id}: dominant zone should carry weight`);
    assert.notEqual(dominantWeight, 'subtle', `${fixture.id}: dominant zone should not be subtle`);
  }

  const executionPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierWeight = presentGuidanceVisualWeight({
    progressState: 'dossier_conversion_loading',
    sectionVisibility: dossierVisibility,
  });

  assert.equal(dossierWeight.execution, 'strong');
  assert.equal(dossierWeight.result, 'subtle');
}

module.exports = {
  runGuidanceVisualWeightMatrixTests,
};
