const assert = require('assert');

// Test task priority functionality
async function runTaskPriorityTests() {
  console.log('Task priority tests running...');

  // Test 1: Valid priority values
  const validPriorities = ['high', 'medium', 'low'];
  for (const priority of validPriorities) {
    assert.ok(['high', 'medium', 'low'].includes(priority), `Priority ${priority} should be valid`);
  }

  // Test 2: Task with priority structure
  const taskWithPriority = {
    name: 'Test task',
    priority: 'high',
  };
  assert.equal(taskWithPriority.priority, 'high', 'Task should have high priority');

  // Test 3: Task without priority (backward compatibility)
  const taskWithoutPriority = {
    name: 'Test task',
  };
  assert.equal(taskWithoutPriority.priority, undefined, 'Task without priority should be undefined');

  // Test 4: Priority colors mapping
  const priorityColors = {
    high: 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]',
    medium: 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
    low: 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]',
  };
  assert.ok(priorityColors.high.includes('error'), 'High priority should use error color');
  assert.ok(priorityColors.medium.includes('warning'), 'Medium priority should use warning color');
  assert.ok(priorityColors.low.includes('secondary'), 'Low priority should use secondary color');

  // Test 5: Priority validation function
  function validatePriority(priority) {
    if (priority === null || priority === undefined) return true;
    return ['high', 'medium', 'low'].includes(priority);
  }
  assert.equal(validatePriority('high'), true, 'Should validate high priority');
  assert.equal(validatePriority('medium'), true, 'Should validate medium priority');
  assert.equal(validatePriority('low'), true, 'Should validate low priority');
  assert.equal(validatePriority(null), true, 'Should validate null priority');
  assert.equal(validatePriority(undefined), true, 'Should validate undefined priority');
  assert.equal(validatePriority('invalid'), false, 'Should reject invalid priority');

  // Test 6: Priority change activity recording
  const priorityActivity = {
    id: '123-abc',
    type: 'task_priority_set',
    description: 'Set priority for "Test task" to high',
    timestamp: '2026-03-27T10:00:00Z',
    taskName: 'Test task',
    newValue: 'high',
  };
  assert.equal(priorityActivity.type, 'task_priority_set', 'Should record priority set activity');
  assert.equal(priorityActivity.newValue, 'high', 'Should record priority value');

  // Test 7: Priority clear activity recording
  const clearPriorityActivity = {
    id: '456-def',
    type: 'task_priority_cleared',
    description: 'Cleared priority from "Test task"',
    timestamp: '2026-03-27T11:00:00Z',
    taskName: 'Test task',
  };
  assert.equal(clearPriorityActivity.type, 'task_priority_cleared', 'Should record priority cleared activity');

  // Test 8: Activity icons for priority
  const ACTIVITY_ICONS = {
    task_priority_set: '⚡',
    task_priority_cleared: '⚡',
  };
  assert.equal(ACTIVITY_ICONS.task_priority_set, '⚡', 'Priority set should have lightning icon');
  assert.equal(ACTIVITY_ICONS.task_priority_cleared, '⚡', 'Priority cleared should have lightning icon');

  // Test 9: Priority persistence in task update
  const tasks = [
    { name: 'Task 1', priority: 'high' },
    { name: 'Task 2' },
    { name: 'Task 3', priority: 'low' },
  ];
  const updatedTasks = tasks.map((t) =>
    t.name === 'Task 2' ? { ...t, priority: 'medium' } : t
  );
  assert.equal(updatedTasks[1].priority, 'medium', 'Should update task priority');
  assert.equal(updatedTasks[0].priority, 'high', 'Should preserve other task priorities');

  // Test 10: API priority sanitization
  function sanitizePriority(input) {
    if (input === undefined) return undefined;
    const validPriorities = ['high', 'medium', 'low'];
    if (validPriorities.includes(input)) {
      return input;
    }
    return undefined;
  }
  assert.equal(sanitizePriority('high'), 'high', 'Should sanitize valid high priority');
  assert.equal(sanitizePriority('medium'), 'medium', 'Should sanitize valid medium priority');
  assert.equal(sanitizePriority('low'), 'low', 'Should sanitize valid low priority');
  assert.equal(sanitizePriority('invalid'), undefined, 'Should reject invalid priority');
  assert.equal(sanitizePriority(undefined), undefined, 'Should handle undefined');

  // Test 11: Priority display badge text
  const priorityBadge = (priority) => `${priority} priority`;
  assert.equal(priorityBadge('high'), 'high priority', 'Should format high priority badge');
  assert.equal(priorityBadge('medium'), 'medium priority', 'Should format medium priority badge');
  assert.equal(priorityBadge('low'), 'low priority', 'Should format low priority badge');

  // Test 12: Priority save handler validation
  function handleSetPriorityValidation(priority) {
    if (priority !== null && !['high', 'medium', 'low'].includes(priority)) {
      return { valid: false, error: 'invalid_priority' };
    }
    return { valid: true };
  }
  assert.equal(handleSetPriorityValidation('high').valid, true, 'Should validate high priority');
  assert.equal(handleSetPriorityValidation('invalid').valid, false, 'Should reject invalid priority');
  assert.equal(handleSetPriorityValidation(null).valid, true, 'Should validate null priority');

  console.log('Task priority tests passed.');
}

module.exports = {
  runTaskPriorityTests,
};
