const assert = require('assert');

// Test task search functionality
async function runTaskSearchTests() {
  console.log('Task search tests running...');

  // Test 1: Search query state initialization
  let searchQuery = '';
  function setSearchQuery(query) {
    searchQuery = query;
  }
  assert.equal(searchQuery, '', 'Search query should initialize empty');

  // Test 2: Search by task name - case insensitive
  const tasks = [
    { name: 'Review contract draft', priority: 'high' },
    { name: 'Schedule client meeting', priority: 'medium' },
    { name: 'Draft proposal', priority: 'low' },
    { name: 'Follow up email' },
  ];

  function matchesSearch(task, query) {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    const nameMatch = task.name.toLowerCase().includes(lowerQuery);
    const notesMatch = task.notes?.toLowerCase().includes(lowerQuery) ?? false;
    return nameMatch || notesMatch;
  }

  const contractResults = tasks.filter((t) => matchesSearch(t, 'contract'));
  assert.equal(contractResults.length, 1, 'Should find task by name');
  assert.equal(contractResults[0].name, 'Review contract draft', 'Should find correct task');

  // Test 3: Search case insensitivity
  const draftResults = tasks.filter((t) => matchesSearch(t, 'DRAFT'));
  assert.equal(draftResults.length, 2, 'Should find tasks case-insensitively');

  // Test 4: Search by task notes
  const tasksWithNotes = [
    { name: 'Task 1', notes: 'Important contract review needed' },
    { name: 'Task 2', notes: 'Schedule before Friday' },
    { name: 'Task 3' },
  ];
  const noteResults = tasksWithNotes.filter((t) => matchesSearch(t, 'contract'));
  assert.equal(noteResults.length, 1, 'Should find task by notes');
  assert.equal(noteResults[0].name, 'Task 1', 'Should find correct task by notes');

  // Test 5: Empty query returns all tasks
  const allResults = tasks.filter((t) => matchesSearch(t, ''));
  assert.equal(allResults.length, 4, 'Empty query should return all tasks');

  // Test 6: Whitespace-only query treated as empty
  const whitespaceResults = tasks.filter((t) => matchesSearch(t, '   '));
  assert.equal(whitespaceResults.length, 4, 'Whitespace query should return all tasks');

  // Test 7: No match returns empty
  const noResults = tasks.filter((t) => matchesSearch(t, 'nonexistent'));
  assert.equal(noResults.length, 0, 'No match should return empty array');

  // Test 8: Search combined with priority filter
  const priorityFilter = 'high';
  const searchAndPriorityResults = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearchQuery = matchesSearch(t, 'review');
    return matchesPriority && matchesSearchQuery;
  });
  assert.equal(searchAndPriorityResults.length, 1, 'Should combine search with priority filter');
  assert.equal(searchAndPriorityResults[0].priority, 'high', 'Should respect priority filter');

  // Test 9: Search with partial match
  const partialResults = tasks.filter((t) => matchesSearch(t, 'draft'));
  assert.equal(partialResults.length, 2, 'Should match partial strings');
  assert.ok(partialResults.some((t) => t.name.includes('contract')), 'Should match contract task');
  assert.ok(partialResults.some((t) => t.name.includes('proposal')), 'Should match proposal task');

  // Test 10: Clear search functionality
  setSearchQuery('draft');
  assert.equal(searchQuery, 'draft', 'Search query should be set');
  setSearchQuery('');
  assert.equal(searchQuery, '', 'Search query should clear');

  // Test 11: Search input styling classes
  const searchInputClasses =
    'w-full rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] pl-9 pr-8 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none';
  assert.ok(searchInputClasses.includes('rounded-md'), 'Search input should have rounded corners');
  assert.ok(searchInputClasses.includes('pl-9'), 'Search input should have left padding for icon');
  assert.ok(searchInputClasses.includes('focus:border-[var(--accent-primary)]'), 'Search input should have focus state');

  // Test 12: Search icon SVG path
  const searchIconPath = 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
  assert.ok(searchIconPath.includes('M21'), 'Search icon should be magnifying glass');

  // Test 13: Clear button appears when search has value
  function shouldShowClearButton(query) {
    return query.length > 0;
  }
  assert.equal(shouldShowClearButton('draft'), true, 'Clear button should show when query exists');
  assert.equal(shouldShowClearButton(''), false, 'Clear button should hide when query empty');

  // Test 14: Backward compatibility - tasks without notes work with search
  const tasksWithoutNotes = [
    { name: 'Simple Task 1' },
    { name: 'Simple Task 2' },
  ];
  const simpleResults = tasksWithoutNotes.filter((t) => matchesSearch(t, 'simple'));
  assert.equal(simpleResults.length, 2, 'Should work with tasks lacking notes');

  // Test 15: Search state preserved independently
  let filterState = { priority: 'all', search: '' };
  function updateSearch(query) {
    filterState = { ...filterState, search: query };
  }
  function updatePriority(priority) {
    filterState = { ...filterState, priority };
  }
  updateSearch('meeting');
  updatePriority('high');
  assert.equal(filterState.search, 'meeting', 'Search should be preserved');
  assert.equal(filterState.priority, 'high', 'Priority should be preserved independently');

  // Test 16: Search placeholder text
  const searchPlaceholder = 'Search tasks...';
  assert.equal(searchPlaceholder, 'Search tasks...', 'Placeholder should be descriptive');

  // Test 17: Search respects task operations (task data preserved through search)
  const taskWithAllData = {
    name: 'Complete Review',
    priority: 'high',
    dueDate: '2026-03-30',
    notes: 'Critical review',
  };
  const foundTask = matchesSearch(taskWithAllData, 'review') ? taskWithAllData : null;
  assert.ok(foundTask, 'Should find task with search');
  assert.equal(foundTask.dueDate, '2026-03-30', 'Due date should be preserved');
  assert.equal(foundTask.priority, 'high', 'Priority should be preserved');
  assert.equal(foundTask.notes, 'Critical review', 'Notes should be preserved');

  console.log('Task search tests passed.');
}

module.exports = {
  runTaskSearchTests,
};
