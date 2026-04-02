/**
 * Dossier task persistence tests
 * Validates that task changes are persisted to the store
 */

require('../helpers/register-ts-runtime.cjs');

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const {
  createStoredDossier,
  updateStoredDossier,
  getStoredDossierById,
} = require('../../src/lib/dossiers/store.ts');

describe('dossier task persistence', () => {
  let testDossierId;

  before(async () => {
    // Create a test dossier for persistence tests
    const created = await createStoredDossier({
      id: `test-persist-${Date.now()}`,
      title: 'Task Persistence Test',
      situation: 'Testing task persistence',
      main_goal: 'Verify tasks persist',
      suggested_tasks: ['Initial task'],
      phase: 'Understanding',
    });
    testDossierId = created.id;
  });

  it('updateStoredDossier updates tasks and persists them', async () => {
    // Update with new tasks
    const updated = await updateStoredDossier(testDossierId, {
      tasks: ['Initial task', 'Added task 1', 'Added task 2'],
      progress: 33,
      lastActivity: 'Tasks updated via persistence test',
    });

    assert.ok(updated, 'Update should return the updated dossier');
    assert.equal(updated.tasks.length, 3, 'Should have 3 tasks after update');
    assert.deepEqual(
      updated.tasks,
      ['Initial task', 'Added task 1', 'Added task 2'],
      'Tasks should match what was set'
    );
    assert.equal(updated.progress, 33, 'Progress should be updated');

    // Verify persistence by fetching fresh
    const fetched = await getStoredDossierById(testDossierId);
    assert.ok(fetched, 'Should fetch the persisted dossier');
    assert.deepEqual(
      fetched.tasks,
      ['Initial task', 'Added task 1', 'Added task 2'],
      'Tasks should persist after re-fetch'
    );
    assert.equal(fetched.progress, 33, 'Progress should persist after re-fetch');
  });

  it('updateStoredDossier returns null for non-existent dossier', async () => {
    const result = await updateStoredDossier('non-existent-id-12345', {
      tasks: ['New task'],
    });

    assert.equal(result, null, 'Should return null for non-existent dossier');
  });

  it('updateStoredDossier sanitizes oversized task strings', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-sanitize-${Date.now()}`,
      title: 'Sanitize Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    // Create an oversized task (over 500 chars)
    const oversizedTask = 'x'.repeat(600);

    const updated = await updateStoredDossier(created.id, {
      tasks: [oversizedTask, 'Valid task'],
    });

    assert.equal(updated.tasks[0].length, 500, 'Oversized task should be truncated to 500 chars');
    assert.equal(updated.tasks[1], 'Valid task', 'Valid task should remain unchanged');
  });

  it('updateStoredDossier validates phase values', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-phase-${Date.now()}`,
      title: 'Phase Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    // Update with invalid phase
    const updated = await updateStoredDossier(created.id, {
      phase: 'InvalidPhase',
    });

    assert.equal(updated.phase, 'Understanding', 'Invalid phase should default to existing value');

    // Update with valid phase
    const updated2 = await updateStoredDossier(created.id, {
      phase: 'Executing',
    });

    assert.equal(updated2.phase, 'Executing', 'Valid phase should be accepted');
  });

  it('updateStoredDossier persists completedTasks', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-completed-${Date.now()}`,
      title: 'Completed Tasks Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: ['Task 1', 'Task 2', 'Task 3'],
      phase: 'Understanding',
    });

    // Update with completed tasks
    const updated = await updateStoredDossier(created.id, {
      completedTasks: ['Task 1', 'Task 3'],
      progress: 67,
    });

    assert.ok(updated.completedTasks, 'Should have completedTasks array');
    assert.equal(updated.completedTasks.length, 2, 'Should have 2 completed tasks');
    assert.ok(updated.completedTasks.includes('Task 1'), 'Should include Task 1');
    assert.ok(updated.completedTasks.includes('Task 3'), 'Should include Task 3');

    // Verify persistence by fetching fresh
    const fetched = await getStoredDossierById(created.id);
    assert.ok(fetched.completedTasks, 'Fetched dossier should have completedTasks');
    assert.deepEqual(
      fetched.completedTasks.sort(),
      ['Task 1', 'Task 3'].sort(),
      'Completed tasks should persist after re-fetch'
    );
  });

  it('updateStoredDossier sanitizes oversized completed task strings', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-completed-sanitize-${Date.now()}`,
      title: 'Completed Sanitize Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    const oversizedTask = 'x'.repeat(600);

    const updated = await updateStoredDossier(created.id, {
      completedTasks: [oversizedTask, 'Valid completed task'],
    });

    assert.equal(updated.completedTasks[0].length, 500, 'Oversized completed task should be truncated');
    assert.equal(updated.completedTasks[1], 'Valid completed task', 'Valid completed task should remain');
  });

  it('updateStoredDossier persists chatHistory', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-chat-${Date.now()}`,
      title: 'Chat History Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    const chatMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'What should I do next?',
        timestamp: new Date().toISOString(),
        messageType: 'response',
      },
      {
        id: 'msg-2',
        role: 'ai',
        content: {
          summary: 'Focus on the core task',
          next_step: 'Start with the first priority',
          suggested_tasks: ['Task 1', 'Task 2'],
        },
        timestamp: new Date().toISOString(),
        messageType: 'initial',
      },
    ];

    const updated = await updateStoredDossier(created.id, {
      chatHistory: chatMessages,
    });

    assert.ok(updated.chatHistory, 'Should have chatHistory array');
    assert.equal(updated.chatHistory.length, 2, 'Should have 2 chat messages');
    assert.equal(updated.chatHistory[0].role, 'user', 'First message should be from user');
    assert.equal(updated.chatHistory[1].role, 'ai', 'Second message should be from AI');

    // Verify persistence by fetching fresh
    const fetched = await getStoredDossierById(created.id);
    assert.ok(fetched.chatHistory, 'Fetched dossier should have chatHistory');
    assert.equal(fetched.chatHistory.length, 2, 'Should persist 2 messages after re-fetch');
    assert.equal(fetched.chatHistory[0].content, 'What should I do next?', 'User message content should persist');
    assert.equal(fetched.chatHistory[1].content.summary, 'Focus on the core task', 'AI content should persist');
  });

  it('updateStoredDossier sanitizes oversized chat messages', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-chat-sanitize-${Date.now()}`,
      title: 'Chat Sanitize Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    const oversizedContent = 'x'.repeat(15000);

    const updated = await updateStoredDossier(created.id, {
      chatHistory: [
        {
          id: 'msg-oversized',
          role: 'user',
          content: oversizedContent,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    assert.equal(updated.chatHistory[0].content.length, 10000, 'Oversized message should be truncated to 10000 chars');
  });

  it('updateStoredDossier limits chat history to 100 messages', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-chat-limit-${Date.now()}`,
      title: 'Chat Limit Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    const manyMessages = Array.from({ length: 150 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'ai',
      content: `Message ${i}`,
      timestamp: new Date().toISOString(),
    }));

    const updated = await updateStoredDossier(created.id, {
      chatHistory: manyMessages,
    });

    assert.equal(updated.chatHistory.length, 100, 'Chat history should be limited to 100 messages');
  });

  it('updateStoredDossier persists phase changes', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-phase-persist-${Date.now()}`,
      title: 'Phase Persist Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    assert.equal(created.phase, 'Understanding', 'Initial phase should be Understanding');

    // Update phase to Structuring
    const updated = await updateStoredDossier(created.id, {
      phase: 'Structuring',
    });

    assert.equal(updated.phase, 'Structuring', 'Phase should be updated to Structuring');

    // Verify persistence by fetching fresh
    const fetched = await getStoredDossierById(created.id);
    assert.equal(fetched.phase, 'Structuring', 'Phase should persist after re-fetch');

    // Update phase to Executing
    const updated2 = await updateStoredDossier(created.id, {
      phase: 'Executing',
    });

    assert.equal(updated2.phase, 'Executing', 'Phase should be updated to Executing');

    // Update phase to Completed
    const updated3 = await updateStoredDossier(created.id, {
      phase: 'Completed',
    });

    assert.equal(updated3.phase, 'Completed', 'Phase should be updated to Completed');
  });

  it('updateStoredDossier rejects invalid phase values', async () => {
    // Create a new dossier for this test
    const created = await createStoredDossier({
      id: `test-phase-invalid-${Date.now()}`,
      title: 'Phase Invalid Test',
      situation: 'Test',
      main_goal: 'Test',
      suggested_tasks: [],
      phase: 'Understanding',
    });

    // Try to set invalid phase
    const updated = await updateStoredDossier(created.id, {
      phase: 'InvalidPhase',
    });

    assert.equal(updated.phase, 'Understanding', 'Invalid phase should default to Understanding');
  });
});

console.log('Dossier task persistence validation tests loaded.');
