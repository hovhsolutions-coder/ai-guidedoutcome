require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  GUIDANCE_SESSION_PRESENTATION_PIPELINE_STEPS,
  buildGuidanceSessionPresentationPipeline,
  buildGuidanceSessionPresentationPipelineFromBaseState,
  presentGuidanceSession,
  presentGuidanceSessionForProgressStateOverride,
} = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceSessionPresenterPipelineTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const fixtures = [
    presentationFixtures.find((fixture) => fixture.id === 'fresh'),
    presentationFixtures.find((fixture) => fixture.id === 'clarifying'),
    presentationFixtures.find((fixture) => fixture.id === 'refined_direction'),
    interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'),
    presentationFixtures.find((fixture) => fixture.id === 'execution_ready'),
    degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'),
  ];

  for (const fixture of fixtures) {
    assert.ok(fixture, 'Missing pipeline fixture');
    const pipeline = buildGuidanceSessionPresentationPipeline({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });
    const finalPresentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(
      Object.keys(pipeline),
      [...GUIDANCE_SESSION_PRESENTATION_PIPELINE_STEPS],
      `${fixture.id}: pipeline step order drifted`
    );
    assert.deepEqual(Object.keys(pipeline.baseState), ['intake', 'rightRailView'], `${fixture.id}: base-state step drifted`);
    assert.deepEqual(Object.keys(pipeline.progressContract), ['progressMessage'], `${fixture.id}: progress step drifted`);
    assert.deepEqual(Object.keys(pipeline.focusVisibility), ['activeFocus', 'sectionVisibility'], `${fixture.id}: focus/visibility step drifted`);
    assert.deepEqual(
      Object.keys(pipeline.zoneLevelContracts),
      ['contentDensity', 'microcopyIntent', 'sectionOutcome', 'surfaceRhythm', 'transitionContinuity', 'visualWeight'],
      `${fixture.id}: zone-level step drifted`
    );
    assert.deepEqual(Object.keys(pipeline.unifiedZoneProfiles), ['zoneProfiles'], `${fixture.id}: zone-profile step drifted`);
    assert.deepEqual(Object.keys(pipeline.surfaceVariant), ['surfaceVariant'], `${fixture.id}: surface-variant step drifted`);
    assert.deepEqual(Object.keys(pipeline.rightRailProfile), ['rightRailProfile'], `${fixture.id}: right-rail-profile step drifted`);
    assert.deepEqual(Object.keys(pipeline.finalInvariantNormalization), ['finalPresentation'], `${fixture.id}: final-normalization step drifted`);

    assert.deepEqual(
      pipeline.finalInvariantNormalization.finalPresentation,
      finalPresentation,
      `${fixture.id}: final pipeline output drifted from presenter output`
    );
  }

  const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
  assert.ok(executionFixture, 'Missing execution pipeline fixture');
  const executionPipeline = buildGuidanceSessionPresentationPipeline({
    state: executionFixture.state,
    liveRawInput: executionFixture.liveRawInput,
  });
  const dossierPipeline = buildGuidanceSessionPresentationPipelineFromBaseState({
    baseState: executionPipeline.baseState,
    progressState: 'dossier_conversion_loading',
  });
  const dossierPresentation = presentGuidanceSessionForProgressStateOverride({
    baseState: executionPipeline.baseState,
    progressState: 'dossier_conversion_loading',
  });

  assert.equal(dossierPipeline.progressContract.progressMessage.state, 'dossier_conversion_loading');
  assert.equal(dossierPipeline.surfaceVariant.surfaceVariant, 'commit_surface');
  assert.equal(dossierPipeline.rightRailProfile.rightRailProfile.role, 'handoff');
  assert.equal(dossierPipeline.finalInvariantNormalization.finalPresentation.progressMessage.state, 'dossier_conversion_loading');
  assert.deepEqual(dossierPipeline.finalInvariantNormalization.finalPresentation, dossierPresentation, 'dossier override should end in the same final shape');

  const freshFixture = presentationFixtures.find((fixture) => fixture.id === 'fresh');
  assert.ok(freshFixture, 'Missing fresh pipeline fixture');
  const freshPipeline = buildGuidanceSessionPresentationPipeline({
    state: freshFixture.state,
    liveRawInput: freshFixture.liveRawInput,
  });
  const contradictoryPipeline = buildGuidanceSessionPresentationPipelineFromBaseState({
    baseState: freshPipeline.baseState,
    progressState: 'clarifying_ready',
  });

  assert.equal(contradictoryPipeline.surfaceVariant.surfaceVariant, 'clarify_surface', 'contradictory case should first resolve the requested variant');
  assert.equal(
    contradictoryPipeline.finalInvariantNormalization.finalPresentation.surfaceVariant,
    'understand_surface',
    'final normalization should be able to calm an impossible clarify surface'
  );
}

module.exports = {
  runGuidanceSessionPresenterPipelineTests,
};
