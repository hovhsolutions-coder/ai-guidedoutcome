require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceProgressMessageForState } = require('../../src/components/guidance/guidance-progress-presenter.ts');
const { createGuidanceRepeatActionFixtureMatrix } = require('./guidance-repeat-action-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceRepeatActionMatrixTests() {
  const fixtures = createGuidanceRepeatActionFixtureMatrix();

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const renderPresentation = fixture.id === 'repeat_execution_ready_dossier_convert'
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
        moduleOverrides: fixture.id === 'repeat_execution_ready_dossier_convert'
          ? buildExecutionDossierLoadingOverride()
          : {},
      });

      switch (fixture.id) {
        case 'repeat_fresh_submit':
          assert.match(markup, />Generating guidance...</, 'repeat fresh submit: processing label missing');
          assert.equal(countMatches(markup, />Generating guidance...</g), 1, 'repeat fresh submit: duplicate processing CTA');
          assert.match(markup, /<button type="submit" disabled/, 'repeat fresh submit: submit should stay locked');
          assert.doesNotMatch(markup, />Generate guidance</, 'repeat fresh submit: idle submit should not reappear');
          assert.doesNotMatch(markup, /Continue guidance/, 'repeat fresh submit: follow-up should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'repeat fresh submit: trainer CTA should stay hidden');
          assert.doesNotMatch(markup, /Convert to dossier/, 'repeat fresh submit: dossier CTA should stay hidden');
          break;

        case 'repeat_clarifying_continue':
          assert.match(markup, /Continuing guidance.../, 'repeat clarifying continue: processing label missing');
          assert.equal(countMatches(markup, /Continuing guidance.../g), 1, 'repeat clarifying continue: duplicate processing CTA');
          assert.match(markup, /Current phase/, 'repeat clarifying continue: context should stay visible');
          assert.match(markup, /<button type="submit" disabled/, 'repeat clarifying continue: primary submit should stay locked');
          assert.doesNotMatch(markup, />Continue guidance</, 'repeat clarifying continue: idle continue CTA should not reappear');
          assert.doesNotMatch(markup, /Continue from this guidance state/, 'repeat clarifying continue: execution bridge should stay hidden');
          assert.doesNotMatch(markup, /Guidance needs attention/, 'repeat clarifying continue: retry state should not appear during active work');
          break;

        case 'repeat_trainer_request':
          assert.match(markup, /Loading strategy trainer.../, 'repeat trainer request: processing label missing');
          assert.match(markup, /strategy trainer selected/i, 'repeat trainer request: locked CTA should stay calm');
          assert.equal(countMatches(markup, /Loading strategy trainer.../g), 1, 'repeat trainer request: only one trainer processing surface should stay active');
          assert.match(markup, /Refined onboarding read/, 'repeat trainer request: refined context should stay visible');
          assert.match(markup, /<button type="submit" disabled/, 'repeat trainer request: primary submit should stay locked');
          assert.doesNotMatch(markup, /<button[^>]*>Ask strategy trainer</, 'repeat trainer request: idle active-trainer CTA should not reappear');
          assert.doesNotMatch(markup, /Refresh strategy trainer/, 'repeat trainer request: retry trainer CTA should not appear during active work');
          assert.doesNotMatch(markup, /The specialist read could not be loaded right now\./, 'repeat trainer request: retry error state should not appear during active work');
          break;

        case 'repeat_execution_ready_dossier_convert':
          assert.match(markup, /Creating dossier.../, 'repeat dossier convert: processing label missing');
          assert.equal(countMatches(markup, /Creating dossier.../g), 1, 'repeat dossier convert: duplicate processing CTA');
          assert.match(markup, /Opening mission control/, 'repeat dossier convert: progress message missing');
          assert.match(markup, /carried into a dossier workspace/, 'repeat dossier convert: progress title missing');
          assert.doesNotMatch(markup, /<button[^>]*>Convert to dossier</, 'repeat dossier convert: idle convert CTA should not reappear');
          assert.doesNotMatch(markup, /Continue guidance/, 'repeat dossier convert: follow-up should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'repeat dossier convert: trainer CTA should stay hidden');
          assert.doesNotMatch(markup, /Creating a dossier from this guidance read:/, 'repeat dossier convert: competing inline status should stay hidden');
          assert.doesNotMatch(markup, /The dossier could not be created\./, 'repeat dossier convert: retry state should not appear during active work');
          assert.equal(countMatches(markup, /data-progress-message-state=/g), 1, 'repeat dossier convert: duplicate progress messages');
          break;

        default:
          throw new Error(`Unhandled repeat-action fixture ${fixture.id}`);
      }
    }
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
  runGuidanceRepeatActionMatrixTests,
};
