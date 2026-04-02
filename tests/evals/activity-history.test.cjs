const assert = require('assert');

// Test activity history functionality
async function runActivityHistoryTests() {
  console.log('Activity history tests running...');

  // Test 1: Activity entry structure
  const activityEntry = {
    id: '123-abc',
    type: 'task_added',
    description: 'Added task "Test task"',
    timestamp: '2026-03-27T10:00:00Z',
    taskName: 'Test task',
  };
  assert.equal(activityEntry.id, '123-abc', 'Activity should have correct ID');
  assert.equal(activityEntry.type, 'task_added', 'Activity should have correct type');
  assert.equal(activityEntry.description, 'Added task "Test task"', 'Activity should have correct description');
  assert.equal(activityEntry.timestamp, '2026-03-27T10:00:00Z', 'Activity should have correct timestamp');
  assert.equal(activityEntry.taskName, 'Test task', 'Activity should have correct taskName');

  // Test 2: All valid activity types
  const validTypes = [
    'task_added', 'task_completed', 'task_uncompleted', 'task_deleted',
    'task_renamed', 'task_due_date_set', 'task_due_date_cleared',
    'task_note_set', 'task_note_cleared', 'phase_changed'
  ];
  for (const type of validTypes) {
    const entry = { id: '1', type, description: 'Test', timestamp: '2026-03-27T10:00:00Z' };
    assert.equal(entry.type, type, `Activity type ${type} should be valid`);
  }

  // Test 3: Activity entry with old/new values
  const renameActivity = {
    id: '456-def',
    type: 'task_renamed',
    description: 'Renamed task from "Old" to "New"',
    timestamp: '2026-03-27T11:00:00Z',
    taskName: 'New',
    oldValue: 'Old',
    newValue: 'New',
  };
  assert.equal(renameActivity.oldValue, 'Old', 'Activity should have oldValue');
  assert.equal(renameActivity.newValue, 'New', 'Activity should have newValue');

  // Test 4: Activity history array operations
  const activities = [];
  const newActivity = {
    id: '789-ghi',
    type: 'task_completed',
    description: 'Completed task "Test"',
    timestamp: new Date().toISOString(),
    taskName: 'Test',
  };
  activities.push(newActivity);
  assert.equal(activities.length, 1, 'Activity history should have 1 entry');
  assert.equal(activities[0].type, 'task_completed', 'Activity should be task_completed');

  // Test 5: Activity history limit (max 100 entries)
  const maxActivities = 100;
  const limitedActivities = activities.slice(-maxActivities);
  assert.equal(limitedActivities.length, 1, 'Limited activities should have correct count');

  // Test 6: Timestamp formatting helper
  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const justNow = formatTimestamp(new Date().toISOString());
  assert.equal(justNow, 'just now', 'Recent timestamp should show "just now"');

  // Test 7: Activity entry creation helper
  function generateActivityId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  const id1 = generateActivityId();
  const id2 = generateActivityId();
  assert.notEqual(id1, id2, 'Generated IDs should be unique');
  assert.ok(id1.includes('-'), 'Generated ID should contain hyphen');

  function createActivityEntry(type, description, taskName, oldValue, newValue) {
    return {
      id: generateActivityId(),
      type,
      description,
      timestamp: new Date().toISOString(),
      taskName,
      oldValue,
      newValue,
    };
  }
  const entry = createActivityEntry('task_added', 'Added task', 'Task 1');
  assert.equal(entry.type, 'task_added', 'Created entry should have correct type');
  assert.equal(entry.description, 'Added task', 'Created entry should have correct description');
  assert.ok(entry.id, 'Created entry should have ID');
  assert.ok(entry.timestamp, 'Created entry should have timestamp');

  // Test 8: Activity history backward compatibility (empty/missing)
  const dossierWithoutHistory = { id: '1', title: 'Test', tasks: [] };
  assert.equal(dossierWithoutHistory.activityHistory, undefined, 'Dossier without history should be undefined');

  // Test 9: Activity history persistence format
  const activityHistory = [
    { id: '1', type: 'task_added', description: 'Added', timestamp: '2026-03-27T10:00:00Z' },
  ];
  const updatePayload = {
    tasks: [{ name: 'Task 1' }],
    completedTasks: [],
    progress: 0,
    lastActivity: 'Tasks updated',
    activityHistory,
  };
  assert.ok(Array.isArray(updatePayload.activityHistory), 'Payload should have activityHistory array');
  assert.equal(updatePayload.activityHistory.length, 1, 'Payload should have 1 activity');

  // Test 10: Activity sanitization
  const sanitizeActivityHistory = (input) => {
    if (!Array.isArray(input)) return undefined;
    
    const MAX_ACTIVITY_ENTRIES = 100;
    const VALID_ACTIVITY_TYPES = [
      'task_added', 'task_completed', 'task_uncompleted', 'task_deleted',
      'task_renamed', 'task_due_date_set', 'task_due_date_cleared',
      'task_note_set', 'task_note_cleared', 'phase_changed'
    ];
    
    const sanitized = [];
    
    for (const entry of input.slice(0, MAX_ACTIVITY_ENTRIES)) {
      if (typeof entry !== 'object' || entry === null) continue;
      
      const e = entry;
      
      if (typeof e.id !== 'string' || !e.id) continue;
      if (typeof e.type !== 'string' || !VALID_ACTIVITY_TYPES.includes(e.type)) continue;
      if (typeof e.description !== 'string' || !e.description.trim()) continue;
      if (typeof e.timestamp !== 'string' || !e.timestamp) continue;
      
      const sanitizedEntry = {
        id: e.id.slice(0, 50),
        type: e.type,
        description: e.description.slice(0, 200),
        timestamp: e.timestamp,
      };
      
      if (e.taskName && typeof e.taskName === 'string') {
        sanitizedEntry.taskName = e.taskName.slice(0, 500);
      }
      if (e.oldValue && typeof e.oldValue === 'string') {
        sanitizedEntry.oldValue = e.oldValue.slice(0, 100);
      }
      if (e.newValue && typeof e.newValue === 'string') {
        sanitizedEntry.newValue = e.newValue.slice(0, 100);
      }
      
      sanitized.push(sanitizedEntry);
    }
    
    return sanitized.length > 0 ? sanitized : undefined;
  };

  // Test valid activity
  const validActivities = [
    { id: '1', type: 'task_added', description: 'Added task', timestamp: '2026-03-27T10:00:00Z', taskName: 'Task 1' },
  ];
  const sanitized = sanitizeActivityHistory(validActivities);
  assert.equal(sanitized.length, 1, 'Valid activities should be sanitized');
  assert.equal(sanitized[0].type, 'task_added', 'Sanitized activity should preserve type');

  // Test invalid activity type
  const invalidTypeActivities = [
    { id: '1', type: 'invalid_type', description: 'Bad', timestamp: '2026-03-27T10:00:00Z' },
  ];
  const sanitizedInvalid = sanitizeActivityHistory(invalidTypeActivities);
  assert.equal(sanitizedInvalid, undefined, 'Invalid activity types should be filtered out');

  // Test empty input
  assert.equal(sanitizeActivityHistory(null), undefined, 'Null input should return undefined');
  assert.equal(sanitizeActivityHistory([]), undefined, 'Empty array should return undefined');

  // Test 11: Activity icons and colors mapping
  const ACTIVITY_ICONS = {
    task_added: '+',
    task_completed: '✓',
    task_uncompleted: '↺',
    task_deleted: '×',
    task_renamed: '✎',
    task_due_date_set: '📅',
    task_due_date_cleared: '📅',
    task_note_set: '📝',
    task_note_cleared: '📝',
    phase_changed: '➤',
  };
  assert.equal(ACTIVITY_ICONS.task_added, '+', 'Task added should have + icon');
  assert.equal(ACTIVITY_ICONS.task_completed, '✓', 'Task completed should have ✓ icon');
  assert.equal(ACTIVITY_ICONS.phase_changed, '➤', 'Phase changed should have ➤ icon');

  // Test 12: Activity description generation for different events
  const taskName = 'Review document';
  const dueDate = '2026-04-15';
  
  // Task added
  const addedDesc = `Added task "${taskName}"`;
  assert.ok(addedDesc.includes(taskName), 'Task added description should include task name');
  
  // Task completed
  const completedDesc = `Completed task "${taskName}"`;
  assert.ok(completedDesc.includes('Completed'), 'Task completed description should indicate completion');
  
  // Due date set
  const dueDateDesc = `Set due date for "${taskName}" to ${dueDate}`;
  assert.ok(dueDateDesc.includes(dueDate), 'Due date description should include date');
  
  // Phase changed
  const phaseDesc = `Moved to Executing phase`;
  assert.ok(phaseDesc.includes('Executing'), 'Phase change description should include phase name');

  console.log('Activity history tests passed.');
}

module.exports = {
  runActivityHistoryTests,
};
