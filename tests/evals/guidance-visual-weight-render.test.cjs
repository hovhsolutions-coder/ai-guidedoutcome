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

function runGuidanceVisualWeightRenderTests() {
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
    assert.match(freshMarkup, /data-guidance-zone="intake"[\s\S]*?data-visual-weight="strong"/, 'fresh: intake should be strong');
    assert.match(freshMarkup, /What do you need help with right now\?/, 'fresh: strong intake heading should remain prominent');
    assert.match(freshMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="subtle"/, 'fresh: result should be subtle');

    const freshLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading');
    const freshLoadingPresentation = presentGuidanceSession({
      state: freshLoadingFixture.state,
      liveRawInput: freshLoadingFixture.liveRawInput,
    });
    const freshLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(freshLoadingFixture, freshLoadingPresentation));
    assert.match(freshLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="strong"/, 'fresh loading: result should be strong');
    assert.match(freshLoadingMarkup, /data-guidance-zone="intake"[\s\S]*?data-visual-weight="subtle"/, 'fresh loading: intake should stay subtle');

    const clarifyingFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
    const clarifyingPresentation = presentGuidanceSession({
      state: clarifyingFixture.state,
      liveRawInput: clarifyingFixture.liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingFixture, clarifyingPresentation));
    assert.match(clarifyingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-visual-weight="strong"/, 'clarifying: onboarding should be strong');
    assert.match(clarifyingMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="balanced"/, 'clarifying: result should be balanced');

    const refinedFixture = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
    const refinedPresentation = presentGuidanceSession({
      state: refinedFixture.state,
      liveRawInput: refinedFixture.liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(buildControllerFixture(refinedFixture, refinedPresentation));
    assert.match(refinedMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="strong"/, 'refined: result should be strong');
    assert.match(refinedMarkup, /data-guidance-zone="trainer"[\s\S]*?data-visual-weight="balanced"/, 'refined: trainer should be balanced');

    const trainerLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
    const trainerLoadingPresentation = presentGuidanceSession({
      state: trainerLoadingFixture.state,
      liveRawInput: trainerLoadingFixture.liveRawInput,
    });
    const trainerLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(trainerLoadingFixture, trainerLoadingPresentation));
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-visual-weight="strong"/, 'trainer loading: trainer should be strong');
    assert.match(trainerLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="subtle"/, 'trainer loading: result should stay subtle');

    const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(buildControllerFixture(executionFixture, executionPresentation));
    assert.match(executionMarkup, /data-guidance-zone="execution"[\s\S]*?data-visual-weight="strong"/, 'execution ready: execution should be strong');
    assert.match(executionMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="balanced"/, 'execution ready: result should be balanced');

    const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
    const degradedPresentation = presentGuidanceSession({
      state: degradedFixture.state,
      liveRawInput: degradedFixture.liveRawInput,
    });
    const degradedMarkup = renderGuidanceShellWithController(buildControllerFixture(degradedFixture, degradedPresentation));
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="balanced"/, 'degraded: result should stay balanced');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="trainer"[\s\S]*?data-visual-weight="strong"/, 'degraded: support zones should stay sober');

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
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-visual-weight="strong"/, 'dossier loading: execution should stay strong');
    assert.match(dossierMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="subtle"/, 'dossier loading: result should stay subtle');
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
  runGuidanceVisualWeightRenderTests,
};
