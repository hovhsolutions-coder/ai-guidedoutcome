require('../helpers/register-ts-runtime.cjs');

const assert = require('node:assert/strict');

const { buildStructuredContracts } = require('../../src/lib/guidance-session/build-structured-contracts.ts');
const { buildGeneratedDossier } = require('../../src/lib/dossiers/build-generated-dossier.ts');

/**
 * Guidance-to-Dossier Handoff Tests
 * 
 * These tests verify that the core "generate → convert → execute" flow
 * preserves intelligence correctly through the handoff from guidance to dossier.
 */

function runGuidanceToDossierHandoffTests() {
  // Test: Structured contracts survive the handoff
  const structuredContracts = buildStructuredContracts({
    situation: 'Need to plan a product launch',
    main_goal: 'Launch successfully within 3 months',
    user_input: 'How do I plan a product launch?',
    intakeAnswers: { timeline: '3 months', budget: 'limited' },
    detectedDomain: 'planning',
    activeMode: 'planning',
    summary: 'A structured planning approach will help you launch successfully.',
    nextStep: 'Define the core product value proposition',
    suggestedTasks: ['Define value proposition', 'Create timeline', 'Identify risks'],
  });

  assert.ok(structuredContracts.narrative, 'narrative contract should exist');
  assert.ok(structuredContracts.systemPlan, 'system plan contract should exist');
  assert.ok(structuredContracts.executionPlan, 'execution plan contract should exist');

  // Verify narrative contract content
  assert.equal(structuredContracts.narrative.situation, 'Need to plan a product launch');
  assert.equal(structuredContracts.narrative.goal, 'Launch successfully within 3 months');
  assert.ok(structuredContracts.narrative.constraints.length > 0, 'constraints should be populated');
  assert.ok(structuredContracts.narrative.confidence > 0, 'confidence should be calculated');

  // Verify system plan contract content
  assert.ok(structuredContracts.systemPlan.departments.length > 0, 'departments should be populated');
  assert.ok(structuredContracts.systemPlan.primaryDepartment, 'primary department should be set');
  assert.ok(structuredContracts.systemPlan.strategicPriorities.length > 0, 'priorities should be populated');

  // Verify execution plan contract content
  assert.equal(structuredContracts.executionPlan.tasks.length, 3, 'all 3 suggested tasks should become execution tasks');
  assert.ok(structuredContracts.executionPlan.criticalPath.length > 0, 'critical path should be determined');
  assert.ok(structuredContracts.executionPlan.milestones.length > 0, 'milestones should be generated');

  // Test: Suggested tasks survive the handoff in sanitized form
  const dossier = buildGeneratedDossier({
    titleSource: 'Product Launch Planning',
    situation: 'A structured planning approach will help you launch successfully.',
    mainGoal: 'Launch successfully within 3 months',
    suggestedTasks: ['Define value proposition', 'Create timeline', 'Identify risks'],
    phase: 'Structuring',
    mode: 'planning',
    narrative: structuredContracts.narrative,
    systemPlan: structuredContracts.systemPlan,
    executionPlan: structuredContracts.executionPlan,
  });

  assert.equal(dossier.suggested_tasks.length, 3, 'all 3 tasks should be preserved');
  assert.equal(dossier.suggested_tasks[0], 'Define value proposition');
  assert.equal(dossier.suggested_tasks[1], 'Create timeline');
  assert.equal(dossier.suggested_tasks[2], 'Identify risks');

  // Test: Structured contracts are preserved in dossier
  assert.ok(dossier.narrative, 'narrative should be preserved in dossier');
  assert.ok(dossier.systemPlan, 'systemPlan should be preserved in dossier');
  assert.ok(dossier.executionPlan, 'executionPlan should be preserved in dossier');

  // Verify contract integrity after handoff
  assert.equal(dossier.narrative?.situation, 'Need to plan a product launch');
  assert.equal(dossier.narrative?.goal, 'Launch successfully within 3 months');
  assert.equal(dossier.systemPlan?.primaryDepartment, 'planning');
  assert.equal(dossier.executionPlan?.tasks.length, 3);

  // Test: Legacy-safe defaults apply when generated fields are missing
  const minimalDossier = buildGeneratedDossier({
    titleSource: '',
    situation: '',
    mainGoal: '',
    suggestedTasks: undefined,
    phase: undefined,
    mode: undefined,
    narrative: undefined,
    systemPlan: undefined,
    executionPlan: undefined,
  });

  assert.equal(minimalDossier.title, 'New Dossier', 'empty title should default to New Dossier');
  assert.equal(minimalDossier.suggested_tasks.length, 0, 'undefined tasks should default to empty array');
  assert.equal(minimalDossier.phase, 'Understanding', 'undefined phase should default to Understanding');
  assert.equal(minimalDossier.narrative, undefined, 'undefined narrative should remain undefined');
  assert.equal(minimalDossier.systemPlan, undefined, 'undefined systemPlan should remain undefined');
  assert.equal(minimalDossier.executionPlan, undefined, 'undefined executionPlan should remain undefined');

  // Test: Partial data survives with defaults
  const partialDossier = buildGeneratedDossier({
    titleSource: 'Risks',
    situation: 'Some situation',
    mainGoal: 'Some goal',
    suggestedTasks: ['Only task'],
    phase: 'Executing',
    mode: 'execution',
    narrative: structuredContracts.narrative,
    systemPlan: undefined,
    executionPlan: structuredContracts.executionPlan,
  });

  assert.equal(partialDossier.title, 'Risks');
  assert.equal(partialDossier.suggested_tasks.length, 1);
  assert.equal(partialDossier.phase, 'Executing');
  assert.ok(partialDossier.narrative, 'narrative should be preserved');
  assert.equal(partialDossier.systemPlan, undefined, 'undefined systemPlan should remain undefined');
  assert.ok(partialDossier.executionPlan, 'executionPlan should be preserved');

  // Test: Task sanitization during handoff
  const messyDossier = buildGeneratedDossier({
    titleSource: 'Test',
    situation: 'Test',
    mainGoal: 'Test',
    suggestedTasks: ['Valid task', '', 'Another valid', '   '],
  });

  // Note: buildGeneratedDossier doesn't sanitize - that's done in toStoredDossier
  // This test verifies the raw handoff preserves all data for storage layer to handle
  assert.equal(messyDossier.suggested_tasks.length, 4, 'raw handoff preserves all tasks');
  assert.equal(messyDossier.suggested_tasks[0], 'Valid task');
  assert.equal(messyDossier.suggested_tasks[1], '');
  assert.equal(messyDossier.suggested_tasks[2], 'Another valid');
  assert.equal(messyDossier.suggested_tasks[3], '   ');

  // Test: Different modes get appropriate initial phases
  const planningDossier = buildGeneratedDossier({
    titleSource: 'Plan',
    situation: 'Plan',
    mainGoal: 'Plan',
    mode: 'planning',
  });
  assert.equal(planningDossier.phase, 'Structuring', 'planning mode should default to Structuring phase');

  const executionDossier = buildGeneratedDossier({
    titleSource: 'Exec',
    situation: 'Exec',
    mainGoal: 'Exec',
    mode: 'execution',
  });
  assert.equal(executionDossier.phase, 'Understanding', 'non-planning mode should default to Understanding phase');
}

module.exports = {
  runGuidanceToDossierHandoffTests,
};
