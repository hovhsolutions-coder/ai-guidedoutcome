require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const {
  observeGuidanceActionTriggered,
  observeGuidancePresentationState,
  observeGuidanceSoftSignal,
} = require('../../src/components/guidance/guidance-observability.ts');
const { createGuidanceRecoveryFixtureMatrix } = require('./guidance-recovery-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const {
  buildControllerFixture,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceProductionReadinessTests() {
  runObservabilityHelperTests();
  runErrorAndRetryContractTests();
  runRenderContinuityTests();
  runControllerStructureTests();
}

function runObservabilityHelperTests() {
  const fixtures = createGuidancePresentationFixtureMatrix();
  const freshFixture = fixtures.find((fixture) => fixture.id === 'fresh');
  assert.ok(freshFixture, 'Missing fresh fixture');

  const presentation = presentGuidanceSession({
    state: freshFixture.state,
    liveRawInput: freshFixture.liveRawInput,
  });

  const originalConsoleDebug = console.debug;
  const originalWindow = global.window;
  const originalCustomEvent = global.CustomEvent;
  const debugCalls = [];
  const dispatchedEvents = [];

  console.debug = (...args) => {
    debugCalls.push(args);
  };
  global.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
  global.window = {
    __GUIDANCE_DEBUG_EVENTS__: [],
    dispatchEvent(event) {
      dispatchedEvents.push(event.detail);
    },
  };

  try {
    observeGuidancePresentationState({
      presentation,
      generationCount: 0,
      errorPresent: false,
      trainerErrorPresent: false,
    });
    observeGuidanceActionTriggered({
      presentation,
      action: 'submit',
      attempt: 1,
    });
    observeGuidanceSoftSignal({
      presentation,
      signal: 'repeated_action_attempt',
      detail: 'submit attempt 2',
    });

    assert.equal(global.window.__GUIDANCE_DEBUG_EVENTS__.length, 3, 'observability helper should record lightweight dev events');
    assert.equal(dispatchedEvents.length, 3, 'observability helper should expose hook points through window events');
    assert.equal(debugCalls.length, 3, 'observability helper should emit structured dev console output');
    assert.equal(global.window.__GUIDANCE_DEBUG_EVENTS__[0].progressState, 'fresh_ready', 'presentation state should include the active progress state');
    assert.equal(global.window.__GUIDANCE_DEBUG_EVENTS__[0].dominantZone, 'intake', 'presentation state should include the dominant zone');
    assert.equal(global.window.__GUIDANCE_DEBUG_EVENTS__[1].action, 'submit', 'action events should record the triggered action');
    assert.equal(global.window.__GUIDANCE_DEBUG_EVENTS__[2].signal, 'repeated_action_attempt', 'soft signals should record the signal marker');
  } finally {
    console.debug = originalConsoleDebug;
    global.window = originalWindow;
    global.CustomEvent = originalCustomEvent;
  }
}

function runErrorAndRetryContractTests() {
  const recoveryFixtures = createGuidanceRecoveryFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const freshRetry = requireFixture(recoveryFixtures, 'fresh_submit_failure');
  const freshRetryPresentation = presentGuidanceSession({
    state: freshRetry.state,
    liveRawInput: freshRetry.liveRawInput,
  });
  assert.equal(freshRetryPresentation.progressMessage.state, 'fresh_retry_ready', 'fresh failure should keep a stable retry progress state');
  assert.equal(freshRetryPresentation.zoneProfiles.intake.microcopyIntent, 'confirm', 'fresh retry should keep the intake calm and confirmative');
  assert.equal(freshRetryPresentation.zoneProfiles.intake.transitionContinuity, 'persist', 'fresh retry should not visually reset the intake');
  assert.equal(freshRetryPresentation.zoneProfiles.result.transitionContinuity, 'persist', 'fresh retry should keep the result context anchored');

  const trainerRetry = requireFixture(recoveryFixtures, 'trainer_request_failure');
  const trainerRetryPresentation = presentGuidanceSession({
    state: trainerRetry.state,
    liveRawInput: trainerRetry.liveRawInput,
  });
  assert.equal(trainerRetryPresentation.progressMessage.state, 'trainer_retry_ready', 'trainer failure should keep a stable retry progress state');
  assert.equal(trainerRetryPresentation.zoneProfiles.trainer.microcopyIntent, 'confirm', 'trainer retry should keep the trainer copy calm and directive');
  assert.equal(trainerRetryPresentation.zoneProfiles.trainer.sectionOutcome, 'understand', 'trainer retry should explain the state before pushing exploration');
  assert.equal(trainerRetryPresentation.zoneProfiles.trainer.transitionContinuity, 'persist', 'trainer retry should hold the current specialist context steady');
  assert.equal(trainerRetryPresentation.rightRailProfile.role, 'context', 'trainer retry should calm the rail back into contextual support');

  const degradedFallback = requireFixture(degradedFixtures, 'result_without_guidance_session');
  const degradedPresentation = presentGuidanceSession({
    state: degradedFallback.state,
    liveRawInput: degradedFallback.liveRawInput,
  });
  assert.equal(degradedPresentation.progressMessage.state, 'degraded_result_fallback', 'degraded fallback should keep an explicit stable progress state');
  assert.equal(degradedPresentation.rightRailProfile.role, 'context', 'degraded fallback should keep the right rail sober');
  assert.equal(degradedPresentation.zoneProfiles.result.sectionOutcome, 'understand', 'degraded fallback should remain result-led and understandable');
}

function runRenderContinuityTests() {
  const recoveryFixtures = createGuidanceRecoveryFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshRetry = requireFixture(recoveryFixtures, 'fresh_submit_failure');
    const freshRetryMarkup = renderFixture(freshRetry);
    assert.match(freshRetryMarkup, /data-guidance-zone="intake"[\s\S]*?data-transition-continuity="persist"/, 'fresh retry should keep the intake visibly anchored');
    assert.match(freshRetryMarkup, /data-guidance-zone="result"[\s\S]*?data-transition-continuity="persist"/, 'fresh retry should keep the result context anchored');
    assert.equal((freshRetryMarkup.match(/data-progress-message-state=/g) ?? []).length, 1, 'fresh retry should keep one stable progress message');

    const trainerRetry = requireFixture(recoveryFixtures, 'trainer_request_failure');
    const trainerRetryMarkup = renderFixture(trainerRetry);
    assert.match(trainerRetryMarkup, /data-guidance-zone="trainer"[\s\S]*?data-transition-continuity="persist"/, 'trainer retry should not visually reset the trainer zone');
    assert.match(trainerRetryMarkup, /data-guidance-right-rail-role="context"/, 'trainer retry should keep the rail calm');
    assert.doesNotMatch(trainerRetryMarkup, /data-guidance-zone="trainer"[\s\S]*?data-transition-continuity="advance"/, 'trainer retry should not look like a brand-new advance');

    const degradedFallback = requireFixture(degradedFixtures, 'result_without_guidance_session');
    const degradedMarkup = renderFixture(degradedFallback);
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-focus-dominance="dominant"/, 'degraded fallback should keep the result as the usable anchor');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="execution"/, 'degraded fallback should not leak execution surfaces');
  });
}

function runControllerStructureTests() {
  const controllerPath = path.join(process.cwd(), 'src/components/guidance/use-guidance-session-controller.ts');
  const source = fs.readFileSync(controllerPath, 'utf8');

  assert.match(source, /observeGuidancePresentationState\(/, 'controller should emit lightweight presentation observability');
  assert.match(source, /observeGuidanceActionTriggered\(/, 'controller should emit action-triggered observability');
  assert.match(source, /observeGuidanceSoftSignal\(/, 'controller should emit soft instrumentation markers');
  assert.match(source, /follow_up_hesitation_window/, 'controller should mark follow-up hesitation windows');
  assert.match(source, /abandoned_execution_bridge/, 'controller should mark execution abandonment moments');
  assert.doesNotMatch(source, /fetch\(|axios|posthog|sentry/i, 'observability should stay lightweight and dependency-free');
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
  runGuidanceProductionReadinessTests,
};
