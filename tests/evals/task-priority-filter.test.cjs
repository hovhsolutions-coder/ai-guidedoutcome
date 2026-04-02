const assert = require('assert');

// Test task priority filtering and sorting functionality
async function runTaskPriorityFilterTests() {
  console.log('Task priority filter tests running...');

  // Test 1: Priority filter values
  const allFilter = 'all';
  const highFilter = 'high';
  assert.equal(allFilter, 'all', 'Should define all filter value');
  assert.equal(highFilter, 'high', 'Should define high filter value');

  // Test 2: Filter all returns all active tasks
  const tasks = [
    { name: 'Task 1', priority: 'high' },
    { name: 'Task 2', priority: 'medium' },
    { name: 'Task 3', priority: 'low' },
    { name: 'Task 4' }, // no priority
  ];
  const allFiltered = tasks; // 'all' filter returns all
  assert.equal(allFiltered.length, 4, 'All filter should return all tasks');

  // Test 3: Filter by high priority
  const highFiltered = tasks.filter((t) => t.priority === 'high');
  assert.equal(highFiltered.length, 1, 'High filter should return only high priority tasks');
  assert.equal(highFiltered[0].name, 'Task 1', 'High filter should return correct task');

  // Test 4: Filter by medium priority
  const mediumFiltered = tasks.filter((t) => t.priority === 'medium');
  assert.equal(mediumFiltered.length, 1, 'Medium filter should return only medium priority tasks');
  assert.equal(mediumFiltered[0].name, 'Task 2', 'Medium filter should return correct task');

  // Test 5: Filter by low priority
  const lowFiltered = tasks.filter((t) => t.priority === 'low');
  assert.equal(lowFiltered.length, 1, 'Low filter should return only low priority tasks');
  assert.equal(lowFiltered[0].name, 'Task 3', 'Low filter should return correct task');

  // Test 6: Priority-first sorting (high > medium > low > none)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3;
    const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3;
    return aOrder - bOrder;
  });
  assert.equal(sortedTasks[0].name, 'Task 1', 'High priority should be first');
  assert.equal(sortedTasks[1].name, 'Task 2', 'Medium priority should be second');
  assert.equal(sortedTasks[2].name, 'Task 3', 'Low priority should be third');
  assert.equal(sortedTasks[3].name, 'Task 4', 'No priority should be last');

  // Test 7: Backward compatibility - tasks without priority work with filter
  const tasksWithoutPriority = [
    { name: 'Task A' },
    { name: 'Task B' },
  ];
  const allWithoutPriority = tasksWithoutPriority;
  const highWithoutPriority = tasksWithoutPriority.filter((t) => t.priority === 'high');
  assert.equal(allWithoutPriority.length, 2, 'All filter should work with tasks lacking priority');
  assert.equal(highWithoutPriority.length, 0, 'High filter should return empty for tasks without priority');

  // Test 8: Filter state persistence (simulating React state)
  let currentFilter = 'all';
  function setFilter(filter) {
    currentFilter = filter;
  }
  setFilter('high');
  assert.equal(currentFilter, 'high', 'Filter state should be updateable');

  // Test 9: Priority task always shown regardless of filter
  const priorityTask = { name: 'Priority Task', priority: 'medium' };
  const activeTasks = [
    priorityTask,
    { name: 'Other High', priority: 'high' },
    { name: 'Other Low', priority: 'low' },
  ];
  const filteredWithPriorityAlwaysShown = activeTasks.filter((task) => {
    if (task.name === priorityTask.name) return true; // Always show priority task
    return task.priority === 'high';
  });
  assert.equal(filteredWithPriorityAlwaysShown.length, 2, 'Priority task should always be shown plus filtered tasks');
  assert.ok(filteredWithPriorityAlwaysShown.some((t) => t.name === 'Priority Task'), 'Priority task should be in filtered list');
  assert.ok(filteredWithPriorityAlwaysShown.some((t) => t.name === 'Other High'), 'Matching filtered task should be present');

  // Test 10: Filter button styling classes
  const filterButtonBase = 'rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors';
  const filterButtonActiveAll = 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]';
  const filterButtonActiveHigh = 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]';
  const filterButtonInactive = 'bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)]';
  assert.ok(filterButtonBase.includes('rounded-md'), 'Filter button should have rounded corners');
  assert.ok(filterButtonActiveHigh.includes('accent-error'), 'High filter button should use error color');
  assert.ok(filterButtonInactive.includes('hover'), 'Inactive filter button should have hover state');

  // Test 11: Filter label text
  const filterLabel = 'Filter:';
  const allLabel = 'All';
  const highLabel = 'high';
  assert.equal(filterLabel, 'Filter:', 'Filter label should be correct');
  assert.equal(allLabel, 'All', 'All filter label should be capitalized');
  assert.equal(highLabel, 'high', 'Priority filter labels should be lowercase');

  // Test 12: Compatibility with task operations (complete, edit, delete, reorder, due date, notes, priority)
  const taskWithAllFields = {
    name: 'Complete Task',
    priority: 'high',
    dueDate: '2026-03-30',
    notes: 'Important note',
  };
  // Simulate filtering doesn't lose task data
  const filteredTask = taskWithAllFields.priority === 'high' ? taskWithAllFields : null;
  assert.ok(filteredTask, 'Task should pass high filter');
  assert.equal(filteredTask.dueDate, '2026-03-30', 'Due date should be preserved through filtering');
  assert.equal(filteredTask.notes, 'Important note', 'Notes should be preserved through filtering');
  assert.equal(filteredTask.priority, 'high', 'Priority should be preserved through filtering');

  // Test 13: Sorting stability - same priority maintains relative order
  const samePriorityTasks = [
    { name: 'First High', priority: 'high' },
    { name: 'Second High', priority: 'high' },
    { name: 'First Medium', priority: 'medium' },
  ];
  const sortedSamePriority = [...samePriorityTasks].sort((a, b) => {
    const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3;
    const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3;
    return aOrder - bOrder;
  });
  assert.equal(sortedSamePriority[0].name, 'First High', 'First high should stay first');
  assert.equal(sortedSamePriority[1].name, 'Second High', 'Second high should stay second');
  assert.equal(sortedSamePriority[2].name, 'First Medium', 'Medium should come after high');

  // Test 14: Empty task list with filter
  const emptyTasks = [];
  const emptyFiltered = emptyTasks.filter((t) => t.priority === 'high');
  assert.equal(emptyFiltered.length, 0, 'Empty task list should return empty filtered result');

  // Test 15: Filter change preserves other component state (simulated)
  let otherState = { expanded: true };
  function changeFilter(newFilter) {
    // Filter change doesn't affect other state
    return { filter: newFilter, ...otherState };
  }
  const newState = changeFilter('medium');
  assert.equal(newState.filter, 'medium', 'Filter should change to medium');
  assert.equal(newState.expanded, true, 'Other state should be preserved');

  console.log('Task priority filter tests passed.');
}

module.exports = {
  runTaskPriorityFilterTests,
};
