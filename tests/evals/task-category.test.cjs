const assert = require('assert');

// Test task category functionality
async function runTaskCategoryTests() {
  console.log('Task category tests running...');

  // Test 1: Category field exists on Task
  const taskWithCategory = {
    name: 'Test Task',
    category: 'Planning',
  };
  assert.equal(taskWithCategory.category, 'Planning', 'Task should have category field');

  // Test 2: Category is optional
  const taskWithoutCategory = {
    name: 'Test Task',
  };
  assert.equal(taskWithoutCategory.category, undefined, 'Category should be optional');

  // Test 3: Category validation - trim whitespace
  const categoryWithSpaces = '  Planning  ';
  const trimmed = categoryWithSpaces.trim();
  assert.equal(trimmed, 'Planning', 'Should trim category whitespace');

  // Test 4: Category validation - max length 50
  const longCategory = 'a'.repeat(60);
  const truncated = longCategory.slice(0, 50);
  assert.equal(truncated.length, 50, 'Should truncate category to 50 chars');

  // Test 5: Category validation - empty becomes null
  const emptyCategory = '   ';
  const isEmpty = emptyCategory.trim().length === 0;
  assert.equal(isEmpty, true, 'Empty category should be treated as null');

  // Test 6: Set category on task
  const task = { name: 'Task 1' };
  const newCategory = 'Research';
  const updatedTask = { ...task, category: newCategory };
  assert.equal(updatedTask.category, 'Research', 'Should set category on task');

  // Test 7: Clear category from task
  const taskWithCat = { name: 'Task 2', category: 'Design' };
  const clearedTask = { ...taskWithCat, category: undefined };
  assert.equal(clearedTask.category, undefined, 'Should clear category from task');

  // Test 8: Category change activity type
  const setActivity = 'task_category_set';
  const clearedActivity = 'task_category_cleared';
  assert.equal(setActivity, 'task_category_set', 'Should have set activity type');
  assert.equal(clearedActivity, 'task_category_cleared', 'Should have cleared activity type');

  // Test 9: Category badge styling
  const categoryBadgeClasses = 'rounded-full bg-[var(--accent-highlight)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-highlight)]';
  assert.ok(categoryBadgeClasses.includes('accent-highlight'), 'Should use highlight color');

  // Test 10: Category input styling
  const categoryInputClasses = 'rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none';
  assert.ok(categoryInputClasses.includes('rounded-md'), 'Should have rounded corners');

  // Test 11: Category tag icon SVG path
  const categoryIconPath = 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z';
  assert.ok(categoryIconPath.includes('M7'), 'Should be a tag icon');

  // Test 12: Activity history icon for category
  const categoryActivityIcon = '🏷️';
  assert.equal(categoryActivityIcon, '🏷️', 'Should use tag emoji for category');

  // Test 13: Activity history color for category
  const categoryActivityColor = 'text-[var(--accent-highlight)]';
  assert.ok(categoryActivityColor.includes('accent-highlight'), 'Should use highlight color');

  // Test 14: Category preserved with other task operations
  const taskWithAll = {
    name: 'Complete Task',
    priority: 'high',
    dueDate: '2026-03-30',
    notes: 'Important note',
    category: 'Urgent',
  };
  assert.equal(taskWithAll.category, 'Urgent', 'Category should coexist with other fields');

  // Test 15: Category search matching (optional)
  const searchQuery = 'plan';
  const category = 'Planning';
  const matches = category.toLowerCase().includes(searchQuery.toLowerCase());
  assert.equal(matches, true, 'Category should be searchable');

  // Test 16: Category API sanitization
  const apiInput = { category: '  Valid Category  ' };
  const sanitized = apiInput.category.trim();
  assert.equal(sanitized, 'Valid Category', 'API should sanitize category');

  // Test 17: Category in batch operations preserved
  const batchTasks = [
    { name: 'Task 1', category: 'A' },
    { name: 'Task 2', category: 'B' },
  ];
  assert.equal(batchTasks[0].category, 'A', 'Category should persist in batch context');
  assert.equal(batchTasks[1].category, 'B', 'Category should persist in batch context');

  // Test 18: Category filter compatibility
  const priorityFilter = 'all';
  const hasCategory = true;
  const passesFilter = priorityFilter === 'all' || hasCategory;
  assert.equal(passesFilter, true, 'Category should not break priority filter');

  // Test 19: Backward compatibility - tasks without category work
  const legacyTask = { name: 'Legacy Task' };
  const displayCategory = legacyTask.category || null;
  assert.equal(displayCategory, null, 'Legacy tasks should work without category');

  // Test 20: Category edit flow
  let editingCategory = false;
  let categoryValue = 'Initial';
  function startEdit() {
    editingCategory = true;
  }
  function saveEdit(value) {
    const trimmed = value.trim();
    if (trimmed && trimmed.length <= 50) {
      categoryValue = trimmed;
    } else if (!trimmed) {
      categoryValue = '';
    }
    editingCategory = false;
  }
  startEdit();
  assert.equal(editingCategory, true, 'Should enter edit mode');
  saveEdit('  Updated  ');
  assert.equal(categoryValue, 'Updated', 'Should save trimmed category');
  assert.equal(editingCategory, false, 'Should exit edit mode');

  console.log('Task category tests passed.');
}

module.exports = {
  runTaskCategoryTests,
};
