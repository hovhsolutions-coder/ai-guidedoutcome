require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { presentGuidanceProgressMessageForState } = require('../../src/components/guidance/guidance-progress-presenter.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceInteractionStateMatrixTests() {
  const fixtures = createGuidanceInteractionFixtureMatrix();

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
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

      switch (fixture.id) {
        case 'fresh_submit_loading':
          assert.match(markup, />Generating guidance...</, 'fresh loading: submit label missing');
          assert.match(markup, /Generating universal guidance.../, 'fresh loading: result loading state missing');
          assert.match(markup, /We are turning this into a fresh structured read that keeps structure, the steps, and the next move aligned\./, 'fresh loading: helper copy missing');
          assert.match(markup, /<button type="submit" disabled="" aria-disabled="true"/, 'fresh loading: submit should be disabled semantically');
          assert.doesNotMatch(markup, /Continue guidance/, 'fresh loading: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'fresh loading: trainer action should stay hidden');
          assert.doesNotMatch(markup, /Continue from this guidance state/, 'fresh loading: execution bridge should stay hidden');
          break;

        case 'clarifying_follow_up_loading':
          assert.match(markup, /Current phase/, 'clarifying loading: onboarding context missing');
          assert.match(markup, /clarifying/, 'clarifying loading: phase label missing');
          assert.match(markup, /Continuing guidance.../, 'clarifying loading: follow-up processing label missing');
          assert.match(markup, /<button type="submit" disabled="" aria-disabled="true"/, 'clarifying loading: primary submit should be disabled semantically');
          assert.doesNotMatch(markup, /Continue from this guidance state/, 'clarifying loading: execution bridge should stay hidden');
          assert.equal(countMatches(markup, /Continuing guidance.../g), 1, 'clarifying loading: duplicate follow-up processing CTA');
          break;

        case 'trainer_request_loading':
          assert.match(markup, /Trainer read/, 'trainer loading: trainer section missing');
          assert.match(markup, /Loading strategy trainer.../, 'trainer loading: processing label missing');
          assert.match(markup, /strategy trainer selected/i, 'trainer loading: locked trainer CTA should stay calm');
          assert.match(markup, /Refined onboarding read/, 'trainer loading: refined context should stay visible');
          assert.match(markup, /<button type="submit" disabled="" aria-disabled="true"/, 'trainer loading: primary submit should be disabled semantically');
          assert.doesNotMatch(markup, /Continue guidance/, 'trainer loading: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Continue from this guidance state/, 'trainer loading: execution bridge should stay hidden');
          assert.equal(countMatches(markup, /Loading strategy trainer.../g), 1, 'trainer loading: only the trainer read should show processing copy');
          break;

        case 'execution_ready_dossier_loading':
          assert.match(markup, /Opening mission control/, 'execution dossier loading: progress eyebrow missing');
          assert.match(markup, /carried into a dossier workspace/, 'execution dossier loading: progress title missing');
          assert.match(markup, /Execution handoff/, 'execution dossier loading: handoff missing');
          assert.match(markup, /Creating dossier.../, 'execution dossier loading: convert processing label missing');
          assert.match(markup, /Continue from this guidance state/, 'execution dossier loading: stable transition context missing');
          assert.doesNotMatch(markup, /Continue guidance/, 'execution dossier loading: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'execution dossier loading: trainer action should stay hidden');
          assert.doesNotMatch(markup, /Creating a dossier from this guidance read:/, 'execution dossier loading: competing inline status should stay hidden');
          assert.equal(countMatches(markup, /Creating dossier.../g), 1, 'execution dossier loading: duplicate convert processing CTA');
          assert.equal(countMatches(markup, /data-progress-message-state=/g), 1, 'execution dossier loading: duplicate progress messages');
          break;

        default:
          throw new Error(`Unhandled interaction fixture ${fixture.id}`);
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
  runGuidanceInteractionStateMatrixTests,
};
