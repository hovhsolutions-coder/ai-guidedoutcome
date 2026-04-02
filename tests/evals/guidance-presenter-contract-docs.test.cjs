require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  GUIDANCE_SESSION_PRESENTATION_PIPELINE_STEPS,
} = require('../../src/components/guidance/guidance-session-presenter.ts');
const { createGuidancePresenterContractSnapshotMatrix } = require('./guidance-presenter-contract-snapshots.ts');

const DOC_PATH = path.resolve(__dirname, '../../src/components/guidance/guidance-presenter-contracts.md');

function runGuidancePresenterContractDocsTests() {
  const doc = fs.readFileSync(DOC_PATH, 'utf8');
  const snapshotStates = createGuidancePresenterContractSnapshotMatrix().map((fixture) => fixture.id);

  for (const step of GUIDANCE_SESSION_PRESENTATION_PIPELINE_STEPS) {
    assert.match(doc, new RegExp('`' + escapeRegExp(step) + '`'), `docs: missing pipeline step ${step}`);
  }

  for (const stateId of snapshotStates) {
    assert.match(doc, new RegExp('`' + escapeRegExp(stateId) + '`'), `docs: missing snapshot state ${stateId}`);
  }

  const requiredFieldNames = [
    'progressMessage',
    'rightRailProfile',
    'activeFocus',
    'sectionVisibility',
    'zoneProfiles',
    'surfaceVariant',
  ];

  for (const fieldName of requiredFieldNames) {
    assert.match(doc, new RegExp('`' + escapeRegExp(fieldName) + '`'), `docs: missing contract field ${fieldName}`);
  }

  const requiredWhySections = [
    '`zoneProfiles` exists',
    '`surfaceVariant` exists',
    '`rightRailProfile` exists',
    '`finalInvariantNormalization` exists',
    'snapshot contract scope exists',
  ];

  for (const marker of requiredWhySections) {
    assert.match(doc, new RegExp(escapeRegExp(marker)), `docs: missing rationale marker ${marker}`);
  }

  for (const marker of [
    'Preferred shell consumer path',
    'Compatibility-only or test-facing fields',
    'dominant zone',
    'CTA-owning zone',
    'progress context',
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(marker)), `docs: missing consumer-path marker ${marker}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  runGuidancePresenterContractDocsTests,
};
