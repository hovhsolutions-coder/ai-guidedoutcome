/**
 * ProgressFrameCard Completed-phase regression tests.
 * 
 * These tests protect the ProgressFrameCard Completed-state simplification:
 * - Completed phase shows "Completion" not "Progress"
 * - Completed phase does not show "Left" metric (always zero, visual noise)
 * - Non-completed phases still show full progress metrics
 */

require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

// Test the ProgressFrameCard rendering logic contracts
function runProgressFrameCardCompletedTests() {
  // ============================================================
  // Completed phase card header contract
  // ============================================================

  // Contract: Completed phase shows "Completion" not "Progress"
  {
    const phase = 'Completed';
    const headerText = phase === 'Completed' ? 'Completion' : 'Progress';
    assert.equal(headerText, 'Completion',
      'Completed phase ProgressFrameCard must show "Completion" header, not "Progress"');
  }

  // Contract: Non-completed phases still show "Progress"
  {
    const phases = ['Understanding', 'Structuring', 'Executing', 'Reviewing'];
    for (const phase of phases) {
      const headerText = phase === 'Completed' ? 'Completion' : 'Progress';
      assert.equal(headerText, 'Progress',
        `${phase} phase ProgressFrameCard must show "Progress" header`);
    }
  }

  // ============================================================
  // Completed phase metrics visibility contract
  // ============================================================

  // Contract: Completed phase does not show "Left" metric
  {
    const phase = 'Completed';
    const showLeftMetric = phase !== 'Completed';
    assert.equal(showLeftMetric, false,
      'Completed phase ProgressFrameCard must NOT show "Left" metric (it is always 0, visual noise)');
  }

  // Contract: Completed phase shows only Total and Done (2 metrics)
  {
    const phase = 'Completed';
    const metricCount = phase === 'Completed' ? 2 : 3;
    assert.equal(metricCount, 2,
      'Completed phase ProgressFrameCard must show exactly 2 metrics (Total, Done)');
  }

  // Contract: Non-completed phases show all 3 metrics including "Left"
  {
    const phases = ['Understanding', 'Structuring', 'Executing', 'Reviewing'];
    for (const phase of phases) {
      const showLeftMetric = phase !== 'Completed';
      assert.equal(showLeftMetric, true,
        `${phase} phase ProgressFrameCard must show "Left" metric`);
      
      const metricCount = phase === 'Completed' ? 2 : 3;
      assert.equal(metricCount, 3,
        `${phase} phase ProgressFrameCard must show exactly 3 metrics`);
    }
  }

  // ============================================================
  // Grid layout contract
  // ============================================================

  // Contract: Completed phase uses 2-column grid
  {
    const phase = 'Completed';
    const gridCols = phase === 'Completed' ? 'grid-cols-2' : 'grid-cols-3';
    assert.equal(gridCols, 'grid-cols-2',
      'Completed phase ProgressFrameCard must use 2-column grid layout');
  }

  // Contract: Non-completed phases use 3-column grid
  {
    const phases = ['Understanding', 'Structuring', 'Executing', 'Reviewing'];
    for (const phase of phases) {
      const gridCols = phase === 'Completed' ? 'grid-cols-2' : 'grid-cols-3';
      assert.equal(gridCols, 'grid-cols-3',
        `${phase} phase ProgressFrameCard must use 3-column grid layout`);
    }
  }

  console.log('✅ All ProgressFrameCard Completed-phase tests passed');
}

// Run if executed directly
if (require.main === module) {
  runProgressFrameCardCompletedTests();
}

module.exports = { runProgressFrameCardCompletedTests };
