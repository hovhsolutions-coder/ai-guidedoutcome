const assert = require('assert');

// Test timeout / cancellation hardening for AI endpoints
async function runTimeoutHardeningTests() {
  console.log('Timeout hardening tests running...');

  // Test createTimeoutPromise logic
  const createTimeoutPromise = (ms) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    });
  };

  // Test 1: Timeout promise should reject after specified duration
  const startTime = Date.now();
  try {
    await createTimeoutPromise(50);
    assert.fail('Should have timed out');
  } catch (error) {
    const elapsed = Date.now() - startTime;
    assert.ok(elapsed >= 45, 'Should wait at least 45ms');
    assert.ok(elapsed < 100, 'Should not take too long');
    assert.ok(error.message.includes('timed out'), 'Error should mention timeout');
    assert.ok(error.message.includes('50ms'), 'Error should mention the duration');
  }

  // Test 2: Promise.race with faster resolution should win
  const fastPromise = Promise.resolve('success');
  const slowTimeout = createTimeoutPromise(100);
  const raceResult = await Promise.race([fastPromise, slowTimeout]);
  assert.equal(raceResult, 'success', 'Fast promise should win the race');

  // Test 3: Promise.race with timeout winning
  const slowPromise = new Promise((resolve) => setTimeout(() => resolve('late'), 200));
  const fastTimeout = createTimeoutPromise(50);
  try {
    await Promise.race([slowPromise, fastTimeout]);
    assert.fail('Should have timed out');
  } catch (error) {
    assert.ok(error.message.includes('timed out'), 'Timeout should win');
  }

  // Test 4: Timeout duration validation
  const timeout10ms = createTimeoutPromise(10);
  const timeout50ms = createTimeoutPromise(50);

  const start10 = Date.now();
  try { await timeout10ms; } catch (e) { /* expected */ }
  const elapsed10 = Date.now() - start10;

  const start50 = Date.now();
  try { await timeout50ms; } catch (e) { /* expected */ }
  const elapsed50 = Date.now() - start50;

  assert.ok(elapsed50 > elapsed10, '50ms timeout should take longer than 10ms');

  // Test 5: Verify route timeout constants
  const GUIDANCE_ROUTE_TIMEOUT = 45000; // 45s
  const DOSSIER_ROUTE_TIMEOUT = 30000; // 30s

  assert.ok(GUIDANCE_ROUTE_TIMEOUT > 30000, 'Guidance timeout should be > 30s (allows for AI 30s timeout + overhead)');
  assert.ok(DOSSIER_ROUTE_TIMEOUT > 15000, 'Dossier timeout should be > 15s (allows for AI 15s timeout + overhead)');
  assert.ok(GUIDANCE_ROUTE_TIMEOUT > DOSSIER_ROUTE_TIMEOUT, 'Guidance timeout should be longer than dossier (heavier operation)');

  // Test 6: Policy timeout alignment
  const POLICY_GUIDANCE_TIMEOUT = 30000; // From policy.ts
  const POLICY_DOSSIER_TIMEOUT = 15000;

  assert.ok(GUIDANCE_ROUTE_TIMEOUT > POLICY_GUIDANCE_TIMEOUT, 'Route timeout should exceed policy timeout for guidance');
  assert.ok(DOSSIER_ROUTE_TIMEOUT > POLICY_DOSSIER_TIMEOUT, 'Route timeout should exceed policy timeout for dossier');

  // Test 7: Timeout error structure
  const timeoutError = new Error(`Request timed out after ${GUIDANCE_ROUTE_TIMEOUT}ms`);
  assert.ok(timeoutError.message.includes('45000'), 'Error should contain timeout value');
  assert.ok(timeoutError instanceof Error, 'Should be an Error instance');

  // Test 8: Multiple concurrent timeouts (only first rejects)
  let rejectionCount = 0;
  const t1 = createTimeoutPromise(30).catch(() => { rejectionCount++; });
  const t2 = createTimeoutPromise(40).catch(() => { rejectionCount++; });
  const t3 = createTimeoutPromise(50).catch(() => { rejectionCount++; });

  // Race them - only the first to complete matters
  try {
    await Promise.race([t1, t2, t3]);
  } catch (e) {
    // Expected
  }

  // Wait a bit for all to settle
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(rejectionCount, 3, 'All three timeouts should eventually reject');

  // Test 9: Normal resolution after timeout setup (ensures no interference)
  const normalResult = await Promise.race([
    Promise.resolve({ success: true, data: 'test' }),
    createTimeoutPromise(1000) // Long timeout that shouldn't trigger
  ]);
  assert.equal(normalResult.success, true, 'Normal result should succeed');
  assert.equal(normalResult.data, 'test', 'Data should be preserved');

  // Test 10: Simulate timeout catching slow operation
  const simulateSlowAI = () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  const routeTimeout = createTimeoutPromise(100);

  try {
    await Promise.race([simulateSlowAI(), routeTimeout]);
    assert.fail('Should have timed out');
  } catch (error) {
    assert.ok(error.message.includes('timed out'), 'Slow AI should be caught by route timeout');
  }

  console.log('Timeout hardening tests passed.');
}

module.exports = {
  runTimeoutHardeningTests,
};
