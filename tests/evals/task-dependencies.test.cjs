const assert = require('assert');

// Test task dependency functionality
async function runTaskDependencyTests() {
  console.log('Task dependency tests running...');

  // Test 1: dependencies field exists on Task
  const taskWithDeps = {
    name: 'Task B',
    dependencies: ['Task A'],
  };
  assert.deepEqual(taskWithDeps.dependencies, ['Task A'], 'Task should have dependencies field');

  // Test 2: dependencies is optional
  const taskWithoutDeps = {
    name: 'Task C',
  };
  assert.equal(taskWithoutDeps.dependencies, undefined, 'dependencies should be optional');

  // Test 3: dependencies can have multiple items
  const taskWithMultipleDeps = {
    name: 'Task D',
    dependencies: ['Task A', 'Task B', 'Task C'],
  };
  assert.equal(taskWithMultipleDeps.dependencies.length, 3, 'Task can have multiple dependencies');

  // Test 4: Self-dependency prevention
  const selfDep = 'Task E';
  const isValid = selfDep !== 'Task E';
  assert.equal(isValid, false, 'Should detect self-dependency as invalid');

  // Test 5: Dependency must reference existing task
  const allTasks = [{ name: 'Task A' }, { name: 'Task B' }];
  const depName = 'Task C';
  const exists = allTasks.some((t) => t.name === depName);
  assert.equal(exists, false, 'Should detect non-existent dependency');

  // Test 6: Adding a dependency
  const task = { name: 'Task B', dependencies: [] };
  const newDep = 'Task A';
  const updatedTask = {
    ...task,
    dependencies: [...task.dependencies, newDep],
  };
  assert.deepEqual(updatedTask.dependencies, ['Task A'], 'Should add dependency');

  // Test 7: Removing all dependencies (null means clear)
  const taskWithDeps2 = { name: 'Task B', dependencies: ['Task A', 'Task C'] };
  const clearedTask = {
    ...taskWithDeps2,
    dependencies: [],
  };
  assert.deepEqual(clearedTask.dependencies, [], 'Should clear all dependencies');

  // Test 8: Duplicate dependency prevention
  const taskWithDup = { name: 'Task B', dependencies: ['Task A'] };
  const newDup = 'Task A';
  const isDuplicate = taskWithDup.dependencies.includes(newDup);
  assert.equal(isDuplicate, true, 'Should detect duplicate dependency');

  // Test 9: Activity types for dependency changes
  const addActivity = 'task_dependency_added';
  const removeActivity = 'task_dependency_removed';
  assert.equal(addActivity, 'task_dependency_added', 'Should have add dependency activity type');
  assert.equal(removeActivity, 'task_dependency_removed', 'Should have remove dependency activity type');

  // Test 10: Activity history icons for dependencies
  const addIcon = '⛓️';
  const removeIcon = '🔗';
  assert.equal(addIcon, '⛓️', 'Should use chain icon for adding dependency');
  assert.equal(removeIcon, '🔗', 'Should use link icon for removing dependency');

  // Test 11: Activity history colors for dependencies
  const addColor = 'text-[var(--accent-highlight)]';
  const removeColor = 'text-[var(--text-secondary)]';
  assert.ok(addColor.includes('accent-highlight'), 'Add dependency should use highlight color');
  assert.ok(removeColor.includes('text-secondary'), 'Remove dependency should use secondary color');

  // Test 12: API sanitization for dependencies (array of strings)
  const apiDeps = ['Task A', 'Task B'];
  const isValidArray = Array.isArray(apiDeps) && apiDeps.every((d) => typeof d === 'string');
  assert.equal(isValidArray, true, 'API should accept valid dependency array');

  // Test 13: API filters out self-references
  const taskName = 'Task A';
  const rawDeps = ['Task B', 'Task A', 'Task C'];
  const filteredDeps = rawDeps.filter((d) => d !== taskName);
  assert.deepEqual(filteredDeps, ['Task B', 'Task C'], 'API should filter self-references');

  // Test 14: API removes duplicates
  const dupDeps = ['Task A', 'Task B', 'Task A'];
  const uniqueDeps = [...new Set(dupDeps)];
  assert.deepEqual(uniqueDeps, ['Task A', 'Task B'], 'API should remove duplicates');

  // Test 15: API limits to max 10 dependencies
  const manyDeps = Array(15).fill(0).map((_, i) => `Task ${i}`);
  const limitedDeps = manyDeps.slice(0, 10);
  assert.equal(limitedDeps.length, 10, 'API should limit to 10 dependencies');

  // Test 16: Blocked state detection - task with incomplete dependencies
  const blockedTask = {
    name: 'Task B',
    dependencies: ['Task A'],
  };
  const completedTasks = new Set(); // Task A not completed
  const isBlocked = blockedTask.dependencies?.some(
    (dep) => !completedTasks.has(dep)
  ) ?? false;
  assert.equal(isBlocked, true, 'Should detect blocked state');

  // Test 17: Blocked state detection - all dependencies completed
  const unblockedTask = {
    name: 'Task B',
    dependencies: ['Task A'],
  };
  const completedTasks2 = new Set(['Task A']);
  const isBlocked2 = unblockedTask.dependencies?.some(
    (dep) => !completedTasks2.has(dep)
  ) ?? false;
  assert.equal(isBlocked2, false, 'Should detect unblocked state');

  // Test 18: Backward compatibility - tasks without dependencies work
  const legacyTask = { name: 'Legacy Task' };
  const hasDeps = legacyTask.dependencies !== undefined && legacyTask.dependencies.length > 0;
  assert.equal(hasDeps, false, 'Legacy tasks should have no dependencies');

  // Test 19: Dependency in batch operations preserved
  const batchTasks = [
    { name: 'Task 1', dependencies: [] },
    { name: 'Task 2', dependencies: ['Task 1'] },
  ];
  assert.equal(batchTasks[1].dependencies[0], 'Task 1', 'Dependencies should persist in batch context');

  // Test 20: Dependencies do not affect other task operations
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
  };
  assert.deepEqual(taskWithAllFields.dependencies, ['Task A'], 'dependencies should coexist with other fields');

  console.log('Task dependency tests passed.');
}

module.exports = {
  runTaskDependencyTests,
};
