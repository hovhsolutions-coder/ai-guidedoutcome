require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

/**
 * Cross-Dossier Precedent Quality Eval
 *
 * Protects the tightened precedent-application rules from regression.
 * Ensures that:
 * 1. Active dossiers may receive completed-dossier context
 * 2. Precedent is used selectively, not by default
 * 3. Generic precedent references are prohibited
 * 4. Stronger parallels are preferred over weak/noisy ones
 * 5. Completed dossiers remain reference-only, not active work
 */

function runCrossDossierPrecedentTests() {
  const testCases = buildPrecedentQualityMatrix();

  for (const testCase of testCases) {
    const prompt = testCase.buildPrompt();

    // Validate strict precedent rules are present
    validatePrecedentRulesPresent(testCase, prompt);

    // Validate match threshold enforcement
    validateMatchThreshold(testCase, prompt);

    // Validate generic references prohibited
    validateGenericReferencesProhibited(testCase, prompt);

    // Validate direct advice primary
    validateDirectAdvicePrimary(testCase, prompt);

    // Validate reference-only framing
    validateReferenceOnlyFraming(testCase, prompt);
  }

  console.log(`Cross-dossier precedent quality: ${testCases.length} scenarios passed`);
}

function buildPrecedentQualityMatrix() {
  return [
    // Case 1: Active dossier with high-relevance completed dossiers
    {
      id: 'active-with-strong-precedent',
      description: 'Active dossier receives context with strong-match precedent',
      buildPrompt: () => {
        const { buildGuidancePrompt } = require('../../src/lib/ai/prompt-builder.ts');
        return buildGuidancePrompt({
          action: 'guidance',
          situation: 'Migrating our legacy API to the new microservices architecture',
          main_goal: 'Complete API migration with zero downtime',
          phase: 'Structuring',
          tasks: ['Design new API contracts', 'Set up staging environment'],
          completedDossiers: [
            {
              id: 'dossier-1',
              title: 'Previous API Migration',
              main_goal: 'Migrated payment API to new architecture',
              relevanceScore: 85,
              outcomeSummary: '8/10 tasks completed • 6h invested • Outcome: zero-downtime migration',
              taskPatterns: ['Design API contracts', 'Set up staging', 'Test migrations'],
            },
          ],
        });
      },
      expect: {
        strictRules: true,
        matchThreshold: 50,
        genericProhibited: true,
        directAdvicePrimary: true,
        referenceOnly: true,
      },
    },

    // Case 2: Active dossier with low-relevance completed dossiers
    {
      id: 'active-with-weak-precedent',
      description: 'Active dossier receives context but weak precedent should be ignored',
      buildPrompt: () => {
        const { buildGuidancePrompt } = require('../../src/lib/ai/prompt-builder.ts');
        return buildGuidancePrompt({
          action: 'guidance',
          situation: 'Planning the company holiday party',
          main_goal: 'Organize a memorable team event',
          phase: 'Understanding',
          tasks: [],
          completedDossiers: [
            {
              id: 'dossier-1',
              title: 'API Migration Project',
              main_goal: 'Migrate legacy API',
              relevanceScore: 15,
              outcomeSummary: 'Completed successfully',
              taskPatterns: ['Code review', 'Deploy to prod'],
            },
          ],
        });
      },
      expect: {
        strictRules: true,
        matchThreshold: 50,
        genericProhibited: true,
        directAdvicePrimary: true,
        referenceOnly: true,
        weakPrecedentIgnored: true,
      },
    },

    // Case 3: Active dossier with no completed dossiers
    {
      id: 'active-no-precedent',
      description: 'Active dossier with no completed context should not have cross-dossier section',
      buildPrompt: () => {
        const { buildGuidancePrompt } = require('../../src/lib/ai/prompt-builder.ts');
        return buildGuidancePrompt({
          action: 'guidance',
          situation: 'Starting a new greenfield project',
          main_goal: 'Build the new feature from scratch',
          phase: 'Understanding',
          tasks: [],
          completedDossiers: [],
        });
      },
      expect: {
        noCrossDossierSection: true,
      },
    },

    // Case 4: Completed phase dossier should not receive context
    {
      id: 'completed-no-context',
      description: 'Completed dossier should not receive cross-dossier context',
      buildPrompt: () => {
        const { buildGuidancePrompt } = require('../../src/lib/ai/prompt-builder.ts');
        return buildGuidancePrompt({
          action: 'guidance',
          situation: 'Project is finished',
          main_goal: 'Already achieved',
          phase: 'Completed',
          tasks: ['All done'],
          completedDossiers: [], // Server-side logic should not pass context for Completed
        });
      },
      expect: {
        noCrossDossierContext: true,
      },
    },
  ];
}

function validatePrecedentRulesPresent(testCase, prompt) {
  // When no completed dossiers, there should be no cross-dossier section
  if (testCase.expect.noCrossDossierSection || testCase.expect.noCrossDossierContext) {
    assert.ok(
      !prompt.includes('Cross-dossier reference context') && !prompt.includes('completed dossier'),
      `${testCase.id}: prompt should not contain cross-dossier context when no completed dossiers`
    );
    return; // Skip rest of validation - no section to validate
  }

  // Must contain strict "DEFAULT: Do NOT reference" language
  assert.ok(
    prompt.includes('DEFAULT: Do NOT reference') || prompt.includes('Do NOT reference'),
    `${testCase.id}: prompt must contain strict 'Do NOT reference' default rule`
  );

  // Must contain explicit threshold (50% match)
  assert.ok(
    prompt.includes('>50%') || prompt.includes('50% match'),
    `${testCase.id}: prompt must specify >50% match threshold`
  );

  // Must prohibit generic references
  assert.ok(
    prompt.includes('Generic references') || prompt.includes('similar to your previous work'),
    `${testCase.id}: prompt must prohibit generic references`
  );
}

function validateMatchThreshold(testCase, prompt) {
  // Skip if no cross-dossier section
  if (testCase.expect.noCrossDossierSection || testCase.expect.noCrossDossierContext) return;

  // Check that match scores are shown for high-relevance items
  if (testCase.id === 'active-with-strong-precedent') {
    assert.ok(
      prompt.includes('[85% match]') || prompt.includes('85%'),
      `${testCase.id}: high-relevance score (85%) should be visible in prompt`
    );
  }

  // Check that weak matches are not emphasized
  if (testCase.id === 'active-with-weak-precedent') {
    // Low relevance score (15%) should NOT get a visible score hint
    assert.ok(
      !prompt.includes('[15% match]'),
      `${testCase.id}: low-relevance score (15%) should not get visible score hint`
    );

    // Should indicate no strong topical similarity
    assert.ok(
      prompt.includes('No dossiers show strong topical similarity') ||
      prompt.includes('0 dossier(s) show strong topical similarity'),
      `${testCase.id}: prompt should indicate no strong topical similarity for weak precedent`
    );
  }
}

function validateGenericReferencesProhibited(testCase, prompt) {
  // Skip if no cross-dossier section
  if (testCase.expect.noCrossDossierSection || testCase.expect.noCrossDossierContext) return;

  // Must explicitly prohibit generic phrases
  // The prompt contains these phrases in the prohibition rule, so we check for the prohibition context
  assert.ok(
    prompt.includes('Generic references like "similar to your previous work"') ||
    prompt.includes('similar to your previous work" are prohibited'),
    `${testCase.id}: prompt must explicitly prohibit generic reference phrases`
  );

  // Must require specificity
  assert.ok(
    prompt.includes('be specific') || prompt.includes('name the exact approach'),
    `${testCase.id}: prompt must require specific reference naming`
  );

  // Must have "prohibited" language for generic references
  assert.ok(
    prompt.includes('are prohibited') || prompt.includes('Generic references'),
    `${testCase.id}: prompt must clearly mark generic references as prohibited`
  );
}

function validateDirectAdvicePrimary(testCase, prompt) {
  // Skip if no cross-dossier section
  if (testCase.expect.noCrossDossierSection || testCase.expect.noCrossDossierContext) return;

  // Must establish hierarchy: direct advice primary, precedent supplementary
  assert.ok(
    prompt.includes('Direct execution advice') || prompt.includes('always primary'),
    `${testCase.id}: prompt must establish direct advice as primary`
  );

  assert.ok(
    prompt.includes('precedent is supplementary') || prompt.includes('supplementary only'),
    `${testCase.id}: prompt must establish precedent as supplementary`
  );
}

function validateReferenceOnlyFraming(testCase, prompt) {
  // Skip if no cross-dossier section
  if (testCase.expect.noCrossDossierSection || testCase.expect.noCrossDossierContext) return;

  // Must keep completed dossiers framed as reference, not active work
  assert.ok(
    prompt.includes('potential precedents') || prompt.includes('reference') || prompt.includes('precedent'),
    `${testCase.id}: prompt must frame completed dossiers as reference/precedent`
  );

  // Should not suggest treating completed work as current work
  assert.ok(
    !prompt.includes('continue working on') || !prompt.toLowerCase().includes('your current dossiers include'),
    `${testCase.id}: prompt should not conflate completed and active work`
  );
}

// Run tests if executed directly
if (require.main === module) {
  runCrossDossierPrecedentTests();
}

module.exports = { runCrossDossierPrecedentTests };
