require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { presentGuidanceActiveFocus } = require('../../src/components/guidance/guidance-active-focus-presenter.ts');
const { presentGuidanceContentDensity } = require('../../src/components/guidance/guidance-content-density-presenter.ts');
const { presentGuidanceMicrocopyIntent } = require('../../src/components/guidance/guidance-microcopy-intent-presenter.ts');
const { presentGuidanceSectionOutcome } = require('../../src/components/guidance/guidance-section-outcome-presenter.ts');
const { presentGuidanceSectionVisibility } = require('../../src/components/guidance/guidance-section-visibility-presenter.ts');
const { presentGuidanceSurfaceRhythm } = require('../../src/components/guidance/guidance-surface-rhythm-presenter.ts');
const { presentGuidanceTransitionContinuity } = require('../../src/components/guidance/guidance-transition-continuity-presenter.ts');
const { presentGuidanceVisualWeight } = require('../../src/components/guidance/guidance-visual-weight-presenter.ts');
const { presentGuidanceZoneProfiles } = require('../../src/components/guidance/guidance-zone-profiles-presenter.ts');
const { presentGuidanceSession } = require('../../src/components/guidance/guidance-session-presenter.ts');
const {
  getGuidanceDominantZoneProfile,
  getGuidancePrimaryCtaZoneProfile,
  getGuidanceVisibleZoneProfiles,
} = require('../../src/components/guidance/guidance-zone-profile-selectors.ts');
const { createGuidancePresentationFixtureMatrix } = require('./guidance-presentation-fixtures.ts');
const { createGuidanceDegradedAuthorityFixtureMatrix } = require('./guidance-degraded-authority-fixtures.ts');

const ZONES = ['intake', 'onboarding', 'result', 'trainer', 'execution'];

function runGuidanceZoneProfilesMatrixTests() {
  const fixtures = [
    ...createGuidancePresentationFixtureMatrix(),
    ...createGuidanceDegradedAuthorityFixtureMatrix(),
  ];

  for (const fixture of fixtures) {
    const presentation = presentGuidanceSession({
      state: fixture.state,
      liveRawInput: fixture.liveRawInput,
    });

    assert.deepEqual(Object.keys(presentation.zoneProfiles), ZONES, `${fixture.id}: zone profile shape changed`);

    for (const zone of ZONES) {
      const profile = presentation.zoneProfiles[zone];
      assert.equal(profile.zone, zone, `${fixture.id}: ${zone} zone label drifted`);
      assert.equal(profile.visibility, presentation.sectionVisibility[zone], `${fixture.id}: ${zone} visibility drifted`);

      if (profile.visibility === 'suppressed') {
        assert.equal(profile.focusState, 'hidden', `${fixture.id}: suppressed ${zone} should not keep focus`);
        assert.equal(profile.isDominant, false, `${fixture.id}: suppressed ${zone} should not be dominant`);
        assert.equal(profile.primaryCta, null, `${fixture.id}: suppressed ${zone} should not keep a CTA`);
        assert.equal(profile.contentDensity, null, `${fixture.id}: suppressed ${zone} should not keep density`);
        assert.equal(profile.microcopyIntent, null, `${fixture.id}: suppressed ${zone} should not keep intent`);
        assert.equal(profile.sectionOutcome, null, `${fixture.id}: suppressed ${zone} should not keep outcome`);
        assert.equal(profile.surfaceRhythm, null, `${fixture.id}: suppressed ${zone} should not keep rhythm`);
        assert.equal(profile.transitionContinuity, null, `${fixture.id}: suppressed ${zone} should not keep continuity`);
        assert.equal(profile.visualWeight, null, `${fixture.id}: suppressed ${zone} should not keep weight`);
        continue;
      }

      assert.notEqual(profile.contentDensity, null, `${fixture.id}: visible ${zone} should keep density`);
      assert.notEqual(profile.microcopyIntent, null, `${fixture.id}: visible ${zone} should keep intent`);
      assert.notEqual(profile.sectionOutcome, null, `${fixture.id}: visible ${zone} should keep outcome`);
      assert.notEqual(profile.surfaceRhythm, null, `${fixture.id}: visible ${zone} should keep rhythm`);
      assert.notEqual(profile.transitionContinuity, null, `${fixture.id}: visible ${zone} should keep continuity`);
      assert.notEqual(profile.visualWeight, null, `${fixture.id}: visible ${zone} should keep weight`);

      assert.equal(profile.contentDensity, presentation.contentDensity[zone], `${fixture.id}: ${zone} density drifted`);
      assert.equal(profile.microcopyIntent, presentation.microcopyIntent[zone], `${fixture.id}: ${zone} intent drifted`);
      assert.equal(profile.sectionOutcome, presentation.sectionOutcome[zone], `${fixture.id}: ${zone} outcome drifted`);
      assert.equal(profile.surfaceRhythm, presentation.surfaceRhythm[zone], `${fixture.id}: ${zone} rhythm drifted`);
      assert.equal(profile.transitionContinuity, presentation.transitionContinuity[zone], `${fixture.id}: ${zone} continuity drifted`);
      assert.equal(profile.visualWeight, presentation.visualWeight[zone], `${fixture.id}: ${zone} weight drifted`);

      if (profile.primaryCta !== null) {
        assert.notEqual(profile.visibility, 'suppressed', `${fixture.id}: ${zone} CTA points into a suppressed zone`);
      }

      if (profile.sectionOutcome === 'commit') {
        assert.equal(zone, 'execution', `${fixture.id}: commit should only exist on execution`);
        assert.equal(profile.microcopyIntent, 'activate', `${fixture.id}: commit execution should activate`);
        assert.equal(profile.visualWeight, 'strong', `${fixture.id}: commit execution should stay strong`);
      }

      if (profile.microcopyIntent === 'activate') {
        assert.equal(profile.sectionOutcome, 'commit', `${fixture.id}: activate should not contradict understand`);
      }

      if (profile.transitionContinuity === 'advance') {
        assert.notEqual(profile.visibility, 'suppressed', `${fixture.id}: advance cannot land on a suppressed zone`);
      }
    }

    assert.deepEqual(
      getGuidanceVisibleZoneProfiles(presentation.zoneProfiles).map((profile) => profile.zone),
      ZONES.filter((zone) => presentation.zoneProfiles[zone].visibility !== 'suppressed'),
      `${fixture.id}: visible zone selector drifted`
    );
    assert.equal(
      getGuidanceDominantZoneProfile(presentation.zoneProfiles).zone,
      presentation.activeFocus.dominantZone,
      `${fixture.id}: dominant zone selector should align with active focus`
    );

    const activeCtaZone = getGuidancePrimaryCtaZoneProfile(presentation.zoneProfiles)?.zone ?? null;
    if (presentation.activeFocus.primaryCta === 'none') {
      assert.equal(activeCtaZone, null, `${fixture.id}: non-CTA state should not mark a zone CTA`);
    } else {
      assert.ok(activeCtaZone, `${fixture.id}: active primary CTA should live inside a zone profile`);
      assert.equal(
        presentation.zoneProfiles[activeCtaZone].primaryCta,
        presentation.activeFocus.primaryCta,
        `${fixture.id}: primary CTA drifted away from its zone profile`
      );
    }
  }

  const degradedFixture = createGuidanceDegradedAuthorityFixtureMatrix().find((fixture) => fixture.id === 'result_without_guidance_session');
  assert.ok(degradedFixture, 'Missing degraded zone-profile fixture');
  const degradedPresentation = presentGuidanceSession({
    state: degradedFixture.state,
    liveRawInput: degradedFixture.liveRawInput,
  });

  assert.equal(degradedPresentation.zoneProfiles.result.focusState, 'dominant', 'degraded fallback should stay result-led');
  assert.equal(degradedPresentation.zoneProfiles.result.visualWeight, 'balanced', 'degraded fallback should stay sober on result emphasis');
  assert.notEqual(degradedPresentation.zoneProfiles.trainer.focusState, 'dominant', 'degraded fallback should not make trainer dominant');

  const executionFixture = createGuidancePresentationFixtureMatrix().find((fixture) => fixture.id === 'execution_ready');
  assert.ok(executionFixture, 'Missing execution zone-profile fixture');
  const executionPresentation = presentGuidanceSession({
    state: executionFixture.state,
    liveRawInput: executionFixture.liveRawInput,
  });
  const dossierVisibility = presentGuidanceSectionVisibility({
    progressState: 'dossier_conversion_loading',
    rightRailView: executionPresentation.rightRailView,
  });
  const dossierZoneProfiles = presentGuidanceZoneProfiles({
    activeFocus: presentGuidanceActiveFocus('dossier_conversion_loading'),
    sectionVisibility: dossierVisibility,
    contentDensity: presentGuidanceContentDensity({
      progressState: 'dossier_conversion_loading',
      sectionVisibility: dossierVisibility,
    }),
    microcopyIntent: presentGuidanceMicrocopyIntent({
      progressState: 'dossier_conversion_loading',
      sectionVisibility: dossierVisibility,
    }),
    sectionOutcome: presentGuidanceSectionOutcome({
      progressState: 'dossier_conversion_loading',
      sectionVisibility: dossierVisibility,
    }),
    surfaceRhythm: presentGuidanceSurfaceRhythm({
      progressState: 'dossier_conversion_loading',
      sectionVisibility: dossierVisibility,
    }),
    transitionContinuity: presentGuidanceTransitionContinuity({
      progressState: 'dossier_conversion_loading',
      sectionVisibility: dossierVisibility,
    }),
    visualWeight: presentGuidanceVisualWeight({
      progressState: 'dossier_conversion_loading',
      sectionVisibility: dossierVisibility,
    }),
  });

  assert.equal(dossierZoneProfiles.execution.visibility, 'visible', 'dossier conversion should keep execution visible');
  assert.equal(dossierZoneProfiles.execution.focusState, 'dominant', 'dossier conversion should keep execution dominant');
  assert.equal(dossierZoneProfiles.execution.primaryCta, 'dossier_convert', 'dossier conversion should keep the dossier CTA in execution');
  assert.equal(dossierZoneProfiles.execution.sectionOutcome, 'commit', 'dossier conversion should keep commit outcome');
  assert.equal(dossierZoneProfiles.execution.microcopyIntent, 'activate', 'dossier conversion should keep activate intent');
  assert.equal(dossierZoneProfiles.execution.visualWeight, 'strong', 'dossier conversion should keep strong execution emphasis');
}

module.exports = {
  runGuidanceZoneProfilesMatrixTests,
};
