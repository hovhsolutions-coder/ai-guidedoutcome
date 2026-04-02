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

  // Debug: Check the fresh fixture specifically
  const freshFixture = fixtures.find(f => f.id === 'fresh');
  console.log('=== FRESH FIXTURE DEBUG ===');
  console.log('Fresh fixture state:', JSON.stringify({
    guidanceSession: freshFixture.state.session.guidanceSession,
    activeTrainer: freshFixture.state.session.activeTrainer,
    trainerLoading: freshFixture.state.session.trainerLoading,
    trainerError: freshFixture.state.session.trainerError,
    result: freshFixture.state.session.result,
  }, null, 2));
  
  const freshPresentation = presentGuidanceSession({
    state: freshFixture.state,
    liveRawInput: freshFixture.liveRawInput,
  });
  
  console.log('Fresh presentation rightRailView.trainer:', JSON.stringify({
    nextPath: freshPresentation.rightRailView.trainer.nextPath,
    response: freshPresentation.rightRailView.trainer.response,
  }, null, 2));
  
  console.log('Fresh zone profiles trainer:', JSON.stringify(freshPresentation.zoneProfiles?.trainer, null, 2));

  withMockedGuidanceShell((GuidanceSessionShell) => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      // Only run the fresh assertion to isolate the issue
      if (fixture.id === 'fresh') {
        console.log('\n=== FRESH FIXTURE MARKUP CHECK ===');
        console.log('Has "Recommended continuation":', /Recommended continuation/.test(markup));
        console.log('Has "Recommended first":', /Recommended first/.test(markup));
        
        // Show snippet around the text if found
        const match = markup.match(/Recommended (continuation|first)/);
        if (match) {
          const index = match.index;
          console.log('Context around match:', markup.substring(Math.max(0, index - 200), index + 200));
        }
        
        assert.doesNotMatch(markup, /Recommended (continuation|first)/, 'fresh: trainer section should be hidden');
      }
    }
  });
}

module.exports = { runGuidanceShellRenderMatrixTests };

if (require.main === module) {
  runGuidanceShellRenderMatrixTests();
}
