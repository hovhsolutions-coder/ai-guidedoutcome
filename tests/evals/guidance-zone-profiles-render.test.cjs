require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');
const {
  buildControllerFixture,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
} = require('./guidance-shell-test-helpers.cjs');

const ZONES = ['intake', 'onboarding', 'result', 'trainer', 'execution'];

function runGuidanceZoneProfilesRenderTests() {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();
  const fixtures = [
    presentationFixtures.find((fixture) => fixture.id === 'clarifying'),
    presentationFixtures.find((fixture) => fixture.id === 'refined_direction'),
    presentationFixtures.find((fixture) => fixture.id === 'execution_ready'),
    degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'),
  ];

  withMockedGuidanceShell(() => {
    for (const fixture of fixtures) {
      assert.ok(fixture, 'Missing zone-profile render fixture');
      const presentation = presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });
      const controller = buildControllerFixture(fixture, presentation);
      const markup = renderGuidanceShellWithController(controller);

      for (const zone of ZONES) {
        const profile = presentation.zoneProfiles[zone];
        if (profile.visibility === 'suppressed') {
          assert.doesNotMatch(markup, new RegExp(`data-guidance-zone="${zone}"`), `${fixture.id}: suppressed ${zone} should not render`);
          continue;
        }

        assert.match(
          markup,
          new RegExp(
            `data-guidance-zone="${zone}"[\\s\\S]*?data-section-visibility="${profile.visibility}"[\\s\\S]*?data-zone-focus-state="${profile.focusState}"[\\s\\S]*?data-zone-primary-cta="${profile.primaryCta ?? 'none'}"`
          ),
          `${fixture.id}: ${zone} shell wrapper drifted away from its zone profile`
        );
      }

      const dominantZone = ZONES.find((zone) => presentation.zoneProfiles[zone].focusState === 'dominant');
      assert.ok(dominantZone, `${fixture.id}: missing dominant zone profile`);
      assert.match(
        markup,
        new RegExp(`data-guidance-zone="${dominantZone}"[\\s\\S]*?data-focus-dominance="dominant"`),
        `${fixture.id}: shell no longer marks the dominant zone from zone profiles`
      );

      switch (fixture.id) {
        case 'clarifying':
          assert.match(markup, /Continue guidance/, 'clarifying: onboarding action should remain visible');
          assert.match(markup, /First onboarding read/, 'clarifying: onboarding context should remain visible');
          assert.match(markup, /Result panel/, 'clarifying: result context should remain visible');
          break;
        case 'refined_direction':
          assert.match(markup, /Refined next step/, 'refined: result-led section should remain intact');
          assert.match(markup, /Recommended continuation/, 'refined: trainer surface should remain available');
          assert.doesNotMatch(markup, />Your answer</, 'refined: clarifying form should stay absent');
          break;
        case 'execution_ready':
          assert.match(markup, /Plan ready/, 'execution: execution section should remain visible');
          assert.match(markup, /Convert to dossier/, 'execution: execution commit CTA should remain visible');
          assert.doesNotMatch(markup, /Recommended continuation/, 'execution: trainer continuation should stay suppressed');
          break;
        case 'result_without_guidance_session':
          assert.match(markup, /Result panel/, 'degraded: result should stay visible');
          assert.doesNotMatch(markup, /Current phase/, 'degraded: phase-specific onboarding should stay suppressed');
          assert.doesNotMatch(markup, /Plan ready/, 'degraded: execution surface should stay suppressed');
          break;
        default:
          throw new Error(`Unhandled render fixture ${fixture.id}`);
      }
    }
  });
}

module.exports = {
  runGuidanceZoneProfilesRenderTests,
};
