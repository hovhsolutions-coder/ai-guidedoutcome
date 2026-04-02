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

function runGuidanceSectionOutcomeRenderTests() {
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
    assert.match(freshMarkup, /data-guidance-zone="intake"[\s\S]*?data-section-outcome="capture"/, 'fresh: intake should capture');
    assert.ok(freshMarkup.indexOf('Your situation') < freshMarkup.indexOf('Optional: sharpen the intake'), 'fresh: capture should prioritize input before optional support');

    const clarifyingFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
    const clarifyingPresentation = presentGuidanceSession({
      state: clarifyingFixture.state,
      liveRawInput: clarifyingFixture.liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingFixture, clarifyingPresentation));
    assert.match(clarifyingMarkup, /data-guidance-zone="onboarding"[\s\S]*?data-section-outcome="clarify"/, 'clarifying: onboarding should clarify');
    assert.ok(clarifyingMarkup.indexOf('Clarify next') < clarifyingMarkup.indexOf('Character introduction'), 'clarifying: clarify should prioritize the next clarification block');
    assert.match(clarifyingMarkup, /data-guidance-zone="result"[\s\S]*?data-section-outcome="understand"/, 'clarifying: result should understand');

    const refinedFixture = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
    const refinedPresentation = presentGuidanceSession({
      state: refinedFixture.state,
      liveRawInput: refinedFixture.liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(buildControllerFixture(refinedFixture, refinedPresentation));
    assert.match(refinedMarkup, /data-guidance-zone="result"[\s\S]*?data-section-outcome="understand"/, 'refined: result should understand');
    assert.ok(refinedMarkup.indexOf('Summary') < refinedMarkup.indexOf('Next step'), 'refined: understand should keep meaning before action');
    assert.match(refinedMarkup, /data-guidance-zone="trainer"[\s\S]*?data-section-outcome="explore"/, 'refined: trainer should explore');

    const trainerLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
    const trainerLoadingPresentation = presentGuidanceSession({
      state: trainerLoadingFixture.state,
      liveRawInput: trainerLoadingFixture.liveRawInput,
    });
    const trainerLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(trainerLoadingFixture, trainerLoadingPresentation));
    assert.match(trainerLoadingMarkup, /data-guidance-zone="trainer"[\s\S]*?data-section-outcome="explore"/, 'trainer loading: trainer should explore');
    assert.ok(trainerLoadingMarkup.indexOf('Trainer read') < trainerLoadingMarkup.indexOf('Recommended continuation'), 'trainer loading: explore should prioritize specialist depth before route options');

    const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(buildControllerFixture(executionFixture, executionPresentation));
    assert.match(executionMarkup, /data-guidance-zone="execution"[\s\S]*?data-section-outcome="commit"/, 'execution ready: execution should commit');
    assert.ok(executionMarkup.indexOf('Your plan is ready to move into mission control.') < executionMarkup.indexOf('What is now understood'), 'execution ready: commit should prioritize the transition before supporting explanation');

    const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
    const degradedPresentation = presentGuidanceSession({
      state: degradedFixture.state,
      liveRawInput: degradedFixture.liveRawInput,
    });
    const degradedMarkup = renderGuidanceShellWithController(buildControllerFixture(degradedFixture, degradedPresentation));
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-section-outcome="understand"/, 'degraded: result should stay understand');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="execution"[\s\S]*?data-section-outcome=/, 'degraded: commit should stay absent');

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
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-section-outcome="commit"/, 'dossier loading: execution should stay commit');
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
  runGuidanceSectionOutcomeRenderTests,
};
