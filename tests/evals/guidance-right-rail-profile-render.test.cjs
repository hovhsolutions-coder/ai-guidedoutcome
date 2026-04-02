require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  buildDossierConversionPresentation,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceRightRailProfileRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const cases = [
    ['clarifying', 'context', 'balanced'],
    ['refined_direction', 'deepen', 'balanced'],
    ['execution_ready', 'handoff', 'strong'],
  ];

  withMockedGuidanceShell(() => {
    for (const [fixtureId, expectedRole, expectedEmphasis] of cases) {
      const fixture = presentationFixtures.find((entry) => entry.id === fixtureId);
      assert.ok(fixture, `Missing right-rail render fixture ${fixtureId}`);
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      assert.match(markup, new RegExp(`data-guidance-right-rail-role="${expectedRole}"`), `${fixtureId}: right-rail role attr drifted`);
      assert.match(markup, new RegExp(`data-guidance-right-rail-emphasis="${expectedEmphasis}"`), `${fixtureId}: right-rail emphasis attr drifted`);
      assert.match(markup, new RegExp(`data-guidance-progress-rail-role="${expectedRole}"`), `${fixtureId}: progress framing should follow the rail role`);
    }

    const degradedFixture = degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session');
    assert.ok(degradedFixture, 'Missing degraded right-rail render fixture');
    const degradedPresentation = presentGuidanceSession({
      state: degradedFixture.state,
      liveRawInput: degradedFixture.liveRawInput,
    });
    const degradedController = buildControllerFixture(degradedFixture, degradedPresentation);
    const degradedMarkup = renderGuidanceShellWithController(degradedController);
    assert.match(degradedMarkup, /data-guidance-right-rail-role="context"/, 'degraded rail should stay contextual');
    assert.match(degradedMarkup, /data-guidance-right-rail-emphasis="subtle"/, 'degraded rail should stay sober');

    const executionFixture = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
    assert.ok(executionFixture, 'Missing dossier right-rail render fixture');
    const executionPresentation = presentGuidanceSession({
      state: executionFixture.state,
      liveRawInput: executionFixture.liveRawInput,
    });
    const dossierPresentation = buildDossierConversionPresentation(executionPresentation);
    const dossierController = buildControllerFixture(executionFixture, dossierPresentation);
    const dossierMarkup = renderGuidanceShellWithController(dossierController, {
      moduleOverrides: buildExecutionDossierLoadingOverride(),
    });
    assert.match(dossierMarkup, /data-guidance-right-rail-role="handoff"/, 'dossier conversion should keep the same handoff rail composition');
    assert.match(dossierMarkup, /data-guidance-right-rail-continuity="persist"/, 'dossier conversion should keep the rail continuity persistent');
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
          onConvertToDossier: () => {},
        });
      },
    },
  };
}

module.exports = {
  runGuidanceRightRailProfileRenderTests,
};
