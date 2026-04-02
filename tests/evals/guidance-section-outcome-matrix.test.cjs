require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSectionOutcome } = require('../../src/components/guidance/guidance-section-outcome-presenter.ts');
const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceSectionOutcomeMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), { intake: 'capture', onboarding: null, result: 'understand', trainer: null, execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), { intake: 'capture', onboarding: null, result: 'understand', trainer: null, execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), { intake: 'capture', onboarding: 'clarify', result: 'understand', trainer: 'explore', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), { intake: 'capture', onboarding: 'understand', result: 'understand', trainer: 'explore', execution: null }],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), { intake: 'capture', onboarding: 'understand', result: 'understand', trainer: 'explore', execution: null }],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), { intake: 'capture', onboarding: 'understand', result: 'understand', trainer: null, execution: 'commit' }],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), { intake: 'capture', onboarding: null, result: 'understand', trainer: null, execution: null }],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing section-outcome fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(presentation.sectionOutcome, expected, `${fixture.id}: section outcome drifted`);

    for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
      if (presentation.sectionVisibility[zone] === 'suppressed') {
        assert.equal(presentation.sectionOutcome[zone], null, `${fixture.id}: suppressed ${zone} should not carry outcome`);
      }
    }

    const activeZoneOutcome = presentation.sectionOutcome[presentation.activeFocus.dominantZone];
    assert.notEqual(activeZoneOutcome, null, `${fixture.id}: dominant zone should always carry outcome`);
  }

  const executionPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierOutcome = presentGuidanceSectionOutcome({
    progressState: 'dossier_conversion_loading',
    sectionVisibility: dossierVisibility,
  });

  assert.equal(dossierOutcome.execution, 'commit');
  assert.equal(dossierOutcome.result, 'understand');
}

module.exports = {
  runGuidanceSectionOutcomeMatrixTests,
};
