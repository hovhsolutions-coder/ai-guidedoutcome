require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');

function runGuidancePresentationMatrixTests() {
  const fixtures = createGuidancePresentationFixtureMatrix();

  assert.deepEqual(
    fixtures.map((fixture) => fixture.id),
    ['fresh', 'clarifying', 'refined_direction', 'execution_ready']
  );

  for (const fixture of fixtures) {
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(Object.keys(presentation), ['intake', 'progressMessage', 'surfaceVariant', 'rightRailProfile', 'activeFocus', 'sectionVisibility', 'contentDensity', 'microcopyIntent', 'sectionOutcome', 'surfaceRhythm', 'transitionContinuity', 'visualWeight', 'zoneProfiles', 'rightRailView'], `${fixture.id}: presenter root shape changed`);
    assert.deepEqual(Object.keys(presentation.intake), ['universal', 'mode', 'submit'], `${fixture.id}: intake shape changed`);
    assert.deepEqual(
      Object.keys(presentation.rightRailView),
      ['onboardingSession', 'executionSession', 'executionReadySection', 'structuredContracts', 'result', 'trainer'],
      `${fixture.id}: right-rail shape changed`
    );

    assert.equal(presentation.intake.submit.label, fixture.expected.submitLabel, `${fixture.id}: submit label drifted`);
    assert.equal(presentation.intake.submit.disabled, fixture.expected.submitDisabled, `${fixture.id}: submit disabled drifted`);
    assert.ok(presentation.progressMessage.title.trim().length > 0, `${fixture.id}: progress title missing`);
    assert.ok(presentation.progressMessage.statusLine.trim().length > 0, `${fixture.id}: progress status missing`);
    assert.ok(presentation.surfaceVariant, `${fixture.id}: surface variant missing`);
    assert.ok(presentation.rightRailProfile.role, `${fixture.id}: right-rail role missing`);
    assert.ok(presentation.rightRailProfile.emphasis, `${fixture.id}: right-rail emphasis missing`);
    assert.ok(presentation.activeFocus.target, `${fixture.id}: active focus target missing`);
    assert.ok(presentation.activeFocus.dominantZone, `${fixture.id}: active focus zone missing`);
    assert.ok(presentation.sectionVisibility.intake, `${fixture.id}: intake visibility missing`);
    assert.ok(presentation.sectionVisibility.result, `${fixture.id}: result visibility missing`);
    assert.ok('intake' in presentation.contentDensity, `${fixture.id}: content density shape changed`);
    assert.ok('intake' in presentation.microcopyIntent, `${fixture.id}: microcopy intent shape changed`);
    assert.ok('intake' in presentation.sectionOutcome, `${fixture.id}: section outcome shape changed`);
    assert.ok('intake' in presentation.surfaceRhythm, `${fixture.id}: surface rhythm shape changed`);
    assert.ok('intake' in presentation.transitionContinuity, `${fixture.id}: transition continuity shape changed`);
    assert.ok('intake' in presentation.visualWeight, `${fixture.id}: visual weight shape changed`);
    assert.ok('intake' in presentation.zoneProfiles, `${fixture.id}: zone profile shape changed`);
    assert.equal(presentation.zoneProfiles[presentation.activeFocus.dominantZone].focusState, 'dominant', `${fixture.id}: dominant zone profile drifted`);

    const visible = {
      onboarding: presentation.rightRailView.onboardingSession !== null,
      result: presentation.rightRailView.result.panel.result !== null || fixture.id === 'fresh',
      trainer_next_path: presentation.rightRailView.trainer.nextPath.guidanceSession !== null,
      execution_ready: presentation.rightRailView.executionReadySection !== null,
    };

    for (const key of fixture.expected.visible) {
      assert.equal(visible[key], true, `${fixture.id}: expected ${key} to be visible`);
    }
    for (const key of fixture.expected.hidden) {
      assert.equal(visible[key], false, `${fixture.id}: expected ${key} to be hidden`);
    }

    if (fixture.expected.phase) {
      assert.equal(
        presentation.rightRailView.onboardingSession?.phase,
        fixture.expected.phase,
        `${fixture.id}: onboarding phase drifted`
      );
    } else {
      assert.equal(presentation.rightRailView.onboardingSession, null, `${fixture.id}: onboarding should be absent`);
    }

    if (fixture.id === 'execution_ready') {
      assert.equal(
        presentation.rightRailView.executionSession?.phase,
        'execution_ready',
        'execution_ready: execution carrier drifted'
      );
      assert.ok(presentation.rightRailView.executionReadySection, 'execution_ready: missing execution section');
      assert.deepEqual(
        Object.keys(presentation.rightRailView.executionReadySection),
        ['progress', 'handoff', 'transition'],
        'execution_ready: execution section shape changed'
      );
      assert.equal(
        presentation.rightRailView.executionReadySection.handoff.nextStep,
        'Define the final owner sequence for launch week'
      );
      assert.equal(
        presentation.rightRailView.executionReadySection.transition.dossierLabel,
        'Convert into dossier when ready'
      );
    } else {
      assert.equal(presentation.rightRailView.executionReadySection, null, `${fixture.id}: execution section should be absent`);
    }

    const copySurface = [
      presentation.progressMessage.title,
      presentation.progressMessage.statusLine,
      presentation.rightRailView.result.currentRead.label,
      presentation.intake.mode.domainValue,
      presentation.intake.mode.dossierValue,
      presentation.intake.submit.label,
      presentation.rightRailView.result.currentRead.summary,
      presentation.rightRailView.executionReadySection?.progress.title ?? '',
    ].join(' ');

    for (const marker of fixture.expected.copyMarkers) {
      assert.match(copySurface, new RegExp(escapeRegExp(marker), 'i'), `${fixture.id}: missing copy marker "${marker}"`);
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  runGuidancePresentationMatrixTests,
};
