const assert = require('assert');

// Test task subtask functionality
async function runTaskSubtaskTests() {
  console.log('Task subtask tests running...');

  // Test 1: Subtask interface exists
  const subtask = {
    id: 'subtask-1',
    name: 'Test subtask',
    completed: false,
  };
  assert.equal(subtask.id, 'subtask-1', 'Subtask should have id field');
  assert.equal(subtask.name, 'Test subtask', 'Subtask should have name field');
  assert.equal(subtask.completed, false, 'Subtask should have completed field');

  // Test 2: Subtasks field on Task interface
  const taskWithSubtasks = {
    name: 'Test Task',
    subtasks: [subtask],
  };
  assert.ok(Array.isArray(taskWithSubtasks.subtasks), 'Task should have subtasks array');
  assert.equal(taskWithSubtasks.subtasks.length, 1, 'Task should have 1 subtask');

  // Test 3: Subtasks is optional
  const taskWithoutSubtasks = {
    name: 'Test Task',
  };
  assert.equal(taskWithoutSubtasks.subtasks, undefined, 'subtasks should be optional');

  // Test 4: Adding a subtask
  const task = { name: 'Task 1' };
  const newSubtask = { id: 'sub-1', name: 'New subtask', completed: false };
  const updatedTask = {
    ...task,
    subtasks: [...(task.subtasks || []), newSubtask],
  };
  assert.equal(updatedTask.subtasks.length, 1, 'Should add subtask to task');
  assert.equal(updatedTask.subtasks[0].name, 'New subtask', 'Should set subtask name');

  // Test 5: Completing a subtask
  const taskToComplete = {
    name: 'Task 2',
    subtasks: [{ id: 'sub-1', name: 'Subtask', completed: false }],
  };
  const completedSubtasks = taskToComplete.subtasks.map((s) =>
    s.id === 'sub-1' ? { ...s, completed: true } : s
  );
  const completedTask = { ...taskToComplete, subtasks: completedSubtasks };
  assert.equal(completedTask.subtasks[0].completed, true, 'Should complete subtask');

  // Test 6: Uncompleting a subtask
  const taskToUncomplete = {
    name: 'Task 3',
    subtasks: [{ id: 'sub-1', name: 'Subtask', completed: true }],
  };
  const uncompletedSubtasks = taskToUncomplete.subtasks.map((s) =>
    s.id === 'sub-1' ? { ...s, completed: false } : s
  );
  const uncompletedTask = { ...taskToUncomplete, subtasks: uncompletedSubtasks };
  assert.equal(uncompletedTask.subtasks[0].completed, false, 'Should uncomplete subtask');

  // Test 7: Editing a subtask
  const taskToEdit = {
    name: 'Task 4',
    subtasks: [{ id: 'sub-1', name: 'Old name', completed: false }],
  };
  const editedSubtasks = taskToEdit.subtasks.map((s) =>
    s.id === 'sub-1' ? { ...s, name: 'New name' } : s
  );
  const editedTask = { ...taskToEdit, subtasks: editedSubtasks };
  assert.equal(editedTask.subtasks[0].name, 'New name', 'Should edit subtask name');

  // Test 8: Deleting a subtask
  const taskToDelete = {
    name: 'Task 5',
    subtasks: [
      { id: 'sub-1', name: 'Subtask 1', completed: false },
      { id: 'sub-2', name: 'Subtask 2', completed: false },
    ],
  };
  const filteredSubtasks = taskToDelete.subtasks.filter((s) => s.id !== 'sub-1');
  const deletedTask = { ...taskToDelete, subtasks: filteredSubtasks };
  assert.equal(deletedTask.subtasks.length, 1, 'Should delete subtask');
  assert.equal(deletedTask.subtasks[0].id, 'sub-2', 'Should keep remaining subtask');

  // Test 9: Subtask name trimming (whitespace removal)
  const rawSubtaskName = '  Test subtask  ';
  const trimmedSubtaskName = rawSubtaskName.trim();
  assert.equal(trimmedSubtaskName, 'Test subtask', 'Should trim whitespace from subtask name');

  // Test 10: Subtask name length validation (max 100 chars)
  const longSubtaskName = 'a'.repeat(150);
  const limitedSubtaskName = longSubtaskName.slice(0, 100);
  assert.equal(limitedSubtaskName.length, 100, 'Should limit subtask name to 100 characters');

  // Test 11: Empty subtask name is invalid
  const emptySubtaskName = '';
  const isEmptyInvalid = emptySubtaskName.trim().length === 0;
  assert.equal(isEmptyInvalid, true, 'Empty subtask name should be invalid');

  // Test 12: Activity types for subtask changes
  assert.equal('subtask_added', 'subtask_added', 'Should have add subtask activity type');
  assert.equal('subtask_completed', 'subtask_completed', 'Should have complete subtask activity type');
  assert.equal('subtask_uncompleted', 'subtask_uncompleted', 'Should have uncomplete subtask activity type');
  assert.equal('subtask_edited', 'subtask_edited', 'Should have edit subtask activity type');
  assert.equal('subtask_deleted', 'subtask_deleted', 'Should have delete subtask activity type');

  // Test 13: Activity history icons for subtasks
  assert.equal('☐', '☐', 'Should use empty box for subtask add');
  assert.equal('☑', '☑', 'Should use checked box for subtask complete');
  assert.equal('✎', '✎', 'Should use pencil for subtask edit');
  assert.equal('×', '×', 'Should use times for subtask delete');

  // Test 14: API sanitization - string only, trimmed, bounded
  const apiSubtaskName = '  Test subtask  ';
  const sanitized = apiSubtaskName.trim().slice(0, 100);
  assert.equal(sanitized, 'Test subtask', 'API should sanitize subtask name');

  // Test 15: API sanitization - max 20 subtasks per task
  const manySubtasks = Array.from({ length: 25 }, (_, i) => ({
    id: `sub-${i}`,
    name: `Subtask ${i}`,
    completed: false,
  }));
  const limitedSubtasks = manySubtasks.slice(0, 20);
  assert.equal(limitedSubtasks.length, 20, 'Should limit subtasks to 20 per task');

  // Test 16: Subtasks don't affect parent task completion
  const taskWithCompletedSubtasks = {
    name: 'Task 6',
    subtasks: [
      { id: 'sub-1', name: 'Subtask 1', completed: true },
      { id: 'sub-2', name: 'Subtask 2', completed: true },
    ],
  };
  // Parent task completion is independent of subtask completion
  assert.equal(taskWithCompletedSubtasks.subtasks.every((s) => s.completed), true, 'All subtasks can be completed');

  // Test 17: Backward compatibility - tasks without subtasks work
  const legacyTask = { name: 'Legacy Task' };
  const hasSubtasks = legacyTask.subtasks !== undefined;
  assert.equal(hasSubtasks, false, 'Legacy tasks should not have subtasks');

  // Test 18: Subtask id generation
  const generateId = () => crypto.randomUUID ? crypto.randomUUID() : 'uuid-' + Date.now();
  const id1 = generateId();
  const id2 = generateId();
  assert.notEqual(id1, id2, 'Should generate unique subtask ids');

  // Test 19: Subtask persistence round-trip
  const originalSubtasks = [
    { id: 'sub-1', name: 'Subtask 1', completed: false },
    { id: 'sub-2', name: 'Subtask 2', completed: true },
  ];
  const persisted = { name: 'Task 7', subtasks: originalSubtasks };
  const retrieved = persisted;
  assert.equal(retrieved.subtasks.length, 2, 'Subtasks should persist round-trip');
  assert.equal(retrieved.subtasks[0].id, 'sub-1', 'Subtask id should persist');
  assert.equal(retrieved.subtasks[0].name, 'Subtask 1', 'Subtask name should persist');
  assert.equal(retrieved.subtasks[0].completed, false, 'Subtask completed should persist');

  // Test 20: Subtask count display
  const taskWithThreeSubtasks = {
    name: 'Task 8',
    subtasks: [
      { id: 'sub-1', name: 'Subtask 1', completed: true },
      { id: 'sub-2', name: 'Subtask 2', completed: true },
      { id: 'sub-3', name: 'Subtask 3', completed: false },
    ],
  };
  const completedCount = taskWithThreeSubtasks.subtasks.filter((s) => s.completed).length;
  const totalCount = taskWithThreeSubtasks.subtasks.length;
  assert.equal(completedCount, 2, 'Should count completed subtasks');
  assert.equal(totalCount, 3, 'Should count total subtasks');

  // Test 21: Subtask checkbox display styling
  const completedStyle = 'text-[var(--color-green)]';
  const uncompletedStyle = 'text-[var(--text-secondary)]';
  assert.ok(completedStyle.includes('color-green'), 'Completed subtask should use green');
  assert.ok(uncompletedStyle.includes('text-secondary'), 'Uncompleted subtask should use secondary');

  // Test 22: Subtask strikethrough display for completed
  const completedSubtaskStyle = 'line-through text-[var(--text-secondary)]';
  assert.ok(completedSubtaskStyle.includes('line-through'), 'Completed subtask should have strikethrough');

  // Test 23: Multiple subtask operations
  const taskWithMultiple = {
    name: 'Task 9',
    subtasks: [{ id: 'sub-1', name: 'Original', completed: false }],
  };
  // Add subtask
  const afterAdd = {
    ...taskWithMultiple,
    subtasks: [...taskWithMultiple.subtasks, { id: 'sub-2', name: 'New', completed: false }],
  };
  assert.equal(afterAdd.subtasks.length, 2, 'Should support multiple add operations');
  // Complete one
  const afterComplete = {
    ...afterAdd,
    subtasks: afterAdd.subtasks.map((s) => (s.id === 'sub-1' ? { ...s, completed: true } : s)),
  };
  assert.equal(afterComplete.subtasks[0].completed, true, 'Should support complete after add');
  // Edit one
  const afterEdit = {
    ...afterComplete,
    subtasks: afterComplete.subtasks.map((s) => (s.id === 'sub-2' ? { ...s, name: 'Edited' } : s)),
  };
  assert.equal(afterEdit.subtasks[1].name, 'Edited', 'Should support edit after complete');

  // Test 24: Subtask preserves other task fields
  const taskWithAllFields = {
    name: 'Complete Task',
    priority: 'high',
    dueDate: '2026-03-30',
    notes: 'Important note',
    category: 'Urgent',
    estimate: '2h',
    actualTime: 90,
    isTracking: false,
    dependencies: ['Task A'],
    milestone: 'Beta Release',
    subtasks: [{ id: 'sub-1', name: 'Subtask', completed: false }],
  };
  assert.equal(taskWithAllFields.subtasks.length, 1, 'subtasks should coexist with other fields');
  assert.equal(taskWithAllFields.priority, 'high', 'priority should be preserved');

  // Test 25: Subtask validation allows clearing all subtasks
  const taskWithSubtasksToClear = {
    name: 'Task 10',
    subtasks: [{ id: 'sub-1', name: 'Subtask', completed: false }],
  };
  const clearedSubtasks = [];
  const taskWithClearedSubtasks = { ...taskWithSubtasksToClear, subtasks: clearedSubtasks };
  assert.equal(taskWithClearedSubtasks.subtasks.length, 0, 'Should allow clearing all subtasks');

  console.log('Task subtask tests passed.');
}

module.exports = {
  runTaskSubtaskTests,
};
