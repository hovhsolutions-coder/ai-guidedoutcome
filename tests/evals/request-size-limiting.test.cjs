const assert = require('assert');

// Test request size limiting for AI endpoints
async function runRequestSizeLimitingTests() {
  console.log('Request size limiting tests running...');

  // Test payload size check function logic
  const checkPayloadSize = (contentLength) => {
    const MAX_PAYLOAD_SIZE = 100 * 1024; // 100KB
    if (contentLength && contentLength > MAX_PAYLOAD_SIZE) {
      return { valid: false, error: 'Payload too large. Maximum size is 100KB.' };
    }
    return { valid: true };
  };

  // Test 1: Small payload should be allowed
  const smallResult = checkPayloadSize(1000);
  assert.equal(smallResult.valid, true, 'Small payload should be allowed');

  // Test 2: Payload at boundary should be allowed
  const boundaryResult = checkPayloadSize(100 * 1024);
  assert.equal(boundaryResult.valid, true, 'Payload at 100KB boundary should be allowed');

  // Test 3: Payload over limit should be rejected
  const largeResult = checkPayloadSize(100 * 1024 + 1);
  assert.equal(largeResult.valid, false, 'Payload over 100KB should be rejected');
  assert.ok(largeResult.error.includes('100KB'), 'Error should mention 100KB limit');

  // Test 4: Missing content-length should be allowed (will be checked later)
  const missingResult = checkPayloadSize(null);
  assert.equal(missingResult.valid, true, 'Missing content-length should pass initial check');

  // Test field length truncation logic
  const MAX_INPUT_LENGTH = 10000;
  const MAX_INTAKE_ANSWERS = 20;
  const MAX_ANSWER_LENGTH = 1000;

  const truncateString = (str, maxLength) => {
    if (typeof str !== 'string') return '';
    return str.slice(0, maxLength);
  };

  // Test 5: Short string should be preserved
  const shortStr = 'Short input';
  assert.equal(truncateString(shortStr, MAX_INPUT_LENGTH), shortStr, 'Short string should be preserved');

  // Test 6: Long string should be truncated
  const longStr = 'x'.repeat(15000);
  const truncated = truncateString(longStr, MAX_INPUT_LENGTH);
  assert.equal(truncated.length, MAX_INPUT_LENGTH, 'Long string should be truncated to max length');

  // Test 7: Intake answers limiting
  const limitAnswers = (answers) => {
    const entries = Object.entries(answers).slice(0, MAX_INTAKE_ANSWERS);
    return Object.fromEntries(
      entries.map(([key, value]) => [
        key.slice(0, 100),
        typeof value === 'string' ? value.slice(0, MAX_ANSWER_LENGTH) : ''
      ])
    );
  };

  const manyAnswers = {};
  for (let i = 0; i < 30; i++) {
    manyAnswers[`key${i}`] = `answer${i}`;
  }
  const limitedAnswers = limitAnswers(manyAnswers);
  assert.equal(Object.keys(limitedAnswers).length, MAX_INTAKE_ANSWERS, 'Should limit to 20 answers');

  // Test 8: Long answer values should be truncated
  const longAnswer = { key: 'x'.repeat(2000) };
  const truncatedAnswer = limitAnswers(longAnswer);
  assert.equal(truncatedAnswer.key.length, MAX_ANSWER_LENGTH, 'Long answer should be truncated');

  // Test 9: Long keys should be truncated
  const longKeyAnswer = { ['x'.repeat(200)]: 'value' };
  const truncatedKey = limitAnswers(longKeyAnswer);
  assert.equal(Object.keys(truncatedKey)[0].length, 100, 'Long key should be truncated to 100 chars');

  // Test create-dossier payload limits (stricter)
  const checkDossierPayloadSize = (contentLength) => {
    const MAX_DOSSIER_PAYLOAD = 50 * 1024; // 50KB
    if (contentLength && contentLength > MAX_DOSSIER_PAYLOAD) {
      return { valid: false, error: 'Payload too large. Maximum size is 50KB.' };
    }
    return { valid: true };
  };

  // Test 10: Dossier payload size check
  const dossierSmall = checkDossierPayloadSize(40000);
  assert.equal(dossierSmall.valid, true, '40KB payload should be allowed for dossier');

  const dossierLarge = checkDossierPayloadSize(60 * 1024);
  assert.equal(dossierLarge.valid, false, '60KB payload should be rejected for dossier');
  assert.ok(dossierLarge.error.includes('50KB'), 'Error should mention 50KB limit');

  // Test intake data sanitization
  const sanitizeIntakeData = (data) => {
    const MAX_INPUT_LENGTH = 5000;
    const MAX_FIELD_LENGTH = 2000;

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { valid: false, error: 'Request body must be an object' };
    }

    const d = data;
    const sanitized = {
      situation: typeof d.situation === 'string' ? d.situation.slice(0, MAX_INPUT_LENGTH) : '',
      goal: typeof d.goal === 'string' ? d.goal.slice(0, MAX_INPUT_LENGTH) : '',
      urgency: typeof d.urgency === 'string' ? d.urgency.slice(0, MAX_FIELD_LENGTH) : '',
      involved: typeof d.involved === 'string' ? d.involved.slice(0, MAX_FIELD_LENGTH) : '',
      blocking: typeof d.blocking === 'string' ? d.blocking.slice(0, MAX_FIELD_LENGTH) : '',
    };

    return { valid: true, sanitized };
  };

  // Test 11: Valid intake data
  const validIntake = {
    situation: 'Test situation',
    goal: 'Test goal',
    urgency: 'high',
    involved: 'team',
    blocking: 'nothing',
  };
  const validResult = sanitizeIntakeData(validIntake);
  assert.equal(validResult.valid, true, 'Valid intake data should pass');
  assert.equal(validResult.sanitized.situation, 'Test situation', 'Situation should be preserved');

  // Test 12: Long intake fields should be truncated
  const longIntake = {
    situation: 'x'.repeat(8000),
    goal: 'Test goal',
  };
  const longResult = sanitizeIntakeData(longIntake);
  assert.equal(longResult.sanitized.situation.length, 5000, 'Long situation should be truncated to 5000');

  // Test 13: Non-object data should be rejected
  const invalidResult = sanitizeIntakeData('not an object');
  assert.equal(invalidResult.valid, false, 'Non-object data should be rejected');

  console.log('Request size limiting tests passed.');
}

module.exports = {
  runRequestSizeLimitingTests,
};
