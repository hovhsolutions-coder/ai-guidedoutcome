require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  buildDossierConversionPresentation,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceAccessibilityRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  withMockedGuidanceShell(() => {
    const freshReady = requireFixture(presentationFixtures, 'fresh');
    const freshReadyMarkup = renderFixture(freshReady);
    assert.equal(countMatches(freshReadyMarkup, /role="status"/g), 1, 'fresh ready: only one live status region should exist');
    assert.equal(countMatches(freshReadyMarkup, /aria-live="polite"/g), 1, 'fresh ready: only one polite live region should exist');
    assert.match(freshReadyMarkup, /role="region" aria-label="Guidance intake" aria-current="step"/, 'fresh ready: intake should be the dominant semantic region');
    assert.match(freshReadyMarkup, /<button type="submit"[^>]*aria-describedby="guidance-progress-message guidance-submit-helper"/, 'fresh ready: submit should describe the shared progress message');
    assert.match(freshReadyMarkup, /focus-visible:ring-2/, 'fresh ready: keyboard focus styling should be present on interactive controls');
    assert.doesNotMatch(freshReadyMarkup, /data-guidance-zone="onboarding"/, 'fresh ready: suppressed onboarding should not render');
    assert.doesNotMatch(freshReadyMarkup, /data-guidance-zone="execution"/, 'fresh ready: suppressed execution should not render');

    const freshLoading = requireFixture(interactionFixtures, 'fresh_submit_loading');
    const freshLoadingMarkup = renderFixture(freshLoading);
    assert.equal(countMatches(freshLoadingMarkup, /role="status"/g), 1, 'fresh loading: only one live status region should exist');
    assert.match(freshLoadingMarkup, /id="guidance-progress-message" role="status" aria-live="polite" aria-atomic="true" aria-busy="true"/, 'fresh loading: progress block should announce the active loading state once');
    assert.match(freshLoadingMarkup, /role="region" aria-label="Guidance result" aria-current="step" aria-busy="true"/, 'fresh loading: dominant result zone should be busy');
    assert.match(freshLoadingMarkup, /<button type="submit" disabled="" aria-disabled="true" aria-describedby="guidance-progress-message guidance-submit-helper"/, 'fresh loading: submit should be disabled semantically and linked to progress');

    const clarifyingLoading = requireFixture(interactionFixtures, 'clarifying_follow_up_loading');
    const clarifyingLoadingMarkup = renderFixture(clarifyingLoading);
    assert.equal(countMatches(clarifyingLoadingMarkup, /role="status"/g), 1, 'clarifying loading: only one live status region should exist');
    assert.match(clarifyingLoadingMarkup, /role="region" aria-label="Guidance clarification" aria-current="step" aria-busy="true"/, 'clarifying loading: onboarding should be the active busy region');
    assert.match(clarifyingLoadingMarkup, /<button type="submit" disabled="" aria-disabled="true" aria-describedby="guidance-progress-message guidance-follow-up-helper"/, 'clarifying loading: continue CTA should stay disabled and progress-described');
    assert.match(clarifyingLoadingMarkup, /<textarea id="guidance-follow-up-answer"[^>]*aria-describedby="guidance-progress-message guidance-follow-up-helper"/, 'clarifying loading: follow-up input should keep progress context attached');

    const trainerLoading = requireFixture(interactionFixtures, 'trainer_request_loading');
    const trainerLoadingMarkup = renderFixture(trainerLoading);
    assert.equal(countMatches(trainerLoadingMarkup, /role="status"/g), 1, 'trainer loading: only one live status region should exist');
    assert.match(trainerLoadingMarkup, /role="region" aria-label="Guidance trainer" aria-current="step" aria-busy="true"/, 'trainer loading: trainer should be the active busy region');
    assert.match(trainerLoadingMarkup, /aria-describedby="guidance-progress-message guidance-next-path-trainer-support"/, 'trainer loading: trainer CTA should describe the shared progress state');
    assert.match(trainerLoadingMarkup, /disabled="" aria-disabled="true"/, 'trainer loading: locked trainer actions should be semantically disabled');

    const dossierLoadingBase = requireFixture(interactionFixtures, 'execution_ready_dossier_loading');
    const dossierLoadingMarkup = renderDossierLoadingFixture(dossierLoadingBase);
    assert.equal(countMatches(dossierLoadingMarkup, /role="status"/g), 1, 'dossier loading: only one live status region should exist');
    assert.match(dossierLoadingMarkup, /role="region" aria-label="Guidance execution transition" aria-current="step" aria-busy="true"/, 'dossier loading: execution should be the active busy region');
    assert.match(dossierLoadingMarkup, /<button type="button" disabled="" aria-disabled="true" aria-describedby="guidance-progress-message guidance-execution-transition-support"/, 'dossier loading: convert CTA should stay disabled and progress-described');

    const degradedFallback = requireFixture(degradedFixtures, 'result_without_guidance_session');
    const degradedMarkup = renderFixture(degradedFallback);
    assert.equal(countMatches(degradedMarkup, /role="status"/g), 1, 'degraded fallback: only one live status region should exist');
    assert.equal(countMatches(degradedMarkup, /aria-busy="true"/g), 0, 'degraded fallback: no zone should announce active loading');
    assert.match(degradedMarkup, /role="region" aria-label="Guidance result" aria-current="step"/, 'degraded fallback: result should remain the semantic anchor');
    assert.doesNotMatch(degradedMarkup, /aria-label="Guidance execution transition"/, 'degraded fallback: untrusted execution semantics should stay suppressed');
  });
}

function renderFixture(fixture) {
  const presentation = presentGuidanceSession({
    state: fixture.state,
    liveRawInput: fixture.liveRawInput,
  });

  return renderGuidanceShellWithController(buildControllerFixture(fixture, presentation));
}

function renderDossierLoadingFixture(fixture) {
  const presentation = buildDossierConversionPresentation(
    presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    })
  );

  return renderGuidanceShellWithController(buildControllerFixture(fixture, presentation), {
    moduleOverrides: buildExecutionDossierLoadingOverride(),
  });
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
          isConverting: true,
          conversionError: null,
          conversionStatus: `Creating a dossier from this guidance read: "${props.transition.nextStep}"`,
          progressMessageId: props.progressMessageId,
          supportDescriptionId: 'guidance-execution-transition-support',
          onConvertToDossier: () => {},
        });
      },
    },
  };
}

function requireFixture(fixtures, id) {
  const fixture = fixtures.find((entry) => entry.id === id);
  assert.ok(fixture, `Missing fixture ${id}`);
  return fixture;
}

module.exports = {
  runGuidanceAccessibilityRenderTests,
};
