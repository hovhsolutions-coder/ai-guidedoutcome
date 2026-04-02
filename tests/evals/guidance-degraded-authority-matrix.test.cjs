require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceDegradedAuthorityMatrixTests() {
  const fixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      assert.match(markup, /Universal Guidance/, `${fixture.id}: page heading missing`);
      assert.match(markup, /Result panel/, `${fixture.id}: result panel missing`);
      assert.match(markup, /Live intake read/, `${fixture.id}: current-read surface missing`);

      switch (fixture.id) {
        case 'result_without_guidance_session':
          assert.equal(presentation.rightRailView.onboardingSession, null, 'result-only degraded: onboarding should be absent');
          assert.equal(presentation.rightRailView.trainer.nextPath.guidanceSession, null, 'result-only degraded: next-path should be absent');
          assert.equal(presentation.rightRailView.executionReadySection, null, 'result-only degraded: execution-ready should be absent');
          assert.match(markup, /Compare the two remaining partner options before committing/, 'result-only degraded: next step missing');
          assert.doesNotMatch(markup, /Current phase/, 'result-only degraded: phase UI should stay hidden');
          assert.doesNotMatch(markup, /Recommended continuation/, 'result-only degraded: next-path should stay hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'result-only degraded: execution-ready should stay hidden');
          assert.doesNotMatch(markup, /Convert to dossier/, 'result-only degraded: no final bridge should appear');
          break;

        case 'execution_phase_without_progression_snapshot':
          assert.equal(presentation.rightRailView.executionReadySection, null, 'execution degraded: execution-ready section should be absent');
          assert.equal(presentation.sectionVisibility.trainer, 'soft_hidden', 'execution degraded: trainer fallback should stay softly visible');
          assert.match(markup, /Recommended continuation/, 'execution degraded: safe next-path fallback missing');
          assert.match(markup, /Convert to dossier/, 'execution degraded: convert action should stay available through next-path');
          assert.doesNotMatch(markup, /Plan ready/, 'execution degraded: fake execution-ready UI should stay hidden');
          assert.doesNotMatch(markup, /Current phase/, 'execution degraded: phase-specific onboarding should stay hidden');
          assert.equal(countMatches(markup, /<button[^>]*>Convert to dossier</g), 1, 'execution degraded: duplicate convert CTA');
          break;

        case 'clarifying_without_phase_ui_data':
          assert.equal(presentation.rightRailView.executionReadySection, null, 'clarifying degraded: execution-ready should be absent');
          assert.match(markup, /Recommended continuation/, 'clarifying degraded: next-path fallback missing');
          assert.doesNotMatch(markup, /First onboarding read|Refined onboarding read/, 'clarifying degraded: onboarding shell should stay hidden');
          assert.doesNotMatch(markup, /Current phase/, 'clarifying degraded: phase UI should stay hidden');
          assert.doesNotMatch(markup, /Continue guidance/, 'clarifying degraded: follow-up CTA should stay hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'clarifying degraded: fake progression should stay hidden');
          break;

        case 'trainer_response_without_recommendation':
          assert.match(markup, /Trainer read/, 'thin trainer degraded: trainer response block missing');
          assert.match(markup, /Hold the narrowed decision frame\./, 'thin trainer degraded: trainer content missing');
          assert.match(markup, /Recommended continuation/, 'thin trainer degraded: next-path section missing');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'thin trainer degraded: trainer CTA should stay hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'thin trainer degraded: execution-ready section should stay hidden');
          assert.doesNotMatch(markup, /Continue guidance/, 'thin trainer degraded: clarifying CTA should stay hidden');
          break;

        default:
          throw new Error(`Unhandled degraded-authority fixture ${fixture.id}`);
      }

      assert.equal(
        presentation.rightRailView.executionReadySection !== null,
        /Plan ready/.test(markup),
        `${fixture.id}: shell execution-ready visibility drifted from presenter`
      );
      assert.equal(
        presentation.sectionVisibility.trainer !== 'suppressed',
        /Recommended continuation/.test(markup),
        `${fixture.id}: shell trainer visibility drifted from presenter`
      );
    }
  });
}

module.exports = {
  runGuidanceDegradedAuthorityMatrixTests,
};
