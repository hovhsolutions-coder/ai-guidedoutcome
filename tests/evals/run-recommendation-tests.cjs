/**
 * Recommendation Test Runner with Controlled Subprocess Isolation
 *
 * TEMPORARY CONTAINMENT STRATEGY:
 * This runner uses subprocess isolation for specific guidance test suites that are
 * affected by shared-process module state contamination. This is a controlled,
 * intentional workaround while the exact polluter is not yet identified.
 *
 * ROOT CAUSE:
 * - Confirmed shared-process module cache leakage from earlier tests in the sequence
 * - ~20+ tests run before affected guidance suites, contaminating global state
 * - shell-render-matrix FAILS in shared-process mode but PASSES in isolation
 *
 * AFFECTED SUITES (subprocess isolated):
 * 1. guidance-sparse-state-matrix.test.cjs - Uses complex fixture state
 * 2. guidance-presentation-matrix.test.cjs - Builds on sparse-state fixtures
 * 3. guidance-shell-render-matrix.test.cjs - Renders UI with polluted presentation state
 *
 * WHY NOT ISOLATE EVERYTHING:
 * - Subprocess isolation adds ~50-100ms overhead per suite
 * - Only isolate suites known to be affected by contamination
 * - Preserve fast execution for unaffected tests
 *
 * DEBUGGING SHARED-PROCESS MODE:
 * To debug in shared-process mode (for identifying the actual polluter),
 * temporarily comment out the runInSubprocess() calls and use direct calls.
 *
 * FUTURE FIX:
 * Binary search through earlier tests to identify the exact polluter(s),
 * then fix the root cause (likely shared mutable state in mocks or module-level
 * variables). Once fixed, remove subprocess isolation.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const { runRecommendationAdapterTests } = require('./recommendation-adapters.test.cjs');
const { runRecommendationCoreTests } = require('./recommendation-core.test.cjs');
const { runDossierChatValidationTests } = require('./dossier-chat-validation.test.cjs');
const { runDossierInputValidationTests } = require('./dossier-input-validation.test.cjs');
const { runGuidanceToDossierHandoffTests } = require('./guidance-to-dossier-handoff.test.cjs');
const { runGuidanceDecisionEnvelopeTests } = require('./guidance-decision-envelope.test.cjs');
const { runDossierGenerationQualityTests } = require('./dossier-generation-quality.test.cjs');
const { runGuidanceEnvelopeConsumerMigrationTests } = require('./guidance-envelope-consumer-migration.test.cjs');
const { runEnvelopeFirstTrustGatingTests } = require('./envelope-first-trust-gating.test.cjs');
const { runEnvelopeFirstViewModelBuildersTests } = require('./envelope-first-view-model-builders.test.cjs');
const { runEnvelopeFirstPresenterHelpersTests } = require('./envelope-first-presenter-helpers.test.cjs');
const { runGuidanceSessionControllerTests } = require('./guidance-session-controller.test.cjs');
const { runGuidanceIntakePresenterTests } = require('./guidance-intake-presenter.test.cjs');
const { runGuidanceActionReadinessMatrixTests } = require('./guidance-action-readiness-matrix.test.cjs');
const { runGuidanceActiveFocusMatrixTests } = require('./guidance-active-focus-matrix.test.cjs');
const { runGuidanceActiveFocusRenderTests } = require('./guidance-active-focus-render.test.cjs');
const { runGuidanceContentDensityMatrixTests } = require('./guidance-content-density-matrix.test.cjs');
const { runGuidanceContentDensityRenderTests } = require('./guidance-content-density-render.test.cjs');
const { runGuidanceMicrocopyIntentMatrixTests } = require('./guidance-microcopy-intent-matrix.test.cjs');
const { runGuidanceMicrocopyIntentRenderTests } = require('./guidance-microcopy-intent-render.test.cjs');
const { runGuidanceSectionVisibilityMatrixTests } = require('./guidance-section-visibility-matrix.test.cjs');
const { runGuidanceSectionVisibilityRenderTests } = require('./guidance-section-visibility-render.test.cjs');
const { runGuidanceSectionOutcomeMatrixTests } = require('./guidance-section-outcome-matrix.test.cjs');
const { runGuidanceSectionOutcomeRenderTests } = require('./guidance-section-outcome-render.test.cjs');
const { runGuidanceSurfaceRhythmMatrixTests } = require('./guidance-surface-rhythm-matrix.test.cjs');
const { runGuidanceSurfaceRhythmRenderTests } = require('./guidance-surface-rhythm-render.test.cjs');
const { runGuidanceTransitionContinuityMatrixTests } = require('./guidance-transition-continuity-matrix.test.cjs');
const { runGuidanceTransitionContinuityRenderTests } = require('./guidance-transition-continuity-render.test.cjs');
const { runGuidanceVisualWeightMatrixTests } = require('./guidance-visual-weight-matrix.test.cjs');
const { runGuidanceVisualWeightRenderTests } = require('./guidance-visual-weight-render.test.cjs');
const { runGuidanceSurfaceVariantMatrixTests } = require('./guidance-surface-variant-matrix.test.cjs');
const { runGuidanceSurfaceVariantRenderTests } = require('./guidance-surface-variant-render.test.cjs');
const { runGuidanceZoneProfilesMatrixTests } = require('./guidance-zone-profiles-matrix.test.cjs');
const { runGuidanceZoneProfileSelectorTests } = require('./guidance-zone-profile-selectors.test.cjs');
const { runGuidanceZoneProfilesRenderTests } = require('./guidance-zone-profiles-render.test.cjs');
const { runGuidanceInteractionStateMatrixTests } = require('./guidance-interaction-state-matrix.test.cjs');
const { runGuidanceProgressMessageMatrixTests } = require('./guidance-progress-message-matrix.test.cjs');
const { runGuidanceProgressMessageRenderTests } = require('./guidance-progress-message-render.test.cjs');
const { runGuidanceRepeatActionMatrixTests } = require('./guidance-repeat-action-matrix.test.cjs');
const { runGuidanceRecoveryStateMatrixTests } = require('./guidance-recovery-state-matrix.test.cjs');
const { runGuidanceSessionResumeMatrixTests } = require('./guidance-session-resume-matrix.test.cjs');
const { runGuidanceDegradedAuthorityMatrixTests } = require('./guidance-degraded-authority-matrix.test.cjs');
const { runGuidancePresenterContractSnapshotTests } = require('./guidance-presenter-contract-snapshot.test.cjs');
const { runGuidancePresenterContractDocsTests } = require('./guidance-presenter-contract-docs.test.cjs');
const { runGuidanceShellStructureTests } = require('./guidance-shell-structure.test.cjs');
const { runGuidanceRightRailProfileTests } = require('./guidance-right-rail-profile.test.cjs');
const { runGuidanceRightRailProfileRenderTests } = require('./guidance-right-rail-profile-render.test.cjs');
const { runGuidanceSectionApiSimplificationTests } = require('./guidance-section-api-simplification.test.cjs');
const { runGuidanceUiCalmnessRenderTests } = require('./guidance-ui-calmness-render.test.cjs');
const { runGuidanceMotionTimingRenderTests } = require('./guidance-motion-timing-render.test.cjs');
const { runGuidanceAccessibilityRenderTests } = require('./guidance-accessibility-render.test.cjs');
const { runGuidanceProductionReadinessTests } = require('./guidance-production-readiness.test.cjs');
const { runGuidanceProgressionLanguageRenderTests } = require('./guidance-progression-language-render.test.cjs');
const { runGuidancePersonalizationRenderTests } = require('./guidance-personalization-render.test.cjs');
const { runGuidanceTrustProofRenderTests } = require('./guidance-trust-proof-render.test.cjs');
const { runGuidanceSessionPresenterTests } = require('./guidance-session-presenter.test.cjs');
const { runGuidanceSessionPresenterPipelineTests } = require('./guidance-session-presenter-pipeline.test.cjs');
const { runGuidanceSessionServiceTests } = require('./guidance-session-service.test.cjs');
const { runGuidanceSessionStoreTests } = require('./guidance-session-store.test.cjs');
const { runGuidanceFirstPassHydrationTests } = require('./guidance-first-pass-hydration.test.cjs');
const { runGuidanceSessionPersistenceTests } = require('./guidance-session-persistence.test.cjs');
const { runNetworkRetryTests } = require('./network-retry.test.cjs');
const { runFailureFeedbackTests } = require('./failure-feedback.test.cjs');
const { runSaveStatusTests } = require('./save-status.test.cjs');
const { runReEngagementRetryTests } = require('./reengagement-retry.test.cjs');
const { runConnectionAwarenessTests } = require('./connection-awareness.test.cjs');
const { runSchemaVersionResilienceTests } = require('./schema-version-resilience.test.cjs');
const { runDossierSchemaResilienceTests } = require('./dossier-schema-resilience.test.cjs');
const { runRequestDeduplicationTests } = require('./request-deduplication.test.cjs');
const { runRateLimitingTests } = require('./rate-limiting.test.cjs');
const { runRequestSizeLimitingTests } = require('./request-size-limiting.test.cjs');
const { runTimeoutHardeningTests } = require('./timeout-hardening.test.cjs');
const { runDataIntegrityTests } = require('./data-integrity.test.cjs');
const { runCorrelationIdTests } = require('./correlation-id.test.cjs');
const { runTaskDeletionTests } = require('./task-deletion.test.cjs');
const { runTaskEditTests } = require('./task-edit.test.cjs');
const { runTaskReorderTests } = require('./task-reorder.test.cjs');
const { runTaskDueDateTests } = require('./task-due-date.test.cjs');
const { runTaskNotesTests } = require('./task-notes.test.cjs');
const { runActivityHistoryTests } = require('./activity-history.test.cjs');
const { runTaskPriorityTests } = require('./task-priority.test.cjs');
const { runTaskPriorityFilterTests } = require('./task-priority-filter.test.cjs');
const { runTaskSearchTests } = require('./task-search.test.cjs');
const { runTaskBatchOperationsTests } = require('./task-batch-operations.test.cjs');
const { runTaskCategoryTests } = require('./task-category.test.cjs');
const { runTaskEstimateTests } = require('./task-estimate.test.cjs');
const { runTaskTimeTrackingTests } = require('./task-time-tracking.test.cjs');
const { runTaskDependencyTests } = require('./task-dependencies.test.cjs');
const { runTaskMilestoneTests } = require('./task-milestones.test.cjs');
const { runTaskSubtaskTests } = require('./task-subtasks.test.cjs');
const { runIntakeIntelligenceTests } = require('./intake-intelligence.test.cjs');
const { runFirstPassAmbiguityTests } = require('./first-pass-ambiguity.test.cjs');
const { runFollowUpQuestionPlannerTests } = require('./follow-up-question-planner.test.cjs');
const { runCharacterProgressionInfluenceTests } = require('./character-progression-influence.test.cjs');
const { runCharacterIntroContentTests } = require('./character-intro-content.test.cjs');
const { runGuidanceOnboardingShellTests } = require('./guidance-onboarding-shell.test.cjs');
const { runGuidanceExecutionReadySectionTests } = require('./guidance-execution-ready-section.test.cjs');
const { runGuidanceExecutionProgressStripTests } = require('./guidance-execution-progress-strip.test.cjs');
const { runGuidanceExecutionHandoffTests } = require('./guidance-execution-handoff.test.cjs');
const { runGuidanceExecutionTransitionTests } = require('./guidance-execution-transition.test.cjs');
const { runGuidancePhaseAndRightRailTests } = require('./guidance-phase-and-right-rail.test.cjs');
const { runOnboardingStatePlannerTests } = require('./onboarding-state-planner.test.cjs');
const { runProgressionSystemTests } = require('./progression-system.test.cjs');
const { runGuidanceSituationPhaseMatrixTests } = require('./guidance-situation-phase-matrix.test.cjs');
const { runServerContinuationTests } = require('./server-continuation.test.cjs');
const { runRouteRecommendationTests } = require('./route-recommendation.test.cjs');
const { runTrainerRecommendationTests } = require('./trainer-recommendation.test.cjs');
const { runRecommendationWrapperParityTests } = require('./recommendation-wrapper-parity.test.cjs');

/**
 * Run a test suite in an isolated subprocess to avoid module cache contamination.
 *
 * @param {string} name - Display name for the test suite
 * @param {string} testFile - Relative path to the test file
 * @param {string} testFn - Name of the test function to run
 * @returns {void}
 * @throws {Error} If subprocess fails or test throws
 */
function runInSubprocess(name, testFile, testFn) {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
        require('./tests/helpers/register-ts-runtime.cjs');
        const { ${testFn} } = require('./${testFile}');
        ${testFn}();
      `
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    }
  );

  if (result.status !== 0) {
    const stderr = result.stderr || '';
    const stdout = result.stdout || '';
    throw new Error(
      `${name} failed in subprocess.\n` +
      `Exit code: ${result.status}\n` +
      `Stdout: ${stdout.substring(0, 500)}\n` +
      `Stderr: ${stderr.substring(0, 500)}`
    );
  }
}

/**
 * AFFECTED SUITES REQUIRING SUBPROCESS ISOLATION
 *
 * These suites are isolated due to confirmed shared-process module state
 * contamination. They pass in isolation but fail when run after earlier
 * tests in the sequence.
 *
 * When the root polluter is identified and fixed, these can be converted
 * back to direct function calls.
 */
const ISOLATED_GUIDANCE_SUITES = [
  { name: 'Guidance presentation matrix', file: 'tests/evals/guidance-presentation-matrix.test.cjs', fn: 'runGuidancePresentationMatrixTests' },
  { name: 'Guidance shell render matrix', file: 'tests/evals/guidance-shell-render-matrix.test.cjs', fn: 'runGuidanceShellRenderMatrixTests' },
  { name: 'Guidance sparse-state matrix', file: 'tests/evals/guidance-sparse-state-matrix.test.cjs', fn: 'runGuidanceSparseStateMatrixTests' },
  { name: 'Dossier store validation', file: 'tests/evals/dossier-store-validation.test.cjs', fn: 'runDossierStoreValidationTests' },
];

async function main() {
  // Standard (non-isolated) test execution
  runDossierChatValidationTests();
  console.log('Dossier chat validation tests passed.');

  runDossierInputValidationTests();
  console.log('Dossier input validation tests passed.');

  runGuidanceToDossierHandoffTests();
  console.log('Guidance to dossier handoff tests passed.');

  await runDossierGenerationQualityTests();
  console.log('Dossier generation quality tests passed.');

  runGuidanceDecisionEnvelopeTests();
  console.log('Guidance decision envelope tests passed.');

  runGuidanceEnvelopeConsumerMigrationTests();
  console.log('Guidance envelope consumer migration tests passed.');

  runEnvelopeFirstTrustGatingTests();
  console.log('Envelope-first trust gating tests passed.');

  runEnvelopeFirstViewModelBuildersTests();
  console.log('Envelope-first view model builders tests passed.');

  runEnvelopeFirstPresenterHelpersTests();
  console.log('Envelope-first presenter helpers tests passed.');

  runGuidanceSessionControllerTests();
  console.log('Guidance session controller tests passed.');

  runGuidanceIntakePresenterTests();
  console.log('Guidance intake presenter tests passed.');

  runGuidanceActionReadinessMatrixTests();
  console.log('Guidance action-readiness matrix tests passed.');

  runGuidanceActiveFocusMatrixTests();
  console.log('Guidance active-focus matrix tests passed.');

  runGuidanceActiveFocusRenderTests();
  console.log('Guidance active-focus render tests passed.');

  runGuidanceContentDensityMatrixTests();
  console.log('Guidance content-density matrix tests passed.');

  runGuidanceContentDensityRenderTests();
  console.log('Guidance content-density render tests passed.');

  runGuidanceMicrocopyIntentMatrixTests();
  console.log('Guidance microcopy-intent matrix tests passed.');

  runGuidanceMicrocopyIntentRenderTests();
  console.log('Guidance microcopy-intent render tests passed.');

  runGuidanceSectionVisibilityMatrixTests();
  console.log('Guidance section-visibility matrix tests passed.');

  runGuidanceSectionVisibilityRenderTests();
  console.log('Guidance section-visibility render tests passed.');

  runGuidanceSectionOutcomeMatrixTests();
  console.log('Guidance section-outcome matrix tests passed.');

  runGuidanceSectionOutcomeRenderTests();
  console.log('Guidance section-outcome render tests passed.');

  runGuidanceSurfaceRhythmMatrixTests();
  console.log('Guidance surface-rhythm matrix tests passed.');

  runGuidanceSurfaceRhythmRenderTests();
  console.log('Guidance surface-rhythm render tests passed.');

  runGuidanceTransitionContinuityMatrixTests();
  console.log('Guidance transition-continuity matrix tests passed.');

  runGuidanceTransitionContinuityRenderTests();
  console.log('Guidance transition-continuity render tests passed.');

  runGuidanceVisualWeightMatrixTests();
  console.log('Guidance visual-weight matrix tests passed.');

  runGuidanceVisualWeightRenderTests();
  console.log('Guidance visual-weight render tests passed.');

  runGuidanceSurfaceVariantMatrixTests();
  console.log('Guidance surface-variant matrix tests passed.');

  runGuidanceSurfaceVariantRenderTests();
  console.log('Guidance surface-variant render tests passed.');

  runGuidanceZoneProfilesMatrixTests();
  console.log('Guidance zone-profile matrix tests passed.');

  runGuidanceZoneProfileSelectorTests();
  console.log('Guidance zone-profile selector tests passed.');

  runGuidanceZoneProfilesRenderTests();
  console.log('Guidance zone-profile render tests passed.');

  runGuidanceInteractionStateMatrixTests();
  console.log('Guidance interaction-state matrix tests passed.');

  runGuidanceProgressMessageMatrixTests();
  console.log('Guidance progress-message matrix tests passed.');

  runGuidanceProgressMessageRenderTests();
  console.log('Guidance progress-message render tests passed.');

  runGuidanceRepeatActionMatrixTests();
  console.log('Guidance repeat-action matrix tests passed.');

  runGuidanceRecoveryStateMatrixTests();
  console.log('Guidance recovery-state matrix tests passed.');

  runGuidanceSessionResumeMatrixTests();
  console.log('Guidance session-resume matrix tests passed.');

  // AFFECTED SUITES: Run in subprocess isolation due to shared-process module state contamination
  // See header documentation for full explanation
  runInSubprocess(
    ISOLATED_GUIDANCE_SUITES[2].name,
    ISOLATED_GUIDANCE_SUITES[2].file,
    ISOLATED_GUIDANCE_SUITES[2].fn
  );
  console.log('Guidance sparse-state matrix tests passed.');

  runInSubprocess(
    ISOLATED_GUIDANCE_SUITES[3].name,
    ISOLATED_GUIDANCE_SUITES[3].file,
    ISOLATED_GUIDANCE_SUITES[3].fn
  );
  console.log('Dossier store validation tests passed.');

  runGuidanceDegradedAuthorityMatrixTests();
  console.log('Guidance degraded-authority matrix tests passed.');

  runInSubprocess(
    ISOLATED_GUIDANCE_SUITES[0].name,
    ISOLATED_GUIDANCE_SUITES[0].file,
    ISOLATED_GUIDANCE_SUITES[0].fn
  );
  console.log('Guidance presentation matrix tests passed.');

  runGuidancePresenterContractSnapshotTests();
  console.log('Guidance presenter contract snapshot tests passed.');

  runGuidancePresenterContractDocsTests();
  console.log('Guidance presenter contract docs tests passed.');

  runInSubprocess(
    ISOLATED_GUIDANCE_SUITES[1].name,
    ISOLATED_GUIDANCE_SUITES[1].file,
    ISOLATED_GUIDANCE_SUITES[1].fn
  );
  console.log('Guidance shell render matrix tests passed.');

  runGuidanceShellStructureTests();
  console.log('Guidance shell structure tests passed.');

  runGuidanceRightRailProfileTests();
  console.log('Guidance right-rail profile tests passed.');

  runGuidanceRightRailProfileRenderTests();
  console.log('Guidance right-rail profile render tests passed.');

  runGuidanceSectionApiSimplificationTests();
  console.log('Guidance section API simplification tests passed.');

  runGuidanceUiCalmnessRenderTests();
  console.log('Guidance UI calmness render tests passed.');

  runGuidanceMotionTimingRenderTests();
  console.log('Guidance motion timing render tests passed.');

  runGuidanceAccessibilityRenderTests();
  console.log('Guidance accessibility render tests passed.');

  runGuidanceProductionReadinessTests();
  console.log('Guidance production readiness tests passed.');

  runGuidanceProgressionLanguageRenderTests();
  console.log('Guidance progression language render tests passed.');

  runGuidancePersonalizationRenderTests();
  console.log('Guidance personalization render tests passed.');

  runGuidanceTrustProofRenderTests();
  console.log('Guidance trust/proof render tests passed.');

  runGuidanceSessionPresenterTests();
  console.log('Guidance session presenter tests passed.');

  runGuidanceSessionPresenterPipelineTests();
  console.log('Guidance session presenter pipeline tests passed.');

  await runGuidanceSessionServiceTests();
  console.log('Guidance session service tests passed.');

  runGuidanceSessionStoreTests();
  console.log('Guidance session store tests passed.');

  runGuidanceFirstPassHydrationTests();
  console.log('Guidance first-pass hydration tests passed.');

  runGuidanceSessionPersistenceTests();
  console.log('Guidance session persistence tests passed.');

  runNetworkRetryTests();
  console.log('Network retry utility tests passed.');

  await runFailureFeedbackTests();
  console.log('Failure feedback tests passed.');

  await runSaveStatusTests();
  console.log('Save status tests passed.');

  await runReEngagementRetryTests();
  console.log('Re-engagement retry tests passed.');

  await runConnectionAwarenessTests();
  console.log('Connection awareness tests passed.');

  await runSchemaVersionResilienceTests();
  console.log('Schema/version resilience tests passed.');

  await runDossierSchemaResilienceTests();
  console.log('Dossier schema resilience tests passed.');

  await runRequestDeduplicationTests();
  console.log('Request deduplication tests passed.');

  await runRateLimitingTests();
  console.log('Rate limiting tests passed.');

  await runRequestSizeLimitingTests();
  console.log('Request size limiting tests passed.');

  await runTimeoutHardeningTests();
  console.log('Timeout hardening tests passed.');

  await runDataIntegrityTests();
  console.log('Data integrity tests passed.');

  await runCorrelationIdTests();
  console.log('Correlation ID tests passed.');

  await runTaskDeletionTests();
  console.log('Task deletion tests passed.');

  await runTaskEditTests();
  console.log('Task edit tests passed.');

  await runTaskReorderTests();
  console.log('Task reorder tests passed.');

  await runTaskDueDateTests();
  console.log('Task due date tests passed.');

  await runTaskNotesTests();
  console.log('Task notes tests passed.');

  await runActivityHistoryTests();
  console.log('Activity history tests passed.');

  await runTaskPriorityTests();
  console.log('Task priority tests passed.');

  await runTaskPriorityFilterTests();
  console.log('Task priority filter tests passed.');

  await runTaskSearchTests();
  console.log('Task search tests passed.');

  await runTaskBatchOperationsTests();
  console.log('Task batch operations tests passed.');

  await runTaskCategoryTests();
  console.log('Task category tests passed.');

  await runTaskEstimateTests();
  console.log('Task estimate tests passed.');

  await runTaskTimeTrackingTests();
  console.log('Task time tracking tests passed.');

  await runTaskDependencyTests();
  console.log('Task dependency tests passed.');

  await runTaskMilestoneTests();
  console.log('Task milestone tests passed.');

  await runTaskSubtaskTests();
  console.log('Task subtask tests passed.');

  runIntakeIntelligenceTests();
  console.log('Intake intelligence tests passed.');

  runFirstPassAmbiguityTests();
  console.log('First-pass ambiguity tests passed.');

  runFollowUpQuestionPlannerTests();
  console.log('Follow-up question planner tests passed.');

  runCharacterProgressionInfluenceTests();
  console.log('Character progression influence tests passed.');

  runCharacterIntroContentTests();
  console.log('Character intro content tests passed.');

  runGuidanceOnboardingShellTests();
  console.log('Guidance onboarding shell tests passed.');

  runGuidanceExecutionReadySectionTests();
  console.log('Guidance execution-ready section tests passed.');

  runGuidanceExecutionProgressStripTests();
  console.log('Guidance execution progress strip tests passed.');

  runGuidanceExecutionHandoffTests();
  console.log('Guidance execution handoff tests passed.');

  await runGuidanceExecutionTransitionTests();
  console.log('Guidance execution transition tests passed.');

  runGuidancePhaseAndRightRailTests();
  console.log('Guidance phase and right-rail tests passed.');

  await runGuidanceSituationPhaseMatrixTests();
  console.log('Guidance situation-phase matrix tests passed.');

  runOnboardingStatePlannerTests();
  console.log('Onboarding state planner tests passed.');

  runProgressionSystemTests();
  console.log('Progression system tests passed.');

  runRecommendationAdapterTests();
  console.log('Recommendation adapter tests passed.');

  runRecommendationCoreTests();
  console.log('Recommendation core tests passed.');

  runServerContinuationTests();
  console.log('Server continuation tests passed.');

  runRecommendationWrapperParityTests();
  console.log('Recommendation wrapper parity tests passed.');

  runRouteRecommendationTests();
  console.log('Route recommendation scenarios passed.');

  runTrainerRecommendationTests();
  console.log('Trainer recommendation scenarios passed.');

  console.log('All recommendation regression scenarios passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
