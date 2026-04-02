require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidanceRecoveryFixtureMatrix } = require('./guidance-recovery-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceRecoveryStateMatrixTests() {
  const fixtures = createGuidanceRecoveryFixtureMatrix();

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller, {
        moduleOverrides: fixture.id === 'execution_ready_dossier_failure'
          ? buildExecutionDossierFailureOverride()
          : {},
      });

      switch (fixture.id) {
        case 'fresh_submit_failure':
          assert.match(markup, /Guidance needs attention/, 'fresh failure: error card missing');
          assert.match(markup, /Guidance could not be generated right now\./, 'fresh failure: error copy missing');
          assert.match(markup, />Generate guidance</, 'fresh failure: retry submit missing');
          assert.doesNotMatch(markup, /Generating guidance\.\.\./, 'fresh failure: loading label should be gone');
          assert.match(markup, /Awaiting first run/, 'fresh failure: result placeholder should remain');
          assert.doesNotMatch(markup, /Current phase/, 'fresh failure: onboarding should stay hidden');
          assert.doesNotMatch(markup, /Continue guidance/, 'fresh failure: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'fresh failure: trainer action should stay hidden');
          assert.doesNotMatch(markup, /Convert to dossier/, 'fresh failure: dossier action should stay hidden');
          break;

        case 'clarifying_follow_up_failure':
          assert.match(markup, /Guidance needs attention/, 'clarifying failure: error card missing');
          assert.match(markup, /Current phase/, 'clarifying failure: clarifying context missing');
          assert.match(markup, /Continue guidance/, 'clarifying failure: follow-up retry path missing');
          assert.match(markup, /Your answer/, 'clarifying failure: follow-up form missing');
          assert.doesNotMatch(markup, /Continuing guidance\.\.\./, 'clarifying failure: loading label should be gone');
          assert.doesNotMatch(markup, /Continue from this guidance state/, 'clarifying failure: execution bridge should stay hidden');
          assert.equal(countMatches(markup, /Continue guidance/g), 1, 'clarifying failure: duplicate follow-up retry CTA');
          break;

        case 'trainer_request_failure':
          assert.match(markup, /Trainer read/, 'trainer failure: trainer section missing');
          assert.match(markup, /The specialist layer could not load right now, but the current guidance direction is still safe to continue from\./, 'trainer failure: error copy missing');
          assert.match(markup, /Refined onboarding read/, 'trainer failure: refined context should remain visible');
          assert.match(markup, /Refresh strategy trainer/, 'trainer failure: retry trainer action missing');
          assert.doesNotMatch(markup, /Loading strategy trainer\.\.\./, 'trainer failure: loading label should be gone');
          assert.doesNotMatch(markup, /Continue guidance/, 'trainer failure: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Continue from this guidance state/, 'trainer failure: execution bridge should stay hidden');
          assert.equal(countMatches(markup, /Refresh strategy trainer/g), 1, 'trainer failure: duplicate retry trainer CTA');
          break;

        case 'execution_ready_dossier_failure':
          assert.match(markup, /Plan ready/, 'execution failure: progress strip missing');
          assert.match(markup, /Execution handoff/, 'execution failure: handoff missing');
          assert.match(markup, /The dossier could not be created\./, 'execution failure: error copy missing');
          assert.match(markup, />Convert to dossier</, 'execution failure: retry convert action missing');
          assert.doesNotMatch(markup, /Creating dossier\.\.\./, 'execution failure: loading label should be gone');
          assert.doesNotMatch(markup, /Continue guidance/, 'execution failure: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'execution failure: trainer action should stay hidden');
          assert.equal(countMatches(markup, /Convert to dossier/g), 1, 'execution failure: duplicate convert retry CTA');
          break;

        default:
          throw new Error(`Unhandled recovery fixture ${fixture.id}`);
      }
    }
  });
}

function buildExecutionDossierFailureOverride() {
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
          isConverting: false,
          conversionError: 'The dossier could not be created.',
          conversionStatus: null,
          onConvertToDossier: () => {},
        });
      },
    },
  };
}

module.exports = {
  runGuidanceRecoveryStateMatrixTests,
};
