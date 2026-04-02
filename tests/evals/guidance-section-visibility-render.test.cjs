require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const React = require('react');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceInteractionFixtureMatrix } = require('./guidance-interaction-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildDossierConversionPresentation,
  buildControllerFixture,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceSectionVisibilityRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const fixtures = [
    presentationFixtures.find((fixture) => fixture.id === 'fresh'),
    interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'),
    presentationFixtures.find((fixture) => fixture.id === 'clarifying'),
    interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'),
    presentationFixtures.find((fixture) => fixture.id === 'refined_direction'),
    interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'),
    presentationFixtures.find((fixture) => fixture.id === 'execution_ready'),
    degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'),
  ];

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      assert.ok(fixture, 'Missing section-visibility render fixture');
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
        const status = presentation.sectionVisibility[zone];
        if (status === 'suppressed') {
          assert.doesNotMatch(markup, new RegExp(`data-guidance-zone="${zone}"`), `${fixture.id}: suppressed ${zone} should not render`);
        } else {
          assert.match(markup, new RegExp(`data-guidance-zone="${zone}"[\\s\\S]*?data-section-visibility="${status}"`), `${fixture.id}: ${zone} visibility marker drifted`);
        }
      }

      assert.match(
        markup,
        new RegExp(`data-guidance-zone="${presentation.activeFocus.dominantZone}"[\\s\\S]*?data-section-visibility="(?:visible|soft_hidden)"[\\s\\S]*?data-focus-dominance="dominant"`),
        `${fixture.id}: dominant zone drifted from presenter`
      );
    }

    const dossierFixture = interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading');
    assert.ok(dossierFixture, 'Missing dossier-conversion render fixture');
    const dossierBasePresentation = presentGuidanceSession({
      state: dossierFixture.state,
      liveRawInput: dossierFixture.liveRawInput,
    });
    const dossierPresentation = buildDossierConversionPresentation(dossierBasePresentation);
    const dossierController = buildControllerFixture(dossierFixture, dossierPresentation);
    const dossierMarkup = renderGuidanceShellWithController(dossierController, {
      moduleOverrides: buildExecutionDossierLoadingOverride(),
    });

    assert.match(dossierMarkup, /data-guidance-zone="execution"[\s\S]*?data-section-visibility="visible"[\s\S]*?data-guidance-cta-context="dossier_convert"[\s\S]*?data-guidance-cta-state="active"[\s\S]*?data-focus-dominance="dominant"/);
    assert.doesNotMatch(dossierMarkup, /data-guidance-zone="trainer"/, 'dossier loading: trainer should stay suppressed');
    assert.match(dossierMarkup, /data-guidance-zone="result"[\s\S]*?data-section-visibility="soft_hidden"/, 'dossier loading: result should stay softly visible');
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
  runGuidanceSectionVisibilityRenderTests,
};
