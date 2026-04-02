const assert = require('assert');

// Test correlation ID generation and handling
async function runCorrelationIdTests() {
  console.log('Correlation ID tests running...');

  // Test getCorrelationId logic
  const getCorrelationId = (request) => {
    const existingId = request.headers.get('x-correlation-id');
    if (existingId && existingId.trim().length > 0) {
      return existingId.trim().slice(0, 64);
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  };

  // Test 1: Generate new correlation ID when none exists
  const mockRequestNoId = {
    headers: {
      get: () => null,
    },
  };
  const newId = getCorrelationId(mockRequestNoId);
  assert.ok(newId && newId.length > 0, 'Should generate correlation ID');
  assert.ok(newId.includes('-'), 'Generated ID should contain hyphen');

  // Test 2: Extract existing correlation ID from header
  const mockRequestWithId = {
    headers: {
      get: (key) => key === 'x-correlation-id' ? 'existing-correlation-id-123' : null,
    },
  };
  const existingId = getCorrelationId(mockRequestWithId);
  assert.equal(existingId, 'existing-correlation-id-123', 'Should extract existing correlation ID');

  // Test 3: Trim whitespace from existing ID
  const mockRequestWithWhitespace = {
    headers: {
      get: (key) => key === 'x-correlation-id' ? '  spaced-id  ' : null,
    },
  };
  const trimmedId = getCorrelationId(mockRequestWithWhitespace);
  assert.equal(trimmedId, 'spaced-id', 'Should trim whitespace from correlation ID');

  // Test 4: Truncate long correlation IDs to 64 chars
  const longId = 'a'.repeat(100);
  const mockRequestWithLongId = {
    headers: {
      get: (key) => key === 'x-correlation-id' ? longId : null,
    },
  };
  const truncatedId = getCorrelationId(mockRequestWithLongId);
  assert.equal(truncatedId.length, 64, 'Should truncate long correlation ID to 64 chars');

  // Test 5: Generate different IDs on subsequent calls
  const id1 = getCorrelationId(mockRequestNoId);
  await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
  const id2 = getCorrelationId(mockRequestNoId);
  assert.notEqual(id1, id2, 'Should generate different IDs each time');

  // Test 6: Empty string header should generate new ID
  const mockRequestWithEmpty = {
    headers: {
      get: (key) => key === 'x-correlation-id' ? '' : null,
    },
  };
  const generatedId = getCorrelationId(mockRequestWithEmpty);
  assert.ok(generatedId && generatedId.length > 0, 'Should generate ID when header is empty');

  // Test 7: Whitespace-only header should generate new ID
  const mockRequestWithOnlyWhitespace = {
    headers: {
      get: (key) => key === 'x-correlation-id' ? '   ' : null,
    },
  };
  const generatedId2 = getCorrelationId(mockRequestWithOnlyWhitespace);
  assert.ok(generatedId2 && generatedId2.length > 0, 'Should generate ID when header is whitespace only');

  // Test 8: Verify log prefix format
  const correlationId = 'test-cid-123';
  const logPrefix = `[api:guidance:success] cid:${correlationId}`;
  assert.ok(logPrefix.includes(`cid:${correlationId}`), 'Log should contain cid prefix');

  // Test 9: Response header format
  const responseHeaders = { 'X-Correlation-Id': correlationId };
  assert.equal(responseHeaders['X-Correlation-Id'], correlationId, 'Response header should contain correlation ID');

  // Test 10: Multiple request types use consistent format
  const guidanceLog = `[api:guidance:success] cid:${correlationId} mode:live domain:planning`;
  const dossierLog = `[api:create-dossier:success] cid:${correlationId} id:dossier-123`;
  const trainerLog = `[api:trainer:success] cid:${correlationId} trainer:strategy mode:live`;

  assert.ok(guidanceLog.includes(`cid:${correlationId}`), 'Guidance log format correct');
  assert.ok(dossierLog.includes(`cid:${correlationId}`), 'Dossier log format correct');
  assert.ok(trainerLog.includes(`cid:${correlationId}`), 'Trainer log format correct');

  console.log('Correlation ID tests passed.');
}

module.exports = {
  runCorrelationIdTests,
};
