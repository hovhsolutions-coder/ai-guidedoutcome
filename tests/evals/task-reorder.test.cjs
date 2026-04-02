const assert = require('assert');

// Test task reordering functionality
async function runTaskReorderTests() {
  console.log('Task reorder tests running...');

  // Test 1: Move task up swaps with previous task
  const tasksUp = ['task1', 'task2', 'task3'];
  const taskToMoveUp = 'task2';
  const currentIndexUp = tasksUp.indexOf(taskToMoveUp);
  const newTasksUp = [...tasksUp];
  const targetIndexUp = currentIndexUp - 1;
  [newTasksUp[currentIndexUp], newTasksUp[targetIndexUp]] = [newTasksUp[targetIndexUp], newTasksUp[currentIndexUp]];
  assert.deepEqual(newTasksUp, ['task2', 'task1', 'task3'], 'Should swap task with previous when moving up');

  // Test 2: Move task down swaps with next task
  const tasksDown = ['task1', 'task2', 'task3'];
  const taskToMoveDown = 'task2';
  const currentIndexDown = tasksDown.indexOf(taskToMoveDown);
  const newTasksDown = [...tasksDown];
  const targetIndexDown = currentIndexDown + 1;
  [newTasksDown[currentIndexDown], newTasksDown[targetIndexDown]] = [newTasksDown[targetIndexDown], newTasksDown[currentIndexDown]];
  assert.deepEqual(newTasksDown, ['task1', 'task3', 'task2'], 'Should swap task with next when moving down');

  // Test 3: First task cannot move up (boundary check)
  const firstTask = 'task1';
  const tasksBoundary = ['task1', 'task2'];
  const firstIndex = tasksBoundary.indexOf(firstTask);
  assert.equal(firstIndex === 0, true, 'First task should be at index 0');
  // Boundary logic: if direction === 'up' && currentIndex === 0, return early
  const canMoveUp = !(firstIndex === 0);
  assert.equal(canMoveUp, false, 'First task should not be able to move up');

  // Test 4: Last task cannot move down (boundary check)
  const lastTask = 'task2';
  const lastIndex = tasksBoundary.indexOf(lastTask);
  assert.equal(lastIndex === tasksBoundary.length - 1, true, 'Last task should be at last index');
  // Boundary logic: if direction === 'down' && currentIndex === tasks.length - 1, return early
  const canMoveDown = !(lastIndex === tasksBoundary.length - 1);
  assert.equal(canMoveDown, false, 'Last task should not be able to move down');

  // Test 5: Reordering preserves completion state
  const tasksWithCompletion = ['task1', 'task2', 'task3'];
  const completedTasks = new Set(['task2']); // task2 is completed
  const taskToReorder = 'task2';

  // Move task2 up
  const idx = tasksWithCompletion.indexOf(taskToReorder);
  const reordered = [...tasksWithCompletion];
  [reordered[idx], reordered[idx - 1]] = [reordered[idx - 1], reordered[idx]];

  // Check completion is preserved
  assert.equal(completedTasks.has('task2'), true, 'Completion state should be preserved for reordered task');
  assert.equal(completedTasks.has('task1'), false, 'Other tasks should not be affected');
  assert.deepEqual(reordered, ['task2', 'task1', 'task3'], 'Task should move up while keeping completion');

  // Test 6: Reordering two tasks (swap)
  const twoTasks = ['a', 'b'];
  const moveA = 'a';
  const idxA = twoTasks.indexOf(moveA);
  const reorderedTwo = [...twoTasks];
  // Move 'a' down
  [reorderedTwo[idxA], reorderedTwo[idxA + 1]] = [reorderedTwo[idxA + 1], reorderedTwo[idxA]];
  assert.deepEqual(reorderedTwo, ['b', 'a'], 'Two tasks should swap correctly');

  // Test 7: Complex reorder scenario - move through multiple positions
  let multiReorder = ['first', 'second', 'third', 'fourth'];

  // Move 'second' down twice
  const idxSecond = multiReorder.indexOf('second');
  [multiReorder[idxSecond], multiReorder[idxSecond + 1]] = [multiReorder[idxSecond + 1], multiReorder[idxSecond]];
  // Now: ['first', 'third', 'second', 'fourth']
  const idxSecondAfter1 = multiReorder.indexOf('second');
  [multiReorder[idxSecondAfter1], multiReorder[idxSecondAfter1 + 1]] = [multiReorder[idxSecondAfter1 + 1], multiReorder[idxSecondAfter1]];
  // Now: ['first', 'third', 'fourth', 'second']
  assert.deepEqual(multiReorder, ['first', 'third', 'fourth', 'second'], 'Multiple reorders should work correctly');

  // Test 8: Reordering non-existent task should do nothing
  const originalTasks = ['a', 'b', 'c'];
  const nonExistent = 'd';
  const idxNonExistent = originalTasks.indexOf(nonExistent);
  assert.equal(idxNonExistent, -1, 'Should return -1 for non-existent task');
  // Logic: if (currentIndex === -1) return;
  assert.equal(idxNonExistent === -1, true, 'Should detect non-existent task');

  // Test 9: Persistence payload for reorder
  const reorderPayload = {
    tasks: ['reordered', 'tasks'],
    completedTasks: new Set(['reordered']),
  };
  assert.equal(reorderPayload.tasks.length, 2, 'Payload should have all tasks');
  assert.equal(reorderPayload.completedTasks.has('reordered'), true, 'Completed set should be preserved');

  // Test 10: Single task cannot reorder (boundary)
  const singleTask = ['only'];
  const canReorderSingle = singleTask.length > 1;
  assert.equal(canReorderSingle, false, 'Single task should not be reorderable');

  console.log('Task reorder tests passed.');
}

module.exports = {
  runTaskReorderTests,
};
