require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceRecoveryFixtureMatrix } = require('./guidance-recovery-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  buildDossierConversionPresentation,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceUiCalmnessRenderTests() {
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const recoveryFixtures = createGuidanceRecoveryFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshLoading = requireFixture(interactionFixtures, 'fresh_submit_loading');
    const freshMarkup = renderFixture(freshLoading);
    assertSingleCalmSurface(freshMarkup, 'fresh loading');
    assert.equal(countMatches(freshMarkup, /data-guidance-cta-state="active"/g), 0, 'fresh loading: no competing CTA should stay active');
    assert.ok(countMatches(freshMarkup, /data-zone-focus-state="secondary"/g) >= 1, 'fresh loading: supporting zones should stay secondary');

    const trainerLoading = requireFixture(interactionFixtures, 'trainer_request_loading');
    const trainerMarkup = renderFixture(trainerLoading);
    assertSingleCalmSurface(trainerMarkup, 'trainer loading');
    assert.equal(countMatches(trainerMarkup, /Loading strategy trainer\.\.\./g), 1, 'trainer loading: only one processing surface should speak actively');
    assert.match(trainerMarkup, /strategy trainer selected/i, 'trainer loading: supporting CTA should stay calm');
    assert.equal(countMatches(trainerMarkup, /data-guidance-cta-state="active"/g), 1, 'trainer loading: only one CTA context should stay active');

    const clarifyingFailure = requireFixture(recoveryFixtures, 'clarifying_follow_up_failure');
    const clarifyingFailureMarkup = renderFixture(clarifyingFailure);
    assertSingleCalmSurface(clarifyingFailureMarkup, 'clarifying failure');
    assert.match(clarifyingFailureMarkup, /Guidance could not be generated right now\./, 'clarifying failure: error should stay visible');
    assert.doesNotMatch(clarifyingFailureMarkup, /Continuing guidance\.\.\./, 'clarifying failure: loading copy should clear cleanly');

    const degradedFallback = requireFixture(degradedFixtures, 'result_without_guidance_session');
    const degradedMarkup = renderFixture(degradedFallback);
    assertSingleCalmSurface(degradedMarkup, 'degraded fallback');
    assert.match(degradedMarkup, /data-guidance-right-rail-emphasis="subtle"/, 'degraded fallback: rail should stay sober');
    assert.match(degradedMarkup, /data-guidance-zone="result"[\s\S]*?data-visual-weight="balanced"/, 'degraded fallback: result should stay balanced');
    assert.doesNotMatch(degradedMarkup, /data-guidance-zone="execution"[\s\S]*?data-focus-dominance="dominant"/, 'degraded fallback: execution should not steal dominance');

    const dossierLoadingBase = requireFixture(interactionFixtures, 'execution_ready_dossier_loading');
    const dossierLoadingPresentation = buildDossierConversionPresentation(
      presentGuidanceSession({
        state: dossierLoadingBase.state,
        liveRawInput: dossierLoadingBase.liveRawInput,
      })
    );
    const dossierMarkup = renderGuidanceShellWithController(
      buildControllerFixture(dossierLoadingBase, dossierLoadingPresentation),
      { moduleOverrides: buildExecutionDossierLoadingOverride() }
    );
    assertSingleCalmSurface(dossierMarkup, 'dossier loading');
    assert.equal(countMatches(dossierMarkup, /Creating dossier\.\.\./g), 1, 'dossier loading: only one convert CTA should stay active');
    assert.match(dossierMarkup, /data-guidance-right-rail-role="handoff"/, 'dossier loading: rail should stay in handoff mode');
    assert.doesNotMatch(dossierMarkup, /Creating a dossier from this guidance read:/, 'dossier loading: inline status should stay hidden');
  });
}

function renderFixture(fixture) {
  const presentation = presentGuidanceSession({
    state: fixture.state,
    liveRawInput: fixture.liveRawInput,
  });

  return renderGuidanceShellWithController(buildControllerFixture(fixture, presentation));
}

function assertSingleCalmSurface(markup, label) {
  assert.equal(countMatches(markup, /data-progress-message-state=/g), 1, `${label}: progress block should stay singular`);
  assert.equal(countMatches(markup, /data-focus-dominance="dominant"/g), 1, `${label}: only one dominant zone should render`);
  assert.ok(countMatches(markup, /data-zone-focus-state="secondary"/g) >= 1, `${label}: secondary context should remain visible but subdued`);
}

function requireFixture(fixtures, id) {
  const fixture = fixtures.find((entry) => entry.id === id);
  assert.ok(fixture, `Missing fixture ${id}`);
  return fixture;
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
          intent: props.intent,
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
  runGuidanceUiCalmnessRenderTests,
};
