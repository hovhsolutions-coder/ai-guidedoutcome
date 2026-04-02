const {
  guidanceQualityScenarios,
  strongOutputPatterns,
  commonFailurePatterns,
} = require('../src/lib/ai/guidance-quality-fixtures.json');

const DEFAULT_BASE_URL = process.env.GUIDANCE_CHECK_BASE_URL || 'http://localhost:3000';
const DEFAULT_MODE = 'live';

const STRONG_VERBS = [
  'define',
  'choose',
  'complete',
  'write',
  'capture',
  'remove',
  'send',
  'finish',
  'clarify',
  'decide',
  'confirm',
  'draft',
  'call',
  'ship',
];

const WEAK_TERMS = [
  'review',
  'assess',
  'consider',
  'explore',
  'look into',
  'start by',
  'begin by',
  'you could',
  'you might',
  'try to',
];

async function main() {
  const scenarioFilter = getScenarioFilter(process.argv.slice(2));
  const scenarios = scenarioFilter
    ? guidanceQualityScenarios.filter((scenario) => scenario.id === scenarioFilter)
    : guidanceQualityScenarios;

  if (scenarios.length === 0) {
    console.error(`No guidance quality scenario found for "${scenarioFilter}".`);
    process.exitCode = 1;
    return;
  }

  console.log('');
  console.log('Guidance Quality Regression Runner');
  console.log('==================================');
  console.log(`Base URL: ${DEFAULT_BASE_URL}`);
  console.log(`Mode: ${mode}`);
  console.log(`Scenarios: ${scenarios.length}`);
  if (mode === 'local') {
    console.log('Note: local mode validates structural guidance quality only. Live mode remains the source of truth for real model behavior.');
  }
  console.log('');

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const scenario of scenarios) {
    const routeResult = await requestGuidance(scenario.input, mode);

    if (!routeResult.success || !routeResult.data) {
      failCount += 1;
      printScenarioHeader(scenario);
      console.log('Status: FAIL');
      console.log(`Error: ${routeResult.error || 'Unknown guidance failure'}`);
      console.log('');
      continue;
    }

    const evaluation = evaluateScenario(scenario, routeResult.data);

    if (evaluation.status === 'PASS') {
      passCount += 1;
    } else if (evaluation.status === 'WARN') {
      warnCount += 1;
    } else {
      failCount += 1;
    }

    printScenarioHeader(scenario);
    console.log(`Status: ${evaluation.status}`);
    console.log(`Situation read: ${routeResult.data.summary}`);
    console.log(`Next step: ${routeResult.data.next_step}`);
    console.log('Suggested tasks:');
    for (const task of routeResult.data.suggested_tasks) {
      console.log(`- ${task}`);
    }

    if (evaluation.failures.length > 0) {
      console.log('Failures:');
      for (const failure of evaluation.failures) {
        console.log(`- ${failure}`);
      }
    }

    if (evaluation.warnings.length > 0) {
      console.log('Warnings:');
      for (const warning of evaluation.warnings) {
        console.log(`- ${warning}`);
      }
    }

    console.log('Expected strong patterns:');
    for (const pattern of scenario.expected.nextStep) {
      console.log(`- ${pattern}`);
    }
    console.log('');
  }

  console.log('Summary');
  console.log('-------');
  console.log(`PASS: ${passCount}`);
  console.log(`WARN: ${warnCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log('');
  console.log('Reference patterns');
  console.log('- Strong output:');
  for (const pattern of strongOutputPatterns) {
    console.log(`  - ${pattern}`);
  }
  console.log('- Common failures:');
  for (const pattern of commonFailurePatterns) {
    console.log(`  - ${pattern}`);
  }

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

async function requestGuidance(input, mode) {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/ai/guidance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-guidance-mode': mode,
    },
    body: JSON.stringify({
      situation: input.situation,
      main_goal: input.main_goal,
      phase: input.phase,
      tasks: input.tasks,
      user_input: input.user_input,
      triggerType: input.triggerType,
    }),
  }).catch((error) => ({
    ok: false,
    status: 0,
    json: async () => ({ success: false, error: `Unable to reach ${DEFAULT_BASE_URL}/api/ai/guidance: ${error.message}` }),
  }));

  const body = await response.json();
  return body;
}

function evaluateScenario(scenario, output) {
  const warnings = [];
  const failures = [];
  const nextStep = output.next_step.trim();
  const nextStepLower = nextStep.toLowerCase();
  const summary = output.summary.trim();
  const summaryLower = summary.toLowerCase();
  const taskTexts = output.suggested_tasks.map((task) => task.trim());
  const normalizedTasks = taskTexts.map((task) => task.toLowerCase());

  if (hasWeakVerb(nextStepLower)) {
    failures.push('`next_step` still contains a weak or hesitant verb.');
  }

  if (hasMultipleActions(nextStepLower)) {
    failures.push('`next_step` appears to contain multiple actions instead of one decisive move.');
  }

  if (isVagueNextStep(nextStepLower)) {
    warnings.push('`next_step` still feels vague or underspecified.');
  }

  if (isLowActionability(nextStepLower)) {
    failures.push('`next_step` is too abstract to execute immediately.');
  }

  const alignedTask = findAlignedTask(nextStepLower, scenario.dossierState.tasks);
  if (scenario.dossierState.tasks.length > 0 && alignedTask === null) {
    warnings.push('No explicit alignment to an existing task was detected.');
  }

  if (scenario.dossierState.tasks.length > 0 && scenario.userState !== 'starting_from_zero' && !referencesExistingWork(nextStepLower, scenario.dossierState.tasks)) {
    warnings.push('The next move does not clearly anchor to the current queue.');
  }

  if (scenario.dossierState.progressSignal === 'momentum_visible' && isMomentumRegression(nextStepLower)) {
    failures.push('Momentum regression detected: the next step falls back into planning instead of continuation.');
  }

  if (scenario.dossierState.progressSignal === 'momentum_visible' && !preservesMomentum(nextStepLower, alignedTask)) {
    warnings.push('Momentum exists, but the next step does not clearly push continuation or completion.');
  }

  const genericTaskCount = taskTexts.filter((task) => isGenericSuggestedTask(task.toLowerCase())).length;
  if (genericTaskCount > 0) {
    warnings.push(`${genericTaskCount} suggested task(s) still look generic.`);
  }

  const unsupportedTaskCount = taskTexts.filter((task) => !supportsNextStep(task, nextStep, alignedTask)).length;
  if (unsupportedTaskCount > 0) {
    warnings.push(`${unsupportedTaskCount} suggested task(s) do not clearly support the next step.`);
  }

  if (!summaryReducesUncertaintyOrCreatesMovement(summaryLower, scenario)) {
    warnings.push('The situation read does not clearly reduce uncertainty or reinforce movement.');
  }

  if (isGenericSummary(summaryLower)) {
    warnings.push('The situation read still sounds generic.');
  }

  if (isRiskSensitiveScenario(scenario) && !containsCautionSignal(`${summaryLower} ${nextStepLower} ${normalizedTasks.join(' ')}`)) {
    warnings.push('This looks risk-sensitive, but the guidance does not signal enough caution or control.');
  }

  if (scenario.userState === 'too_many_tasks' && alignedTask === null) {
    failures.push('Task overload scenario was not collapsed into one clear current objective.');
  }

  const duplicatedTasks = taskTexts.filter((task) => normalize(task) === normalize(nextStep));
  if (duplicatedTasks.length > 0) {
    failures.push('A suggested task duplicates `next_step` instead of supporting it.');
  }

  const status = failures.length > 0
    ? 'FAIL'
    : warnings.length > 0
      ? 'WARN'
      : 'PASS';

  return { status, warnings, failures };
}

function printScenarioHeader(scenario) {
  console.log(`[${scenario.id}] ${scenario.title}`);
  console.log(`Phase: ${scenario.phase} | User state: ${scenario.userState}`);
  console.log(`Tasks: ${scenario.dossierState.tasks.length} | Completed: ${scenario.dossierState.completedTaskCount} | Progress: ${scenario.dossierState.progressSignal}`);
  console.log(`Hesitation: ${scenario.dossierState.hesitationMoment}`);
}

function getScenarioFilter(args) {
  const match = args.find((arg) => arg.startsWith('--scenario='));
  return match ? match.split('=')[1] : null;
}

function getMode(args) {
  const match = args.find((arg) => arg.startsWith('--mode='));
  const mode = match ? match.split('=')[1] : DEFAULT_MODE;
  return mode === 'local' ? 'local' : 'live';
}

function hasWeakVerb(nextStep) {
  return WEAK_TERMS.some((term) => nextStep.includes(term));
}

function hasMultipleActions(nextStep) {
  return /\band\b|\bthen\b|;/.test(nextStep);
}

function isVagueNextStep(nextStep) {
  return [
    'next action',
    'move things forward',
    'make progress',
    'continue',
    'work on it',
    'something concrete',
    'the biggest unknown',
  ].some((phrase) => nextStep.includes(phrase)) || !hasStrongLeadingVerb(nextStep);
}

function isLowActionability(nextStep) {
  const wordCount = nextStep.split(/\s+/).filter(Boolean).length;
  return wordCount < 4
    || /^(identify|define|choose|capture)\s+(the|a)\s+(biggest|right|best|key)\b/.test(nextStep);
}

function hasStrongLeadingVerb(nextStep) {
  return STRONG_VERBS.some((verb) => nextStep.startsWith(verb));
}

function findAlignedTask(nextStep, tasks) {
  return tasks.find((task) => {
    const normalizedTask = normalize(task);
    return nextStep.includes(normalizedTask) || normalizedTask.includes(normalize(nextStep));
  }) ?? null;
}

function referencesExistingWork(nextStep, tasks) {
  return tasks.some((task) => nextStep.includes(normalize(task)));
}

function isMomentumRegression(nextStep) {
  return [
    'plan',
    'review',
    'assess',
    'explore',
    'rethink',
    'brainstorm',
  ].some((term) => nextStep.includes(term));
}

function isGenericSuggestedTask(task) {
  return [
    'review the context',
    'assess the situation',
    'consider the options',
    'continue working',
    'summarize the current situation',
    'choose the next step',
  ].some((phrase) => task.includes(phrase));
}

function preservesMomentum(nextStep, alignedTask) {
  if (alignedTask && nextStep.includes(normalize(alignedTask))) {
    return true;
  }

  return /^(complete|finish|send|confirm|ship|finalize|close|deliver)\b/.test(nextStep);
}

function summaryReducesUncertaintyOrCreatesMovement(summary, scenario) {
  if (scenario.phase === 'Understanding') {
    return /(uncertainty|unknown|assumption|evidence|proof|clarity|signal)/.test(summary);
  }

  if (scenario.phase === 'Structuring') {
    return /(sequence|priority|owner|dependency|structure|order|scope)/.test(summary);
  }

  return /(momentum|progress|execution|blocker|pace|visible move|traction)/.test(summary);
}

function isGenericSummary(summary) {
  return [
    'this is the right time',
    'the work is moving',
    'progress is happening',
    'you are making progress',
    'the next move matters',
  ].some((phrase) => summary.includes(phrase));
}

function isRiskSensitiveScenario(scenario) {
  const text = `${scenario.dossierState.situation} ${scenario.dossierState.main_goal}`.toLowerCase();
  return /(compliance|legal|security|risk|privacy|safety|regulatory|audit)/.test(text);
}

function containsCautionSignal(text) {
  return /(risk|protect|confirm|verify|compliance|safe|safely|constraint|guardrail|review)/.test(text);
}

function supportsNextStep(task, nextStep, alignedTask) {
  const normalizedTask = normalize(task);
  const normalizedNextStep = normalize(nextStep);

  if (alignedTask && normalizedTask.includes(normalize(alignedTask))) {
    return true;
  }

  return STRONG_VERBS.some((verb) => normalizedTask.startsWith(verb))
    && !normalizedTask.includes(normalizedNextStep);
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/[.!?"]+/g, '');
}

const mode = getMode(process.argv.slice(2));

void main();
