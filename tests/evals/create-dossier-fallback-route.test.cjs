const assert = require('assert');
require('../helpers/register-ts-runtime.cjs');

const orchestrator = require('../../src/lib/ai/orchestrator');
const store = require('../../src/lib/dossiers/store');
const { POST } = require('../../app/api/ai/create-dossier/route');

async function runCreateDossierFallbackRouteTests() {
  console.log('Create dossier fallback route tests running...');

  const originalRun = orchestrator.runAIOrchestrator;
  const originalCreate = store.createStoredDossier;

  const calls = [];

  orchestrator.runAIOrchestrator = async (_input, options = {}) => {
    const mode = options.mode ?? 'live';
    calls.push(mode);

    if (mode === 'local') {
      return {
        success: true,
        data: {
          summary: 'Fallback summary',
          next_step: 'Complete the first unblock now.',
          suggested_tasks: ['Write the blocker', 'Define done', 'Confirm next unlock'],
        },
      };
    }

    return { success: false, error: 'provider unavailable' };
  };

  store.createStoredDossier = async (payload) => ({
    id: 'test-id',
    title: payload.title,
    situation: payload.situation,
    main_goal: payload.main_goal,
    phase: payload.phase,
    tasks: payload.suggested_tasks,
    suggested_tasks: payload.suggested_tasks,
  });

  const mockRequest = {
    async json() {
      return {
        situation: 'Provider is offline',
        goal: 'Ship the release',
        urgency: 'high',
      };
    },
  };

  const response = await POST(mockRequest);
  const body = await response.json();

  assert.equal(response.status, 200, 'fallback path should return HTTP 200');
  assert.ok(body.success, 'response should indicate success');
  assert.equal(body.id, 'test-id', 'stored dossier id should be returned');
  assert.ok(body.usedFallback, 'response should indicate fallback was used');
  assert.ok(calls.includes('live'), 'live run should be attempted first');
  assert.ok(calls.includes('local'), 'local fallback should be used after failure');

  orchestrator.runAIOrchestrator = originalRun;
  store.createStoredDossier = originalCreate;

  console.log('Create dossier fallback route tests passed.');
}

module.exports = {
  runCreateDossierFallbackRouteTests,
};
