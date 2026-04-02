require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { createStoredDossier } = require('../../src/lib/dossiers/store.ts');

async function runDossierStoreValidationTests() {
  // Helper to create a memory-based test environment
  const testDossier = {
    title: 'Test Dossier',
    situation: 'Test situation',
    main_goal: 'Test goal',
    phase: 'Understanding',
    suggested_tasks: ['Task 1', 'Task 2'],
  };

  // Test: Valid dossier creates successfully
  const validDossier = await createStoredDossier(testDossier);
  assert.equal(validDossier.title, 'Test Dossier');
  assert.equal(validDossier.situation, 'Test situation');
  assert.equal(validDossier.main_goal, 'Test goal');
  assert.equal(validDossier.phase, 'Understanding');
  // Tasks are now returned as Task objects with full metadata
  assert.equal(validDossier.tasks.length, 2);
  assert.equal(validDossier.tasks[0].name, 'Task 1');
  assert.equal(validDossier.tasks[1].name, 'Task 2');
  assert.ok(validDossier.id, 'should have generated id');
  assert.equal(validDossier.progress, 0);

  // Test: Missing required fields get safe defaults
  const missingFieldsDossier = await createStoredDossier({
    title: '',
    situation: '',
    main_goal: '',
    phase: 'InvalidPhase',
    suggested_tasks: [],
  });
  assert.equal(missingFieldsDossier.title, 'New Dossier');
  assert.equal(missingFieldsDossier.situation, 'No situation provided');
  assert.equal(missingFieldsDossier.main_goal, 'No goal specified');
  assert.equal(missingFieldsDossier.phase, 'Understanding');
  assert.deepEqual(missingFieldsDossier.tasks, []);

  // Test: Whitespace-only strings treated as empty
  const whitespaceDossier = await createStoredDossier({
    title: '   ',
    situation: '  \n\t  ',
    main_goal: 'Valid Goal',
    phase: 'Understanding',
    suggested_tasks: [],
  });
  assert.equal(whitespaceDossier.title, 'New Dossier');
  assert.equal(whitespaceDossier.situation, 'No situation provided');
  assert.equal(whitespaceDossier.main_goal, 'Valid Goal');

  // Test: Non-string fields get safe defaults
  const invalidTypesDossier = await createStoredDossier({
    title: 123,
    situation: null,
    main_goal: undefined,
    phase: 'Understanding',
    suggested_tasks: [],
  });
  assert.equal(invalidTypesDossier.title, 'New Dossier');
  assert.equal(invalidTypesDossier.situation, 'No situation provided');
  assert.equal(invalidTypesDossier.main_goal, 'No goal specified');

  // Test: Oversized strings are truncated
  const oversizedTitle = 'A'.repeat(10000);
  const oversizedDossier = await createStoredDossier({
    title: oversizedTitle,
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Understanding',
    suggested_tasks: [],
  });
  assert.equal(oversizedDossier.title.length, 5000);
  assert.equal(oversizedDossier.title, 'A'.repeat(5000));

  // Test: Invalid tasks array filtered
  const invalidTasksDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Understanding',
    suggested_tasks: ['Valid', 123, null, 'Also Valid', {}, ''],
  });
  assert.equal(invalidTasksDossier.tasks.length, 2);
  assert.equal(invalidTasksDossier.tasks[0].name, 'Valid');
  assert.equal(invalidTasksDossier.tasks[1].name, 'Also Valid');

  // Test: Too many tasks truncated
  const manyTasks = Array.from({ length: 150 }, (_, i) => `Task ${i}`);
  const manyTasksDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Understanding',
    suggested_tasks: manyTasks,
  });
  assert.equal(manyTasksDossier.tasks.length, 100);
  assert.equal(manyTasksDossier.tasks[0].name, 'Task 0');
  assert.equal(manyTasksDossier.tasks[99].name, 'Task 99');

  // Test: Oversized tasks truncated
  const longTask = 'B'.repeat(1000);
  const longTaskDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Understanding',
    suggested_tasks: [longTask],
  });
  assert.equal(longTaskDossier.tasks[0].name.length, 500);

  // Test: Invalid phase defaults to Understanding
  const invalidPhaseDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'NotARealPhase',
    suggested_tasks: [],
  });
  assert.equal(invalidPhaseDossier.phase, 'Understanding');

  // Test: Valid phases preserved
  const structuringDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Structuring',
    suggested_tasks: [],
  });
  assert.equal(structuringDossier.phase, 'Structuring');

  const executingDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Executing',
    suggested_tasks: [],
  });
  assert.equal(executingDossier.phase, 'Executing');

  const completedDossier = await createStoredDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    phase: 'Completed',
    suggested_tasks: [],
  });
  assert.equal(completedDossier.phase, 'Completed');
}

module.exports = {
  runDossierStoreValidationTests,
};
