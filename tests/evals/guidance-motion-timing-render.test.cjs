require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  buildDossierConversionPresentation,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceMotionTimingRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshLoading = requireFixture(interactionFixtures, 'fresh_submit_loading');
    const freshLoadingMarkup = renderFixture(freshLoading);
    assert.match(freshLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-guidance-motion-profile="instant"/, 'fresh loading: dominant result should respond instantly');
    assert.match(freshLoadingMarkup, /data-guidance-zone="intake"[\s\S]*?data-guidance-motion-profile="smooth"/, 'fresh loading: intake should react more softly');
    assert.match(freshLoadingMarkup, /data-guidance-progress-context="result"[\s\S]*?data-guidance-motion-profile="instant"/, 'fresh loading: progress block should stay synced with the dominant zone');

    const clarifyingLoading = requireFixture(interactionFixtures, 'clarifying_follow_up_loading');
    const clarifyingLoadingMarkup = renderFixture(clarifyingLoading);
    assert.match(clarifyingLoadingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-guidance-motion-profile="smooth"/, 'clarifying loading: onboarding should fold in smoothly');
    assert.match(clarifyingLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'clarifying loading: supporting result should trail more quietly');
    assert.match(clarifyingLoadingMarkup, /data-guidance-progress-context="follow_up"[\s\S]*?data-guidance-motion-profile="smooth"/, 'clarifying loading: progress block should stay smooth with onboarding');

    const trainerLoading = requireFixture(interactionFixtures, 'trainer_request_loading');
    const trainerLoadingMarkup = renderFixture(trainerLoading);
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'trainer loading: trainer should use the deliberate profile');
    assert.match(trainerLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'trainer loading: supporting result should stay calm and delayed');
    assert.match(trainerLoadingMarkup, /data-guidance-progress-context="trainer"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'trainer loading: progress block should match the deliberate trainer timing');

    const executionReady = requireFixture(presentationFixtures, 'execution_ready');
    const executionReadyMarkup = renderFixture(executionReady);
    assert.match(executionReadyMarkup, /data-guidance-zone="execution"[\s\S]*?data-guidance-motion-profile="smooth"/, 'execution ready: execution should advance smoothly before conversion starts');

    const dossierLoadingBase = requireFixture(interactionFixtures, 'execution_ready_dossier_loading');
    const dossierLoadingPresentation = buildDossierConversionPresentation(
      presentGuidanceSession({
        state: dossierLoadingBase.state,
        liveRawInput: dossierLoadingBase.liveRawInput,
      })
    );
    const dossierLoadingMarkup = renderGuidanceShellWithController(
      buildControllerFixture(dossierLoadingBase, dossierLoadingPresentation)
    );
    assert.match(dossierLoadingMarkup, /data-guidance-zone="execution"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'dossier loading: execution should feel like a deliberate commit');
    assert.match(dossierLoadingMarkup, /data-guidance-progress-context="execution_transition"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'dossier loading: progress block should keep the same deliberate commit timing');
    assert.match(dossierLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-guidance-motion-profile="deliberate"/, 'dossier loading: secondary result should stay slower than the dominant handoff');

    const degradedFallback = requireFixture(degradedFixtures, 'result_without_guidance_session');
    const degradedMarkup = renderFixture(degradedFallback);
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-guidance-motion-profile="smooth"/, 'degraded fallback: result should stay calm and steady');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="trainer"[\s\S]*?data-guidance-motion-profile="instant"/, 'degraded fallback: secondary zones should never snap faster than the result');
  });
}

function renderFixture(fixture) {
  const presentation = presentGuidanceSession({
    state: fixture.state,
    liveRawInput: fixture.liveRawInput,
  });

  return renderGuidanceShellWithController(buildControllerFixture(fixture, presentation));
}

function requireFixture(fixtures, id) {
  const fixture = fixtures.find((entry) => entry.id === id);
  assert.ok(fixture, `Missing fixture ${id}`);
  return fixture;
}

module.exports = {
  runGuidanceMotionTimingRenderTests,
};
