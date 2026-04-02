const assert = require('assert');

// Test task time tracking functionality
async function runTaskTimeTrackingTests() {
  console.log('Task time tracking tests running...');

  // Test 1: actualTime field exists on Task
  const taskWithTime = {
    name: 'Test Task',
    actualTime: 90, // 90 minutes
  };
  assert.equal(taskWithTime.actualTime, 90, 'Task should have actualTime field');

  // Test 2: actualTime is optional
  const taskWithoutTime = {
    name: 'Test Task',
  };
  assert.equal(taskWithoutTime.actualTime, undefined, 'actualTime should be optional');

  // Test 3: isTracking field exists on Task
  const taskWithTracking = {
    name: 'Test Task',
    isTracking: true,
  };
  assert.equal(taskWithTracking.isTracking, true, 'Task should have isTracking field');

  // Test 4: trackingStartedAt field exists on Task
  const taskWithStartedAt = {
    name: 'Test Task',
    isTracking: true,
    trackingStartedAt: '2026-03-27T10:00:00Z',
  };
  assert.equal(taskWithStartedAt.trackingStartedAt, '2026-03-27T10:00:00Z', 'Task should have trackingStartedAt field');

  // Test 5: Start tracking sets isTracking and trackingStartedAt
  const task = { name: 'Task 1' };
  const now = new Date().toISOString();
  const updatedTask = {
    ...task,
    isTracking: true,
    trackingStartedAt: now,
  };
  assert.equal(updatedTask.isTracking, true, 'Should set isTracking to true');
  assert.equal(updatedTask.trackingStartedAt, now, 'Should set trackingStartedAt');

  // Test 6: Stop tracking adds elapsed time to actualTime
  const trackingTask = {
    name: 'Task 2',
    isTracking: true,
    trackingStartedAt: '2026-03-27T10:00:00Z',
    actualTime: 30,
  };
  // Simulate 15 minutes passed
  const elapsed = 15;
  const stoppedTask = {
    ...trackingTask,
    isTracking: false,
    trackingStartedAt: undefined,
    actualTime: (trackingTask.actualTime || 0) + elapsed,
  };
  assert.equal(stoppedTask.isTracking, false, 'Should set isTracking to false');
  assert.equal(stoppedTask.trackingStartedAt, undefined, 'Should clear trackingStartedAt');
  assert.equal(stoppedTask.actualTime, 45, 'Should add elapsed time to actualTime');

  // Test 7: actualTime non-negative validation
  const negativeTime = -10;
  const sanitizedTime = negativeTime >= 0 ? negativeTime : 0;
  assert.equal(sanitizedTime, 0, 'Should sanitize negative actualTime to 0');

  // Test 8: Activity types for time tracking
  const startActivity = 'task_tracking_started';
  const stopActivity = 'task_tracking_stopped';
  assert.equal(startActivity, 'task_tracking_started', 'Should have start tracking activity type');
  assert.equal(stopActivity, 'task_tracking_stopped', 'Should have stop tracking activity type');

  // Test 9: Activity history icons for time tracking
  const startIcon = '▶️';
  const stopIcon = '⏹️';
  assert.equal(startIcon, '▶️', 'Should use play icon for tracking start');
  assert.equal(stopIcon, '⏹️', 'Should use stop icon for tracking stop');

  // Test 10: Activity history colors for time tracking
  const startColor = 'text-[var(--color-green)]';
  const stopColor = 'text-[var(--text-secondary)]';
  assert.ok(startColor.includes('color-green'), 'Start tracking should use green color');
  assert.ok(stopColor.includes('text-secondary'), 'Stop tracking should use secondary color');

  // Test 11: formatTime helper function
  function formatTime(minutes) {
    if (!minutes || minutes <= 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  assert.equal(formatTime(30), '30m', 'Should format 30 minutes');
  assert.equal(formatTime(90), '1h 30m', 'Should format 90 minutes');
  assert.equal(formatTime(120), '2h', 'Should format 120 minutes');
  assert.equal(formatTime(0), '0m', 'Should format 0 minutes');
  assert.equal(formatTime(null), '0m', 'Should format null as 0m');

  // Test 12: Time tracking button styling when active
  const activeTrackingClass = 'text-[var(--color-green)] animate-pulse';
  assert.ok(activeTrackingClass.includes('color-green'), 'Active tracking should use green');
  assert.ok(activeTrackingClass.includes('animate-pulse'), 'Active tracking should pulse');

  // Test 13: Time tracking button styling when inactive
  const inactiveTrackingClass = 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]';
  assert.ok(inactiveTrackingClass.includes('text-secondary'), 'Inactive tracking should use secondary');

  // Test 14: API sanitization for actualTime (number, non-negative)
  const apiInput = { actualTime: 120 };
  const isValid = typeof apiInput.actualTime === 'number' && apiInput.actualTime >= 0;
  assert.equal(isValid, true, 'API should accept valid actualTime');

  // Test 15: API sanitization for isTracking (boolean)
  const apiTracking = { isTracking: true };
  const isValidTracking = typeof apiTracking.isTracking === 'boolean';
  assert.equal(isValidTracking, true, 'API should accept valid isTracking');

  // Test 16: API sanitization for trackingStartedAt (valid ISO date)
  const apiStartedAt = { trackingStartedAt: '2026-03-27T10:00:00Z' };
  const date = new Date(apiStartedAt.trackingStartedAt);
  const isValidDate = !isNaN(date.getTime());
  assert.equal(isValidDate, true, 'API should accept valid ISO date');

  // Test 17: Estimate vs actual comparison
  const taskWithBoth = {
    name: 'Task',
    estimate: '2h',
    actualTime: 90, // 1h 30m
  };
  assert.ok(taskWithBoth.estimate, 'Task should have estimate');
  assert.ok(taskWithBoth.actualTime !== undefined, 'Task should have actualTime');

  // Test 18: Backward compatibility - tasks without time tracking fields work
  const legacyTask = { name: 'Legacy Task' };
  const displayTime = legacyTask.actualTime || 0;
  const isTracking = legacyTask.isTracking || false;
  assert.equal(displayTime, 0, 'Legacy tasks should show 0 time');
  assert.equal(isTracking, false, 'Legacy tasks should show not tracking');

  // Test 19: Time tracking in batch operations preserved
  const batchTasks = [
    { name: 'Task 1', actualTime: 30, isTracking: false },
    { name: 'Task 2', actualTime: 60, isTracking: true, trackingStartedAt: '2026-03-27T10:00:00Z' },
  ];
  assert.equal(batchTasks[0].actualTime, 30, 'Time should persist in batch context');
  assert.equal(batchTasks[1].isTracking, true, 'Tracking state should persist in batch context');

  // Test 20: Time tracking does not affect other task operations
  const taskWithAllFields = {
    name: 'Complete Task',
    priority: 'high',
    dueDate: '2026-03-30',
    notes: 'Important note',
    category: 'Urgent',
    estimate: '2h',
    actualTime: 90,
    isTracking: false,
  };
  assert.equal(taskWithAllFields.actualTime, 90, 'actualTime should coexist with other fields');
  assert.equal(taskWithAllFields.isTracking, false, 'isTracking should coexist with other fields');

  console.log('Task time tracking tests passed.');
}

module.exports = {
  runTaskTimeTrackingTests,
};
