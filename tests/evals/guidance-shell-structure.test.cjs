const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function runGuidanceShellStructureTests() {
  const shellPath = path.join(process.cwd(), 'src/components/guidance/guidance-session-shell.tsx');
  const source = fs.readFileSync(shellPath, 'utf8');

  assert.match(
    source,
    /const \{ intake, progressMessage, surfaceVariant, rightRailProfile, zoneProfiles, rightRailView \} = presentation;/,
    'shell should read its top-level render inputs from the final presenter output'
  );
  assert.match(
    source,
    /deriveGuidanceProgressContext\(zoneProfiles, surfaceVariant\)/,
    'shell should derive progress context from zone profiles plus the final surface variant'
  );
  assert.match(
    source,
    /getGuidancePrimaryCtaZoneProfile\(zoneProfiles\)/,
    'shell should derive CTA ownership from zone profiles instead of loose focus state'
  );
  assert.match(
    source,
    /getGuidanceProgressMotionTimingProfile\(/,
    'shell should derive progress timing from final presenter signals instead of ad hoc state branches'
  );
  assert.match(
    source,
    /getGuidanceZoneMotionTimingProfile\(/,
    'shell should derive zone timing from final presenter signals instead of local timing state'
  );
  assert.match(
    source,
    /isGuidanceZoneBusy\(/,
    'shell should derive busy semantics from the shared guidance semantic helper'
  );
  assert.match(
    source,
    /getGuidanceZoneAriaLabel\(/,
    'shell should derive zone accessibility labels from the shared semantic helper'
  );
  assert.match(
    source,
    /GUIDANCE_PROGRESS_MESSAGE_ID/,
    'shell should use the shared progress message id instead of ad hoc aria wiring'
  );
  assert.match(
    source,
    /function GuidanceZoneSurface\(/,
    'shell should centralize zone wrapper composition in one helper'
  );
  assert.match(
    source,
    /presentGuidanceSessionForProgressStateOverride/,
    'dossier conversion should continue to run through the same presenter override pipeline'
  );

  for (const zone of ['intake', 'onboarding', 'result', 'trainer', 'execution']) {
    assert.match(
      source,
      new RegExp(`zoneProfile=\\{zoneProfiles\\.${zone}\\}`),
      `${zone} section should consume its zone profile directly`
    );
  }

  for (const forbiddenReference of [
    'presentation.activeFocus',
    'presentation.sectionVisibility',
    'presentation.contentDensity',
    'presentation.microcopyIntent',
    'presentation.sectionOutcome',
    'presentation.surfaceRhythm',
    'presentation.transitionContinuity',
    'presentation.visualWeight',
  ]) {
    assert.doesNotMatch(
      source,
      new RegExp(forbiddenReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `shell should not re-read ${forbiddenReference} once zone profiles are available`
    );
  }

  assert.doesNotMatch(
    source,
    /\bactiveFocus\b/,
    'shell should not read the legacy activeFocus field once zone-profile selectors are available'
  );

  for (const [propName, loosePropPattern] of [
    ['density', /\sdensity=\{/],
    ['intent', /\sintent=\{/],
    ['outcome', /\soutcome=\{/],
    ['rhythm', /\srhythm=\{/],
    ['continuity', /\scontinuity=\{/],
    ['weight', /\sweight=\{/],
  ]) {
    assert.doesNotMatch(
      source,
      loosePropPattern,
      `shell should not pass loose ${propName} props into sections`
    );
  }

  assert.doesNotMatch(
    source,
    /data-guidance-right-rail-variant=|getRightRailClassName\(surfaceVariant\)|getProgressBlockClassName\(surfaceVariant\)/,
    'shell should no longer derive right-rail framing directly from surfaceVariant'
  );
  assert.match(
    source,
    /guidanceSession=\{rightRailView\.executionSession\}/,
    'execution section should read its own right-rail carrier instead of reusing onboarding state'
  );
}

module.exports = {
  runGuidanceShellStructureTests,
};
