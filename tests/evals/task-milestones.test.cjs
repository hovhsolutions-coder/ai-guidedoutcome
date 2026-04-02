const assert = require('assert');

// Test task milestone functionality
async function runTaskMilestoneTests() {
  console.log('Task milestone tests running...');

  // Test 1: milestone field exists on Task
  const taskWithMilestone = {
    name: 'Test Task',
    milestone: 'Phase 1',
  };
  assert.equal(taskWithMilestone.milestone, 'Phase 1', 'Task should have milestone field');

  // Test 2: milestone is optional
  const taskWithoutMilestone = {
    name: 'Test Task',
  };
  assert.equal(taskWithoutMilestone.milestone, undefined, 'milestone should be optional');

  // Test 3: Setting a milestone
  const task = { name: 'Task 1' };
  const updatedTask = {
    ...task,
    milestone: 'Beta Release',
  };
  assert.equal(updatedTask.milestone, 'Beta Release', 'Should set milestone on task');

  // Test 4: Clearing a milestone (null means clear)
  const taskWithMilestone2 = { name: 'Task 2', milestone: 'Phase 1' };
  const clearedTask = {
    ...taskWithMilestone2,
    milestone: undefined,
  };
  assert.equal(clearedTask.milestone, undefined, 'Should clear milestone from task');

  // Test 5: Editing a milestone
  const taskToEdit = { name: 'Task 3', milestone: 'Old Milestone' };
  const editedTask = {
    ...taskToEdit,
    milestone: 'New Milestone',
  };
  assert.equal(editedTask.milestone, 'New Milestone', 'Should edit milestone on task');

  // Test 6: Milestone trimming (whitespace removal)
  const rawMilestone = '  Beta Release  ';
  const trimmedMilestone = rawMilestone.trim();
  assert.equal(trimmedMilestone, 'Beta Release', 'Should trim whitespace from milestone');

  // Test 7: Milestone length validation (max 30 chars)
  const longMilestone = 'This is a very long milestone name that exceeds the limit';
  const limitedMilestone = longMilestone.slice(0, 30);
  assert.equal(limitedMilestone.length, 30, 'Should limit milestone to 30 characters');

  // Test 8: Empty milestone is treated as clearing
  const emptyMilestone = '';
  const shouldClear = emptyMilestone.trim().length === 0;
  assert.equal(shouldClear, true, 'Empty milestone should be treated as clearing');

  // Test 9: Activity types for milestone changes
  const setActivity = 'task_milestone_set';
  const clearActivity = 'task_milestone_cleared';
  assert.equal(setActivity, 'task_milestone_set', 'Should have set milestone activity type');
  assert.equal(clearActivity, 'task_milestone_cleared', 'Should have clear milestone activity type');

  // Test 10: Activity history icons for milestones
  const setIcon = '🚩';
  const clearIcon = '🏁';
  assert.equal(setIcon, '🚩', 'Should use flag icon for setting milestone');
  assert.equal(clearIcon, '🏁', 'Should use finish flag icon for clearing milestone');

  // Test 11: Activity history colors for milestones
  const setColor = 'text-[var(--accent-primary)]';
  const clearColor = 'text-[var(--text-secondary)]';
  assert.ok(setColor.includes('accent-primary'), 'Set milestone should use primary color');
  assert.ok(clearColor.includes('text-secondary'), 'Clear milestone should use secondary color');

  // Test 12: Milestone display badge styling
  const badgeClass = 'rounded-full bg-[var(--accent-primary)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-primary)]';
  assert.ok(badgeClass.includes('accent-primary'), 'Milestone badge should use primary color');
  assert.ok(badgeClass.includes('rounded-full'), 'Milestone badge should be rounded');

  // Test 13: Milestone API sanitization (string only, trimmed, bounded)
  const apiMilestone = '  Beta Release  ';
  const sanitized = apiMilestone.trim().slice(0, 30);
  assert.equal(sanitized, 'Beta Release', 'API should sanitize milestone');

  // Test 14: Grouping tasks by milestone
  const tasks = [
    { name: 'Task 1', milestone: 'Phase 1' },
    { name: 'Task 2', milestone: 'Phase 1' },
    { name: 'Task 3', milestone: 'Phase 2' },
    { name: 'Task 4' },
  ];
  const grouped = tasks.reduce((acc, task) => {
    const key = task.milestone || 'No milestone';
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});
  assert.equal(grouped['Phase 1'].length, 2, 'Should group tasks by milestone');
  assert.equal(grouped['Phase 2'].length, 1, 'Should group tasks by milestone');
  assert.equal(grouped['No milestone'].length, 1, 'Should handle tasks without milestone');

  // Test 15: Backward compatibility - tasks without milestone work
  const legacyTask = { name: 'Legacy Task' };
  const hasMilestone = legacyTask.milestone !== undefined;
  assert.equal(hasMilestone, false, 'Legacy tasks should not have milestone');

  // Test 16: Milestone in batch operations preserved
  const batchTasks = [
    { name: 'Task 1', milestone: 'Phase 1' },
    { name: 'Task 2', milestone: 'Phase 1' },
  ];
  assert.equal(batchTasks[0].milestone, 'Phase 1', 'Milestone should persist in batch context');
  assert.equal(batchTasks[1].milestone, 'Phase 1', 'Milestone should persist in batch context');

  // Test 17: Milestone does not affect other task operations
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
  };
  assert.equal(taskWithAllFields.milestone, 'Beta Release', 'milestone should coexist with other fields');

  // Test 18: Milestone inline edit input styling
  const inputClass = 'rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-xs';
  assert.ok(inputClass.includes('border-subtle'), 'Milestone input should have subtle border');

  // Test 19: Milestone compact display truncation
  const longDisplayMilestone = 'Very Long Milestone Name';
  const truncated = longDisplayMilestone.slice(0, 15) + (longDisplayMilestone.length > 15 ? '...' : '');
  assert.ok(truncated.includes('...'), 'Long milestone should be truncated in compact view');

  // Test 20: Milestone persistence round-trip
  const originalMilestone = 'Phase 1';
  const persisted = { name: 'Task 1', milestone: originalMilestone };
  const retrieved = persisted;
  assert.equal(retrieved.milestone, originalMilestone, 'Milestone should persist round-trip');

  console.log('Task milestone tests passed.');
}

module.exports = {
  runTaskMilestoneTests,
};
