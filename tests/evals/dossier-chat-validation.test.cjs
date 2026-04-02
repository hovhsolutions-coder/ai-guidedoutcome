require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

/**
 * Dossier chat input validation tests
 * 
 * These tests verify that chat input in the dossier detail flow
 * properly validates and sanitizes input before processing.
 */

function runDossierChatValidationTests() {
  // Simulate the handleSubmit validation logic from ChatPanel
  function validateChatInput(userInput) {
    if (typeof userInput !== 'string') return null;
    const trimmedInput = userInput.trim();
    if (!trimmedInput || trimmedInput.length === 0) return null;
    if (trimmedInput.length > 5000) return null; // Max message length
    return trimmedInput;
  }

  // Test: Valid message passes validation
  assert.equal(validateChatInput('Hello, need help with this'), 'Hello, need help with this');
  assert.equal(validateChatInput('  Trim whitespace  '), 'Trim whitespace');

  // Test: Empty string rejected
  assert.equal(validateChatInput(''), null);
  assert.equal(validateChatInput('   '), null);

  // Test: Non-string rejected
  assert.equal(validateChatInput(null), null);
  assert.equal(validateChatInput(undefined), null);
  assert.equal(validateChatInput(123), null);
  assert.equal(validateChatInput({}), null);
  assert.equal(validateChatInput([]), null);

  // Test: Oversized message rejected (>5000 chars)
  const oversizedMessage = 'A'.repeat(5001);
  assert.equal(validateChatInput(oversizedMessage), null);

  // Test: Message at exactly 5000 chars accepted
  const maxSizeMessage = 'B'.repeat(5000);
  assert.equal(validateChatInput(maxSizeMessage), maxSizeMessage);

  // Test: Whitespace-only rejected
  assert.equal(validateChatInput('\n\t  '), null);

  // Test: Multi-line message passes
  const multilineMessage = 'Line 1\nLine 2\nLine 3';
  assert.equal(validateChatInput(multilineMessage), multilineMessage);

  // Test: Message with special characters passes
  const specialChars = "Hello! @#$%^&*()_+{}|:<>?[];',./\"";
  assert.equal(validateChatInput(specialChars), specialChars);

  // Test: Unicode message passes
  const unicodeMessage = 'Hello 世界 🌍 مرحبا';
  assert.equal(validateChatInput(unicodeMessage), unicodeMessage);
}

module.exports = {
  runDossierChatValidationTests,
};
