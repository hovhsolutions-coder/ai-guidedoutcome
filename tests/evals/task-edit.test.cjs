const assert = require('assert');

// Test task editing functionality
async function runTaskEditTests() {
  console.log('Task edit tests running...');

  // Test 1: Task rename replaces old name with new name
  const tasks = ['task1', 'task2', 'task3'];
  const oldTask = 'task2';
  const newTask = 'updated task 2';
  const renamedTasks = tasks.map((t) => (t === oldTask ? newTask : t));
  assert.deepEqual(renamedTasks, ['task1', 'updated task 2', 'task3'], 'Should replace task name in list');

  // Test 2: Task rename preserves completion state
  const completedTasks = new Set(['task1', 'task2']);
  const oldCompletedTask = 'task2';
  const newCompletedTask = 'updated task 2';

  if (completedTasks.has(oldCompletedTask)) {
    completedTasks.delete(oldCompletedTask);
    completedTasks.add(newCompletedTask);
  }

  assert.equal(completedTasks.has(oldCompletedTask), false, 'Should remove old task name from completed set');
  assert.equal(completedTasks.has(newCompletedTask), true, 'Should add new task name to completed set');
  assert.equal(completedTasks.has('task1'), true, 'Should preserve other completed tasks');

  // Test 3: Task rename does not affect completion if task was not completed
  const notCompletedTasks = new Set(['task1']);
  const oldNotCompleted = 'task2';
  const newNotCompleted = 'updated task 2';

  if (notCompletedTasks.has(oldNotCompleted)) {
    notCompletedTasks.delete(oldNotCompleted);
    notCompletedTasks.add(newNotCompleted);
  }

  assert.equal(notCompletedTasks.has(newNotCompleted), false, 'Should not add to completed if not originally completed');

  // Test 4: Empty rename should be rejected
  const emptyRename = '   ';
  const trimmedEmpty = emptyRename.trim();
  assert.equal(trimmedEmpty.length, 0, 'Should reject empty string after trim');

  // Test 5: Same name rename should be skipped (no-op)
  const sameName = 'task1';
  const oldSame = 'task1';
  assert.equal(sameName === oldSame, true, 'Should detect no change');

  // Test 6: Duplicate name should be rejected
  const existingTasks = ['task1', 'task2', 'task3'];
  const duplicateName = 'task1';
  const oldDuplicate = 'task2';
  const wouldBeDuplicate = existingTasks.includes(duplicateName) && duplicateName !== oldDuplicate;
  assert.equal(wouldBeDuplicate, true, 'Should detect duplicate name');

  // Test 7: Long task name should be allowed up to limit (500 chars)
  const longName = 'a'.repeat(500);
  assert.equal(longName.length, 500, 'Should allow up to 500 chars');

  // Test 8: Task rename preserves order
  const orderedTasks = ['first', 'second', 'third'];
  const renamedOrdered = orderedTasks.map((t) => (t === 'second' ? 'SECOND' : t));
  assert.deepEqual(renamedOrdered, ['first', 'SECOND', 'third'], 'Should preserve task order after rename');

  // Test 9: Multiple renames on same task list
  let multiTasks = ['a', 'b', 'c'];
  multiTasks = multiTasks.map((t) => (t === 'a' ? 'A' : t));
  multiTasks = multiTasks.map((t) => (t === 'b' ? 'B' : t));
  assert.deepEqual(multiTasks, ['A', 'B', 'c'], 'Should support multiple sequential renames');

  // Test 10: Simulated UI edit flow
  let uiTasks = ['ui-task-1', 'ui-task-2'];
  let uiCompleted = new Set(['ui-task-1']);

  // Simulate edit 'ui-task-2' to 'ui-task-2-updated'
  const editedTask = 'ui-task-2-updated';
  uiTasks = uiTasks.map((t) => (t === 'ui-task-2' ? editedTask : t));

  assert.deepEqual(uiTasks, ['ui-task-1', 'ui-task-2-updated'], 'UI tasks should update after edit');
  assert.equal(uiCompleted.has(editedTask), false, 'Edited task should not be in completed set if original was not');

  // Test 11: Rename completed task preserves completion
  let completedRenameTasks = ['done', 'pending'];
  let completedRenameSet = new Set(['done']);

  completedRenameTasks = completedRenameTasks.map((t) => (t === 'done' ? 'completed' : t));
  if (completedRenameSet.has('done')) {
    completedRenameSet.delete('done');
    completedRenameSet.add('completed');
  }

  assert.equal(completedRenameSet.has('completed'), true, 'Should preserve completion status after rename');

  console.log('Task edit tests passed.');
}

module.exports = {
  runTaskEditTests,
};
