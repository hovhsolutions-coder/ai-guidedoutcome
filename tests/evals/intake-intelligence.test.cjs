require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildGuidanceRequest } = require('../../src/lib/ai/build-guidance-request.ts');

function runIntakeIntelligenceTests() {
  const planningRequest = buildGuidanceRequest({
    raw_input: 'Need help with this.',
    main_goal: 'Build the onboarding rollout plan and sequence the milestones.',
    intakeAnswers: {
      timeline: 'Launch starts next month and the milestones need to be mapped this week.',
      resources: 'Two PMs and one engineer are available.',
      constraints: 'The checklist has to be documented for the support team.',
    },
  });

  assert.equal(
    planningRequest.detectedDomain,
    'planning',
    'cross-field planning signals should improve first-pass planning detection'
  );
  assert.equal(
    planningRequest.activeMode,
    'planning',
    'cross-field planning signals should improve first-pass mode resolution'
  );
  assert.equal(
    planningRequest.shouldOfferDossier,
    true,
    'planning-oriented structured intake should still keep dossier-worthiness'
  );

  const lowInfoRequest = buildGuidanceRequest({
    raw_input: 'Need help.',
    main_goal: 'Help',
    intakeAnswers: {
      context_window: 'Soon',
    },
  });

  assert.equal(
    lowInfoRequest.detectedDomain,
    'problem_solving',
    'low-information intake should not over-infer a stronger domain from weak supporting text'
  );
  assert.equal(
    lowInfoRequest.activeMode,
    'problem_solver',
    'low-information intake should preserve the existing lightweight fallback mode'
  );
  assert.equal(
    lowInfoRequest.shouldOfferDossier,
    false,
    'low-information intake should not inflate dossier-worthiness'
  );

  const conflictRequest = buildGuidanceRequest({
    raw_input: 'Need help with this.',
    main_goal: 'Repair the vendor relationship without escalating the conflict.',
    intakeAnswers: {
      other_party: 'Vendor account team',
      desired_outcome: 'Reset trust and get aligned on the next conversation.',
      stakes: 'If this goes badly, the relationship gets worse.',
    },
  });

  assert.equal(
    conflictRequest.detectedDomain,
    'conflict',
    'cross-field conflict evidence should influence first-pass conflict detection'
  );
  assert.equal(
    conflictRequest.activeMode,
    'conflict',
    'cross-field conflict evidence should influence first-pass mode resolution'
  );

  const executionRequest = buildGuidanceRequest({
    raw_input: 'Need help with this launch.',
    main_goal: 'Unblock the launch and get the approval path moving today.',
    intakeAnswers: {
      blocker: 'Legal approval is blocking the handoff.',
      impact: 'Shipping stays blocked if we do not move this today.',
      attempted: 'We already drafted the update and tried to unblock it manually.',
    },
  });

  assert.equal(
    executionRequest.detectedDomain,
    'problem_solving',
    'blocker and execution evidence should influence first-pass problem-solving detection'
  );
  assert.equal(
    executionRequest.activeMode,
    'problem_solver',
    'blocker and execution evidence should influence first-pass mode resolution'
  );
  assert.equal(
    executionRequest.input.detectedDomain,
    executionRequest.detectedDomain,
    'request shaping should stay aligned with improved session detection'
  );
}

module.exports = {
  runIntakeIntelligenceTests,
};
