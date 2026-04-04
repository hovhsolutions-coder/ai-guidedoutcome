require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { runAIOrchestrator } = require('../../src/lib/ai/orchestrator.ts');

/**
 * AI Quality Eval: Situation-Type × Phase Intelligence
 *
 * Protects the situation-aware guidance from regression to generic output.
 * Tests that guidance adapts meaningfully to both situation type and current phase.
 */

async function runGuidanceSituationPhaseMatrixTests() {
  const testCases = buildSituationPhaseMatrix();

  for (const testCase of testCases) {
    const result = await runAIOrchestrator(testCase.input, { mode: 'local' });

    assert.equal(result.success, true, `${testCase.id}: guidance should succeed`);
    assert.ok(result.data, `${testCase.id}: guidance should return data`);

    // Validate situation-phase specific expectations
    validateSummaryFraming(testCase, result.data.summary);
    validateNextStepFraming(testCase, result.data.next_step);
    validateTaskDirection(testCase, result.data.suggested_tasks);

    // Validate rejection patterns (what the output should NOT be)
    validateRejectionPatterns(testCase, result.data);
  }

  console.log(`Situation-phase matrix: ${testCases.length} scenarios passed`);
}

function buildSituationPhaseMatrix() {
  return [
    // BLOCKED × UNDERSTANDING: Should emphasize root cause analysis
    {
      id: 'blocked-understanding',
      situation: 'blocked',
      phase: 'Understanding',
      situationSignal: 'The deployment pipeline is blocked by a failing security scan',
      input: {
        action: 'guidance',
        situation: 'The deployment pipeline is blocked by a failing security scan we do not fully understand',
        main_goal: 'Get the deployment pipeline working again',
        phase: 'Understanding',
        tasks: ['Investigate security scan failure', 'Review recent dependency changes'],
        user_input: 'We are blocked and need to understand why',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/block/i, /stall/i, /root cause/i, /understand/i, /precisely name/i],
        nextStepPatterns: [/analyz/i, /identif/i, /understand/i, /why/i, /fact/i],
        taskDirection: 'root-cause-clarification',
      },
      reject: {
        summaryPatterns: [/execute immediately/i, /move through/i], // Shouldn't rush to execution
        nextStepPatterns: [/complete.*now/i, /execute.*now/i], // Shouldn't demand immediate completion
      },
    },

    // BLOCKED × ACTION: Should emphasize unblocking execution
    {
      id: 'blocked-action',
      situation: 'blocked',
      phase: 'Action',
      situationSignal: 'blocked by vendor approval and the deadline is today',
      input: {
        action: 'guidance',
        situation: 'The launch is blocked by pending vendor approval and the deadline is today',
        main_goal: 'Launch the feature today',
        phase: 'Action',
        tasks: ['Get vendor approval', 'Prepare fallback assets', 'Notify stakeholders'],
        user_input: 'We are blocked and need to move fast',
        triggerType: 'quick_action',
      },
      expect: {
        summaryPatterns: [/execute/i, /unblock/i, /immediately/i, /decisive/i, /momentum/i],
        nextStepPatterns: [/complete.*now/i, /execute/i, /make.*ask/i, /clear.*blocker/i],
        taskDirection: 'unblock-execution',
      },
      reject: {
        summaryPatterns: [/analyze why/i, /understand.*blocker/i], // Shouldn't go back to analysis
        nextStepPatterns: [/investigate/i, /research/i, /analyze/i], // Shouldn't suggest research
      },
    },

    // DECISION × STRUCTURING: Should emphasize decision framework
    {
      id: 'decision-structuring',
      situation: 'decision',
      phase: 'Structuring',
      situationSignal: 'choosing between self-serve and high-touch services offer',
      input: {
        action: 'guidance',
        situation: 'The team must choose between a self-serve model and high-touch services offer. Both seem viable.',
        main_goal: 'Choose the operating model for next quarter',
        phase: 'Structuring',
        tasks: ['Model self-serve funnel', 'Model services capacity', 'Estimate team bandwidth'],
        user_input: 'We need to structure this decision properly',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/structure/i, /criteria/i, /framework/i, /eliminate/i, /force/i],
        nextStepPatterns: [/criteria/i, /eliminate/i, /framework/i, /establish/i],
        taskDirection: 'decision-framework',
      },
      reject: {
        summaryPatterns: [/commit now/i, /decide immediately/i], // Shouldn't rush to decision
        nextStepPatterns: [/choose now/i, /commit/i], // Shouldn't demand immediate commitment
      },
    },

    // UNCLEAR × UNDERSTANDING: Should emphasize fog reduction
    {
      id: 'unclear-understanding',
      situation: 'unclear',
      phase: 'Understanding',
      situationSignal: 'Something feels off in enterprise expansion but the signal is still fuzzy',
      input: {
        action: 'guidance',
        situation: 'Something feels off in enterprise expansion but the signal is still fuzzy and unclear',
        main_goal: 'Identify the first useful angle to investigate',
        phase: 'Understanding',
        tasks: [],
        user_input: 'I am not sure where to look yet',
        triggerType: 'manual',
      },
      expect: {
        summaryPatterns: [/fog/i, /clarif/i, /unclear/i, /uncertainty/i, /thread to pull/i],
        nextStepPatterns: [/identif/i, /one fact/i, /clarity/i, /investigation angle/i],
        taskDirection: 'fog-reduction',
      },
      reject: {
        summaryPatterns: [/execute through/i, /complete.*now/i], // Shouldn't push execution
        nextStepPatterns: [/complete.*task/i, /execute/i], // Shouldn't demand completion
      },
    },

    // UNCLEAR × ACTION: Should emphasize execution through uncertainty
    {
      id: 'unclear-action',
      situation: 'unclear',
      phase: 'Action',
      situationSignal: 'messy situation but we need to ship something today',
      input: {
        action: 'guidance',
        situation: 'The requirements are still messy but we need to ship a working prototype today',
        main_goal: 'Ship a working prototype today despite unclear requirements',
        phase: 'Action',
        tasks: ['Draft core functionality', 'Prepare demo data', 'Document known gaps'],
        user_input: 'We need to move even though things are unclear',
        triggerType: 'quick_action',
      },
      expect: {
        summaryPatterns: [/execute/i, /despite/i, /uncertainty/i, /tangible data/i, /move/i],
        nextStepPatterns: [/complete/i, /concrete/i, /data/i, /produce/i, /despite/i],
        taskDirection: 'execute-through-fog',
      },
      reject: {
        summaryPatterns: [/need more clarity/i, /define.*first/i], // Shouldn't block on clarity
        nextStepPatterns: [/clarify first/i, /understand.*before/i], // Shouldn't demand understanding first
      },
    },

    // PLANNING × STRUCTURING: Should emphasize sequence and structure
    {
      id: 'planning-structuring',
      situation: 'planning',
      phase: 'Structuring',
      situationSignal: 'building a launch plan with too many parallel workstreams',
      input: {
        action: 'guidance',
        situation: 'Building a launch plan with too many parallel workstreams across pricing, messaging, and enablement',
        main_goal: 'Reduce the launch plan to one workable execution sequence',
        phase: 'Structuring',
        tasks: ['Rewrite messaging', 'Update pricing page', 'Prepare sales deck', 'Assign owners'],
        user_input: 'The plan keeps spreading. What should become the anchor?',
        triggerType: 'quick_action',
      },
      expect: {
        summaryPatterns: [/sequence/i, /structure/i, /anchor/i, /operating structure/i, /ownership/i],
        nextStepPatterns: [/establish/i, /sequence/i, /anchor/i, /priority/i, /dependency/i],
        taskDirection: 'sequencing-structure',
      },
      reject: {
        summaryPatterns: [/execute now/i, /complete.*now/i], // Shouldn't jump to execution
        nextStepPatterns: [/complete.*task/i, /execute/i], // Shouldn't demand immediate completion
      },
    },
  ];
}

function validateSummaryFraming(testCase, summary) {
  const { expect, reject, id } = testCase;

  // At least one expected pattern should match
  const hasExpectedPattern = expect.summaryPatterns.some(pattern => pattern.test(summary));
  assert.ok(
    hasExpectedPattern,
    `${id}: summary should contain situation-phase appropriate framing. Got: "${summary}". Expected patterns: ${expect.summaryPatterns.join(', ')}`
  );

  // Rejection patterns should NOT match
  if (reject.summaryPatterns) {
    for (const pattern of reject.summaryPatterns) {
      assert.doesNotMatch(
        summary,
        pattern,
        `${id}: summary should NOT contain generic/phase-mismatched language`
      );
    }
  }
}

function validateNextStepFraming(testCase, nextStep) {
  const { expect, reject, id } = testCase;

  // At least one expected pattern should match
  const hasExpectedPattern = expect.nextStepPatterns.some(pattern => pattern.test(nextStep));
  assert.ok(
    hasExpectedPattern,
    `${id}: next_step should contain situation-phase appropriate directive. Got: "${nextStep}". Expected patterns: ${expect.nextStepPatterns.join(', ')}`
  );

  // Rejection patterns should NOT match
  if (reject.nextStepPatterns) {
    for (const pattern of reject.nextStepPatterns) {
      assert.doesNotMatch(
        nextStep,
        pattern,
        `${id}: next_step should NOT contain generic/phase-mismatched language`
      );
    }
  }
}

function validateTaskDirection(testCase, tasks) {
  const { id, expect } = testCase;

  assert.ok(Array.isArray(tasks), `${id}: suggested_tasks should be an array`);
  assert.ok(tasks.length >= 2, `${id}: should have at least 2 suggested tasks`);

  // Tasks should be concrete and supportive of the direction
  const taskText = tasks.join(' ').toLowerCase();

  switch (expect.taskDirection) {
    case 'root-cause-clarification':
      assert.ok(
        /blocker|root|cause|understand|why|appeared|dependency/.test(taskText),
        `${id}: tasks should support root cause clarification`
      );
      break;
    case 'unblock-execution':
      assert.ok(
        /unblock|complete|execute|ask|clear|path/.test(taskText),
        `${id}: tasks should support unblocking execution`
      );
      break;
    case 'decision-framework':
      assert.ok(
        /criteria|eliminate|option|framework|structure|choice/.test(taskText),
        `${id}: tasks should support decision framework building`
      );
      break;
    case 'fog-reduction':
      assert.ok(
        /unknown|uncertainty|clarity|information|fact|step/.test(taskText),
        `${id}: tasks should support fog reduction`
      );
      break;
    case 'execute-through-fog':
      assert.ok(
        /move|complete|concrete|data|despite|produce/.test(taskText),
        `${id}: tasks should support execution through uncertainty`
      );
      break;
    case 'sequencing-structure':
      assert.ok(
        /sequence|priority|anchor|ownership|dependency|order/.test(taskText),
        `${id}: tasks should support sequencing and structure`
      );
      break;
  }
}

function validateRejectionPatterns(testCase, data) {
  const { id, situation, phase } = testCase;
  const summary = data.summary.toLowerCase();
  const nextStep = data.next_step.toLowerCase();

  // Generic phrases that should not appear in situation-aware output
  const genericPhrases = [
    /review the context/,
    /assess the situation/,
    /consider the options/,
    /continue working/,
  ];

  for (const phrase of genericPhrases) {
    assert.doesNotMatch(
      summary,
      phrase,
      `${id}: summary should avoid generic guidance phrases`
    );
  }

  // Phase-specific rejection: Action phase should not suggest more analysis
  if (phase === 'Action') {
    const analysisPhrases = [/analyze.*more/i, /research.*first/i, /understand.*better/i];
    for (const phrase of analysisPhrases) {
      assert.doesNotMatch(
        nextStep,
        phrase,
        `${id}: Action phase should not suggest more analysis`
      );
    }
  }

  // Situation-specific rejection: Blocked should not be treated as generic unclear
  if (situation === 'blocked') {
    assert.ok(
      /block|stuck|halt|unblock/.test(summary) || /block|stuck|halt|unblock/.test(nextStep),
      `${id}: Blocked situations should explicitly acknowledge blocking language`
    );
  }

  // Situation-specific rejection: Decision should not be treated as generic planning
  if (situation === 'decision') {
    assert.ok(
      /decision|choice|option|criteria/.test(summary) || /decision|choose|eliminate/.test(nextStep),
      `${id}: Decision situations should explicitly reference decision language`
    );
  }
}

module.exports = {
  runGuidanceSituationPhaseMatrixTests,
};
