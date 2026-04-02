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

function runGuidanceSurfaceVariantRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), 'clarify_surface'],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), 'understand_surface'],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), 'commit_surface'],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), 'degraded_understand_surface'],
  ];

  withMockedGuidanceShell(() => {
    for (const [fixture, expectedVariant] of cases) {
      assert.ok(fixture, 'Missing surface-variant render fixture');
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const markup = renderGuidanceShellWithController(
        buildControllerFixture(fixture, presentation)
      );

      assert.match(markup, new RegExp(`data-guidance-surface-variant="${expectedVariant}"`), `${fixture.id}: page surface variant drifted`);

      if (fixture.id === 'clarifying') {
        assert.match(markup, /data-guidance-zone="onboarding"[\s\S]*?data-focus-dominance="dominant"/, 'clarifying: onboarding should remain dominant');
      }

      if (fixture.id === 'execution_ready') {
        assert.match(markup, /data-guidance-zone="execution"[\s\S]*?data-focus-dominance="dominant"/, 'execution: execution should remain dominant');
        assert.doesNotMatch(markup, /data-guidance-zone="trainer"/, 'execution: trainer should stay suppressed');
      }

      if (fixture.id === 'result_without_guidance_session') {
        assert.match(markup, /data-guidance-zone="result"[\s\S]*?data-focus-dominance="dominant"/, 'degraded: result should stay dominant');
        assert.doesNotMatch(markup, /data-guidance-zone="onboarding"/, 'degraded: onboarding should stay suppressed');
      }
    }

    const dossierFixture = interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading');
    assert.ok(dossierFixture, 'Missing dossier-loading surface-variant fixture');
    const dossierPresentation = buildDossierConversionPresentation(
      presentGuidanceSession({
        state: dossierFixture.state,
        liveRawInput: dossierFixture.liveRawInput,
      })
    );
    const dossierMarkup = renderGuidanceShellWithController(
      buildControllerFixture(dossierFixture, dossierPresentation)
    );

    assert.match(dossierMarkup, /data-guidance-surface-variant="commit_surface"/, 'dossier loading: page should stay commit surface');
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-focus-dominance="dominant"/, 'dossier loading: execution should remain dominant');
  });
}

module.exports = {
  runGuidanceSurfaceVariantRenderTests,
};
