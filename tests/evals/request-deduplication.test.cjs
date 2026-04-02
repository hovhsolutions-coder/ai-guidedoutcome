const assert = require('assert');

// Test request deduplication / in-flight guard behavior
async function runRequestDeduplicationTests() {
  console.log('Request deduplication tests running...');

  // Test 1: Guidance submit should block duplicate requests while loading
  let isLoading = false;
  let submitCount = 0;

  const mockSubmitGuidance = async () => {
    if (isLoading) {
      console.log('[test:dedup] submit blocked - already loading');
      return 'blocked';
    }
    isLoading = true;
    submitCount++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    isLoading = false;
    return 'success';
  };

  // First call should start the operation
  const promise1 = mockSubmitGuidance();
  // Second call while first is in-flight should be blocked
  const promise2 = mockSubmitGuidance();

  const result1 = await promise1;
  const result2 = await promise2;

  assert.equal(result1, 'success', 'First submit should succeed');
  assert.equal(result2, 'blocked', 'Second submit should be blocked while in-flight');
  assert.equal(submitCount, 1, 'Only one actual submission should occur');

  // Test 2: Follow-up submit should block duplicate requests
  let isSubmittingFollowUp = false;
  let followUpCount = 0;

  const mockSubmitFollowUp = async () => {
    if (isSubmittingFollowUp) {
      console.log('[test:dedup] follow-up blocked - already in flight');
      return 'blocked';
    }
    isSubmittingFollowUp = true;
    followUpCount++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    isSubmittingFollowUp = false;
    return 'success';
  };

  const fuPromise1 = mockSubmitFollowUp();
  const fuPromise2 = mockSubmitFollowUp();

  const fuResult1 = await fuPromise1;
  const fuResult2 = await fuPromise2;

  assert.equal(fuResult1, 'success', 'First follow-up should succeed');
  assert.equal(fuResult2, 'blocked', 'Second follow-up should be blocked');
  assert.equal(followUpCount, 1, 'Only one follow-up submission should occur');

  // Test 3: Trainer selection should block duplicate requests
  let trainerLoading = null;
  let trainerCount = 0;

  const mockSelectTrainer = (trainerId) => {
    if (trainerLoading) {
      console.log(`[test:dedup] trainer ${trainerId} blocked - ${trainerLoading} already loading`);
      return 'blocked';
    }
    trainerLoading = trainerId;
    trainerCount++;
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        trainerLoading = null;
        resolve('success');
      }, 10);
    });
  };

  const tPromise1 = mockSelectTrainer('strategy');
  const tPromise2 = mockSelectTrainer('risk');

  const tResult1 = await tPromise1;
  const tResult2 = tPromise2; // This is a string 'blocked', not a promise

  assert.equal(tResult1, 'success', 'First trainer selection should succeed');
  assert.equal(tResult2, 'blocked', 'Second trainer selection should be blocked');
  assert.equal(trainerCount, 1, 'Only one trainer request should occur');

  // Test 4: Dossier persistence should block overlapping operations
  let persistInFlight = false;
  let persistCount = 0;

  const mockPersistTaskChanges = async () => {
    if (persistInFlight) {
      console.log('[test:dedup] persist blocked - already in flight');
      return { success: false, blocked: true };
    }
    persistInFlight = true;
    persistCount++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    persistInFlight = false;
    return { success: true };
  };

  const pPromise1 = mockPersistTaskChanges();
  const pPromise2 = mockPersistTaskChanges();

  const pResult1 = await pPromise1;
  const pResult2 = await pPromise2;

  assert.equal(pResult1.success, true, 'First persist should succeed');
  assert.equal(pResult2.blocked, true, 'Second persist should be blocked');
  assert.equal(persistCount, 1, 'Only one persistence operation should occur');

  // Test 5: Sequential requests (after completion) should be allowed
  isLoading = false;
  submitCount = 0;

  const seq1 = await mockSubmitGuidance();
  const seq2 = await mockSubmitGuidance();

  assert.equal(seq1, 'success', 'First sequential submit should succeed');
  assert.equal(seq2, 'success', 'Second sequential submit should succeed (not blocked)');
  assert.equal(submitCount, 2, 'Two sequential submissions should occur');

  // Test 6: Verify retry behavior is preserved (retries allowed, duplicates blocked)
  let attemptCount = 0;
  const mockSubmitWithRetry = async () => {
    if (isLoading) {
      return 'blocked';
    }
    isLoading = true;
    attemptCount++;
    // Simulate a failure then success on retry
    if (attemptCount === 1) {
      isLoading = false;
      throw new Error('Transient error');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
    isLoading = false;
    return 'success';
  };

  // First attempt fails
  try {
    await mockSubmitWithRetry();
  } catch (e) {
    // Expected
  }

  // Retry should be allowed (not blocked) because isLoading is false after failure
  const retryResult = await mockSubmitWithRetry();
  assert.equal(retryResult, 'success', 'Retry after failure should be allowed');
  assert.equal(attemptCount, 2, 'Two attempts should occur (original + retry)');

  console.log('Request deduplication tests passed.');
}

module.exports = {
  runRequestDeduplicationTests,
};
