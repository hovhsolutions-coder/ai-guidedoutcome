require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

/**
 * Cross-Dossier Data-Shaping Deterministic Tests
 *
 * Protects the deterministic cross-dossier data-shaping layer:
 * - Relevance scoring and ranking
 * - Outcome summary derivation
 * - Task pattern extraction
 *
 * These tests ensure future changes cannot silently:
 * - Select weak dossiers over stronger matches
 * - Degrade outcome summaries into low-value/generic strings
 * - Bloat or flatten task pattern extraction
 */

const {
  calculateRelevanceScore,
  deriveOutcomeSummary,
  extractTaskPatterns,
  normalizeText,
  extractSignificantWords,
} = require('../../src/lib/db/dossier-store.ts');

function runCrossDossierDataShapingTests() {
  // Test 1: Relevance Scoring - Perfect match
  testRelevanceScoring();

  // Test 2: Relevance Scoring - No match
  testNoMatchScoring();

  // Test 3: Relevance Scoring - Partial match
  testPartialMatchScoring();

  // Test 4: Relevance Scoring - Word boundary handling
  testWordBoundaryScoring();

  // Test 5: Outcome Summary - Full data
  testOutcomeSummaryFull();

  // Test 6: Outcome Summary - No activity entries
  testOutcomeSummaryNoActivities();

  // Test 7: Outcome Summary - Truncation
  testOutcomeSummaryTruncation();

  // Test 8: Outcome Summary - Empty/minimal
  testOutcomeSummaryMinimal();

  // Test 9: Task Pattern Extraction - Basic
  testTaskPatternExtraction();

  // Test 10: Task Pattern Extraction - Deduplication
  testTaskPatternDeduplication();

  // Test 11: Task Pattern Extraction - Limit enforcement
  testTaskPatternLimit();

  // Test 12: Text Normalization
  testTextNormalization();

  // Test 13: Significant Words - Stop word filtering
  testSignificantWordsFiltering();

  console.log('Cross-dossier data-shaping: 13 test scenarios passed');
}

// ============================================================================
// RELEVANCE SCORING TESTS
// ============================================================================

function testRelevanceScoring() {
  // Perfect match should give high score (100% word overlap = 70 + 30 = 100)
  const score = calculateRelevanceScore(
    { title: 'API Migration', mainGoal: 'Migrate legacy API to new system' },
    { title: 'API Migration', mainGoal: 'Migrate legacy API to new system' }
  );

  assert.equal(score, 100, 'Perfect match should score 100');
}

function testNoMatchScoring() {
  // No overlapping words should give 0
  const score = calculateRelevanceScore(
    { title: 'Garden Planning', mainGoal: 'Design vegetable garden layout' },
    { title: 'API Migration', mainGoal: 'Migrate legacy API to new system' }
  );

  assert.equal(score, 0, 'No matching words should score 0');
}

function testPartialMatchScoring() {
  // Partial overlap - "migration" and "API" match
  const score = calculateRelevanceScore(
    { title: 'Database Migration', mainGoal: 'Migrate database to cloud' },
    { title: 'API Migration', mainGoal: 'Migrate legacy API to new system' }
  );

  // Should have some score from "migration" overlap (stop word filtering applies)
  // But "database" vs "api" and "cloud" vs "legacy/new/system" reduces overlap
  assert.ok(score >= 0 && score <= 70, 'Partial match should give moderate score');
}

function testWordBoundaryScoring() {
  // Test that word boundaries work correctly
  const score = calculateRelevanceScore(
    { title: 'Payment Gateway Integration', mainGoal: 'Integrate Stripe payment gateway' },
    { title: 'Payment Gateway Integration', mainGoal: 'Integrate Stripe payment gateway' }
  );

  assert.equal(score, 100, 'Identical dossiers should score 100');
}

// ============================================================================
// OUTCOME SUMMARY TESTS
// ============================================================================

function testOutcomeSummaryFull() {
  const summary = deriveOutcomeSummary({
    tasks: [
      { completed: true, actualTime: 120, priority: 'high' },
      { completed: true, actualTime: 90, priority: 'medium' },
      { completed: false, actualTime: 0, priority: 'low' },
    ],
    lastActivity: 'Deployed to production',
    activityEntries: [
      { type: 'milestone_reached', description: 'Successfully deployed with zero downtime' },
    ],
  });

  assert.ok(summary.includes('2/3 tasks completed'), 'Should show task completion stats');
  assert.ok(summary.includes('3h 30m invested') || summary.includes('210m invested'), 'Should show time invested');
  assert.ok(summary.includes('Outcome:'), 'Should include outcome from activity entry');
  assert.ok(summary.includes('zero downtime'), 'Should include key outcome detail');
}

function testOutcomeSummaryNoActivities() {
  const summary = deriveOutcomeSummary({
    tasks: [
      { completed: true, actualTime: 60, priority: 'high' },
    ],
    lastActivity: 'Final review completed',
    activityEntries: [],
  });

  assert.ok(summary.includes('1/1 tasks completed'), 'Should show task completion');
  assert.ok(summary.includes('1h invested') || summary.includes('60m invested'), 'Should show time');
  assert.ok(summary.includes('Completed:') && summary.includes('Final review'), 'Should fallback to lastActivity');
}

function testOutcomeSummaryTruncation() {
  const longDescription = 'A'.repeat(100);
  const summary = deriveOutcomeSummary({
    tasks: [{ completed: true, actualTime: 0, priority: 'high' }],
    lastActivity: 'Done',
    activityEntries: [
      { type: 'completed', description: longDescription },
    ],
  });

  assert.ok(summary.includes('...'), 'Long descriptions should be truncated');
  assert.ok(!summary.includes('A'.repeat(70)), 'Truncation should limit description length');
}

function testOutcomeSummaryMinimal() {
  const summary = deriveOutcomeSummary({
    tasks: [],
    lastActivity: 'Dossier created',
    activityEntries: [],
  });

  // Should handle empty/minimal case gracefully
  assert.equal(typeof summary, 'string', 'Should return string even for empty input');
  assert.ok(!summary.includes('undefined'), 'Should not contain undefined values');
}

// ============================================================================
// TASK PATTERN EXTRACTION TESTS
// ============================================================================

function testTaskPatternExtraction() {
  const patterns = extractTaskPatterns([
    { name: 'Design database schema', completed: true, priority: 'high' },
    { name: 'Set up API endpoints', completed: true, priority: 'high' },
    { name: 'Write documentation', completed: false, priority: 'medium' },
  ]);

  assert.ok(patterns.includes('Design database schema'), 'Should include first task');
  assert.ok(patterns.includes('Set up API endpoints'), 'Should include second task');
  assert.ok(patterns.includes('Write documentation'), 'Should include third task');
}

function testTaskPatternDeduplication() {
  const patterns = extractTaskPatterns([
    { name: 'Test the API', completed: true, priority: 'high' },
    { name: 'Test the API', completed: true, priority: 'medium' }, // Duplicate
    { name: 'Deploy to staging', completed: true, priority: 'high' },
  ]);

  const testApiCount = patterns.filter((p) => p === 'Test the API').length;
  assert.equal(testApiCount, 1, 'Should deduplicate repeated task names');
}

function testTaskPatternLimit() {
  const manyTasks = Array(10)
    .fill(null)
    .map((_, i) => ({
      name: `Task ${i + 1}`,
      completed: true,
      priority: 'medium',
    }));

  const patterns = extractTaskPatterns(manyTasks);

  assert.ok(patterns.length <= 5, 'Should limit to maximum 5 task patterns');
}

// ============================================================================
// TEXT PROCESSING TESTS
// ============================================================================

function testTextNormalization() {
  // Test punctuation removal
  assert.equal(
    normalizeText('API, Migration! (v2)'),
    'api migration v2',
    'Should remove punctuation and lowercase'
  );

  // Test whitespace normalization
  assert.equal(
    normalizeText('Multiple   Spaces\tHere'),
    'multiple spaces here',
    'Should normalize whitespace'
  );
}

function testSignificantWordsFiltering() {
  // Test stop word removal
  const words = extractSignificantWords('the and for api migration with database');

  assert.ok(!words.includes('the'), 'Should filter stop words');
  assert.ok(!words.includes('and'), 'Should filter stop words');
  assert.ok(!words.includes('for'), 'Should filter stop words');
  assert.ok(words.includes('api'), 'Should keep significant words');
  assert.ok(words.includes('migration'), 'Should keep significant words');
  assert.ok(words.includes('database'), 'Should keep significant words');

  // Test short word filtering
  const shortWords = extractSignificantWords('ab cd api');
  assert.ok(!shortWords.includes('ab'), 'Should filter words under 3 chars');
  assert.ok(!shortWords.includes('cd'), 'Should filter words under 3 chars');
  assert.ok(shortWords.includes('api'), 'Should keep 3+ char words');
}

// Run tests if executed directly
if (require.main === module) {
  runCrossDossierDataShapingTests();
}

module.exports = { runCrossDossierDataShapingTests };
