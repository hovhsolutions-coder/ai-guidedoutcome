require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { createInitialGuidanceSessionStoreState } = require('../../src/components/guidance/guidance-session-store.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidancePersonalizationRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const clarifyingFixture = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
  const refinedFixture = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
  const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
  const freshLoadingFixture = interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading');

  assert.ok(clarifyingFixture, 'Missing clarifying personalization fixture');
  assert.ok(refinedFixture, 'Missing refined personalization fixture');
  assert.ok(executionFixture, 'Missing execution personalization fixture');
  assert.ok(freshLoadingFixture, 'Missing fresh loading personalization fixture');

  const emotionalFreshState = {
    ...createInitialGuidanceSessionStoreState(),
    input: {
      ...createInitialGuidanceSessionStoreState().input,
      rawInput: 'I feel overwhelmed and need help understanding what I am reacting to and what to do next.',
    },
  };

  withMockedGuidanceShell(() => {
    const emotionalPresentation = presentGuidanceSession({
      state: emotionalFreshState,
      liveRawInput: emotionalFreshState.input.rawInput,
    });
    const emotionalMarkup = renderGuidanceShellWithController(buildControllerFixture({
      state: emotionalFreshState,
      liveRawInput: emotionalFreshState.input.rawInput,
    }, emotionalPresentation));

    assert.match(emotionalMarkup, /We are shaping this with you/i, 'emotional fresh: copy should mirror reflective intent');
    assert.match(emotionalMarkup, /Auto mode is shaping this around/i, 'emotional fresh: mode framing should adapt instead of staying generic');
    assert.equal(countMatches(emotionalMarkup, /data-progress-message-state=/g), 1, 'emotional fresh: progress surface should stay singular');

    const clarifyingPresentation = presentGuidanceSession({
      state: clarifyingFixture.state,
      liveRawInput: clarifyingFixture.liveRawInput,
    });
    const clarifyingMarkup = renderGuidanceShellWithController(buildControllerFixture(clarifyingFixture, clarifyingPresentation));

    assert.match(clarifyingMarkup, /confirm the position/i, 'clarifying: conflict/domain phrasing should shift toward position language');
    assert.match(clarifyingMarkup, /clarity, the position, and the risk/i, 'clarifying: current-read copy should reflect clarity domain');

    const refinedPresentation = presentGuidanceSession({
      state: refinedFixture.state,
      liveRawInput: refinedFixture.liveRawInput,
    });
    const refinedMarkup = renderGuidanceShellWithController(buildControllerFixture(refinedFixture, refinedPresentation));

    assert.match(refinedMarkup, /You now have a clearer position/i, 'refined: result intro should mirror decision-style language');
    assert.match(refinedMarkup, /using what you already clarified/i, 'refined: continuation copy should preserve prior-answer continuity');

    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const executionMarkup = renderGuidanceShellWithController(buildControllerFixture(executionFixture, executionPresentation));

    assert.match(executionMarkup, /The plan is confirmed and ready to move\./, 'execution: planning inputs should read as a plan');
    assert.match(executionMarkup, /carry the plan into action/i, 'execution: commit language should stay plan-oriented');

    const freshLoadingPresentation = presentGuidanceSession({
      state: freshLoadingFixture.state,
      liveRawInput: freshLoadingFixture.liveRawInput,
    });
    const freshLoadingMarkup = renderGuidanceShellWithController(buildControllerFixture(freshLoadingFixture, freshLoadingPresentation));

    assert.match(freshLoadingMarkup, /more executable next move/i, 'fresh loading: action-oriented planning input should pull toward execution');
    assert.equal(countMatches(freshLoadingMarkup, /data-focus-dominance="dominant"/g), 1, 'fresh loading: dominant zone should stay singular');
  });
}

module.exports = {
  runGuidancePersonalizationRenderTests,
};
