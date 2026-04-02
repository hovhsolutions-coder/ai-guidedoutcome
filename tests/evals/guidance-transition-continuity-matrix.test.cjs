require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceTransitionContinuity } = require('../../src/components/guidance/guidance-transition-continuity-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceTransitionContinuityMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { intake: 'persist', onboarding: null, result: 'advance', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'settle', onboarding: 'advance', result: 'persist', trainer: 'settle', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), { intake: 'settle', onboarding: 'persist', result: 'settle', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'settle', onboarding: 'persist', result: 'advance', trainer: 'settle', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'settle', onboarding: 'settle', result: 'persist', trainer: 'advance', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'settle', onboarding: 'settle', result: 'persist', trainer: null, execution: 'advance' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'settle', onboarding: null, result: 'persist', trainer: null, execution: null }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing transition-continuity fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.transitionContinuity, expected, `${fixture.id}: transition continuity drifted`);

    for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
      if (presentation.sectionVisibility[zone] === 'suppressed') {
        assert.equal(presentation.transitionContinuity[zone], null, `${fixture.id}: suppressed ${zone} should not carry continuity`);
      }
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
  const dossierContinuity = presentGuidanceTransitionContinuity({
    progressState: 'dossier_conversion_loading',
    sectionVisibility: dossierVisibility,
  });

  assert.equal(dossierContinuity.execution, 'persist');
  assert.equal(dossierContinuity.result, 'settle');
}

module.exports = {
  runGuidanceTransitionContinuityMatrixTests,
};
