require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceActiveFocus } = require('../../src/components/guidance/guidance-active-focus-presenter.ts');
const { presentGuidanceProgressMessageForState } = require('../../src/components/guidance/guidance-progress-presenter.ts');
const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceSectionVisibilityMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { intake: 'visible', onboarding: 'suppressed', result: 'visible', trainer: 'suppressed', execution: 'suppressed' }],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { intake: 'soft_hidden', onboarding: 'suppressed', result: 'visible', trainer: 'suppressed', execution: 'suppressed' }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'soft_hidden', onboarding: 'visible', result: 'visible', trainer: 'soft_hidden', execution: 'suppressed' }],
    [interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), { intake: 'soft_hidden', onboarding: 'visible', result: 'soft_hidden', trainer: 'suppressed', execution: 'suppressed' }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'soft_hidden', onboarding: 'soft_hidden', result: 'visible', trainer: 'soft_hidden', execution: 'suppressed' }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'soft_hidden', onboarding: 'soft_hidden', result: 'soft_hidden', trainer: 'visible', execution: 'suppressed' }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'soft_hidden', onboarding: 'soft_hidden', result: 'soft_hidden', trainer: 'suppressed', execution: 'visible' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'soft_hidden', onboarding: 'suppressed', result: 'visible', trainer: 'suppressed', execution: 'suppressed' }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing section-visibility fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });
    assert.deepEqual(presentation.sectionVisibility, expected, `${fixture.id}: section visibility drifted`);

    const focusStatus = presentation.sectionVisibility[presentation.activeFocus.dominantZone];
    assert.notEqual(focusStatus, 'suppressed', `${fixture.id}: active focus points to a suppressed zone`);

    if (presentation.activeFocus.primaryCta === 'submit') {
      assert.notEqual(presentation.sectionVisibility.intake, 'suppressed', `${fixture.id}: submit CTA points to suppressed intake`);
    }
    if (presentation.activeFocus.primaryCta === 'follow_up') {
      assert.notEqual(presentation.sectionVisibility.onboarding, 'suppressed', `${fixture.id}: follow-up CTA points to suppressed onboarding`);
    }
    if (presentation.activeFocus.primaryCta === 'trainer') {
      assert.notEqual(presentation.sectionVisibility.trainer, 'suppressed', `${fixture.id}: trainer CTA points to suppressed trainer zone`);
    }
    if (presentation.activeFocus.primaryCta === 'dossier_convert') {
      assert.notEqual(presentation.sectionVisibility.execution, 'suppressed', `${fixture.id}: dossier CTA points to suppressed execution zone`);
    }
  }

  const executionPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierProgress = presentGuidanceProgressMessageForState({
    state: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierFocus = presentGuidanceActiveFocus(dossierProgress.state);
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: dossierProgress.state,
    rightRailView: executionPresentation.rightRailView,
  });

  assert.equal(dossierVisibility.execution, 'visible');
  assert.equal(dossierFocus.dominantZone, 'execution');
  assert.notEqual(dossierVisibility[dossierFocus.dominantZone], 'suppressed');
}

module.exports = {
  runGuidanceSectionVisibilityMatrixTests,
};
