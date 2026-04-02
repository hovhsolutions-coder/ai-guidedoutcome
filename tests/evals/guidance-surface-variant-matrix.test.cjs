require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSurfaceVariant } = require('../../src/components/guidance/guidance-surface-variant-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const { createGuidanceRecoveryFixtureMatrix } = require('./guidance-recovery-fixtures.ts');

function runGuidanceSurfaceVariantMatrixTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();
  const recoveryFixtures = createGuidanceRecoveryFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'fresh'), 'capture_surface'],
    [interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), 'understand_surface'],
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), 'clarify_surface'],
    [interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), 'clarify_surface'],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), 'understand_surface'],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), 'explore_surface'],
    [recoveryFixtures.find((fixture) => fixture.id === 'trainer_request_failure'), 'explore_surface'],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), 'commit_surface'],
    [interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading'), 'commit_surface'],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), 'degraded_understand_surface'],
  ];

  for (const [fixture, expected] of cases) {
    assert.ok(fixture, 'Missing surface-variant fixture');
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.equal(presentation.surfaceVariant, expected, `${fixture.id}: surface variant drifted`);
    assert.equal(
      presentation.surfaceVariant,
      presentGuidanceSurfaceVariant(presentation.progressMessage.state),
      `${fixture.id}: surface variant drifted away from progress state`
    );
  }

  const commitFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
  const commitPresentation = presentGuidanceSession({
    state: commitFixture.state,
    liveRawInput: commitFixture.liveRawInput,
  });
  assert.equal(commitPresentation.surfaceVariant, 'commit_surface');
  assert.equal(commitPresentation.activeFocus.dominantZone, 'execution', 'commit surface requires execution dominance');
  assert.equal(commitPresentation.activeFocus.primaryCta, 'dossier_convert', 'commit surface requires execution CTA');

  const exploreFixture = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
  const explorePresentation = presentGuidanceSession({
    state: exploreFixture.state,
    liveRawInput: exploreFixture.liveRawInput,
  });
  assert.equal(explorePresentation.surfaceVariant, 'explore_surface');
  assert.equal(explorePresentation.activeFocus.dominantZone, 'trainer', 'explore surface requires trainer dominance');

  const clarifyFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
  const clarifyPresentation = presentGuidanceSession({
    state: clarifyFixture.state,
    liveRawInput: clarifyFixture.liveRawInput,
  });
  assert.equal(clarifyPresentation.surfaceVariant, 'clarify_surface');
  assert.equal(clarifyPresentation.activeFocus.dominantZone, 'onboarding', 'clarify surface requires onboarding dominance');

  const captureFixture = presentationFixtures.find((fixture) => fixture.id === 'fresh');
  const capturePresentation = presentGuidanceSession({
    state: captureFixture.state,
    liveRawInput: captureFixture.liveRawInput,
  });
  assert.equal(capturePresentation.surfaceVariant, 'capture_surface');
  assert.equal(capturePresentation.activeFocus.dominantZone, 'intake', 'capture surface requires intake dominance');

  const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
  const degradedPresentation = presentGuidanceSession({
    state: degradedFixture.state,
    liveRawInput: degradedFixture.liveRawInput,
  });
  assert.equal(degradedPresentation.surfaceVariant, 'degraded_understand_surface');
  assert.equal(degradedPresentation.activeFocus.dominantZone, 'result');
  assert.equal(degradedPresentation.activeFocus.primaryCta, 'none');
}

module.exports = {
  runGuidanceSurfaceVariantMatrixTests,
};
