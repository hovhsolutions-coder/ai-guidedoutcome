import { type PersistedGuidanceShellStateInput } from '@/src/lib/guidance-session/persist-guidance-session-state';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';
import { createGuidancePresentationFixtureMatrix } from '@/tests/evals/guidance-presentation-fixtures';
import { createGuidanceRecoveryFixtureMatrix } from '@/tests/evals/guidance-recovery-fixtures';

export interface GuidanceSessionResumeFixture {
  id:
    | 'restored_clarifying_session'
    | 'restored_refined_direction_session'
    | 'restored_execution_ready_session'
    | 'restored_clarifying_follow_up_failure'
    | 'restored_trainer_request_failure'
    | 'restored_execution_ready_dossier_failure';
  snapshot: PersistedGuidanceShellStateInput;
  liveRawInput: string;
}

export function createGuidanceSessionResumeFixtureMatrix(): GuidanceSessionResumeFixture[] {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const recoveryFixtures = createGuidanceRecoveryFixtureMatrix();

  const clarifying = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
  const refined = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
  const executionReady = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');
  const clarifyingFailure = recoveryFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_failure');
  const trainerFailure = recoveryFixtures.find((fixture) => fixture.id === 'trainer_request_failure');
  const dossierFailure = recoveryFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_failure');

  if (!clarifying || !refined || !executionReady || !clarifyingFailure || !trainerFailure || !dossierFailure) {
    throw new Error('Guidance resume fixtures are incomplete.');
  }

  return [
    {
      id: 'restored_clarifying_session',
      snapshot: buildSnapshotFromState(clarifying.state),
      liveRawInput: clarifying.liveRawInput,
    },
    {
      id: 'restored_refined_direction_session',
      snapshot: buildSnapshotFromState(refined.state),
      liveRawInput: refined.liveRawInput,
    },
    {
      id: 'restored_execution_ready_session',
      snapshot: buildSnapshotFromState(executionReady.state),
      liveRawInput: executionReady.liveRawInput,
    },
    {
      id: 'restored_clarifying_follow_up_failure',
      snapshot: buildSnapshotFromState(clarifyingFailure.state),
      liveRawInput: clarifyingFailure.liveRawInput,
    },
    {
      id: 'restored_trainer_request_failure',
      snapshot: buildSnapshotFromState(trainerFailure.state),
      liveRawInput: trainerFailure.liveRawInput,
    },
    {
      id: 'restored_execution_ready_dossier_failure',
      snapshot: buildSnapshotFromState(dossierFailure.state),
      liveRawInput: dossierFailure.liveRawInput,
    },
  ];
}

function buildSnapshotFromState(state: GuidanceSessionStoreState): PersistedGuidanceShellStateInput {
  return {
    rawInput: state.input.rawInput,
    situation: state.input.situation,
    mainGoal: state.input.mainGoal,
    selectedMode: state.input.selectedMode,
    intakeAnswers: state.input.intakeAnswers,
    result: state.session.result,
    resultMeta: state.session.resultMeta,
    guidanceSession: state.session.guidanceSession,
    activeTrainer: state.session.activeTrainer,
    generationCount: state.meta.generationCount,
    lastGeneratedAt: state.meta.lastGeneratedAt,
  };
}
