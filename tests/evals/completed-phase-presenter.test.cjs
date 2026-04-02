/**
 * Presenter-level regression tests for Completed-phase objective/CTA logic and detail-page card behavior.
 * 
 * These tests provide fast, deterministic coverage for the post-close-out
 * detail-state contracts. They complement the E2E tests by catching regressions
 * earlier without requiring full page rendering.
 */

require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const {
  getCurrentObjective,
  getPrimaryCtaLabel,
  getThirdSlotContent,
} = require('../../components/dossiers/DossierDetailClient.tsx');

function runCompletedPhasePresenterTests() {
  // ============================================================
  // getPrimaryCtaLabel() contracts
  // ============================================================

  // Contract: Completed phase returns "Review record" not "Keep going"
  {
    const label = getPrimaryCtaLabel(true, true, 'Completed');
    assert.equal(label, 'Review record', 
      'Completed phase must show "Review record" CTA, not active-work language');
  }

  // Contract: Completed phase returns "Review record" even without completed tasks
  // (edge case: empty completed dossier)
  {
    const label = getPrimaryCtaLabel(false, false, 'Completed');
    assert.equal(label, 'Review record',
      'Completed phase must show "Review record" regardless of task state');
  }

  // Contract: Non-completed phases still work correctly
  {
    assert.equal(getPrimaryCtaLabel(false, false, 'Executing'), 'Define first action');
    assert.equal(getPrimaryCtaLabel(true, false, 'Executing'), 'Start now');
    assert.equal(getPrimaryCtaLabel(true, true, 'Executing'), 'Keep going');
  }

  // ============================================================
  // getCurrentObjective() contracts
  // ============================================================

  // Contract: Completed phase returns reference/review framing, not active-work
  {
    const result = getCurrentObjective({
      phase: 'Completed',
      tasks: [
        { name: 'Task 1', completed: true },
        { name: 'Task 2', completed: true },
      ],
      completedCount: 2,
      guidanceNextStep: null,
      fallbackNextStep: 'All tasks done',
    });

    assert.equal(result.focusBadge, 'Review record',
      'Completed phase focusBadge must be "Review record", not "Momentum focus"');
    assert.equal(result.statusLine, 'All work completed. Review the record below to capture outcomes or reference for future work.',
      'Completed phase statusLine must reference record/review language');
    assert.equal(result.progressLine, 'This dossier is now a completed reference. Browse tasks, activity history, and outcomes.',
      'Completed phase progressLine must reflect reference state');
  }

  // Contract: Completed phase does NOT return "Momentum focus" badge
  {
    const result = getCurrentObjective({
      phase: 'Completed',
      tasks: [{ name: 'Task 1', completed: true }],
      completedCount: 1,
      guidanceNextStep: null,
      fallbackNextStep: 'Done',
    });

    assert.notEqual(result.focusBadge, 'Momentum focus',
      'Completed phase must NOT show "Momentum focus" (that is active-work framing)');
    assert.notEqual(result.focusBadge, 'Primary focus',
      'Completed phase must NOT show "Primary focus" (that is for unstarted work)');
    assert.notEqual(result.focusBadge, 'Start here',
      'Completed phase must NOT show "Start here" (that is for empty task lists)');
  }

  // Contract: Executing phase with completed tasks returns active-work framing
  // (ensuring we didn't break the non-Completed behavior)
  {
    const result = getCurrentObjective({
      phase: 'Executing',
      tasks: [
        { name: 'Task 1', completed: true },
        { name: 'Task 2', completed: false },
      ],
      completedCount: 1,
      guidanceNextStep: null,
      fallbackNextStep: 'Continue',
    });

    assert.equal(result.focusBadge, 'Momentum focus',
      'Executing phase with completed tasks must show "Momentum focus"');
  }

  // Contract: Empty task list in non-Completed phase returns "Start here"
  {
    const result = getCurrentObjective({
      phase: 'Structuring',
      tasks: [],
      completedCount: 0,
      guidanceNextStep: null,
      fallbackNextStep: 'Begin',
    });

    assert.equal(result.focusBadge, 'Start here',
      'Empty task list in Structuring phase must show "Start here"');
  }

  // Contract: Zero completed tasks in non-Completed phase returns "Primary focus"
  {
    const result = getCurrentObjective({
      phase: 'Understanding',
      tasks: [{ name: 'Task 1', completed: false }],
      completedCount: 0,
      guidanceNextStep: null,
      fallbackNextStep: 'First step',
    });

    assert.equal(result.focusBadge, 'Primary focus',
      'Zero completed tasks in Understanding phase must show "Primary focus"');
  }

  // ============================================================
  // getThirdSlotContent() contracts - Completed-phase third-slot removal
  // ============================================================

  // Contract: Completed phase returns null for third slot (no Momentum signal)
  {
    const thirdSlot = getThirdSlotContent(null, 'Completed');
    assert.equal(thirdSlot, null,
      'Completed phase must NOT show fallback Momentum signal card');
  }

  // Contract: Completed phase does not show "Momentum signal" text
  {
    const thirdSlot = getThirdSlotContent(null, 'Completed');
    assert.notEqual(thirdSlot, 'momentum',
      'Completed phase must NOT show "Momentum signal" language');
  }

  // Contract: Non-completed phases show Momentum signal when no blockerState
  {
    const thirdSlot = getThirdSlotContent(null, 'Executing');
    assert.equal(thirdSlot, 'momentum',
      'Non-Completed phases must show Momentum signal fallback when no blockers');
  }

  // Contract: BlockersCard shown in non-completed phases when blockerState exists
  {
    const mockBlockerState = { title: 'Test Blocker', description: 'Test description' };
    const thirdSlot = getThirdSlotContent(mockBlockerState, 'Executing');
    assert.equal(thirdSlot, 'blocker',
      'Non-Completed phases must show BlockersCard when blockerState exists');
  }

  // Contract: BlockersCard shown even in Completed phase if blockerState exists (edge case)
  {
    const mockBlockerState = { title: 'Legacy Blocker', description: 'Historical' };
    const thirdSlot = getThirdSlotContent(mockBlockerState, 'Completed');
    assert.equal(thirdSlot, 'blocker',
      'Completed phase must show BlockersCard if blockerState exists (edge case)');
  }

  console.log('✅ All Completed-phase presenter tests passed');
}

// Run if executed directly
if (require.main === module) {
  runCompletedPhasePresenterTests();
}

module.exports = { runCompletedPhasePresenterTests };
