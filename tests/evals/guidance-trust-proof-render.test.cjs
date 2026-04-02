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

function runGuidanceTrustProofRenderTests() {
  const fixtures = createGuidancePresentationFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const clarifyingMarkup = renderFixture(fixtures, 'clarifying');
    assert.match(clarifyingMarkup, /based on what is already clear/i, 'clarifying: proof language should ground the follow-up step');
    assert.match(
      clarifyingMarkup,
      /show what became clearer about .* and keep the same guidance context intact\./i,
      'clarifying: helper copy should keep confidence calm'
    );

    const refinedMarkup = renderFixture(fixtures, 'refined_direction');
    assert.match(refinedMarkup, /Based on the current read, you now have/i, 'refined: result opening should feel grounded');
    assert.match(refinedMarkup, /This next step is based on the strongest signals already clarified/i, 'refined: next-step proof should stay compact');

    const executionMarkup = renderFixture(fixtures, 'execution_ready');
    assert.match(executionMarkup, /based on the route already confirmed here/i, 'execution: opening should explain why action is justified');
    assert.match(executionMarkup, /based on the same clarified thread/i, 'execution: conversion support should preserve trust');
    assert.equal(countMatches(executionMarkup, /data-progress-message-state=/g), 1, 'execution: progress surface should stay singular');

    const degradedMarkup = renderFixture(degradedFixtures, 'result_without_guidance_session');
    assert.match(degradedMarkup, /result stays usable and safe/i, 'degraded: fallback should be explicitly safe and usable');
    assert.doesNotMatch(degradedMarkup, /based on the route already confirmed here/i, 'degraded: execution proof should stay absent');
  });
}

function renderFixture(fixtures, id) {
  const fixture = fixtures.find((entry) => entry.id === id);
  assert.ok(fixture, `Missing trust/proof fixture ${id}`);
  const presentation = presentGuidanceSession({
    state: fixture.state,
    liveRawInput: fixture.liveRawInput,
  });

  return renderGuidanceShellWithController(buildControllerFixture(fixture, presentation));
}

module.exports = {
  runGuidanceTrustProofRenderTests,
};
