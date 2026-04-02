require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceProgressMessageForState } = require('../../src/components/guidance/guidance-progress-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceProgressMessageMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const fixtures = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), 'fresh_ready'],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), 'fresh_submit_loading'],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), 'clarifying_ready'],
    [interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), 'clarifying_continue_loading'],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), 'refined_ready'],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), 'trainer_request_loading'],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), 'execution_ready'],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), 'degraded_result_fallback'],
    [degradedFixtures.find((fixture) => fixture.id === 'execution_phase_without_progression_snapshot'), 'degraded_result_fallback'],
  ];

  for (const [fixture, expectedState] of fixtures) {
    assert.ok(fixture, `Missing fixture for ${expectedState}`);
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.equal(presentation.progressMessage.state, expectedState, `${fixture.id}: progress state drifted`);
    assert.ok(presentation.progressMessage.eyebrow.trim().length > 0, `${fixture.id}: missing progress eyebrow`);
    assert.ok(presentation.progressMessage.title.trim().length > 0, `${fixture.id}: missing progress title`);
    assert.ok(presentation.progressMessage.statusLine.trim().length > 0, `${fixture.id}: missing progress status line`);
  }

  const executionReadyPresentation = presentGuidanceSession({
    state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
    liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
  });
  const dossierConversionMessage = presentGuidanceProgressMessageForState({
    state: 'dossier_conversion_loading',
    rightRailView: executionReadyPresentation.rightRailView,
  });
  assert.equal(dossierConversionMessage.state, 'dossier_conversion_loading');
  assert.ok(dossierConversionMessage.title.trim().length > 0, 'dossier conversion: missing progress title');
  assert.ok(dossierConversionMessage.statusLine.trim().length > 0, 'dossier conversion: missing progress status line');

  const freshLoadingPresentation = presentGuidanceSession({
    state: interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading').state,
    liveRawInput: interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading').liveRawInput,
  });
  assert.match(freshLoadingPresentation.progressMessage.title, /guidance pass/i);
  assert.match(freshLoadingPresentation.progressMessage.statusLine, /summary, one next step/i);

  const trainerLoadingPresentation = presentGuidanceSession({
    state: interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading').state,
    liveRawInput: interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading').liveRawInput,
  });
  assert.match(trainerLoadingPresentation.progressMessage.title, /trainer read/i);
  assert.match(trainerLoadingPresentation.progressMessage.statusLine, /main guidance read stays stable/i);

  const degradedPresentation = presentGuidanceSession({
    state: degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session').state,
    liveRawInput: degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session').liveRawInput,
  });
  assert.match(degradedPresentation.progressMessage.title, /core guidance read is still here/i);
  assert.match(degradedPresentation.progressMessage.statusLine, /nothing important was lost/i);
  assert.match(degradedPresentation.progressMessage.statusLine, /enough authority to keep the next move trustworthy/i);

  assert.match(dossierConversionMessage.title, /carried into a dossier workspace/i);
  assert.match(dossierConversionMessage.statusLine, /persistent workspace/i);
}

module.exports = {
  runGuidanceProgressMessageMatrixTests,
};
