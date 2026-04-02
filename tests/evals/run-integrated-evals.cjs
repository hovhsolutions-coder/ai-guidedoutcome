/**
 * Integrated Eval Test Runner
 *
 * Runs all deterministic eval protections in a single pass:
 * - Completed-phase presenter tests
 * - Cross-dossier data shaping tests
 * - Cross-dossier precedent quality tests
 * - Cross-dossier usefulness tests
 * - Cross-dossier observability tests
 *
 * This integrates the shipped eval protections into the normal quality gate
 * so they run automatically with `npm run test` and `npm run auto`.
 */

const { runCompletedPhasePresenterTests } = require('./completed-phase-presenter.test.cjs');
const { runProgressFrameCardCompletedTests } = require('./progress-frame-card-completed.test.cjs');
const { runCrossDossierDataShapingTests } = require('./cross-dossier-data-shaping.test.cjs');
const { runCrossDossierPrecedentTests } = require('./cross-dossier-precedent-quality.test.cjs');
const { runCrossDossierUsefulnessTests } = require('./cross-dossier-usefulness.test.cjs');
const { runObservabilityProtectionTests } = require('./cross-dossier-observability.test.cjs');

function runAllEvalTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Running Integrated Eval Protections');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const startTime = Date.now();

  // 1. Completed-phase presenter tests
  console.log('1. Completed-phase presenter tests...');
  runCompletedPhasePresenterTests();
  console.log('   ✅ Passed\n');

  // 2. ProgressFrameCard Completed-phase tests
  console.log('2. ProgressFrameCard Completed-phase tests...');
  runProgressFrameCardCompletedTests();
  console.log('   ✅ Passed\n');

  // 3. Cross-dossier data shaping tests
  console.log('3. Cross-dossier data shaping tests...');
  runCrossDossierDataShapingTests();
  console.log('   ✅ Passed\n');

  // 4. Cross-dossier precedent quality tests
  console.log('4. Cross-dossier precedent quality tests...');
  runCrossDossierPrecedentTests();
  console.log('   ✅ Passed\n');

  // 5. Cross-dossier usefulness tests
  console.log('5. Cross-dossier usefulness tests...');
  runCrossDossierUsefulnessTests();
  console.log('   ✅ Passed\n');

  // 6. Cross-dossier observability tests
  console.log('6. Cross-dossier observability tests...');
  runObservabilityProtectionTests();
  console.log('   ✅ Passed\n');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ All eval protections passed (${duration}s)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run if executed directly
if (require.main === module) {
  try {
    runAllEvalTests();
  } catch (error) {
    console.error('\n❌ Eval tests failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { runAllEvalTests };
