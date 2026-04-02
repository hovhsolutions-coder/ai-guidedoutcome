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
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceContentDensityRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshPresentation = presentGuidanceSession({
      state: presentationFixtures.find((fixture) => fixture.id === 'fresh').state,
      liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'fresh').liveRawInput,
    });
    const freshMarkup = renderGuidanceShellWithController(
      buildControllerFixture(presentationFixtures.find((fixture) => fixture.id === 'fresh'), freshPresentation)
    );
    assert.match(freshMarkup, /data-guidance-zone="intake"[\s\S]*?data-content-density="guided"/, 'fresh: intake should be guided');
    assert.match(freshMarkup, /Write it the messy way first/, 'fresh: guided intake description should remain');

    const freshLoadingPresentation = presentGuidanceSession({
      state: interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading').state,
      liveRawInput: interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading').liveRawInput,
    });
    const freshLoadingMarkup = renderGuidanceShellWithController(
      buildControllerFixture(interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), freshLoadingPresentation)
    );
    assert.match(freshLoadingMarkup, /data-guidance-zone="intake"[\s\S]*?data-content-density="minimal"/, 'fresh loading: intake should be minimal');
    assert.doesNotMatch(freshLoadingMarkup, /Write it the messy way first/, 'fresh loading: intake should feel compact');

    const clarifyingPresentation = presentGuidanceSession({
      state: presentationFixtures.find((fixture) => fixture.id === 'clarifying').state,
      liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'clarifying').liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(
      buildControllerFixture(presentationFixtures.find((fixture) => fixture.id === 'clarifying'), clarifyingPresentation)
    );
    assert.match(clarifyingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-content-density="guided"/, 'clarifying: onboarding should be guided');
    assert.match(clarifyingMarkup, /data-guidance-zone="result"[\s\S]*?data-content-density="guided"/, 'clarifying: result should be guided');

    const refinedPresentation = presentGuidanceSession({
      state: presentationFixtures.find((fixture) => fixture.id === 'refined_direction').state,
      liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'refined_direction').liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(
      buildControllerFixture(presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), refinedPresentation)
    );
    assert.match(refinedMarkup, /data-guidance-zone="result"[\s\S]*?data-content-density="expanded"/, 'refined: result should be expanded');
    assert.match(refinedMarkup, /Last refreshed at/, 'refined: expanded result should keep richer timing context');

    const trainerLoadingPresentation = presentGuidanceSession({
      state: interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading').state,
      liveRawInput: interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading').liveRawInput,
    });
    const trainerLoadingMarkup = renderGuidanceShellWithController(
      buildControllerFixture(interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), trainerLoadingPresentation)
    );
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-content-density="guided"/, 'trainer loading: trainer should be guided');
    assert.doesNotMatch(trainerLoadingMarkup, /Other ways to continue/, 'trainer loading: guided trainer should suppress extra route noise');

    const executionPresentation = presentGuidanceSession({
      state: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').state,
      liveRawInput: presentationFixtures.find((fixture) => fixture.id === 'execution_ready').liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(
      buildControllerFixture(presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), executionPresentation)
    );
    assert.match(executionMarkup, /data-guidance-zone="execution"[\s\S]*?data-content-density="expanded"/, 'execution ready: execution should be expanded');
    assert.match(executionMarkup, /data-guidance-zone="result"[\s\S]*?data-content-density="guided"/, 'execution ready: result should stay guided');

    const degradedPresentation = presentGuidanceSession({
      state: degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session').state,
      liveRawInput: degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session').liveRawInput,
    });
    const degradedMarkup = renderGuidanceShellWithController(
      buildControllerFixture(degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), degradedPresentation)
    );
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-content-density="guided"/, 'degraded: result should stay guided');
    assert.doesNotMatch(degradedMarkup, /Last refreshed at/, 'degraded: density should stay sober');

    const dossierFixture = interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading');
    const dossierBasePresentation = presentGuidanceSession({
      state: dossierFixture.state,
      liveRawInput: dossierFixture.liveRawInput,
    });
    const dossierPresentation = buildDossierConversionPresentation(dossierBasePresentation);
    const dossierMarkup = renderGuidanceShellWithController(
      buildControllerFixture(dossierFixture, dossierPresentation),
      { moduleOverrides: buildExecutionDossierLoadingOverride() }
    );
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-content-density="expanded"/, 'dossier loading: execution should stay expanded');
    assert.match(dossierMarkup, /data-guidance-zone="result"[\s\S]*?data-content-density="minimal"/, 'dossier loading: result should be compact');
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
  runGuidanceContentDensityRenderTests,
};
