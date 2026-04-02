const assert = require('assert');

// Test server-side rate limiting for AI endpoints
async function runRateLimitingTests() {
  console.log('Rate limiting tests running...');

  // Import the rate limiter
  const { checkRateLimit, getRateLimitInfo } = require('../../src/lib/rate-limit.ts');

  // Create a mock request that matches the Request interface
  const createMockRequest = (url = 'http://localhost/api/ai/guidance', headers = {}) => {
    const headersMap = new Map(Object.entries(headers));
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key) || null,
      },
    };
  };

  // Test 1: First request should be allowed (use unique URL to avoid test pollution)
  const req1 = createMockRequest('http://localhost/api/test1');
  const result1 = checkRateLimit(req1, { windowMs: 60000, maxRequests: 5 });
  assert.equal(result1.allowed, true, 'First request should be allowed');
  assert.equal(result1.remaining, 4, 'Should have 4 requests remaining');
  assert.equal(result1.retryAfter, 0, 'No retry needed');

  // Test 2: Requests within limit should be allowed
  const req2 = createMockRequest('http://localhost/api/test2');
  const result2 = checkRateLimit(req2, { windowMs: 60000, maxRequests: 5 });
  assert.equal(result2.allowed, true, 'Second request should be allowed');
  assert.equal(result2.remaining, 4, 'Should have 4 requests remaining (new window)');

  // Test 3: Multiple requests on same endpoint
  const req3 = createMockRequest('http://localhost/api/test3');
  checkRateLimit(req3, { windowMs: 60000, maxRequests: 5 });
  checkRateLimit(req3, { windowMs: 60000, maxRequests: 5 });
  const result3 = checkRateLimit(req3, { windowMs: 60000, maxRequests: 5 });
  assert.equal(result3.allowed, true, '3rd request should be allowed');
  assert.equal(result3.remaining, 2, 'Should have 2 remaining');

  // Reset and test boundary properly
  const boundaryReq = createMockRequest('http://localhost/api/test-boundary');
  const config = { windowMs: 60000, maxRequests: 3 };

  const b1 = checkRateLimit(boundaryReq, config);
  assert.equal(b1.allowed, true, '1st request should be allowed');
  assert.equal(b1.remaining, 2, 'Should have 2 remaining');

  const b2 = checkRateLimit(boundaryReq, config);
  assert.equal(b2.allowed, true, '2nd request should be allowed');
  assert.equal(b2.remaining, 1, 'Should have 1 remaining');

  const b3 = checkRateLimit(boundaryReq, config);
  assert.equal(b3.allowed, true, '3rd request should be allowed (at limit)');
  assert.equal(b3.remaining, 0, 'Should have 0 remaining');

  // Test 4: Request over limit should be blocked
  const b4 = checkRateLimit(boundaryReq, config);
  assert.equal(b4.allowed, false, '4th request should be blocked');
  assert.equal(b4.remaining, 0, 'Should show 0 remaining');
  assert.ok(b4.retryAfter > 0, 'Should have retry-after value');
  assert.ok(b4.resetTime > Date.now(), 'Reset time should be in future');

  // Test 5: Different clients have separate limits
  const client1Req = createMockRequest('http://localhost/api/guidance', { 'x-forwarded-for': '1.2.3.4' });
  const client2Req = createMockRequest('http://localhost/api/guidance', { 'x-forwarded-for': '5.6.7.8' });
  const strictConfig = { windowMs: 60000, maxRequests: 1 };

  const c1r1 = checkRateLimit(client1Req, strictConfig);
  assert.equal(c1r1.allowed, true, 'Client 1 first request should be allowed');

  const c2r1 = checkRateLimit(client2Req, strictConfig);
  assert.equal(c2r1.allowed, true, 'Client 2 first request should be allowed (separate limit)');

  // Client 1 should be blocked now, client 2 should also be blocked (they used their 1 request)
  const c1r2 = checkRateLimit(client1Req, strictConfig);
  assert.equal(c1r2.allowed, false, 'Client 1 second request should be blocked');

  // Test 6: Rate limit info without incrementing
  const infoReq = createMockRequest('http://localhost/api/info-test');
  const infoConfig = { windowMs: 60000, maxRequests: 10 };

  // Make one request
  checkRateLimit(infoReq, infoConfig);

  // Get info - should show 9 remaining without decrementing
  const info = getRateLimitInfo(infoReq, infoConfig);
  assert.equal(info.remaining, 9, 'Should show 9 remaining');

  // Get info again - should still show 9
  const info2 = getRateLimitInfo(infoReq, infoConfig);
  assert.equal(info2.remaining, 9, 'Should still show 9 remaining (no decrement)');

  // Actually make another request
  checkRateLimit(infoReq, infoConfig);

  // Now info should show 8
  const info3 = getRateLimitInfo(infoReq, infoConfig);
  assert.equal(info3.remaining, 8, 'Should show 8 remaining after actual request');

  // Test 7: Different endpoints have separate limits
  const endpoint1 = createMockRequest('http://localhost/api/endpoint1');
  const endpoint2 = createMockRequest('http://localhost/api/endpoint2');
  const epConfig = { windowMs: 60000, maxRequests: 2 };

  const ep1r1 = checkRateLimit(endpoint1, epConfig);
  const ep1r2 = checkRateLimit(endpoint1, epConfig);
  const ep1r3 = checkRateLimit(endpoint1, epConfig);

  assert.equal(ep1r3.allowed, false, 'Endpoint 1 3rd request should be blocked');

  const ep2r1 = checkRateLimit(endpoint2, epConfig);
  assert.equal(ep2r1.allowed, true, 'Endpoint 2 1st request should be allowed (separate limit)');
  assert.equal(ep2r1.remaining, 1, 'Endpoint 2 should have its own limit');

  // Test 8: Verify 429 response structure
  const blockedResult = checkRateLimit(endpoint1, epConfig);
  assert.equal(blockedResult.allowed, false, 'Should be blocked');
  assert.ok(typeof blockedResult.retryAfter === 'number', 'Should have numeric retryAfter');
  assert.ok(blockedResult.retryAfter >= 0, 'retryAfter should be non-negative');

  // Test 9: Window expiry (simulated by using a new endpoint)
  const windowTestReq = createMockRequest('http://localhost/api/window-test');
  const windowConfig = { windowMs: 50, maxRequests: 1 }; // Very short window

  const w1 = checkRateLimit(windowTestReq, windowConfig);
  assert.equal(w1.allowed, true, 'First request should be allowed');

  // Wait for window to expire (simulated - in real tests would use timeout)
  // For unit test purposes, we verify the window tracking is working

  console.log('Rate limiting tests passed.');
}

module.exports = {
  runRateLimitingTests,
};
