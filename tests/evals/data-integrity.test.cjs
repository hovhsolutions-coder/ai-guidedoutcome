const assert = require('assert');

// Test data integrity / corruption recovery for dossier API endpoints
async function runDataIntegrityTests() {
  console.log('Data integrity tests running...');

  // Test 1: String sanitization - normal string
  const sanitizeString = (input, defaultValue) => {
    if (typeof input !== 'string') return defaultValue;
    const trimmed = input.trim();
    if (trimmed.length === 0) return defaultValue;
    if (trimmed.length > 5000) return trimmed.slice(0, 5000);
    return trimmed;
  };

  assert.equal(sanitizeString('  hello  ', 'default'), 'hello', 'Should trim whitespace');
  assert.equal(sanitizeString('', 'default'), 'default', 'Empty string returns default');
  assert.equal(sanitizeString('   ', 'default'), 'default', 'Whitespace-only returns default');
  assert.equal(sanitizeString(123, 'default'), 'default', 'Non-string returns default');
  assert.equal(sanitizeString(null, 'default'), 'default', 'Null returns default');
  assert.equal(sanitizeString('x'.repeat(10000), 'default').length, 5000, 'Long string truncated to 5000');

  // Test 2: Task array sanitization
  const sanitizeTasks = (input) => {
    if (!Array.isArray(input)) return [];
    return input
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .map((t) => (t.length > 500 ? t.slice(0, 500) : t))
      .slice(0, 100);
  };

  assert.deepEqual(sanitizeTasks(['task1', 'task2']), ['task1', 'task2'], 'Valid tasks preserved');
  assert.deepEqual(sanitizeTasks(['  task1  ', '', 'task2', '   ']), ['  task1  ', 'task2'], 'Empty/whitespace filtered');
  assert.deepEqual(sanitizeTasks(['x'.repeat(1000)]), ['x'.repeat(500)], 'Long tasks truncated');
  assert.deepEqual(sanitizeTasks('not an array'), [], 'Non-array returns empty');
  assert.deepEqual(sanitizeTasks([123, 'valid', null]), ['valid'], 'Non-strings filtered');
  assert.equal(sanitizeTasks(Array(200).fill('task')).length, 100, 'Max 100 tasks');

  // Test 3: GeneratedDossier sanitization
  const sanitizeGeneratedDossier = (input) => {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return null;
    }

    const d = input;
    const title = sanitizeString(d.title, '');
    const situation = sanitizeString(d.situation, '');
    const main_goal = sanitizeString(d.main_goal, '');

    if (!title || !situation || !main_goal) {
      return null;
    }

    return {
      title,
      situation,
      main_goal,
      phase: sanitizeString(d.phase, 'Understanding'),
      suggested_tasks: sanitizeTasks(d.suggested_tasks),
    };
  };

  // Valid dossier
  const validDossier = sanitizeGeneratedDossier({
    title: 'Test Dossier',
    situation: 'Test situation',
    main_goal: 'Test goal',
    phase: 'Structuring',
    suggested_tasks: ['task1', 'task2'],
  });
  assert.ok(validDossier, 'Valid dossier accepted');
  assert.equal(validDossier.title, 'Test Dossier', 'Title preserved');
  assert.equal(validDossier.phase, 'Structuring', 'Phase preserved');
  assert.equal(validDossier.suggested_tasks.length, 2, 'Tasks preserved');

  // Missing required field
  assert.equal(sanitizeGeneratedDossier({ title: 'Test', situation: 'Test' }), null, 'Missing main_goal rejected');
  assert.equal(sanitizeGeneratedDossier({ title: '', situation: 'Test', main_goal: 'Test' }), null, 'Empty title rejected');

  // Non-object input
  assert.equal(sanitizeGeneratedDossier('string'), null, 'String input rejected');
  assert.equal(sanitizeGeneratedDossier(null), null, 'Null input rejected');
  assert.equal(sanitizeGeneratedDossier(['array']), null, 'Array input rejected');

  // Malicious task data
  const maliciousDossier = sanitizeGeneratedDossier({
    title: 'Test',
    situation: 'Test',
    main_goal: 'Test',
    suggested_tasks: ['valid', '', null, 123, '  ', 'x'.repeat(1000)],
  });
  assert.equal(maliciousDossier.suggested_tasks.length, 2, 'Only valid tasks kept');
  assert.equal(maliciousDossier.suggested_tasks[1].length, 500, 'Long task truncated');

  // Test 4: Updates sanitization
  const validatePhase = (input) => {
    const validPhases = ['Understanding', 'Structuring', 'Executing', 'Completed'];
    if (validPhases.includes(input)) return input;
    return undefined;
  };

  const sanitizeUpdates = (input) => {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return null;
    }

    const u = input;
    const sanitized = {};

    if (u.title !== undefined) {
      const sanitizedTitle = sanitizeString(u.title, '');
      if (sanitizedTitle) sanitized.title = sanitizedTitle;
    }

    if (u.phase !== undefined) {
      const sanitizedPhase = validatePhase(u.phase);
      if (sanitizedPhase) sanitized.phase = sanitizedPhase;
    }

    if (u.progress !== undefined && typeof u.progress === 'number' && !isNaN(u.progress)) {
      sanitized.progress = Math.max(0, Math.min(100, Math.round(u.progress)));
    }

    if (u.tasks !== undefined) {
      sanitized.tasks = sanitizeTasks(u.tasks);
    }

    return Object.keys(sanitized).length > 0 ? sanitized : null;
  };

  // Valid updates
  const validUpdates = sanitizeUpdates({ title: 'New Title', progress: 75 });
  assert.ok(validUpdates, 'Valid updates accepted');
  assert.equal(validUpdates.title, 'New Title', 'Title updated');
  assert.equal(validUpdates.progress, 75, 'Progress clamped');

  // Invalid phase rejected
  const invalidPhase = sanitizeUpdates({ phase: 'InvalidPhase' });
  assert.equal(invalidPhase, null, 'Invalid phase results in no valid updates');

  // Progress clamping
  assert.equal(sanitizeUpdates({ progress: 150 }).progress, 100, 'Progress clamped to 100');
  assert.equal(sanitizeUpdates({ progress: -10 }).progress, 0, 'Progress clamped to 0');
  assert.equal(sanitizeUpdates({ progress: 45.7 }).progress, 46, 'Progress rounded');

  // NaN progress rejected
  const nanProgress = sanitizeUpdates({ progress: NaN });
  assert.equal(nanProgress, null, 'NaN progress rejected');

  // Empty string title rejected
  const emptyTitle = sanitizeUpdates({ title: '' });
  assert.equal(emptyTitle, null, 'Empty title rejected');

  // Non-object input
  assert.equal(sanitizeUpdates('string'), null, 'String updates rejected');
  assert.equal(sanitizeUpdates(null), null, 'Null updates rejected');

  // Mixed valid/invalid - only valid kept
  const mixedUpdates = sanitizeUpdates({
    title: 'Valid Title',
    phase: 'Invalid',
    progress: 50,
    tasks: ['task1', 123, 'task2'],
  });
  assert.ok(mixedUpdates, 'Mixed updates accepted');
  assert.equal(mixedUpdates.title, 'Valid Title', 'Valid title kept');
  assert.equal(mixedUpdates.phase, undefined, 'Invalid phase excluded');
  assert.equal(mixedUpdates.progress, 50, 'Valid progress kept');
  assert.equal(mixedUpdates.tasks.length, 2, 'Only valid tasks kept');

  console.log('Data integrity tests passed.');
}

module.exports = {
  runDataIntegrityTests,
};
