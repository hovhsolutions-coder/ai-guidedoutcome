require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceActiveFocus } = require('../../src/components/guidance/guidance-active-focus-presenter.ts');
const { presentGuidanceContentDensity } = require('../../src/components/guidance/guidance-content-density-presenter.ts');
const { presentGuidanceProgressMessageForState } = require('../../src/components/guidance/guidance-progress-presenter.ts');
const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceContentDensityMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { intake: 'guided', onboarding: null, result: 'minimal', trainer: null, execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { intake: 'minimal', onboarding: null, result: 'guided', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'minimal', onboarding: 'guided', result: 'guided', trainer: 'minimal', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), { intake: 'minimal', onboarding: 'guided', result: 'minimal', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'minimal', onboarding: 'guided', result: 'expanded', trainer: 'guided', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'minimal', onboarding: 'minimal', result: 'guided', trainer: 'guided', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'minimal', onboarding: 'minimal', result: 'guided', trainer: null, execution: 'expanded' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'minimal', onboarding: null, result: 'guided', trainer: null, execution: null }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing content-density fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.contentDensity, expected, `${fixture.id}: content density drifted`);

    for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
      if (presentation.sectionVisibility[zone] === 'suppressed') {
        assert.equal(presentation.contentDensity[zone], null, `${fixture.id}: suppressed ${zone} should not carry density`);
      }
    }

    const dominantDensity = presentation.contentDensity[presentation.activeFocus.dominantZone];
    assert.notEqual(dominantDensity, null, `${fixture.id}: dominant zone should always have density`);
  }

  const executionPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierDensity = presentGuidanceContentDensity({
    progressState: 'dossier_conversion_loading',
    sectionVisibility: dossierVisibility,
  });
  const dossierFocus = presentGuidanceActiveFocus('dossier_conversion_loading');
  const dossierProgress = presentGuidanceProgressMessageForState({
    state: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });

  assert.equal(dossierProgress.state, 'dossier_conversion_loading');
  assert.equal(dossierDensity.execution, 'expanded');
  assert.equal(dossierDensity.result, 'minimal');
  assert.equal(dossierFocus.dominantZone, 'execution');
}

module.exports = {
  runGuidanceContentDensityMatrixTests,
};
