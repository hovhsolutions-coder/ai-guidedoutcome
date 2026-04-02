const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SECTION_FILES = [
  'src/components/guidance/universal-intake.tsx',
  'src/components/guidance/mode-intake-form.tsx',
  'src/components/guidance/guidance-onboarding-shell.tsx',
  'src/components/guidance/guidance-result-panel.tsx',
  'src/components/guidance/guidance-trainer-section.tsx',
  'src/components/guidance/guidance-execution-ready-section.tsx',
];

function runGuidanceSectionApiSimplificationTests() {
  for (const relativePath of SECTION_FILES) {
    const absolutePath = path.join(process.cwd(), relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');

    assert.match(
      source,
      /zoneProfile: GuidanceZoneProfile;/,
      `${relativePath}: section should require a zoneProfile`
    );

    for (const removedProp of ['density?:', 'intent?:', 'outcome?:', 'rhythm?:', 'continuity?:', 'weight?:']) {
      assert.doesNotMatch(
        source,
        new RegExp(removedProp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `${relativePath}: legacy ${removedProp.slice(0, -2)} prop should be removed from the section API`
      );
    }
  }

  const shellSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/guidance/guidance-session-shell.tsx'),
    'utf8'
  );

  assert.match(
    shellSource,
    /<GuidanceResultPanel\s+section=\{rightRailView\.result\}\s+zoneProfile=\{zoneProfiles\.result\}/,
    'shell should pass the compact result section payload plus the result zone profile'
  );
}

module.exports = {
  runGuidanceSectionApiSimplificationTests,
};
