const assert = require('assert');

// Test retry behavior for network calls
async function runNetworkRetryTests() {
  console.log('Network retry utility tests running...');

  // Test 1: Successful call should not retry
  let attemptCount = 0;
  const successFn = async () => {
    attemptCount++;
    return 'success';
  };

  const result1 = await withRetry(successFn, { maxRetries: 2, delayMs: 10 });
  assert.equal(result1, 'success');
  assert.equal(attemptCount, 1, 'Should not retry on success');

  // Test 2: Retry on network error (TypeError)
  attemptCount = 0;
  const networkErrorFn = async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new TypeError('Failed to fetch');
    }
    return 'recovered';
  };

  const result2 = await withRetry(networkErrorFn, { maxRetries: 2, delayMs: 10 });
  assert.equal(result2, 'recovered');
  assert.equal(attemptCount, 3, 'Should retry on network error');

  // Test 3: Retry on 5xx Response error
  attemptCount = 0;
  const serverErrorFn = async () => {
    attemptCount++;
    if (attemptCount < 2) {
      const response = new Response(null, { status: 503 });
      throw response;
    }
    return 'recovered';
  };

  const result3 = await withRetry(serverErrorFn, { maxRetries: 2, delayMs: 10 });
  assert.equal(result3, 'recovered');
  assert.equal(attemptCount, 2, 'Should retry on 5xx error');

  // Test 4: Retry on 429 rate limit
  attemptCount = 0;
  const rateLimitFn = async () => {
    attemptCount++;
    if (attemptCount < 2) {
      const response = new Response(null, { status: 429 });
      throw response;
    }
    return 'recovered';
  };

  const result4 = await withRetry(rateLimitFn, { maxRetries: 2, delayMs: 10 });
  assert.equal(result4, 'recovered');
  assert.equal(attemptCount, 2, 'Should retry on 429 error');

  // Test 5: Do not retry on 4xx client errors (except 429)
  attemptCount = 0;
  const clientErrorFn = async () => {
    attemptCount++;
    const response = new Response(null, { status: 400 });
    throw response;
  };

  try {
    await withRetry(clientErrorFn, { maxRetries: 2, delayMs: 10 });
    assert.fail('Should have thrown');
  } catch {
    assert.equal(attemptCount, 1, 'Should not retry on 4xx error');
  }

  // Test 6: Do not retry on application error (non-retryable)
  attemptCount = 0;
  const appErrorFn = async () => {
    attemptCount++;
    throw new Error('Invalid input');
  };

  try {
    await withRetry(appErrorFn, { maxRetries: 2, delayMs: 10 });
    assert.fail('Should have thrown');
  } catch {
    assert.equal(attemptCount, 1, 'Should not retry on application error');
  }

  // Test 7: Exhaust retries and fail
  attemptCount = 0;
  const alwaysFailFn = async () => {
    attemptCount++;
    throw new TypeError('Network failure');
  };

  try {
    await withRetry(alwaysFailFn, { maxRetries: 2, delayMs: 10 });
    assert.fail('Should have thrown after retries exhausted');
  } catch (error) {
    assert.equal(attemptCount, 3, 'Should exhaust all retries');
    assert.ok(error instanceof TypeError);
    assert.ok(error.message.includes('Network failure'));
  }

  console.log('Network retry utility tests passed.');
}

// Inline retry utility for tests (copied from source)
async function withRetry(fn, options = {}) {
  const { maxRetries = 2, delayMs = 500, shouldRetry = isRetryableError } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

function isRetryableError(error) {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Response) {
    return error.status >= 500 || error.status === 429;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('abort')
    );
  }

  return false;
}

module.exports = {
  runNetworkRetryTests,
};
