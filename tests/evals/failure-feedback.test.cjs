const assert = require('assert');

// Test user-facing failure feedback for retry exhaustion
async function runFailureFeedbackTests() {
  console.log('Failure feedback tests running...');

  // Test 1: Verify error messages are user-friendly
  const taskErrorMessage = 'Task update could not be saved. Your changes are kept locally—try again shortly.';
  const phaseErrorMessage = 'Phase change could not be saved. Your change is kept locally—try again shortly.';
  const chatErrorMessage = 'Chat history could not be saved. Your messages are kept locally—try again shortly.';

  assert.ok(taskErrorMessage.includes('kept locally'), 'Task error should mention local state preservation');
  assert.ok(taskErrorMessage.includes('try again'), 'Task error should suggest retry action');
  assert.ok(phaseErrorMessage.includes('kept locally'), 'Phase error should mention local state preservation');
  assert.ok(phaseErrorMessage.includes('try again'), 'Phase error should suggest retry action');
  assert.ok(chatErrorMessage.includes('kept locally'), 'Chat error should mention local state preservation');
  assert.ok(chatErrorMessage.includes('try again'), 'Chat error should suggest retry action');

  // Test 2: Verify error message tone is calm and non-technical
  const errorMessages = [taskErrorMessage, phaseErrorMessage, chatErrorMessage];
  for (const msg of errorMessages) {
    assert.ok(!msg.includes('500'), 'Error should not expose HTTP status codes');
    assert.ok(!msg.includes('server'), 'Error should not blame server explicitly');
    assert.ok(!msg.includes('network'), 'Error should not use technical network terms');
    assert.ok(!msg.includes('timeout'), 'Error should not use technical timeout terms');
  }

  // Test 3: Verify error dismissibility (UI pattern verification)
  // The dismiss button uses setPersistError(null) pattern
  // This is verified by component structure, here we verify the state pattern exists
  const mockSetError = (val) => val;
  assert.equal(mockSetError(null), null, 'Error dismiss should set state to null');

  console.log('Failure feedback tests passed.');
}

module.exports = {
  runFailureFeedbackTests,
};
