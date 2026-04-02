const {
  trainerQualityScenarios,
  strongOutputPatterns,
  commonFailurePatterns,
} = require('../src/lib/ai/trainer-quality-fixtures.json');

const DEFAULT_BASE_URL = process.env.GUIDANCE_CHECK_BASE_URL || 'http://localhost:3000';
const DEFAULT_MODE = 'live';

async function main() {
  const args = process.argv.slice(2);
  const mode = getMode(args);
  const scenarioFilter = getScenarioFilter(args);
  const scenarios = scenarioFilter
    ? trainerQualityScenarios.filter((scenario) => scenario.id === scenarioFilter)
    : trainerQualityScenarios;

  if (scenarios.length === 0) {
    console.error(`No trainer quality scenario found for "${scenarioFilter}".`);
    process.exitCode = 1;
    return;
  }

  console.log('');
  console.log('Trainer Quality Regression Runner');
  console.log('=================================');
  console.log(`Base URL: ${DEFAULT_BASE_URL}`);
  console.log(`Mode: ${mode}`);
  console.log(`Scenarios: ${scenarios.length}`);
  if (mode === 'local') {
    console.log('Note: local mode validates structural trainer differentiation only. Live mode remains the source of truth for real provider/model behavior.');
  }
  console.log('');

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  const groupOutputs = new Map();

  for (const scenario of scenarios) {
    const routeResult = await requestTrainer(scenario.input, mode);

    if (!routeResult.success || !routeResult.data) {
      failCount += 1;
      printScenarioHeader(scenario);
      console.log('Status: FAIL');
      console.log(`Error: ${routeResult.error || 'Unknown trainer failure'}`);
      console.log('');
      continue;
    }

    const evaluation = evaluateScenario(scenario, routeResult.data);
    const similarityWarnings = collectSimilarityWarnings(
      scenario,
      routeResult.data,
      groupOutputs
    );
    evaluation.warnings.push(...similarityWarnings);
    evaluation.status = evaluation.failures.length > 0
      ? 'FAIL'
      : evaluation.warnings.length > 0
        ? 'WARN'
        : 'PASS';

    if (evaluation.status === 'PASS') {
      passCount += 1;
    } else if (evaluation.status === 'WARN') {
      warnCount += 1;
    } else {
      failCount += 1;
    }

    printScenarioHeader(scenario);
    console.log(`Status: ${evaluation.status}`);
    console.log(`Focus label: ${routeResult.data.focus_label}`);
    console.log(`Headline: ${routeResult.data.headline}`);
    console.log(`Key insight: ${routeResult.data.key_insight}`);
    console.log(`Recommendation: ${routeResult.data.recommendation}`);
    console.log(`Next move: ${routeResult.data.next_move}`);
    console.log(`Confidence: ${routeResult.data.confidence_label}`);
    if (routeResult.data.caution) {
      console.log(`Caution: ${routeResult.data.caution}`);
    }
    if (routeResult.data.message_draft) {
      console.log(`Message draft: ${routeResult.data.message_draft}`);
    }
    console.log('Support points:');
    for (const point of routeResult.data.support_points) {
      console.log(`- ${point}`);
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

    console.log('Expected angle checks:');
    for (const angle of scenario.expected.angle) {
      console.log(`- ${angle}`);
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

async function requestTrainer(input, mode) {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/ai/trainer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-guidance-mode': mode,
    },
    body: JSON.stringify(input),
  }).catch((error) => ({
    ok: false,
    status: 0,
    json: async () => ({ success: false, error: `Unable to reach ${DEFAULT_BASE_URL}/api/ai/trainer: ${error.message}` }),
  }));

  return response.json();
}

function evaluateScenario(scenario, output) {
  const warnings = [];
  const failures = [];
  const combined = [
    output.headline,
    output.key_insight,
    output.recommendation,
    output.next_move,
    ...(output.support_points || []),
    output.caution || '',
    output.message_draft || '',
  ].join(' ').toLowerCase();
  const nextMove = (output.next_move || '').trim().toLowerCase();

  if (isVagueNextMove(nextMove)) {
    failures.push('`next_move` is vague, abstract, or too easy to misinterpret.');
  }

  if (isGenericOutput(combined)) {
    warnings.push('The trainer output still sounds generic.');
  }

  if (!matchesTrainerAngle(scenario.trainer, output, combined)) {
    failures.push(`The ${scenario.trainer} trainer does not appear to be behaving from the right angle.`);
  }

  if (!nextMoveFitsTrainerRole(scenario.trainer, nextMove, combined)) {
    failures.push(`\`next_move\` does not fit the ${scenario.trainer} trainer role cleanly.`);
  }

  if (scenario.trainer === 'communication' && !output.message_draft && !looksCommunicationAware(combined)) {
    warnings.push('Communication output does not clearly provide dossier-aware phrasing support.');
  }

  if (scenario.trainer === 'risk' && isAlarmist(combined)) {
    warnings.push('Risk output sounds too alarmist instead of measured.');
  }

  if (scenario.trainer === 'strategy' && !narrowsDirection(combined)) {
    warnings.push('Strategy output is not narrowing the mission enough.');
  }

  if (scenario.trainer === 'execution' && isMotivationalInsteadOfOperational(combined)) {
    warnings.push('Execution output sounds motivational instead of operational.');
  }

  return {
    status: failures.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS',
    warnings,
    failures,
  };
}

function collectSimilarityWarnings(scenario, output, groupOutputs) {
  const groupEntries = groupOutputs.get(scenario.group_id) ?? [];
  const warnings = [];

  for (const entry of groupEntries) {
    const overlap = getSimilarityScore(
      `${entry.output.key_insight} ${entry.output.recommendation} ${entry.output.next_move}`,
      `${output.key_insight} ${output.recommendation} ${output.next_move}`
    );

    if (overlap >= 0.66) {
      warnings.push(`Similarity drift: ${scenario.trainer} reads too similarly to ${entry.trainer} for the same dossier context.`);
    }
  }

  groupEntries.push({ trainer: scenario.trainer, output });
  groupOutputs.set(scenario.group_id, groupEntries);
  return warnings;
}

function matchesTrainerAngle(trainer, output, combined) {
  switch (trainer) {
    case 'strategy':
      return /(direction|tradeoff|leverage|sequence|narrow|priority|position)/.test(combined);
    case 'execution':
      return /(execute|complete|remove blocker|friction|done|sequence|immediate|move now)/.test(combined);
    case 'risk':
      return /(risk|exposure|watchpoint|verify|confirm|protect|contain|downside|assumption)/.test(combined);
    case 'communication':
      return looksCommunicationAware(combined);
  }
}

function nextMoveFitsTrainerRole(trainer, nextMove, combined) {
  switch (trainer) {
    case 'strategy':
      return /^(choose|define|narrow|decide|align)\b/.test(nextMove) && /(tradeoff|direction|priority|leverage|sequence|position)/.test(combined);
    case 'execution':
      return /^(complete|remove|define|confirm|send|write|capture|finish)\b/.test(nextMove);
    case 'risk':
      return /^(confirm|verify|check|protect|contain|review)\b/.test(nextMove);
    case 'communication':
      return /^(write|shape|draft|send|align|prepare|respond)\b/.test(nextMove);
  }
}

function looksCommunicationAware(text) {
  return /(message|tone|position|positioning|stakeholder|customer|response|reply|align|friction|communicat|say|phrase)/.test(text);
}

function narrowsDirection(text) {
  return /(narrow|tradeoff|leverage|priority|sequence|single mission|strongest path|reduce competing)/.test(text);
}

function isMotivationalInsteadOfOperational(text) {
  return /(keep going|momentum|you can do this|push forward|stay strong)/.test(text) && !/(blocker|sequence|done|complete|confirm|remove)/.test(text);
}

function isAlarmist(text) {
  return /(disaster|catastrophic|urgent danger|severe failure|major crisis)/.test(text);
}

function isVagueNextMove(nextMove) {
  return !nextMove
    || /^(improve|help|clarify|refine|review|consider)\b/.test(nextMove)
    || /(something|somehow|better|more clearly)$/.test(nextMove)
    || nextMove.split(/\s+/).filter(Boolean).length < 4;
}

function isGenericOutput(text) {
  return [
    'move things forward',
    'keep momentum',
    'make progress',
    'improve communication',
    'clarify the plan',
  ].some((phrase) => text.includes(phrase));
}

function getSimilarityScore(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const union = new Set([...leftTokens, ...rightTokens]);
  let intersection = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  }

  return union.size === 0 ? 0 : intersection / union.size;
}

function tokenize(value) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length >= 5)
  );
}

function printScenarioHeader(scenario) {
  console.log(`[${scenario.id}] ${scenario.title}`);
  console.log(`Trainer: ${scenario.trainer} | Group: ${scenario.group_id}`);
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

void main();
