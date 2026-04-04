require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { runAIOrchestrator } = require('../../src/lib/ai/orchestrator.ts');

/**
 * AI Quality Eval: Generated Dossier Quality
 *
 * Protects dossier generation quality from regression to generic output.
 * Tests that created dossiers are specific, well-structured, actionable,
 * strategically sequenced, and appropriate to the situation.
 */

async function runDossierGenerationQualityTests() {
  const testCases = buildDossierQualityMatrix();

  for (const testCase of testCases) {
    const result = await runAIOrchestrator(testCase.input, { mode: 'local' });

    assert.equal(result.success, true, `${testCase.id}: dossier creation should succeed`);
    assert.ok(result.data, `${testCase.id}: dossier creation should return data`);

    // Validate dossier-specific quality expectations
    validateSummaryQuality(testCase, result.data.summary);
    validateNextStepQuality(testCase, result.data.next_step);
    validateTaskQuality(testCase, result.data.suggested_tasks);
    validateTaskSequencing(testCase, result.data.suggested_tasks);

    // Validate rejection patterns
    validateRejectionPatterns(testCase, result.data);
  }

  console.log(`Dossier generation quality: ${testCases.length} scenarios passed`);
}

function buildDossierQualityMatrix() {
  return [
    // BLOCKED situation: Should emphasize unblocking in initial structure
    {
      id: 'dossier-blocked',
      situationType: 'blocked',
      input: {
        action: 'create_dossier',
        situation: 'The deployment pipeline is blocked by a failing security scan we do not fully understand',
        main_goal: 'Get the deployment pipeline working again',
        phase: 'Understanding',
        tasks: [],
        user_input: 'Urgency: high\nInvolved: DevOps team\nBlocking: Security scan failure',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/block/i, /stuck/i, /deployment/i, /pipeline/i, /security/i],
        nextStepPatterns: [/write/i, /define/i, /identif/i, /outcome/i, /first/i],
        taskDirection: 'unblocking-focus',
      },
      reject: {
        summaryPatterns: [/complex situation/i, /multiple factors/i, /interesting opportunity/i],
        nextStepPatterns: [/review/i, /assess/i, /consider/i, /explore/i],
      },
    },

    // DECISION situation: Should emphasize choice framework
    {
      id: 'dossier-decision',
      situationType: 'decision',
      input: {
        action: 'create_dossier',
        situation: 'The team must choose between building in-house analytics or buying a third-party solution',
        main_goal: 'Decide on the analytics approach for next quarter',
        phase: 'Understanding',
        tasks: [],
        user_input: 'Urgency: medium\nInvolved: Product and Engineering leads\nBlocking: Unclear decision criteria',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/decision/i, /choose/i, /analytics/i, /build/i, /buy/i],
        nextStepPatterns: [/write/i, /define/i, /choose/i, /criteria/i, /decision/i],
        taskDirection: 'decision-framework',
      },
      reject: {
        summaryPatterns: [/complex situation/i, /interesting opportunity/i],
        nextStepPatterns: [/review/i, /assess/i, /consider/i, /explore options/i],
      },
    },

    // UNCLEAR/MESSY situation: Should emphasize clarity creation
    {
      id: 'dossier-unclear',
      situationType: 'unclear',
      input: {
        action: 'create_dossier',
        situation: 'Customer churn is rising but we do not know which segment or why. Signal is scattered across support, sales, and product data.',
        main_goal: 'Identify the primary cause of rising churn',
        phase: 'Understanding',
        tasks: [],
        user_input: 'Urgency: high\nInvolved: Customer Success, Product, Sales\nBlocking: No clear pattern yet',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/churn/i, /rising/i, /pattern/i, /segment/i, /cause/i, /unclear/i],
        nextStepPatterns: [/write/i, /define/i, /identif/i, /first/i, /concrete/i],
        taskDirection: 'clarity-focus',
      },
      reject: {
        summaryPatterns: [/complex situation/i, /multiple factors/i],
        nextStepPatterns: [/research/i, /analyze/i, /gather more/i],
      },
    },

    // PLANNING situation: Should emphasize structure and sequence
    {
      id: 'dossier-planning',
      situationType: 'planning',
      input: {
        action: 'create_dossier',
        situation: 'We need to plan the Q3 product launch across marketing, sales, and customer success teams',
        main_goal: 'Execute a coordinated Q3 product launch',
        phase: 'Understanding',
        tasks: [],
        user_input: 'Urgency: medium\nInvolved: Marketing, Sales, CS teams\nBlocking: No coordinated plan yet',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/launch/i, /plan/i, /coordinate/i, /Q3/i, /marketing/i, /sales/i],
        nextStepPatterns: [/write/i, /define/i, /establish/i, /sequence/i, /first/i],
        taskDirection: 'structure-focus',
      },
      reject: {
        summaryPatterns: [/complex situation/i],
        nextStepPatterns: [/start by reviewing/i, /begin by assessing/i],
      },
    },

    // EXECUTION/ACTIVE situation: Should emphasize momentum and completion
    {
      id: 'dossier-execution',
      situationType: 'execution',
      input: {
        action: 'create_dossier',
        situation: 'The migration is 60% complete but we need to finish the remaining data transfers and cutover this week',
        main_goal: 'Complete the migration and cutover this week',
        phase: 'Understanding',
        tasks: [],
        user_input: 'Urgency: high\nInvolved: Engineering and Data teams\nBlocking: Risk of delay in final cutover',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/migration/i, /complete/i, /finish/i, /cutover/i, /data/i, /transfer/i],
        nextStepPatterns: [/write/i, /define/i, /complete/i, /finish/i, /concrete/i],
        taskDirection: 'execution-focus',
      },
      reject: {
        summaryPatterns: [/complex situation/i, /interesting challenge/i],
        nextStepPatterns: [/plan/i, /research/i, /analyze/i],
      },
    },
  ];
}

function validateSummaryQuality(testCase, summary) {
  const { expect, reject, id, situationType } = testCase;

  // Summary should be specific (not generic)
  assert.ok(
    summary.length > 60,
    `${id}: summary should be substantive (>60 chars), got: "${summary}"`
  );

  // Summary should mention situation-specific elements
  const hasExpectedPattern = expect.summaryPatterns.some(pattern => pattern.test(summary));
  assert.ok(
    hasExpectedPattern,
    `${id}: summary should contain situation-specific language. Got: "${summary}". Expected patterns like: ${expect.summaryPatterns.slice(0, 3).map(p => p.source).join(', ')}`
  );

  // Rejection: generic phrases should NOT appear
  if (reject.summaryPatterns) {
    for (const pattern of reject.summaryPatterns) {
      assert.doesNotMatch(
        summary,
        pattern,
        `${id}: summary should avoid generic phrasing like "${pattern.source}"`
      );
    }
  }

  // Situation-specific validations
  if (situationType === 'blocked') {
    assert.ok(
      /block|stuck|halt|unable/i.test(summary),
      `${id}: Blocked situation summary should acknowledge blocking`
    );
  }
  if (situationType === 'decision') {
    assert.ok(
      /decision|choose|between|option/i.test(summary),
      `${id}: Decision situation summary should reference the choice`
    );
  }
}

function validateNextStepQuality(testCase, nextStep) {
  const { expect, reject, id } = testCase;

  // Next step should use strong action verbs
  const strongVerbs = /^(write|define|choose|complete|capture|confirm|finalize|identify|establish|clarify)/i;
  assert.ok(
    strongVerbs.test(nextStep.trim()),
    `${id}: next_step should start with strong action verb (write/define/choose/complete/capture/confirm/finalize/identify/establish/clarify). Got: "${nextStep}"`
  );

  // Next step should be concrete (not vague)
  assert.ok(
    nextStep.length > 30,
    `${id}: next_step should be specific (>30 chars), got: "${nextStep}"`
  );

  // Should match expected patterns
  const hasExpectedPattern = expect.nextStepPatterns.some(pattern => pattern.test(nextStep));
  assert.ok(
    hasExpectedPattern,
    `${id}: next_step should contain expected quality patterns. Got: "${nextStep}"`
  );

  // Rejection: weak verbs should NOT appear
  if (reject.nextStepPatterns) {
    for (const pattern of reject.nextStepPatterns) {
      assert.doesNotMatch(
        nextStep,
        pattern,
        `${id}: next_step should avoid weak verbs like "${pattern.source}"`
      );
    }
  }

  // Should not be vague about timing
  assert.doesNotMatch(
    nextStep,
    /soon|later|eventually|when possible/i,
    `${id}: next_step should not defer timing vaguely`
  );
}

function validateTaskQuality(testCase, tasks) {
  const { id, expect } = testCase;

  assert.ok(Array.isArray(tasks), `${id}: suggested_tasks should be an array`);
  assert.ok(tasks.length >= 2 && tasks.length <= 4, `${id}: should have 2-4 suggested tasks, got ${tasks.length}`);

  // Each task should be concrete (not high-level planning activities)
  for (const task of tasks) {
    assert.ok(
      task.length > 20,
      `${id}: each task should be specific (>20 chars), got: "${task}"`
    );

    // Tasks should start with strong verbs
    const taskLower = task.toLowerCase();
    const hasStrongVerb = /^(write|define|choose|complete|capture|confirm|finalize|identify|establish|clarify|set up|finish|name)/i.test(task);
    assert.ok(
      hasStrongVerb,
      `${id}: task should start with strong verb: "${task}"`
    );

    // Tasks should NOT use weak exploratory language
    assert.doesNotMatch(
      task,
      /review|assess|explore|consider|analyze|research/i,
      `${id}: task should avoid weak exploratory verbs: "${task}"`
    );
  }

  // Task direction validation based on situation type
  const taskText = tasks.join(' ').toLowerCase();
  switch (expect.taskDirection) {
    case 'unblocking-focus':
      assert.ok(
        /blocker|unblock|resolve|fix|remove/i.test(taskText),
        `${id}: tasks should support unblocking in blocked situations`
      );
      break;
    case 'decision-framework':
      assert.ok(
        /criteria|option|compare|decision|factor/i.test(taskText),
        `${id}: tasks should support decision framework building`
      );
      break;
    case 'clarity-focus':
      assert.ok(
        /define|identify|clarify|write|specific/i.test(taskText),
        `${id}: tasks should support clarity creation`
      );
      break;
    case 'structure-focus':
      assert.ok(
        /sequence|coordinate|plan|structure|order/i.test(taskText),
        `${id}: tasks should support structure building`
      );
      break;
    case 'execution-focus':
      assert.ok(
        /complete|finish|transfer|cutover|execute/i.test(taskText),
        `${id}: tasks should support execution completion`
      );
      break;
  }
}

function validateTaskSequencing(testCase, tasks) {
  const { id } = testCase;

  // First task should be the smallest, most immediate action (momentum-creating)
  const firstTask = tasks[0].toLowerCase();

  // First task patterns that indicate good sequencing
  const momentumPatterns = [
    /write/i,
    /define/i,
    /name/i,
    /identify/i,
    /list/i,
  ];

  const hasMomentumPattern = momentumPatterns.some(p => p.test(firstTask));
  assert.ok(
    hasMomentumPattern,
    `${id}: first task should be immediate and momentum-creating (write/define/name/identify/list). Got: "${tasks[0]}"`
  );

  // Tasks should feel like they build on each other (sequential logic)
  // This is a heuristic check - subsequent tasks should reference outcomes of earlier tasks
  if (tasks.length >= 2) {
    const allTasksText = tasks.join(' ').toLowerCase();
    // Should have some sense of progression (not just random activities)
    assert.ok(
      /first|then|next|after|before|enable/i.test(allTasksText) ||
      tasks.some(t => /checkpoint|milestone|verify|confirm/i.test(t)),
      `${id}: tasks should show sequential progression or verification points`
    );
  }

  // No duplicate or nearly-duplicate tasks
  const normalizedTasks = tasks.map(t => t.toLowerCase().replace(/[^a-z]/g, ''));
  const uniqueTasks = new Set(normalizedTasks);
  assert.equal(
    uniqueTasks.size,
    tasks.length,
    `${id}: tasks should be unique, found duplicates`
  );
}

function validateRejectionPatterns(testCase, data) {
  const { id, situationType } = testCase;
  const summary = data.summary.toLowerCase();
  const nextStep = data.next_step.toLowerCase();
  const tasksText = data.suggested_tasks.join(' ').toLowerCase();

  // Generic filler language should not appear
  const fillerPhrases = [
    /understand better/,
    /gather more information/,
    /review the context/,
    /assess the situation/,
  ];

  for (const phrase of fillerPhrases) {
    assert.doesNotMatch(
      summary,
      phrase,
      `${id}: summary should avoid filler language like "${phrase.source}"`
    );
    assert.doesNotMatch(
      tasksText,
      phrase,
      `${id}: tasks should avoid filler language like "${phrase.source}"`
    );
  }

  // Optional language should not appear
  const optionalPatterns = [/you could/, /you might/, /consider/, /try to/];
  for (const pattern of optionalPatterns) {
    assert.doesNotMatch(
      nextStep,
      pattern,
      `${id}: next_step should avoid optional language like "${pattern.source}"`
    );
  }

  // Situation-appropriate specificity
  if (situationType === 'execution') {
    // Execution tasks should be completion-focused
    assert.ok(
      /complete|finish|finalize|confirm/i.test(tasksText),
      `${id}: Execution situation tasks should emphasize completion`
    );
  }
}

module.exports = {
  runDossierGenerationQualityTests,
};
