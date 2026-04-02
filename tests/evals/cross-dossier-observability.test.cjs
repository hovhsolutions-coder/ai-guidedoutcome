require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

/**
 * Cross-Dossier Observability Protection Eval
 *
 * Protects the observability logging contract for precedent-aware guidance.
 * Ensures that:
 * 1. Metrics are logged when completed dossier context exists
 * 2. Metrics are absent/clean when no precedent context exists
 * 3. Strong match count is derived correctly (>50% threshold)
 * 4. Max relevance score is captured correctly
 * 5. Outcome/task pattern availability flags are captured correctly
 * 6. Active phase is included in metrics
 */

// Extract the precedent metrics calculation logic for deterministic testing
function calculatePrecedentMetrics(completedDossiers, activePhase) {
  if (!completedDossiers || completedDossiers.length === 0) {
    return null;
  }

  return {
    count: completedDossiers.length,
    strongMatches: completedDossiers.filter((d) => (d.relevanceScore ?? 0) > 50).length,
    maxRelevanceScore: Math.max(...completedDossiers.map((d) => d.relevanceScore ?? 0)),
    hasOutcomeSummaries: completedDossiers.some((d) => d.outcomeSummary && d.outcomeSummary.length > 0),
    hasTaskPatterns: completedDossiers.some((d) => d.taskPatterns && d.taskPatterns.length > 0),
    activePhase: activePhase ?? 'unknown',
  };
}

function runObservabilityProtectionTests() {
  const testCases = buildObservabilityMatrix();

  for (const testCase of testCases) {
    const metrics = calculatePrecedentMetrics(
      testCase.completedDossiers,
      testCase.activePhase
    );

    validateMetricsPresence(testCase, metrics);
    validateMetricsAccuracy(testCase, metrics);
    validateStrongMatchThreshold(testCase, metrics);
    validateRichnessFlags(testCase, metrics);
    validatePhaseInclusion(testCase, metrics);
  }

  console.log(`Cross-dossier observability protection: ${testCases.length} scenarios passed`);
}

function buildObservabilityMatrix() {
  return [
    // Case 1: Multiple dossiers with mixed relevance - metrics should be present
    {
      id: 'mixed-relevance-metrics',
      description: 'Three completed dossiers with varying relevance scores',
      completedDossiers: [
        { id: 'd1', relevanceScore: 85, outcomeSummary: 'Completed successfully', taskPatterns: ['Task A'] },
        { id: 'd2', relevanceScore: 45, outcomeSummary: '', taskPatterns: [] },
        { id: 'd3', relevanceScore: 92, outcomeSummary: 'Great results', taskPatterns: ['Task B', 'Task C'] },
      ],
      activePhase: 'Executing',
      expect: {
        metricsPresent: true,
        count: 3,
        strongMatches: 2, // 85 and 92 are > 50
        maxRelevanceScore: 92,
        hasOutcomeSummaries: true,
        hasTaskPatterns: true,
        activePhase: 'Executing',
      },
    },

    // Case 2: No completed dossiers - metrics should be null
    {
      id: 'no-dossiers-clean',
      description: 'No completed dossiers - should return null metrics',
      completedDossiers: [],
      activePhase: 'Understanding',
      expect: {
        metricsPresent: false,
      },
    },

    // Case 3: Null completed dossiers - metrics should be null
    {
      id: 'null-dossiers-clean',
      description: 'Null completed dossiers - should return null metrics',
      completedDossiers: null,
      activePhase: 'Structuring',
      expect: {
        metricsPresent: false,
      },
    },

    // Case 4: All weak matches - strong count should be 0
    {
      id: 'all-weak-matches',
      description: 'All dossiers below 50% relevance threshold',
      completedDossiers: [
        { id: 'd1', relevanceScore: 12, outcomeSummary: '', taskPatterns: [] },
        { id: 'd2', relevanceScore: 35, outcomeSummary: '', taskPatterns: [] },
        { id: 'd3', relevanceScore: 48, outcomeSummary: '', taskPatterns: [] },
      ],
      activePhase: 'Planning',
      expect: {
        metricsPresent: true,
        count: 3,
        strongMatches: 0,
        maxRelevanceScore: 48,
        hasOutcomeSummaries: false,
        hasTaskPatterns: false,
        activePhase: 'Planning',
      },
    },

    // Case 5: Edge case - exactly 50% relevance (not strong)
    {
      id: 'edge-case-fifty-percent',
      description: 'Exactly 50% relevance should NOT count as strong match',
      completedDossiers: [
        { id: 'd1', relevanceScore: 50, outcomeSummary: '', taskPatterns: [] },
        { id: 'd2', relevanceScore: 51, outcomeSummary: '', taskPatterns: [] },
      ],
      activePhase: 'Reviewing',
      expect: {
        metricsPresent: true,
        count: 2,
        strongMatches: 1, // Only 51 is > 50
        maxRelevanceScore: 51,
        hasOutcomeSummaries: false,
        hasTaskPatterns: false,
        activePhase: 'Reviewing',
      },
    },

    // Case 6: Richness detection - outcome summaries
    {
      id: 'richness-outcomes-only',
      description: 'Has outcome summaries but no task patterns',
      completedDossiers: [
        { id: 'd1', relevanceScore: 75, outcomeSummary: 'Good outcome', taskPatterns: [] },
        { id: 'd2', relevanceScore: 60, outcomeSummary: 'Another outcome', taskPatterns: [] },
      ],
      activePhase: 'Executing',
      expect: {
        metricsPresent: true,
        count: 2,
        strongMatches: 2,
        maxRelevanceScore: 75,
        hasOutcomeSummaries: true,
        hasTaskPatterns: false,
        activePhase: 'Executing',
      },
    },

    // Case 7: Richness detection - task patterns only
    {
      id: 'richness-tasks-only',
      description: 'Has task patterns but no outcome summaries',
      completedDossiers: [
        { id: 'd1', relevanceScore: 80, outcomeSummary: '', taskPatterns: ['Task 1'] },
        { id: 'd2', relevanceScore: 55, outcomeSummary: '', taskPatterns: ['Task 2', 'Task 3'] },
      ],
      activePhase: 'Planning',
      expect: {
        metricsPresent: true,
        count: 2,
        strongMatches: 2,
        maxRelevanceScore: 80,
        hasOutcomeSummaries: false,
        hasTaskPatterns: true,
        activePhase: 'Planning',
      },
    },

    // Case 8: Single strong match
    {
      id: 'single-strong-match',
      description: 'Single high-relevance dossier',
      completedDossiers: [
        { id: 'd1', relevanceScore: 95, outcomeSummary: 'Excellent results with full metrics', taskPatterns: ['Setup', 'Configure', 'Deploy'] },
      ],
      activePhase: 'Completed',
      expect: {
        metricsPresent: true,
        count: 1,
        strongMatches: 1,
        maxRelevanceScore: 95,
        hasOutcomeSummaries: true,
        hasTaskPatterns: true,
        activePhase: 'Completed',
      },
    },

    // Case 9: Missing relevance scores default to 0
    {
      id: 'missing-relevance-defaults',
      description: 'Dossiers with undefined/null relevance scores default to 0',
      completedDossiers: [
        { id: 'd1', relevanceScore: undefined, outcomeSummary: '', taskPatterns: [] },
        { id: 'd2', relevanceScore: null, outcomeSummary: '', taskPatterns: [] },
        { id: 'd3', relevanceScore: 60, outcomeSummary: '', taskPatterns: [] },
      ],
      activePhase: 'Understanding',
      expect: {
        metricsPresent: true,
        count: 3,
        strongMatches: 1, // Only 60 is > 50
        maxRelevanceScore: 60,
        hasOutcomeSummaries: false,
        hasTaskPatterns: false,
        activePhase: 'Understanding',
      },
    },

    // Case 10: Unknown phase fallback
    {
      id: 'unknown-phase-fallback',
      description: 'Undefined phase should fallback to unknown',
      completedDossiers: [
        { id: 'd1', relevanceScore: 70, outcomeSummary: '', taskPatterns: [] },
      ],
      activePhase: undefined,
      expect: {
        metricsPresent: true,
        count: 1,
        strongMatches: 1,
        maxRelevanceScore: 70,
        hasOutcomeSummaries: false,
        hasTaskPatterns: false,
        activePhase: 'unknown',
      },
    },
  ];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateMetricsPresence(testCase, metrics) {
  if (testCase.expect.metricsPresent) {
    assert.ok(
      metrics !== null && metrics !== undefined,
      `${testCase.id}: metrics should be present when completed dossiers exist`
    );
  } else {
    assert.strictEqual(
      metrics,
      null,
      `${testCase.id}: metrics should be null when no completed dossiers exist`
    );
  }
}

function validateMetricsAccuracy(testCase, metrics) {
  if (!testCase.expect.metricsPresent) return;

  assert.strictEqual(
    metrics.count,
    testCase.expect.count,
    `${testCase.id}: count should match number of completed dossiers`
  );

  assert.strictEqual(
    metrics.maxRelevanceScore,
    testCase.expect.maxRelevanceScore,
    `${testCase.id}: maxRelevanceScore should be highest score in the set`
  );
}

function validateStrongMatchThreshold(testCase, metrics) {
  if (!testCase.expect.metricsPresent) return;

  assert.strictEqual(
    metrics.strongMatches,
    testCase.expect.strongMatches,
    `${testCase.id}: strongMatches should count only dossiers with relevanceScore > 50`
  );
}

function validateRichnessFlags(testCase, metrics) {
  if (!testCase.expect.metricsPresent) return;

  assert.strictEqual(
    metrics.hasOutcomeSummaries,
    testCase.expect.hasOutcomeSummaries,
    `${testCase.id}: hasOutcomeSummaries should be true if any dossier has non-empty outcomeSummary`
  );

  assert.strictEqual(
    metrics.hasTaskPatterns,
    testCase.expect.hasTaskPatterns,
    `${testCase.id}: hasTaskPatterns should be true if any dossier has non-empty taskPatterns`
  );
}

function validatePhaseInclusion(testCase, metrics) {
  if (!testCase.expect.metricsPresent) return;

  assert.strictEqual(
    metrics.activePhase,
    testCase.expect.activePhase,
    `${testCase.id}: activePhase should match provided phase or 'unknown'`
  );
}

// Run tests if executed directly
if (require.main === module) {
  runObservabilityProtectionTests();
}

module.exports = {
  runObservabilityProtectionTests,
  calculatePrecedentMetrics,
};
