require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const {
  buildGuidanceSessionPresentationPipeline,
  presentGuidanceSession,
  presentGuidanceSessionForProgressStateOverride,
} = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresenterContractSnapshotMatrix } = require('./guidance-presenter-contract-snapshots.ts');
const { toGuidancePresenterContractSnapshot } = require('./guidance-presenter-contract-snapshot-helper.cjs');

function runGuidancePresenterContractSnapshotTests() {
  const fixtures = createGuidancePresenterContractSnapshotMatrix();

  for (const fixture of fixtures) {
    const actualPresentation = fixture.progressOverride
      ? buildOverridePresentation(fixture)
      : presentGuidanceSession({
        state: fixture.state,
        liveRawInput: fixture.liveRawInput,
      });

    const actualSnapshot = toGuidancePresenterContractSnapshot(actualPresentation);

    assert.deepEqual(actualSnapshot, fixture.expected, `${fixture.id}: presenter contract snapshot drifted`);
  }

  const dossierFixture = fixtures.find((fixture) => fixture.id === 'dossier_conversion_loading');
  assert.ok(dossierFixture, 'Missing dossier conversion snapshot fixture');
  const dossierPipeline = buildGuidanceSessionPresentationPipeline({
    state: dossierFixture.state,
    liveRawInput: dossierFixture.liveRawInput,
  });
  const dossierOverridePresentation = presentGuidanceSessionForProgressStateOverride({
    baseState: dossierPipeline.baseState,
    progressState: 'dossier_conversion_loading',
  });

  assert.deepEqual(
    toGuidancePresenterContractSnapshot(dossierOverridePresentation),
    dossierFixture.expected,
    'dossier conversion snapshot should come from the same override pipeline'
  );

  const degradedFixture = fixtures.find((fixture) => fixture.id === 'degraded_result_fallback');
  assert.ok(degradedFixture, 'Missing degraded snapshot fixture');
  assert.equal(degradedFixture.expected.activeFocus.dominantZone, 'result');
  assert.equal(degradedFixture.expected.surfaceVariant, 'degraded_understand_surface');
  assert.equal(degradedFixture.expected.zoneProfiles.result.visualWeight, 'balanced');
}

function buildOverridePresentation(fixture) {
  const pipeline = buildGuidanceSessionPresentationPipeline({
    state: fixture.state,
    liveRawInput: fixture.liveRawInput,
  });

  return presentGuidanceSessionForProgressStateOverride({
    baseState: pipeline.baseState,
    progressState: fixture.progressOverride,
  });
}

module.exports = {
  runGuidancePresenterContractSnapshotTests,
};
