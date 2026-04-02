const assert = require('assert');

// Test schema/version resilience for persisted guidance session state
async function runSchemaVersionResilienceTests() {
  console.log('Schema/version resilience tests running...');

  // Import the module under test
  const {
    parsePersistedGuidanceShellState,
    GUIDANCE_SESSION_STORAGE_VERSION,
  } = require('../../src/lib/guidance-session/persist-guidance-session-state.ts');

  // Test 1: Valid current version should parse successfully
  const validState = {
    version: 1,
    savedAt: Date.now(),
    rawInput: 'test input',
    situation: 'test situation',
    mainGoal: 'test goal',
    selectedMode: 'auto',
    intakeAnswers: {},
    result: null,
    resultMeta: null,
    guidanceSession: null,
    activeTrainer: null,
    generationCount: 0,
    lastGeneratedAt: null,
  };
  const parsedValid = parsePersistedGuidanceShellState(validState);
  assert.ok(parsedValid, 'Valid state should parse successfully');
  assert.equal(parsedValid.version, GUIDANCE_SESSION_STORAGE_VERSION, 'Should normalize to current version');

  // Test 2: Missing version should default to v1 and parse
  const missingVersionState = {
    savedAt: Date.now(),
    rawInput: 'test',
    situation: 'situation',
    mainGoal: 'goal',
    selectedMode: 'auto',
    intakeAnswers: {},
    result: null,
    resultMeta: null,
    guidanceSession: null,
    activeTrainer: null,
    generationCount: 0,
    lastGeneratedAt: null,
  };
  const parsedMissingVersion = parsePersistedGuidanceShellState(missingVersionState);
  assert.ok(parsedMissingVersion, 'Missing version should default and parse');
  assert.equal(parsedMissingVersion.rawInput, 'test', 'Should preserve rawInput with missing version');

  // Test 3: Future version should reject (conservative safety)
  const futureVersionState = {
    version: 999,
    savedAt: Date.now(),
    rawInput: 'future input',
    situation: 'future situation',
    mainGoal: 'future goal',
    selectedMode: 'auto',
    intakeAnswers: {},
    result: null,
    resultMeta: null,
    guidanceSession: null,
    activeTrainer: null,
    generationCount: 0,
    lastGeneratedAt: null,
  };
  const parsedFuture = parsePersistedGuidanceShellState(futureVersionState);
  assert.equal(parsedFuture, null, 'Future version should reject for safety');

  // Test 4: Too old version should reject
  const oldVersionState = {
    version: 0,
    savedAt: Date.now(),
    rawInput: 'old',
    situation: 'old',
    mainGoal: 'old',
    selectedMode: 'auto',
    intakeAnswers: {},
    result: null,
    resultMeta: null,
    guidanceSession: null,
    activeTrainer: null,
    generationCount: 0,
    lastGeneratedAt: null,
  };
  const parsedOld = parsePersistedGuidanceShellState(oldVersionState);
  assert.equal(parsedOld, null, 'Too old version should reject');

  // Test 5: Partial data should fill safe defaults
  const partialState = {
    version: 1,
    savedAt: Date.now(),
    rawInput: 'partial',
    // missing situation, mainGoal, etc.
  };
  const parsedPartial = parsePersistedGuidanceShellState(partialState);
  assert.ok(parsedPartial, 'Partial state should parse with defaults');
  assert.equal(parsedPartial.situation, '', 'Missing situation should default to empty string');
  assert.equal(parsedPartial.mainGoal, '', 'Missing mainGoal should default to empty string');
  assert.equal(parsedPartial.selectedMode, 'auto', 'Missing selectedMode should default to auto');
  assert.deepStrictEqual(parsedPartial.intakeAnswers, {}, 'Missing intakeAnswers should default to empty object');
  assert.equal(parsedPartial.result, null, 'Missing result should default to null');
  assert.equal(parsedPartial.generationCount, 0, 'Missing generationCount should default to 0');

  // Test 6: Malformed fields should be sanitized
  const malformedState = {
    version: 1,
    savedAt: 'not a number', // malformed
    rawInput: 123, // not a string
    situation: true, // not a string
    mainGoal: null,
    selectedMode: 'auto',
    intakeAnswers: {},
    result: { summary: 123, next_step: 456, suggested_tasks: 'not an array' }, // malformed result
    resultMeta: { detectedDomain: 123, activeMode: 456, shouldOfferDossier: 'not boolean' }, // malformed
    guidanceSession: null,
    activeTrainer: null,
    generationCount: 'not a number',
    lastGeneratedAt: 123, // not a string
  };
  const parsedMalformed = parsePersistedGuidanceShellState(malformedState);
  assert.ok(parsedMalformed, 'Malformed state should parse with safe defaults');
  assert.equal(typeof parsedMalformed.savedAt, 'number', 'savedAt should be normalized to number');
  assert.equal(parsedMalformed.rawInput, '', 'rawInput should default when malformed');
  assert.equal(parsedMalformed.situation, '', 'situation should default when malformed');
  assert.equal(parsedMalformed.result, null, 'Malformed result should default to null');
  assert.equal(parsedMalformed.resultMeta, null, 'Malformed resultMeta should default to null');
  assert.equal(parsedMalformed.generationCount, 0, 'generationCount should default when malformed');
  assert.equal(parsedMalformed.lastGeneratedAt, null, 'lastGeneratedAt should default when malformed');

  // Test 7: Non-record should return null
  const nonRecord = 'not an object';
  const parsedNonRecord = parsePersistedGuidanceShellState(nonRecord);
  assert.equal(parsedNonRecord, null, 'Non-record should return null');

  // Test 8: Array should return null (not a record)
  const arrayValue = [1, 2, 3];
  const parsedArray = parsePersistedGuidanceShellState(arrayValue);
  assert.equal(parsedArray, null, 'Array should return null');

  console.log('Schema/version resilience tests passed.');
}

module.exports = {
  runSchemaVersionResilienceTests,
};
