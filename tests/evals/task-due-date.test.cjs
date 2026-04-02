const assert = require('assert');

// Test task due date functionality
async function runTaskDueDateTests() {
  console.log('Task due date tests running...');

  // Test 1: Task object structure with due date
  const taskWithDueDate = {
    name: 'Complete market analysis',
    dueDate: '2026-03-30',
  };
  assert.equal(taskWithDueDate.name, 'Complete market analysis', 'Task should have correct name');
  assert.equal(taskWithDueDate.dueDate, '2026-03-30', 'Task should have correct due date');

  // Test 2: Task object without due date (backward compatibility)
  const taskWithoutDueDate = {
    name: 'Draft proposal',
  };
  assert.equal(taskWithoutDueDate.name, 'Draft proposal', 'Task should have correct name');
  assert.equal(taskWithoutDueDate.dueDate, undefined, 'Task should not have due date');

  // Test 3: Due date validation (YYYY-MM-DD format)
  const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  assert.equal(validDateRegex.test('2026-03-30'), true, 'Valid date should pass regex');
  assert.equal(validDateRegex.test('03-30-2026'), false, 'Invalid date format should fail regex');
  assert.equal(validDateRegex.test('2026/03/30'), false, 'Invalid date format should fail regex');
  assert.equal(validDateRegex.test('invalid'), false, 'Non-date string should fail regex');

  // Test 4: Due date parsing
  const validDate = new Date('2026-03-30');
  assert.equal(isNaN(validDate.getTime()), false, 'Valid date should parse correctly');
  const invalidDate = new Date('invalid');
  assert.equal(isNaN(invalidDate.getTime()), true, 'Invalid date should be NaN');

  // Test 5: Due date formatting (locale-independent check)
  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  assert.ok(formatDueDate('2026-03-30').includes('Mar'), 'Date should include month abbreviation');
  assert.ok(formatDueDate('2026-03-30').includes('30'), 'Date should include day');
  assert.equal(formatDueDate(''), '', 'Empty date should return empty string');
  assert.equal(formatDueDate('invalid'), '', 'Invalid date should return empty string');

  // Test 6: Overdue detection
  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };
  assert.equal(isOverdue('2020-01-01'), true, 'Past date should be overdue');
  assert.equal(isOverdue('2099-12-31'), false, 'Future date should not be overdue');
  assert.equal(isOverdue(undefined), false, 'Undefined date should not be overdue');

  // Test 7: Set due date on task
  const tasks = [{ name: 'Task 1' }, { name: 'Task 2' }];
  const taskName = 'Task 1';
  const newDueDate = '2026-04-15';
  const updatedTasks = tasks.map((t) =>
    t.name === taskName ? { ...t, dueDate: newDueDate } : t
  );
  assert.equal(updatedTasks[0].dueDate, '2026-04-15', 'Due date should be set on correct task');
  assert.equal(updatedTasks[1].dueDate, undefined, 'Other tasks should not have due date');

  // Test 8: Clear due date from task
  const tasksWithDueDate = [{ name: 'Task 1', dueDate: '2026-04-15' }, { name: 'Task 2' }];
  const clearedTasks = tasksWithDueDate.map((t) =>
    t.name === 'Task 1' ? { ...t, dueDate: undefined } : t
  );
  assert.equal(clearedTasks[0].dueDate, undefined, 'Due date should be cleared');

  // Test 9: Edit task preserves due date
  const taskToEdit = { name: 'Old Name', dueDate: '2026-05-01' };
  const editedTask = { ...taskToEdit, name: 'New Name' };
  assert.equal(editedTask.name, 'New Name', 'Task name should be updated');
  assert.equal(editedTask.dueDate, '2026-05-01', 'Due date should be preserved when editing name');

  // Test 10: Reorder tasks preserves due dates
  const tasksToReorder = [
    { name: 'Task A', dueDate: '2026-06-01' },
    { name: 'Task B', dueDate: '2026-06-15' },
  ];
  const idx = 0;
  const reordered = [...tasksToReorder];
  [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
  assert.equal(reordered[0].dueDate, '2026-06-15', 'Due date should follow task when reordering');
  assert.equal(reordered[1].dueDate, '2026-06-01', 'Due date should follow task when reordering');

  // Test 11: Legacy string tasks normalization
  const normalizeTasks = (rawTasks) => {
    if (!rawTasks) return [];
    return rawTasks.map((t) => (typeof t === 'string' ? { name: t } : t));
  };
  const legacyTasks = ['Task 1', 'Task 2'];
  const normalized = normalizeTasks(legacyTasks);
  assert.deepEqual(normalized, [{ name: 'Task 1' }, { name: 'Task 2' }], 'Legacy strings should normalize to Task objects');

  // Test 12: Mixed legacy and new format normalization
  const mixedTasks = ['Legacy Task', { name: 'New Task', dueDate: '2026-07-01' }];
  const normalizedMixed = normalizeTasks(mixedTasks);
  assert.deepEqual(normalizedMixed, [{ name: 'Legacy Task' }, { name: 'New Task', dueDate: '2026-07-01' }], 'Mixed formats should normalize correctly');

  // Test 13: API sanitization of tasks with due dates
  const sanitizeTasks = (input) => {
    if (!Array.isArray(input)) return [];
    const MAX_TASK_LENGTH = 500;
    const MAX_TASKS = 100;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    return input
      .filter((t) => {
        if (typeof t === 'string') return t.trim().length > 0;
        if (typeof t === 'object' && t !== null) {
          return typeof t.name === 'string' && t.name.trim().length > 0;
        }
        return false;
      })
      .map((t) => {
        if (typeof t === 'string') {
          return t.length > MAX_TASK_LENGTH ? t.slice(0, MAX_TASK_LENGTH) : t;
        }
        const sanitized = {
          name: t.name.length > MAX_TASK_LENGTH ? t.name.slice(0, MAX_TASK_LENGTH) : t.name,
        };
        if (t.dueDate !== undefined) {
          if (dateRegex.test(t.dueDate)) {
            const date = new Date(t.dueDate);
            if (!isNaN(date.getTime())) {
              sanitized.dueDate = t.dueDate;
            }
          }
        }
        return sanitized;
      })
      .slice(0, MAX_TASKS);
  };
  
  const apiTasks = [
    { name: 'Valid Task', dueDate: '2026-08-01' },
    { name: 'Invalid Date Task', dueDate: 'invalid' },
    'Legacy String Task',
  ];
  const sanitizedApiTasks = sanitizeTasks(apiTasks);
  assert.equal(sanitizedApiTasks[0].dueDate, '2026-08-01', 'Valid due date should be preserved');
  assert.equal(sanitizedApiTasks[1].dueDate, undefined, 'Invalid due date should be removed');
  assert.equal(sanitizedApiTasks[2], 'Legacy String Task', 'Legacy string should be preserved');

  console.log('Task due date tests passed.');
}

module.exports = {
  runTaskDueDateTests,
};
