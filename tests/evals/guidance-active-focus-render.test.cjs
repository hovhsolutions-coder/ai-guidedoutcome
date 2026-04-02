require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildDossierConversionPresentation,
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceActiveFocusRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const fixtures = [
    [presentationFixtures.find((fixture) => fixture.id === 'clarifying'), 'onboarding'],
    [presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), 'result'],
    [presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), 'execution'],
    [interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), 'trainer'],
    [degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), 'result'],
  ];

  withMockedGuidanceShell(() => {
    for (const [fixture, expectedZone] of fixtures) {
      assert.ok(fixture, 'Missing active-focus render fixture');
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      assert.equal(countMatches(markup, /data-focus-dominance="dominant"/g), 1, `${fixture.id}: expected exactly one dominant zone`);
      assert.match(markup, new RegExp(`data-guidance-zone="${expectedZone}"[\\s\\S]*?data-section-visibility="(?:visible|soft_hidden)"[\\s\\S]*?data-focus-dominance="dominant"`), `${fixture.id}: dominant zone drifted`);
      assert.match(markup, new RegExp(`data-guidance-progress-context="${presentation.activeFocus.target}"`), `${fixture.id}: progress context drifted`);
    }

    const dossierLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading');
    assert.ok(dossierLoadingFixture, 'Missing dossier-loading active-focus fixture');
    const dossierLoadingPresentation = presentGuidanceSession({
      state: dossierLoadingFixture.state,
      liveRawInput: dossierLoadingFixture.liveRawInput,
    });
    const dossierRenderPresentation = buildDossierConversionPresentation(dossierLoadingPresentation);
    const dossierController = buildControllerFixture(dossierLoadingFixture, dossierRenderPresentation);
    const dossierMarkup = renderGuidanceShellWithController(dossierController, {
      moduleOverrides: buildExecutionDossierLoadingOverride(),
    });

    assert.equal(countMatches(dossierMarkup, /data-focus-dominance="dominant"/g), 1, 'dossier loading: expected exactly one dominant zone');
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-section-visibility="visible"[\s\S]*?data-guidance-cta-context="dossier_convert"[\s\S]*?data-guidance-cta-state="active"[\s\S]*?data-focus-dominance="dominant"/, 'dossier loading: execution zone should be dominant');
    assert.match(dossierMarkup, /data-guidance-progress-context="execution_transition"/, 'dossier loading: progress context drifted');
    assert.doesNotMatch(dossierMarkup, /data-guidance-zone="result"[\s\S]*?data-section-visibility="(?:visible|soft_hidden)"[\s\S]*?data-focus-dominance="dominant"/, 'dossier loading: result should stay secondary');
  });
}

function buildExecutionDossierLoadingOverride() {
  const transitionModule = require('../../src/components/guidance/guidance-execution-transition.tsx');

  return {
    '../../src/components/guidance/guidance-execution-transition.tsx': {
      ...transitionModule,
      GuidanceExecutionTransition(props) {
        if (!props.transition) {
          return null;
        }

        return React.createElement(transitionModule.GuidanceExecutionTransitionCard, {
          transition: props.transition,
          isConverting: true,
          conversionError: null,
          conversionStatus: `Creating a dossier from this guidance read: "${props.transition.nextStep}"`,
          onConvertToDossier: () => {},
        });
      },
    },
  };
}

module.exports = {
  runGuidanceActiveFocusRenderTests,
};
