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

function runGuidanceTransitionContinuityRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading');
    const freshLoadingPresentation = presentGuidanceSession({
      state: freshLoadingFixture.state,
      liveRawInput: freshLoadingFixture.liveRawInput,
    });
    const freshLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(freshLoadingFixture, freshLoadingPresentation));
    assert.match(freshLoadingMarkup, /data-guidance-zone="intake"[\s\S]*?data-transition-continuity="persist"/, 'fresh loading: intake should persist');
    assert.match(freshLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="advance"/, 'fresh loading: result should advance');

    const clarifyingFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
    const clarifyingPresentation = presentGuidanceSession({
      state: clarifyingFixture.state,
      liveRawInput: clarifyingFixture.liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingFixture, clarifyingPresentation));
    assert.match(clarifyingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-transition-continuity="advance"/, 'clarifying: onboarding should advance');
    assert.match(clarifyingMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="persist"/, 'clarifying: result should persist');

    const clarifyingLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading');
    const clarifyingLoadingPresentation = presentGuidanceSession({
      state: clarifyingLoadingFixture.state,
      liveRawInput: clarifyingLoadingFixture.liveRawInput,
    });
    const clarifyingLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingLoadingFixture, clarifyingLoadingPresentation));
    assert.match(clarifyingLoadingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-transition-continuity="persist"/, 'clarifying loading: onboarding should persist');
    assert.match(clarifyingLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="settle"/, 'clarifying loading: result should settle');

    const refinedFixture = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
    const refinedPresentation = presentGuidanceSession({
      state: refinedFixture.state,
      liveRawInput: refinedFixture.liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(buildControllerFixture(refinedFixture, refinedPresentation));
    assert.match(refinedMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="advance"/, 'refined: result should advance');

    const trainerLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
    const trainerLoadingPresentation = presentGuidanceSession({
      state: trainerLoadingFixture.state,
      liveRawInput: trainerLoadingFixture.liveRawInput,
    });
    const trainerLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(trainerLoadingFixture, trainerLoadingPresentation));
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-transition-continuity="advance"/, 'trainer loading: trainer should advance');
    assert.match(trainerLoadingMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="persist"/, 'trainer loading: result should persist');

    const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(buildControllerFixture(executionFixture, executionPresentation));
    assert.match(executionMarkup, /data-guidance-zone="execution"[\s\S]*?data-transition-continuity="advance"/, 'execution ready: execution should advance');
    assert.match(executionMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="persist"/, 'execution ready: result should persist');

    const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
    const degradedPresentation = presentGuidanceSession({
      state: degradedFixture.state,
      liveRawInput: degradedFixture.liveRawInput,
    });
    const degradedMarkup = renderGuidanceShellWithController(buildControllerFixture(degradedFixture, degradedPresentation));
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="persist"/, 'degraded: result should persist');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="advance"/, 'degraded: result should stay sober');

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
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-transition-continuity="persist"/, 'dossier loading: execution should persist');
    assert.match(dossierMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="settle"/, 'dossier loading: result should settle');
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
  runGuidanceTransitionContinuityRenderTests,
};
