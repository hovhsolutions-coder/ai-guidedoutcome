require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceProgressMessageForState } = require('../../src/components/guidance/guidance-progress-presenter.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceRepeatActionFixtureMatrix } = require('./guidance-repeat-action-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceProgressMessageRenderTests() {
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const repeatFixtures = createGuidanceRepeatActionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const fixtures = [
    interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'),
    interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'),
    interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'),
    interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading'),
    repeatFixtures.find((fixture) => fixture.id === 'repeat_clarifying_continue'),
    repeatFixtures.find((fixture) => fixture.id === 'repeat_trainer_request'),
    degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'),
    degradedFixtures.find((fixture) => fixture.id === 'execution_phase_without_progression_snapshot'),
  ];

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      assert.ok(fixture, 'Missing progress render fixture');
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const renderPresentation = fixture.id === 'execution_ready_dossier_loading'
        ? {
          ...presentation,
          progressMessage: presentGuidanceProgressMessageForState({
            state: 'dossier_conversion_loading',
            rightRailView: presentation.rightRailView,
          }),
        }
        : presentation;
      const controller = buildControllerFixture(fixture, renderPresentation);
      const markup = renderGuidanceShellWithController(controller, {
        moduleOverrides: fixture.id === 'execution_ready_dossier_loading'
          ? buildExecutionDossierLoadingOverride()
          : {},
      });

      assert.equal(
        countMatches(markup, /data-progress-message-state=/g),
        1,
        `${fixture.id}: expected exactly one progress message block`
      );
      assert.match(
        markup,
        new RegExp(`data-progress-message-state="${renderPresentation.progressMessage.state}"`),
        `${fixture.id}: progress message state marker drifted`
      );
      assert.match(markup, new RegExp(escapeRegExp(escapeHtml(renderPresentation.progressMessage.title))), `${fixture.id}: progress title missing`);
      assert.match(markup, new RegExp(escapeRegExp(escapeHtml(renderPresentation.progressMessage.statusLine))), `${fixture.id}: progress status line missing`);
      assert.doesNotMatch(markup, /Guidance refreshed|Guidance ready/, `${fixture.id}: competing legacy status text drifted in`);
      if (fixture.id === 'execution_ready_dossier_loading') {
        assert.doesNotMatch(markup, /Creating a dossier from this guidance read:/, `${fixture.id}: competing inline dossier status drifted in`);
      }
    }

    const repeatClarifying = repeatFixtures.find((fixture) => fixture.id === 'repeat_clarifying_continue');
    const repeatTrainer = repeatFixtures.find((fixture) => fixture.id === 'repeat_trainer_request');
    const repeatClarifyingPresentation = presentGuidanceSession({
      state: repeatClarifying.state,
      liveRawInput: repeatClarifying.liveRawInput,
    });
    const repeatTrainerPresentation = presentGuidanceSession({
      state: repeatTrainer.state,
      liveRawInput: repeatTrainer.liveRawInput,
    });

    assert.equal(repeatClarifyingPresentation.progressMessage.state, 'clarifying_continue_loading');
    assert.equal(repeatTrainerPresentation.progressMessage.state, 'trainer_request_loading');
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
  runGuidanceProgressMessageRenderTests,
};
