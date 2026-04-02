require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const {
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
  restoreStoreStateFromPersistedSnapshot,
} = require('../../src/components/guidance/guidance-session-store.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const {
  loadPersistedGuidanceShellState,
  savePersistedGuidanceShellState,
} = require('../../src/lib/guidance-session/persist-guidance-session-state.ts');
const { createGuidanceSessionResumeFixtureMatrix } = require('./guidance-session-resume-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceSessionResumeMatrixTests() {
  const fixtures = createGuidanceSessionResumeFixtureMatrix();

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      const storage = createMemoryStorage();
      savePersistedGuidanceShellState(storage, fixture.snapshot, 1000);
      const restoredSnapshot = loadPersistedGuidanceShellState(storage, 1000);
      const restoredPayload = restoreStoreStateFromPersistedSnapshot(restoredSnapshot);

      assert.ok(restoredPayload, `${fixture.id}: restore should produce controller payload`);

      const restoredState = guidanceSessionStoreReducer(createInitialGuidanceSessionStoreState(), {
        type: 'restore',
        payload: restoredPayload,
      });

      const presentation = presentGuidanceSession({
        state: restoredState,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture({
        state: restoredState,
        liveRawInput: fixture.liveRawInput,
      }, presentation);
      const markup = renderGuidanceShellWithController(controller);

      switch (fixture.id) {
        case 'restored_clarifying_session':
          assert.equal(restoredState.session.guidanceSession.phase, 'clarifying', 'restored clarifying: phase drifted');
          assert.match(markup, /First onboarding read/, 'restored clarifying: onboarding missing');
          assert.match(markup, /Continue guidance/, 'restored clarifying: follow-up action missing');
          assert.match(markup, /Recommended continuation/, 'restored clarifying: next-path missing');
          assert.doesNotMatch(markup, /Plan ready/, 'restored clarifying: execution-ready section should stay hidden');
          assert.equal(countMatches(markup, /Continue guidance/g), 1, 'restored clarifying: duplicate follow-up CTA');
          break;

        case 'restored_refined_direction_session':
          assert.equal(restoredState.session.guidanceSession.phase, 'refined_direction', 'restored refined: phase drifted');
          assert.match(markup, /Refined onboarding read/, 'restored refined: onboarding missing');
          assert.match(markup, /Refined next step/, 'restored refined: next-step framing missing');
          assert.match(markup, /Recommended continuation/, 'restored refined: next-path missing');
          assert.doesNotMatch(markup, /Continue guidance/, 'restored refined: follow-up action should stay hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'restored refined: execution-ready section should stay hidden');
          break;

        case 'restored_execution_ready_session':
          assert.equal(restoredState.session.guidanceSession.phase, 'execution_ready', 'restored execution: phase drifted');
          assert.match(markup, /Plan ready/, 'restored execution: progress strip missing');
          assert.match(markup, /Execution handoff/, 'restored execution: handoff missing');
          assert.match(markup, /Convert to dossier/, 'restored execution: final bridge missing');
          assert.doesNotMatch(markup, /Recommended continuation/, 'restored execution: next-path should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'restored execution: trainer actions should stay hidden');
          break;

        case 'restored_clarifying_follow_up_failure':
          assert.equal(restoredState.session.guidanceSession.phase, 'clarifying', 'restored clarifying failure: phase drifted');
          assert.doesNotMatch(markup, /Guidance needs attention/, 'restored clarifying failure: transient shell error should not persist');
          assert.match(markup, /Continue guidance/, 'restored clarifying failure: retry path missing');
          assert.match(markup, /Current phase/, 'restored clarifying failure: clarifying context missing');
          assert.doesNotMatch(markup, /Plan ready/, 'restored clarifying failure: execution-ready should stay hidden');
          assert.equal(countMatches(markup, /Continue guidance/g), 1, 'restored clarifying failure: duplicate retry CTA');
          break;

        case 'restored_trainer_request_failure':
          assert.equal(restoredState.session.guidanceSession.phase, 'refined_direction', 'restored trainer failure: phase drifted');
          assert.match(markup, /Recommended continuation/, 'restored trainer failure: next-path section missing');
          assert.doesNotMatch(markup, /The specialist read could not be loaded right now\./, 'restored trainer failure: transient trainer error should not persist');
          assert.match(markup, /Refresh strategy trainer/, 'restored trainer failure: retry trainer path missing');
          assert.doesNotMatch(markup, /Trainer read/, 'restored trainer failure: transient trainer response block should not persist');
          assert.doesNotMatch(markup, /Continue guidance/, 'restored trainer failure: clarifying action should stay hidden');
          assert.doesNotMatch(markup, /Plan ready/, 'restored trainer failure: execution-ready should stay hidden');
          break;

        case 'restored_execution_ready_dossier_failure':
          assert.equal(restoredState.session.guidanceSession.phase, 'execution_ready', 'restored dossier failure: phase drifted');
          assert.match(markup, /Plan ready/, 'restored dossier failure: progress strip missing');
          assert.match(markup, /Execution handoff/, 'restored dossier failure: handoff missing');
          assert.doesNotMatch(markup, /The dossier could not be created\./, 'restored dossier failure: transient conversion error should not persist');
          assert.match(markup, />Convert to dossier</, 'restored dossier failure: retry convert path missing');
          assert.doesNotMatch(markup, /Continue guidance/, 'restored dossier failure: follow-up should stay hidden');
          assert.doesNotMatch(markup, /Ask .* trainer/, 'restored dossier failure: trainer actions should stay hidden');
          assert.equal(countMatches(markup, /Convert to dossier/g), 1, 'restored dossier failure: duplicate convert CTA');
          break;

        default:
          throw new Error(`Unhandled resume fixture ${fixture.id}`);
      }

      assert.equal(
        presentation.rightRailView.executionReadySection !== null,
        /Plan ready/.test(markup),
        `${fixture.id}: resumed execution-ready visibility drifted from presenter`
      );
    }
  });
}

function createMemoryStorage() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

module.exports = {
  runGuidanceSessionResumeMatrixTests,
};
