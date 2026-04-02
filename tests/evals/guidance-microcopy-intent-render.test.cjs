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

function runGuidanceMicrocopyIntentRenderTests() {
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
    assert.match(freshMarkup, /data-guidance-zone="intake"[\s\S]*?data-microcopy-intent="orient"/, 'fresh: intake should orient');
    assert.match(freshMarkup, /Start with raw context first\. The system will structure it into a cleaner read\./, 'fresh: orient copy should appear');

    const clarifyingFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
    const clarifyingPresentation = presentGuidanceSession({
      state: clarifyingFixture.state,
      liveRawInput: clarifyingFixture.liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingFixture, clarifyingPresentation));
    assert.match(clarifyingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-microcopy-intent="orient"/, 'clarifying: onboarding should orient');
    assert.match(clarifyingMarkup, /The direction is promising, but one clarifying answer will make the next move feel more grounded and more useful\./, 'clarifying: orient wording should remain guided');
    assert.match(clarifyingMarkup, /data-guidance-zone="result"[\s\S]*?data-microcopy-intent="confirm"/, 'clarifying: result should confirm');

    const refinedFixture = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
    const refinedPresentation = presentGuidanceSession({
      state: refinedFixture.state,
      liveRawInput: refinedFixture.liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(buildControllerFixture(refinedFixture, refinedPresentation));
    assert.match(refinedMarkup, /data-guidance-zone="result"[\s\S]*?data-microcopy-intent="deepen"/, 'refined: result should deepen');
    assert.match(refinedMarkup, /These tasks unpack the current read into a clearer path without changing the underlying position you already confirmed\./, 'refined: deepen wording should appear');
    assert.match(refinedMarkup, /data-guidance-zone="trainer"[\s\S]*?data-microcopy-intent="deepen"/, 'refined: trainer should deepen');

    const trainerLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
    const trainerLoadingPresentation = presentGuidanceSession({
      state: trainerLoadingFixture.state,
      liveRawInput: trainerLoadingFixture.liveRawInput,
    });
    const trainerLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(trainerLoadingFixture, trainerLoadingPresentation));
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-microcopy-intent="deepen"/, 'trainer loading: trainer should deepen');
    assert.match(trainerLoadingMarkup, /Loading strategy trainer\.\.\./, 'trainer loading: deepen trainer wording should remain specific');

    const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(buildControllerFixture(executionFixture, executionPresentation));
    assert.match(executionMarkup, /data-guidance-zone="execution"[\s\S]*?data-microcopy-intent="activate"/, 'execution ready: execution should activate');
    assert.match(executionMarkup, /Your plan is ready to move into mission control\./, 'execution ready: activate wording should stay direct');

    const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
    const degradedPresentation = presentGuidanceSession({
      state: degradedFixture.state,
      liveRawInput: degradedFixture.liveRawInput,
    });
    const degradedMarkup = renderGuidanceShellWithController(buildControllerFixture(degradedFixture, degradedPresentation));
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-microcopy-intent="confirm"/, 'degraded: result should confirm');
    assert.doesNotMatch(degradedMarkup, /What this adds/, 'degraded: deepen trainer language should stay absent when authority is thin');

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
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-microcopy-intent="activate"/, 'dossier loading: execution should stay activate');
    assert.doesNotMatch(dossierMarkup, /data-guidance-zone="trainer"[\s\S]*?data-microcopy-intent=/, 'dossier loading: trainer should stay suppressed');
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
  runGuidanceMicrocopyIntentRenderTests,
};
