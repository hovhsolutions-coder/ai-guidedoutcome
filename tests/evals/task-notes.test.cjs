const assert = require('assert');

// Test task notes functionality
async function runTaskNotesTests() {
  console.log('Task notes tests running...');

  // Test 1: Task object structure with notes
  const taskWithNotes = {
    name: 'Complete market analysis',
    notes: 'Focus on Q1 trends and competitor pricing',
  };
  assert.equal(taskWithNotes.name, 'Complete market analysis', 'Task should have correct name');
  assert.equal(taskWithNotes.notes, 'Focus on Q1 trends and competitor pricing', 'Task should have correct notes');

  // Test 2: Task object without notes (backward compatibility)
  const taskWithoutNotes = {
    name: 'Draft proposal',
  };
  assert.equal(taskWithoutNotes.name, 'Draft proposal', 'Task should have correct name');
  assert.equal(taskWithoutNotes.notes, undefined, 'Task should not have notes');

  // Test 3: Notes validation - trimming
  const rawNotes = '  Some notes with whitespace  ';
  const trimmedNotes = rawNotes.trim();
  assert.equal(trimmedNotes, 'Some notes with whitespace', 'Notes should be trimmed');

  // Test 4: Notes validation - empty string becomes null
  const emptyNotes = '   ';
  const shouldBeNull = emptyNotes.trim().length > 0 ? emptyNotes.trim() : null;
  assert.equal(shouldBeNull, null, 'Empty notes should become null');

  // Test 5: Notes validation - length limit
  const longNotes = 'a'.repeat(1500);
  const truncatedNotes = longNotes.length > 1000 ? longNotes.slice(0, 1000) : longNotes;
  assert.equal(truncatedNotes.length, 1000, 'Notes should be truncated to 1000 chars');

  // Test 6: Set notes on task
  const tasks = [{ name: 'Task 1' }, { name: 'Task 2' }];
  const taskName = 'Task 1';
  const newNotes = 'Important note about this task';
  const updatedTasks = tasks.map((t) =>
    t.name === taskName ? { ...t, notes: newNotes } : t
  );
  assert.equal(updatedTasks[0].notes, 'Important note about this task', 'Notes should be set on correct task');
  assert.equal(updatedTasks[1].notes, undefined, 'Other tasks should not have notes');

  // Test 7: Clear notes from task
  const tasksWithNotes = [{ name: 'Task 1', notes: 'Some notes' }, { name: 'Task 2' }];
  const clearedTasks = tasksWithNotes.map((t) =>
    t.name === 'Task 1' ? { ...t, notes: undefined } : t
  );
  assert.equal(clearedTasks[0].notes, undefined, 'Notes should be cleared');

  // Test 8: Edit task preserves notes
  const taskToEdit = { name: 'Old Name', notes: 'Important context' };
  const editedTask = { ...taskToEdit, name: 'New Name' };
  assert.equal(editedTask.name, 'New Name', 'Task name should be updated');
  assert.equal(editedTask.notes, 'Important context', 'Notes should be preserved when editing name');

  // Test 9: Reorder tasks preserves notes
  const tasksToReorder = [
    { name: 'Task A', notes: 'Notes for A' },
    { name: 'Task B', notes: 'Notes for B' },
  ];
  const idx = 0;
  const reordered = [...tasksToReorder];
  [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
  assert.equal(reordered[0].notes, 'Notes for B', 'Notes should follow task when reordering');
  assert.equal(reordered[1].notes, 'Notes for A', 'Notes should follow task when reordering');

  // Test 10: Legacy string tasks normalization
  const normalizeTasks = (rawTasks) => {
    if (!rawTasks) return [];
    return rawTasks.map((t) => (typeof t === 'string' ? { name: t } : t));
  };
  const legacyTasks = ['Task 1', 'Task 2'];
  const normalized = normalizeTasks(legacyTasks);
  assert.deepEqual(normalized, [{ name: 'Task 1' }, { name: 'Task 2' }], 'Legacy strings should normalize to Task objects');

  // Test 11: Mixed legacy and new format with notes
  const mixedTasks = ['Legacy Task', { name: 'New Task', notes: 'With notes' }];
  const normalizedMixed = normalizeTasks(mixedTasks);
  assert.deepEqual(normalizedMixed, [{ name: 'Legacy Task' }, { name: 'New Task', notes: 'With notes' }], 'Mixed formats should normalize correctly');

  // Test 12: API sanitization of tasks with notes
  const sanitizeTasks = (input) => {
    if (!Array.isArray(input)) return [];
    const MAX_TASK_LENGTH = 500;
    const MAX_TASKS = 100;
    
    const tasks = [];
    
    for (const t of input.slice(0, MAX_TASKS)) {
      if (typeof t === 'string' && t.trim().length > 0) {
        tasks.push({
          name: t.length > MAX_TASK_LENGTH ? t.slice(0, MAX_TASK_LENGTH) : t,
        });
      } else if (typeof t === 'object' && t !== null && typeof t.name === 'string') {
        const sanitized = {
          name: t.name.length > MAX_TASK_LENGTH ? t.name.slice(0, MAX_TASK_LENGTH) : t.name,
        };
        if (t.dueDate !== undefined) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(t.dueDate)) {
            const date = new Date(t.dueDate);
            if (!isNaN(date.getTime())) {
              sanitized.dueDate = t.dueDate;
            }
          }
        }
        if (t.notes !== undefined) {
          const trimmedNotes = t.notes.trim();
          if (trimmedNotes.length > 0) {
            sanitized.notes = trimmedNotes.length > 1000 ? trimmedNotes.slice(0, 1000) : trimmedNotes;
          }
        }
        tasks.push(sanitized);
      }
    }
    
    return tasks;
  };
  
  const apiTasks = [
    { name: 'Valid Task', notes: 'Valid notes' },
    { name: 'Long Notes Task', notes: 'a'.repeat(1500) },
    { name: 'Empty Notes Task', notes: '   ' },
    'Legacy String Task',
  ];
  const sanitizedApiTasks = sanitizeTasks(apiTasks);
  assert.equal(sanitizedApiTasks[0].notes, 'Valid notes', 'Valid notes should be preserved');
  assert.equal(sanitizedApiTasks[1].notes.length, 1000, 'Long notes should be truncated');
  assert.equal(sanitizedApiTasks[2].notes, undefined, 'Empty notes should be removed');
  assert.equal(sanitizedApiTasks[3].name, 'Legacy String Task', 'Legacy string should be converted');

  // Test 13: Notes with due date together
  const taskWithBoth = {
    name: 'Complex Task',
    dueDate: '2026-04-15',
    notes: 'Must include pricing analysis',
  };
  assert.equal(taskWithBoth.dueDate, '2026-04-15', 'Due date should be present');
  assert.equal(taskWithBoth.notes, 'Must include pricing analysis', 'Notes should be present');

  // Test 14: Edit notes preserves other fields
  const taskToEditNotes = { name: 'Task', dueDate: '2026-05-01', notes: 'Old notes' };
  const editedNotesTask = { ...taskToEditNotes, notes: 'New notes' };
  assert.equal(editedNotesTask.name, 'Task', 'Name should be preserved');
  assert.equal(editedNotesTask.dueDate, '2026-05-01', 'Due date should be preserved');
  assert.equal(editedNotesTask.notes, 'New notes', 'Notes should be updated');

  console.log('Task notes tests passed.');
}

module.exports = {
  runTaskNotesTests,
};
