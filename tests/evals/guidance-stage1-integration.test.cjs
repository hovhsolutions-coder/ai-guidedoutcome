require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');

const orchestrator = require('../../src/lib/ai/orchestrator.ts');
const { POST } = require('../../app/api/ai/guidance/route.ts');

async function runStage1IntegrationTest() {
  const originalRunAIOrchestrator = orchestrator.runAIOrchestrator;

  try {
    orchestrator.runAIOrchestrator = async () => ({
      success: true,
      data: {
        summary: 'Simple summary',
        next_step: 'Do the thing now',
        suggested_tasks: ['Task A', 'Task B'],
      },
    });

    const req = new NextRequest('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guidance-mode': 'local',
      },
      body: JSON.stringify({
        raw_input: 'Stage1 test input',
        main_goal: 'Test goal',
        intakeAnswers: { foo: 'bar' },
        triggerType: 'manual',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const body = await res.json();

    // Minimal assertions for Stage 1
    assert.equal(body.success, true);
    assert.ok(body.data.continuation, 'continuation must exist');
    assert.ok('detectedDomain' in body.data.continuation, 'detectedDomain present');
    assert.ok('activeMode' in body.data.continuation, 'activeMode present');
    assert.ok('shouldOfferDossier' in body.data.continuation, 'shouldOfferDossier present');

    console.log('Stage1 integration test passed');
  } finally {
    orchestrator.runAIOrchestrator = originalRunAIOrchestrator;
  }
}

if (require.main === module) {
  runStage1IntegrationTest().catch((err) => {
    console.error('Stage1 test failed:', err);
    process.exit(1);
  });
}

module.exports = { runStage1IntegrationTest };
