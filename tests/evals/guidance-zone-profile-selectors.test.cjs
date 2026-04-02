require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceSession, presentGuidanceSessionForProgressStateOverride } = require('../../src/components/guidance/guidance-session-presenter.ts');
const {
  deriveGuidanceProgressContext,
  getGuidanceDominantZoneProfile,
  getGuidancePrimaryCtaZoneProfile,
  getGuidanceVisibleZoneProfiles,
} = require('../../src/components/guidance/guidance-zone-profile-selectors.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

function runGuidanceZoneProfileSelectorTests() {
  const fixtures = createGuidancePresentationFixtureMatrix();

  const expectedByFixture = {
    fresh: {
      dominantZone: 'intake',
      progressContext: 'intake',
      primaryCtaZone: 'intake',
      visibleZones: ['intake', 'result'],
    },
    clarifying: {
      dominantZone: 'onboarding',
      progressContext: 'follow_up',
      primaryCtaZone: 'onboarding',
      visibleZones: ['intake', 'onboarding', 'result', 'trainer'],
    },
    refined_direction: {
      dominantZone: 'result',
      progressContext: 'result',
      primaryCtaZone: null,
      visibleZones: ['intake', 'onboarding', 'result', 'trainer'],
    },
    execution_ready: {
      dominantZone: 'execution',
      progressContext: 'execution_transition',
      primaryCtaZone: 'execution',
      visibleZones: ['intake', 'onboarding', 'result', 'execution'],
    },
  };

  for (const fixture of fixtures) {
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });
    const expected = expectedByFixture[fixture.id];

    assert.equal(
      getGuidanceDominantZoneProfile(presentation.zoneProfiles).zone,
      expected.dominantZone,
      `${fixture.id}: dominant zone selector drifted`
    );
    assert.equal(
      deriveGuidanceProgressContext(presentation.zoneProfiles, presentation.surfaceVariant),
      expected.progressContext,
      `${fixture.id}: progress context selector drifted`
    );
    assert.deepEqual(
      getGuidanceVisibleZoneProfiles(presentation.zoneProfiles).map((profile) => profile.zone),
      expected.visibleZones,
      `${fixture.id}: visible zone selector drifted`
    );

    const primaryCtaZone = getGuidancePrimaryCtaZoneProfile(presentation.zoneProfiles);
    assert.equal(primaryCtaZone?.zone ?? null, expected.primaryCtaZone, `${fixture.id}: CTA-owning zone selector drifted`);
  }

  const degradedFixture = createGuidanceDegradedAuthorityFixtureMatrix().find((fixture) => fixture.id === 'result_without_guidance_session');
  assert.ok(degradedFixture, 'Missing degraded selector fixture');
  const degradedPresentation = presentGuidanceSession({
    state: degradedFixture.state,
    liveRawInput: degradedFixture.liveRawInput,
  });

  assert.equal(getGuidanceDominantZoneProfile(degradedPresentation.zoneProfiles).zone, 'result');
  assert.equal(
    deriveGuidanceProgressContext(degradedPresentation.zoneProfiles, degradedPresentation.surfaceVariant),
    'degraded_result',
    'degraded selector path should stay result-led but downgraded'
  );
  assert.equal(getGuidancePrimaryCtaZoneProfile(degradedPresentation.zoneProfiles), null, 'degraded fallback should not claim a primary CTA zone');

  const executionFixture = fixtures.find((fixture) => fixture.id === 'execution_ready');
  assert.ok(executionFixture, 'Missing execution selector fixture');
  const executionPresentation = presentGuidanceSession({
    state: executionFixture.state,
    liveRawInput: executionFixture.liveRawInput,
  });
  const dossierPresentation = presentGuidanceSessionForProgressStateOverride({
    baseState: {
      intake: executionPresentation.intake,
      rightRailView: executionPresentation.rightRailView,
    },
    progressState: 'dossier_conversion_loading',
  });

  assert.equal(getGuidanceDominantZoneProfile(dossierPresentation.zoneProfiles).zone, 'execution');
  assert.equal(
    deriveGuidanceProgressContext(dossierPresentation.zoneProfiles, dossierPresentation.surfaceVariant),
    'execution_transition',
    'dossier conversion selector should keep the same execution progress context'
  );
  assert.equal(getGuidancePrimaryCtaZoneProfile(dossierPresentation.zoneProfiles)?.zone, 'execution');
}

module.exports = {
  runGuidanceZoneProfileSelectorTests,
};
