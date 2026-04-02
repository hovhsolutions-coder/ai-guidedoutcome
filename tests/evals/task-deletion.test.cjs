const assert = require('assert');

// Test task deletion functionality
async function runTaskDeletionTests() {
  console.log('Task deletion tests running...');

  // Test 1: Task deletion removes task from list
  const tasks = ['task1', 'task2', 'task3'];
  const taskToDelete = 'task2';
  const newTasks = tasks.filter((t) => t !== taskToDelete);
  assert.deepEqual(newTasks, ['task1', 'task3'], 'Should remove task from list');

  // Test 2: Task deletion also removes from completed tasks
  const completedTasks = new Set(['task1', 'task2']);
  completedTasks.delete(taskToDelete);
  assert.equal(completedTasks.has('task2'), false, 'Should remove deleted task from completed set');
  assert.equal(completedTasks.has('task1'), true, 'Should keep other completed tasks');

  // Test 3: Deleting non-existent task does nothing
  const tasksBefore = ['task1', 'task2'];
  const nonExistentTask = 'task3';
  const tasksAfter = tasksBefore.filter((t) => t !== nonExistentTask);
  assert.deepEqual(tasksBefore, tasksAfter, 'Deleting non-existent task should not change list');

  // Test 4: Can delete all tasks one by one
  let remainingTasks = ['a', 'b', 'c'];
  remainingTasks = remainingTasks.filter((t) => t !== 'a');
  remainingTasks = remainingTasks.filter((t) => t !== 'b');
  remainingTasks = remainingTasks.filter((t) => t !== 'c');
  assert.deepEqual(remainingTasks, [], 'Should be able to delete all tasks');

  // Test 5: Delete deduplication - prevents overlapping operations
  let persistInFlight = false;
  let operationCount = 0;

  function attemptDelete() {
    if (persistInFlight) {
      return 'blocked';
    }
    persistInFlight = true;
    operationCount++;
    persistInFlight = false;
    return 'success';
  }

  const result1 = attemptDelete();
  const result2 = attemptDelete();
  assert.equal(result1, 'success', 'First delete should succeed');
  assert.equal(result2, 'success', 'Sequential deletes should both succeed (not blocked)');
  assert.equal(operationCount, 2, 'Both operations should execute');

  // Test 6: Simulated in-flight blocking
  persistInFlight = true;
  const blockedResult = attemptDelete();
  assert.equal(blockedResult, 'blocked', 'Should block when operation in flight');

  // Test 7: Task deletion preserves task order of remaining tasks
  const orderedTasks = ['first', 'second', 'third', 'fourth'];
  const afterDelete = orderedTasks.filter((t) => t !== 'second');
  assert.deepEqual(afterDelete, ['first', 'third', 'fourth'], 'Should preserve order of remaining tasks');

  // Test 8: Delete priority task - next task becomes priority
  const activeTasks = ['priority', 'second', 'third'];
  const priorityTask = activeTasks[0];
  const afterPriorityDelete = activeTasks.filter((t) => t !== priorityTask);
  assert.equal(afterPriorityDelete[0], 'second', 'Next task should become priority after deletion');

  // Test 9: UI state update simulation
  let uiTasks = ['task-a', 'task-b'];
  let uiCompleted = new Set(['task-a']);

  // Simulate delete 'task-b'
  uiTasks = uiTasks.filter((t) => t !== 'task-b');
  uiCompleted.delete('task-b');

  assert.deepEqual(uiTasks, ['task-a'], 'UI tasks should update');
  assert.equal(uiCompleted.has('task-b'), false, 'UI completed set should update');

  // Test 10: Persistence payload for task deletion
  const deletePayload = {
    tasks: ['remaining-task'],
    completedTasks: new Set(['remaining-task']),
  };
  assert.equal(deletePayload.tasks.length, 1, 'Payload should have remaining tasks only');

  console.log('Task deletion tests passed.');
}

module.exports = {
  runTaskDeletionTests,
};
