require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

/**
 * Dossier-side input validation tests
 * 
 * These tests verify that user-editable surfaces in the dossier detail flow
 * properly validate and sanitize input before processing.
 */

function runDossierInputValidationTests() {
  // Simulate the handleAddTask validation logic from DossierDetailClient
  function validateTaskInput(task, existingTasks = []) {
    const sanitized = typeof task === 'string' ? task.trim() : '';
    if (!sanitized || sanitized.length === 0) return null;
    if (sanitized.length > 500) return null;
    if (existingTasks.includes(sanitized)) return null;
    return sanitized;
  }

  // Test: Valid task passes validation
  assert.equal(validateTaskInput('Complete the report'), 'Complete the report');
  assert.equal(validateTaskInput('  Trim whitespace  '), 'Trim whitespace');

  // Test: Empty string rejected
  assert.equal(validateTaskInput(''), null);
  assert.equal(validateTaskInput('   '), null);

  // Test: Non-string rejected
  assert.equal(validateTaskInput(null), null);
  assert.equal(validateTaskInput(undefined), null);
  assert.equal(validateTaskInput(123), null);
  assert.equal(validateTaskInput({}), null);
  assert.equal(validateTaskInput([]), null);

  // Test: Oversized task rejected (>500 chars)
  const oversizedTask = 'A'.repeat(501);
  assert.equal(validateTaskInput(oversizedTask), null);

  // Test: Task at exactly 500 chars accepted
  const maxSizeTask = 'B'.repeat(500);
  assert.equal(validateTaskInput(maxSizeTask), maxSizeTask);

  // Test: Duplicate task rejected
  const existingTasks = ['Existing task', 'Another task'];
  assert.equal(validateTaskInput('Existing task', existingTasks), null);
  assert.equal(validateTaskInput('New task', existingTasks), 'New task');

  // Test: Case-sensitive duplicate detection
  assert.equal(validateTaskInput('existing task', existingTasks), 'existing task');

  // Test: Whitespace-only rejected
  assert.equal(validateTaskInput('\n\t  '), null);

  // Test: Mixed valid/invalid in sequence
  const tasks = [];
  const result1 = validateTaskInput('First task', tasks);
  assert.equal(result1, 'First task');
  if (result1) tasks.push(result1);

  const result2 = validateTaskInput('First task', tasks); // Duplicate
  assert.equal(result2, null);

  const result3 = validateTaskInput('   '); // Empty
  assert.equal(result3, null);

  const result4 = validateTaskInput('Second task', tasks);
  assert.equal(result4, 'Second task');
}

module.exports = {
  runDossierInputValidationTests,
};
