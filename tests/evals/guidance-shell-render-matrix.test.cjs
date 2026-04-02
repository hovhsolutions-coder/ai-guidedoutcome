require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const {
  buildDossierConversionPresentation,
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceShellRenderMatrixTests() {
  const fixtures = createGuidancePresentationFixtureMatrix();

  withMockedGuidanceShell((GuidanceSessionShell) => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });

      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      assert.match(markup, new RegExp(`data-guidance-surface-variant="${presentation.surfaceVariant}"`), `${fixture.id}: page surface variant drifted`);
      assert.match(markup, /Universal Guidance/, `${fixture.id}: missing page heading`);
      assert.match(markup, /What do you need help with right now\?/, `${fixture.id}: missing intake section`);
      assert.match(markup, /Result panel/, `${fixture.id}: missing result section`);

      switch (fixture.id) {
        case 'fresh':
          assert.match(markup, /Awaiting first run/, 'fresh: result placeholder missing');
          assert.match(markup, />Generate guidance</, 'fresh: generate CTA missing');
          assert.doesNotMatch(markup, /Current phase/, 'fresh: onboarding should be hidden');
          assert.doesNotMatch(markup, /Recommended continuation/, 'fresh: trainer section should be hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'fresh: execution-ready section should be hidden');
          break;

        case 'clarifying':
          assert.match(markup, /First onboarding read/, 'clarifying: onboarding header missing');
          assert.match(markup, /Continue guidance/, 'clarifying: follow-up CTA missing');
          assert.match(markup, /Your answer/, 'clarifying: follow-up form missing');
          assert.match(markup, /Recommended continuation/, 'clarifying: next-path section missing');
          assert.doesNotMatch(markup, /Refined onboarding read/, 'clarifying: should not look refined');
          assert.doesNotMatch(markup, /Plan ready/, 'clarifying: execution-ready section should be hidden');
          assert.equal(countMatches(markup, /Continue guidance/g), 1, 'clarifying: duplicate follow-up CTA');
          break;

        case 'refined_direction':
          assert.match(markup, /Refined onboarding read/, 'refined: refined onboarding header missing');
          assert.match(markup, /Refined next step/, 'refined: refined next-step framing missing');
          assert.match(markup, /Recommended continuation/, 'refined: next-path section missing');
          assert.doesNotMatch(markup, />Your answer</, 'refined: follow-up form label should be hidden');
          assert.doesNotMatch(markup, /Continue guidance/, 'refined: follow-up CTA should be hidden');
          assert.doesNotMatch(markup, /Clarify next/, 'refined: clarifying framing should be gone');
          assert.doesNotMatch(markup, /Plan ready/, 'refined: execution-ready section should be hidden');
          break;

        case 'execution_ready':
          assert.match(markup, /Plan ready/, 'execution_ready: progress strip missing');
          assert.match(markup, /Execution handoff/, 'execution_ready: handoff missing');
          assert.match(markup, /Your plan is ready to move into mission control\./, 'execution_ready: transition missing');
          assert.match(markup, /Convert to dossier/, 'execution_ready: dossier CTA missing');
          assert.doesNotMatch(markup, /Recommended continuation/, 'execution_ready: next-path section should be hidden');
          assert.equal(countMatches(markup, /Plan ready/g), 1, 'execution_ready: duplicate progress strip');
          assert.equal(countMatches(markup, /Convert to dossier/g), 1, 'execution_ready: duplicate dossier CTA');
          break;

        default:
          throw new Error(`Unhandled fixture ${fixture.id}`);
      }

      assert.equal(
        presentation.rightRailView.executionReadySection !== null,
        /Plan ready/.test(markup),
        `${fixture.id}: shell execution-ready rendering drifted from presenter`
      );
    }

    const executionFixture = fixtures.find((fixture) => fixture.id === 'execution_ready');
    assert.ok(executionFixture, 'Missing execution fixture for dossier-conversion render coverage');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const dossierPresentation = buildDossierConversionPresentation(executionPresentation);
    const dossierController = buildControllerFixture(executionFixture, dossierPresentation);
    const dossierMarkup = renderGuidanceShellWithController(dossierController, {
      moduleOverrides: buildExecutionDossierLoadingOverride(),
    });

    assert.match(dossierMarkup, /data-guidance-surface-variant="commit_surface"/, 'dossier conversion: shell surface variant drifted');
    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-section-visibility="visible"/, 'dossier conversion: execution zone should stay visible');
    assert.match(dossierMarkup, /Creating dossier.../, 'dossier conversion: loading CTA should stay visible');
    assert.equal(countMatches(dossierMarkup, /Creating dossier.../g), 1, 'dossier conversion: duplicate processing CTA');
    assert.equal(countMatches(dossierMarkup, /data-progress-message-state=/g), 1, 'dossier conversion: progress block should stay singular');
    assert.doesNotMatch(dossierMarkup, /<button[^>]*>Convert to dossier</, 'dossier conversion: idle convert CTA should not reappear');
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
  runGuidanceShellRenderMatrixTests,
};
