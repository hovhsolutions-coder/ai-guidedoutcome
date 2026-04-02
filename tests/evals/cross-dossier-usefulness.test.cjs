require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildGuidancePrompt } = require('../../src/lib/ai/prompt-builder.ts');

/**
 * Cross-Dossier Guidance Usefulness Eval
 *
 * Measures and protects the practical usefulness of cross-dossier guidance.
 * Ensures that:
 * 1. Strong precedent makes guidance more specific/actionable
 * 2. Weak precedent keeps guidance direct without generic noise
 * 3. Precedent improves operational advice rather than distracting
 * 4. Completed dossiers remain reference-only in guidance framing
 */

function runCrossDossierUsefulnessTests() {
  const testCases = buildUsefulnessMatrix();

  for (const testCase of testCases) {
    const prompt = buildGuidancePrompt(testCase.input);

    // Validate prompt structure and precedent handling
    validatePrecedentInclusion(testCase, prompt);
    validateSpecificityImprovement(testCase, prompt);
    validateOperationalValue(testCase, prompt);
    validateNoGenericNoise(testCase, prompt);
    validateReferenceOnlyFraming(testCase, prompt);
  }

  console.log(`Cross-dossier usefulness: ${testCases.length} scenarios passed`);
}

function buildUsefulnessMatrix() {
  return [
    // Case 1: Strong precedent (high relevance) - should include rich context
    {
      id: 'strong-precedent-api-migration',
      description: 'Active API migration with strong precedent from similar completed work',
      input: {
        action: 'guidance',
        situation: 'Migrating our payment API from legacy system to new microservices architecture',
        main_goal: 'Complete API migration with zero downtime and full data integrity',
        phase: 'Structuring',
        tasks: ['Design new API contracts', 'Set up database replication', 'Plan cutover strategy'],
        completedDossiers: [
          {
            id: 'dossier-1',
            title: 'Previous API Migration - Billing Service',
            main_goal: 'Migrated billing API to microservices with zero downtime',
            relevanceScore: 87,
            outcomeSummary: '10/12 tasks completed • 8h invested • Outcome: zero-downtime migration with 100% data integrity',
            taskPatterns: ['Database replication setup', 'API contract validation', 'Staging environment testing', 'Blue-green deployment', 'Data integrity verification'],
          },
        ],
        triggerType: 'manual',
      },
      expect: {
        includesPrecedentContext: true,
        showsHighRelevance: true,
        includesTaskPatterns: true,
        includesOutcomeSummary: true,
        referenceOnly: true,
      },
    },

    // Case 2: Weak precedent (low relevance) - should minimize or exclude context
    {
      id: 'weak-precedent-party-planning',
      description: 'Party planning with irrelevant API migration precedent',
      input: {
        action: 'guidance',
        situation: 'Planning the company holiday party and team celebration',
        main_goal: 'Organize a memorable team event within budget',
        phase: 'Understanding',
        tasks: [],
        completedDossiers: [
          {
            id: 'dossier-1',
            title: 'API Migration Project',
            main_goal: 'Migrate legacy payment API',
            relevanceScore: 12,
            outcomeSummary: 'Completed successfully',
            taskPatterns: ['Code review', 'Deploy'],
          },
        ],
        triggerType: 'manual',
      },
      expect: {
        showsNoStrongSimilarity: true,
        weakPrecedentMinimized: true,
        directAdvicePrimary: true,
      },
    },

    // Case 3: No precedent - clean prompt without cross-dossier section
    {
      id: 'no-precedent-greenfield',
      description: 'New greenfield project with no completed dossiers',
      input: {
        action: 'guidance',
        situation: 'Starting a completely new product initiative in an unexplored market',
        main_goal: 'Validate market demand and build initial prototype',
        phase: 'Understanding',
        tasks: [],
        completedDossiers: [],
        triggerType: 'manual',
      },
      expect: {
        noCrossDossierSection: true,
        cleanGuidance: true,
      },
    },

    // Case 4: Multiple precedents with mixed relevance - should rank and select
    {
      id: 'mixed-precedents-ranking',
      description: 'Multiple completed dossiers with varying relevance scores',
      input: {
        action: 'guidance',
        situation: 'Implementing user authentication system with OAuth and SSO',
        main_goal: 'Secure user authentication with enterprise SSO integration',
        phase: 'Executing',
        tasks: ['Set up OAuth providers', 'Configure SSO integration', 'Test authentication flows'],
        completedDossiers: [
          {
            id: 'dossier-high',
            title: 'OAuth Integration for Mobile App',
            main_goal: 'Implemented Google and GitHub OAuth',
            relevanceScore: 78,
            outcomeSummary: '6/7 tasks completed • 5h invested • Outcome: secure OAuth with refresh tokens',
            taskPatterns: ['OAuth provider setup', 'Token management', 'Security review'],
          },
          {
            id: 'dossier-low',
            title: 'Database Migration',
            main_goal: 'Migrated from MongoDB to PostgreSQL',
            relevanceScore: 15,
            outcomeSummary: 'Completed',
            taskPatterns: ['Data export', 'Schema conversion'],
          },
          {
            id: 'dossier-medium',
            title: 'SSO Implementation for Internal Tools',
            main_goal: 'Added SAML-based SSO',
            relevanceScore: 65,
            outcomeSummary: '4/5 tasks completed • 4h invested',
            taskPatterns: ['SAML configuration', 'Identity provider setup'],
          },
        ],
        triggerType: 'manual',
      },
      expect: {
        includesPrecedentContext: true,
        highRelevanceFirst: true,
        sortedByRelevance: true,
        onlyStrongMatchesEmphasized: true,
      },
    },
  ];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validatePrecedentInclusion(testCase, prompt) {
  if (testCase.expect.noCrossDossierSection) {
    assert.ok(
      !prompt.includes('Cross-dossier reference context'),
      `${testCase.id}: should not include cross-dossier section when no precedent`
    );
    return;
  }

  if (testCase.expect.includesPrecedentContext) {
    assert.ok(
      prompt.includes('Cross-dossier reference context'),
      `${testCase.id}: should include cross-dossier context with strong precedent`
    );

    // Verify dossier details are present
    const firstDossier = testCase.input.completedDossiers[0];
    assert.ok(
      prompt.includes(firstDossier.title),
      `${testCase.id}: prompt should include completed dossier title`
    );
  }
}

function validateSpecificityImprovement(testCase, prompt) {
  if (testCase.expect.includesTaskPatterns) {
    const firstDossier = testCase.input.completedDossiers[0];
    // At least some task patterns should be visible
    const hasTaskPatterns = firstDossier.taskPatterns.some((task) =>
      prompt.includes(task)
    );
    assert.ok(
      hasTaskPatterns,
      `${testCase.id}: prompt should include task patterns for operational precedent`
    );
  }

  if (testCase.expect.includesOutcomeSummary) {
    const firstDossier = testCase.input.completedDossiers[0];
    assert.ok(
      prompt.includes(firstDossier.outcomeSummary.substring(0, 30)),
      `${testCase.id}: prompt should include outcome summary for value context`
    );
  }
}

function validateOperationalValue(testCase, prompt) {
  if (testCase.expect.directAdvicePrimary) {
    // Should always have direct guidance rules that take precedence
    assert.ok(
      prompt.includes('Direct execution advice') || prompt.includes('always primary'),
      `${testCase.id}: should establish direct advice as primary`
    );
  }

  if (testCase.expect.showsHighRelevance) {
    const firstDossier = testCase.input.completedDossiers[0];
    if (firstDossier.relevanceScore > 50) {
      assert.ok(
        prompt.includes(`${firstDossier.relevanceScore}% match`) || prompt.includes(`${firstDossier.relevanceScore}`),
        `${testCase.id}: should show high relevance score for strong matches`
      );
    }
  }
}

function validateNoGenericNoise(testCase, prompt) {
  if (testCase.expect.weakPrecedentMinimized) {
    // Low relevance should not get prominent display
    assert.ok(
      !prompt.includes('[12% match]') && !prompt.includes('[15% match]'),
      `${testCase.id}: weak precedents should not show low match percentages prominently`
    );
  }

  if (testCase.expect.showsNoStrongSimilarity) {
    assert.ok(
      prompt.includes('No dossiers show strong topical similarity') ||
      prompt.includes('0 dossier(s) show strong topical similarity'),
      `${testCase.id}: should indicate no strong topical similarity for weak precedent`
    );
  }

  // Only check for generic reference prohibition if there's a cross-dossier section
  if (!testCase.expect.noCrossDossierSection) {
    assert.ok(
      prompt.includes('Generic references') || prompt.includes('are prohibited'),
      `${testCase.id}: should prohibit generic references`
    );
  }
}

function validateReferenceOnlyFraming(testCase, prompt) {
  if (testCase.expect.referenceOnly) {
    // Should frame as precedents/potential precedents, not current work
    assert.ok(
      prompt.includes('potential precedents') || prompt.includes('precedent'),
      `${testCase.id}: should frame completed dossiers as potential precedents`
    );

    // Should NOT suggest continuing or working on completed dossiers
    assert.ok(
      !prompt.includes('Continue working on') && !prompt.includes('your current dossiers'),
      `${testCase.id}: should not conflate completed and active work`
    );
  }

  if (testCase.expect.sortedByRelevance) {
    // Check that sorting instruction exists
    assert.ok(
      prompt.includes('relevance') || prompt.includes('match'),
      `${testCase.id}: should mention relevance-based ordering`
    );
  }
}

// Run tests if executed directly
if (require.main === module) {
  runCrossDossierUsefulnessTests();
}

module.exports = { runCrossDossierUsefulnessTests };
