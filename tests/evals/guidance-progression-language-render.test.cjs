require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceProgressionLanguageRenderTests() {
  const fixtures = createGuidancePresentationFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const fresh = requireFixture(fixtures, 'fresh');
    const freshMarkup = renderFixture(fresh);
    assert.match(freshMarkup, /first visible sign of progress/i, 'fresh: first-run progress language should feel rewarding');
    assert.match(freshMarkup, /what became clearer about/i, 'fresh: empty result should preview value clearly');
    assert.equal(countMatches(freshMarkup, /Result panel/g), 1, 'fresh: no extra result surface should be added');

    const clarifying = requireFixture(fixtures, 'clarifying');
    const clarifyingMarkup = renderFixture(clarifying);
    assert.match(clarifyingMarkup, /You are not starting over\. You are narrowing the one detail that will help confirm the position, based on what is already clear\./, 'clarifying: onboarding should reflect refinement progress');
    assert.match(clarifyingMarkup, /show what became clearer/i, 'clarifying: follow-up copy should promise clearer output');

    const refined = requireFixture(fixtures, 'refined_direction');
    const refinedMarkup = renderFixture(refined);
    assert.match(refinedMarkup, /Direction confirmed/, 'refined: progress block should acknowledge confirmation');
    assert.match(refinedMarkup, /You now have a clearer position/i, 'refined: result panel should reflect progress explicitly');
    assert.match(refinedMarkup, /extra sharpness/i, 'refined: next-step pull should feel stronger');

    const execution = requireFixture(fixtures, 'execution_ready');
    const executionMarkup = renderFixture(execution);
    assert.match(executionMarkup, /Plan ready/, 'execution: progress block should reflect plan readiness');
    assert.match(executionMarkup, /Your plan is ready to move into mission control\./, 'execution: transition should feel like a rewarding next move');
    assert.match(executionMarkup, /so the plan you shaped here can keep moving/i, 'execution: execution helper copy should reinforce continuity');

    const degraded = requireFixture(degradedFixtures, 'result_without_guidance_session');
    const degradedMarkup = renderFixture(degraded);
    assert.match(degradedMarkup, /Nothing important was lost\./, 'degraded: fallback should preserve confidence');
    assert.equal(countMatches(degradedMarkup, /data-progress-message-state=/g), 1, 'degraded: no extra progress surface should be added');
  });
}

function renderFixture(fixture) {
  const presentation = presentGuidanceSession({
    state: fixture.state,
    liveRawInput: fixture.liveRawInput,
  });

  return renderGuidanceShellWithController(buildControllerFixture(fixture, presentation));
}

function requireFixture(fixtures, id) {
  const fixture = fixtures.find((entry) => entry.id === id);
  assert.ok(fixture, `Missing fixture ${id}`);
  return fixture;
}

module.exports = {
  runGuidanceProgressionLanguageRenderTests,
};
