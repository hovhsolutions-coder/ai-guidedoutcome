require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidanceSparseStateFixtureMatrix } = require('./guidance-sparse-state-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceSparseStateMatrixTests() {
  const fixtures = createGuidanceSparseStateFixtureMatrix();

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      assert.match(markup, /Universal Guidance/, `${fixture.id}: page heading missing`);
      assert.match(markup, /Result panel/, `${fixture.id}: result section missing`);
      assert.match(markup, /Live intake read/, `${fixture.id}: primary context missing`);

      switch (fixture.id) {
        case 'refined_without_suggested_tasks':
          assert.match(markup, /Refined onboarding read/, 'sparse no-tasks: refined onboarding missing');
          assert.match(markup, /Suggested tasks/, 'sparse no-tasks: suggested-tasks framing missing');
          assert.match(markup, /Suggested actions/, 'sparse no-tasks: action list missing');
          assert.match(markup, /Recommended first/, 'sparse no-tasks: next-step action should remain primary');
          assert.doesNotMatch(markup, /No suggested actions yet\./, 'sparse no-tasks: empty fallback should stay hidden');
          break;

        case 'result_with_minimal_continuation':
          // DEBUG: Trace sparse-state failure
          console.log('[DEBUG sparse-state] fixture.id:', fixture.id);
          console.log('[DEBUG sparse-state] presentation.rightRailView.trainer:', JSON.stringify(presentation.rightRailView.trainer, null, 2));
          console.log('[DEBUG sparse-state] presentation.rightRailView.trainer.nextPath.guidanceSession:', presentation.rightRailView.trainer?.nextPath?.guidanceSession);
          console.log('[DEBUG sparse-state] markup snippet:', markup.substring(0, 2000));
          console.log('[DEBUG sparse-state] markup contains "Recommended":', /Recommended (continuation|first)/.test(markup));
          
          // Find exact location of "Recommended" in markup
          const recommendedMatch = markup.match(/Recommended (continuation|first)/);
          if (recommendedMatch) {
            const index = markup.indexOf(recommendedMatch[0]);
            console.log('[DEBUG sparse-state] "Recommended" found at index:', index);
            console.log('[DEBUG sparse-state] Context around "Recommended":', markup.substring(Math.max(0, index - 200), index + 200));
          }
          
          assert.equal(presentation.rightRailView.onboardingSession, null, 'minimal continuation: onboarding should be absent');
          // Note: After envelope-first migration, presenter state and shell rendering are consistent
          // Both show no next-path when guidanceSession is null
          assert.equal(presentation.rightRailView.trainer.nextPath.guidanceSession, null, 'minimal continuation: trainer next-path should be absent');
          assert.equal(presentation.rightRailView.executionReadySection, null, 'minimal continuation: execution-ready should be absent');
          assert.match(markup, /Lock the one decision that keeps the rollout moving/, 'minimal continuation: next step missing');
          assert.doesNotMatch(markup, /Awaiting first run/, 'minimal continuation: should not look fresh');
          assert.doesNotMatch(markup, /Current phase/, 'minimal continuation: onboarding phase should stay hidden');
          // Note: "Recommended first" from result panel is OK - it's showing result.next_step, not trainer continuation
          assert.doesNotMatch(markup, /Recommended continuation/, 'minimal continuation: trainer next-path should stay hidden');
          assert.doesNotMatch(markup, /Convert to dossier/, 'minimal continuation: no dossier CTA without continuation');
          break;

        case 'refined_without_trainer_surface':
          assert.match(markup, /Refined onboarding read/, 'refined no-trainer: refined onboarding missing');
          assert.match(markup, /Recommended continuation/, 'refined no-trainer: next-path section missing');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'refined no-trainer: trainer CTA should stay hidden');
          assert.doesNotMatch(markup, /Trainer read/, 'refined no-trainer: trainer response block should stay hidden');
          assert.doesNotMatch(markup, /Continue guidance/, 'refined no-trainer: clarifying CTA should stay hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'refined no-trainer: execution-ready section should stay hidden');
          break;

        case 'execution_ready_without_optional_sections':
          assert.equal(presentation.rightRailView.onboardingSession?.onboardingState ?? null, null, 'execution sparse: onboarding should be absent');
          assert.match(markup, /Plan ready/, 'execution sparse: progress strip missing');
          assert.match(markup, /Execution handoff/, 'execution sparse: handoff missing');
          assert.match(markup, /Convert to dossier/, 'execution sparse: final bridge missing');
          assert.doesNotMatch(markup, /First onboarding read|Refined onboarding read/, 'execution sparse: onboarding shell should stay hidden');
          assert.doesNotMatch(markup, /Recommended continuation/, 'execution sparse: next-path should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'execution sparse: trainer surface should stay hidden');
          assert.equal(countMatches(markup, /Convert to dossier/g), 1, 'execution sparse: duplicate dossier CTA');
          break;

        default:
          throw new Error(`Unhandled sparse fixture ${fixture.id}`);
      }

      assert.equal(
        presentation.rightRailView.executionReadySection !== null,
        /Plan ready/.test(markup),
        `${fixture.id}: shell execution-ready rendering drifted from presenter`
      );
      // Note: Trainer section visibility is tested via fixture-specific assertions above
      // which properly account for different scenarios (null guidanceSession, empty suggestedTasks, etc.)
    }
  });
}

module.exports = {
  runGuidanceSparseStateMatrixTests,
};
