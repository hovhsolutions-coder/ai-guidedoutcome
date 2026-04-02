require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const {
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

function runGuidanceActionReadinessMatrixTests() {
  const fixtures = createGuidancePresentationFixtureMatrix().map((fixture) => ({
    ...fixture,
    expectedActions: buildExpectedActions(fixture.id),
  }));

  withMockedGuidanceShell((GuidanceSessionShell) => {
    for (const fixture of fixtures) {
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);
      const topTrainer = fixture.state.session.guidanceSession?.trainerRecommendation?.topTrainer ?? null;

      assert.equal(
        isPrimarySubmitEnabled(markup, presentation.intake.submit.label),
        fixture.expectedActions.primarySubmitEnabled,
        `${fixture.id}: primary submit availability drifted`
      );
      assert.equal(
        /Continue guidance/.test(markup),
        fixture.expectedActions.followUpContinueVisible,
        `${fixture.id}: follow-up continue availability drifted`
      );
      assert.equal(
        topTrainer ? new RegExp(`Ask ${escapeRegExp(topTrainer)} trainer`, 'i').test(markup) : false,
        fixture.expectedActions.trainerActionVisible,
        `${fixture.id}: trainer action availability drifted`
      );
      assert.equal(
        /Continue from this guidance state/.test(markup),
        fixture.expectedActions.executionTransitionVisible,
        `${fixture.id}: execution transition availability drifted`
      );
      assert.equal(
        /<button[^>]*>Convert to dossier</.test(markup),
        fixture.expectedActions.dossierConvertVisible,
        `${fixture.id}: dossier convert availability drifted`
      );

      if (fixture.expectedActions.primarySubmitEnabled) {
        assert.equal(
          countMatches(markup, new RegExp(`>${escapeRegExp(presentation.intake.submit.label)}<`, 'g')),
          1,
          `${fixture.id}: duplicate primary submit action`
        );
      }

      if (fixture.expectedActions.followUpContinueVisible) {
        assert.equal(countMatches(markup, /Continue guidance/g), 1, `${fixture.id}: duplicate follow-up action`);
        assert.doesNotMatch(markup, /Continue from this guidance state/, `${fixture.id}: conflicting execution transition`);
      }

      if (fixture.expectedActions.executionTransitionVisible) {
        assert.equal(countMatches(markup, /Continue from this guidance state/g), 1, `${fixture.id}: duplicate execution transition`);
        assert.equal(countMatches(markup, /<button[^>]*>Convert to dossier</g), 1, `${fixture.id}: duplicate dossier convert`);
        assert.doesNotMatch(markup, /Continue guidance/, `${fixture.id}: conflicting follow-up action`);
        assert.doesNotMatch(markup, /Ask .* trainer/, `${fixture.id}: conflicting trainer action`);
      }

      if (fixture.id === 'fresh') {
        assert.doesNotMatch(markup, /Ask .* trainer/, 'fresh: trainer actions should stay hidden');
        assert.doesNotMatch(markup, /<button[^>]*>Convert to dossier</, 'fresh: dossier action should stay hidden');
      }

      assert.equal(
        fixture.expectedActions.executionTransitionVisible,
        presentation.rightRailView.executionReadySection !== null,
        `${fixture.id}: action readiness drifted from presenter execution-ready state`
      );

      if (topTrainer) {
        assert.equal(
          fixture.expectedActions.trainerActionVisible,
          presentation.rightRailView.trainer.nextPath.guidanceSession !== null,
          `${fixture.id}: trainer action drifted from presenter next-path state`
        );
      }
    }
  });
}

function buildExpectedActions(fixtureId) {
  switch (fixtureId) {
    case 'fresh':
      return {
        primarySubmitEnabled: false,
        followUpContinueVisible: false,
        trainerActionVisible: false,
        executionTransitionVisible: false,
        dossierConvertVisible: false,
      };
    case 'clarifying':
      return {
        primarySubmitEnabled: true,
        followUpContinueVisible: true,
        trainerActionVisible: true,
        executionTransitionVisible: false,
        dossierConvertVisible: false,
      };
    case 'refined_direction':
      return {
        primarySubmitEnabled: true,
        followUpContinueVisible: false,
        trainerActionVisible: true,
        executionTransitionVisible: false,
        dossierConvertVisible: false,
      };
    case 'execution_ready':
      return {
        primarySubmitEnabled: true,
        followUpContinueVisible: false,
        trainerActionVisible: false,
        executionTransitionVisible: true,
        dossierConvertVisible: true,
      };
    default:
      throw new Error(`Unhandled fixture ${fixtureId}`);
  }
}

function isPrimarySubmitEnabled(markup, label) {
  const enabledPattern = new RegExp(`<button type="submit"(?![^>]*\\sdisabled=)[^>]*>${escapeRegExp(label)}<`, 'i');
  return enabledPattern.test(markup);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  runGuidanceActionReadinessMatrixTests,
};
