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

function runGuidanceSurfaceRhythmRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshFixture = presentationFixtures.find((fixture) => fixture.id === 'fresh');
    const freshPresentation = presentGuidanceSession({
      state: freshFixture.state,
      liveRawInput: freshFixture.liveRawInput,
    });
    const freshMarkup = renderGuidanceShellWithController(buildControllerFixture(freshFixture, freshPresentation));
    assert.match(freshMarkup, /data-guidance-zone="intake"[\s\S]*?data-surface-rhythm="steady"/, 'fresh: intake should be steady');
    assert.match(freshMarkup, /ui-surface-secondary[\s\S]*?space-y-5 p-5 sm:p-6/, 'fresh: steady rhythm should keep moderate spacing');

    const freshLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading');
    const freshLoadingPresentation = presentGuidanceSession({
      state: freshLoadingFixture.state,
      liveRawInput: freshLoadingFixture.liveRawInput,
    });
    const freshLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(freshLoadingFixture, freshLoadingPresentation));
    assert.match(freshLoadingMarkup, /data-guidance-zone="intake"[\s\S]*?data-surface-rhythm="compact"/, 'fresh loading: intake should be compact');
    assert.match(freshLoadingMarkup, /ui-surface-secondary[\s\S]*?space-y-4 p-4 sm:p-5/, 'fresh loading: compact rhythm should tighten spacing');

    const clarifyingFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
    const clarifyingPresentation = presentGuidanceSession({
      state: clarifyingFixture.state,
      liveRawInput: clarifyingFixture.liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingFixture, clarifyingPresentation));
    assert.match(clarifyingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-surface-rhythm="steady"/, 'clarifying: onboarding should be steady');
    assert.match(clarifyingMarkup, /ui-surface-primary[\s\S]*?space-y-5 p-5 sm:p-6/, 'clarifying: steady onboarding spacing should remain calm');

    const refinedFixture = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
    const refinedPresentation = presentGuidanceSession({
      state: refinedFixture.state,
      liveRawInput: refinedFixture.liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(buildControllerFixture(refinedFixture, refinedPresentation));
    assert.match(refinedMarkup, /data-guidance-zone="result"[\s\S]*?data-surface-rhythm="spacious"/, 'refined: result should be spacious');
    assert.match(refinedMarkup, /space-y-7 p-6 sm:p-7/, 'refined: spacious result should get more air');

    const trainerLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
    const trainerLoadingPresentation = presentGuidanceSession({
      state: trainerLoadingFixture.state,
      liveRawInput: trainerLoadingFixture.liveRawInput,
    });
    const trainerLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(trainerLoadingFixture, trainerLoadingPresentation));
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-surface-rhythm="spacious"/, 'trainer loading: trainer should be spacious');
    assert.match(trainerLoadingMarkup, /class="space-y-7/, 'trainer loading: spacious trainer rhythm should widen section spacing');

    const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(buildControllerFixture(executionFixture, executionPresentation));
    assert.match(executionMarkup, /data-guidance-zone="execution"[\s\S]*?data-surface-rhythm="spacious"/, 'execution ready: execution should be spacious');
    assert.match(executionMarkup, /class="space-y-5/, 'execution ready: spacious execution rhythm should keep the most room');

    const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
    const degradedPresentation = presentGuidanceSession({
      state: degradedFixture.state,
      liveRawInput: degradedFixture.liveRawInput,
    });
    const degradedMarkup = renderGuidanceShellWithController(buildControllerFixture(degradedFixture, degradedPresentation));
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-surface-rhythm="steady"/, 'degraded: result should stay steady');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="trainer"[\s\S]*?data-surface-rhythm="spacious"/, 'degraded: supporting zones should stay sober');

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
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-surface-rhythm="spacious"/, 'dossier loading: execution should stay spacious');
    assert.match(dossierMarkup, /data-guidance-zone="result"[\s\S]*?data-surface-rhythm="compact"/, 'dossier loading: result should tighten while execution leads');
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
          intent: props.intent,
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
  runGuidanceSurfaceRhythmRenderTests,
};
