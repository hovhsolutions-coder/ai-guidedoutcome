'use client';

import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AIResponseOutput, type AITrainerId } from '@/src/lib/ai/types';
import { type PersistedGuidanceShellState } from '@/src/lib/guidance-session/persist-guidance-session-state';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';

export type ModeSelection = 'auto' | GuidanceModeId;

export interface GuidanceGenerationStatus {
  tone: 'success' | 'neutral';
  title: string;
  description: string;
}

export interface GuidanceResultMetaState {
  detectedDomain: GuidancePrimaryDomain;
  activeMode: GuidanceModeId;
  shouldOfferDossier: boolean;
}

export interface GuidanceSessionStoreState {
  input: {
    rawInput: string;
    situation: string;
    mainGoal: string;
    selectedMode: ModeSelection;
    intakeAnswers: Record<string, string>;
  };
  feedback: {
    isLoading: boolean;
    isSubmittingFollowUp: boolean;
    error: string | null;
    generationStatus: GuidanceGenerationStatus | null;
  };
  session: {
    result: AIResponseOutput | null;
    resultMeta: GuidanceResultMetaState | null;
    guidanceSession: GuidanceSession | null;
    activeTrainer: AITrainerId | null;
    trainerLoading: AITrainerId | null;
    trainerError: string | null;
  };
  meta: {
    generationCount: number;
    lastGeneratedAt: string | null;
    hasRestoredPersistedState: boolean;
  };
}

export type GuidanceSessionStoreAction =
  | { type: 'restore'; payload: ReturnType<typeof restoreStoreStateFromPersistedSnapshot> }
  | { type: 'mark_restore_complete' }
  | { type: 'set_raw_input'; payload: string }
  | { type: 'set_situation'; payload: string }
  | { type: 'set_main_goal'; payload: string }
  | { type: 'set_selected_mode'; payload: ModeSelection }
  | { type: 'set_intake_answers'; payload: Record<string, string> }
  | { type: 'set_error'; payload: string | null }
  | { type: 'set_generation_status'; payload: GuidanceGenerationStatus | null }
  | { type: 'set_loading'; payload: boolean }
  | { type: 'set_submitting_follow_up'; payload: boolean }
  | { type: 'start_trainer_loading'; payload: AITrainerId }
  | { type: 'finish_trainer_loading' }
  | { type: 'set_trainer_error'; payload: string | null }
  | { type: 'set_session_result'; payload: ReturnType<typeof buildSessionResultUpdate> }
  | { type: 'set_trainer_response'; payload: GuidanceSession['trainerResponse'] };

export function createInitialGuidanceSessionStoreState(): GuidanceSessionStoreState {
  return {
    input: {
      rawInput: '',
      situation: '',
      mainGoal: '',
      selectedMode: 'auto',
      intakeAnswers: {},
    },
    feedback: {
      isLoading: false,
      isSubmittingFollowUp: false,
      error: null,
      generationStatus: null,
    },
    session: {
      result: null,
      resultMeta: null,
      guidanceSession: null,
      activeTrainer: null,
      trainerLoading: null,
      trainerError: null,
    },
    meta: {
      generationCount: 0,
      lastGeneratedAt: null,
      hasRestoredPersistedState: false,
    },
  };
}

export function guidanceSessionStoreReducer(
  state: GuidanceSessionStoreState,
  action: GuidanceSessionStoreAction
): GuidanceSessionStoreState {
  switch (action.type) {
    case 'restore':
      return action.payload ? {
        ...state,
        input: {
          rawInput: action.payload.rawInput,
          situation: action.payload.situation,
          mainGoal: action.payload.mainGoal,
          selectedMode: action.payload.selectedMode,
          intakeAnswers: action.payload.intakeAnswers,
        },
        session: {
          ...state.session,
          result: action.payload.result,
          resultMeta: action.payload.resultMeta,
          guidanceSession: action.payload.guidanceSession,
          activeTrainer: action.payload.activeTrainer,
        },
        meta: {
          ...state.meta,
          generationCount: action.payload.generationCount,
          lastGeneratedAt: action.payload.lastGeneratedAt,
        },
      } : state;
    case 'mark_restore_complete':
      return {
        ...state,
        meta: {
          ...state.meta,
          hasRestoredPersistedState: true,
        },
      };
    case 'set_raw_input':
      return {
        ...state,
        input: {
          ...state.input,
          rawInput: action.payload,
        },
      };
    case 'set_situation':
      return {
        ...state,
        input: {
          ...state.input,
          situation: action.payload,
        },
      };
    case 'set_main_goal':
      return {
        ...state,
        input: {
          ...state.input,
          mainGoal: action.payload,
        },
      };
    case 'set_selected_mode':
      return {
        ...state,
        input: {
          ...state.input,
          selectedMode: action.payload,
        },
      };
    case 'set_intake_answers':
      return {
        ...state,
        input: {
          ...state.input,
          intakeAnswers: action.payload,
        },
      };
    case 'set_error':
      return {
        ...state,
        feedback: {
          ...state.feedback,
          error: action.payload,
        },
      };
    case 'set_generation_status':
      return {
        ...state,
        feedback: {
          ...state.feedback,
          generationStatus: action.payload,
        },
      };
    case 'set_loading':
      return {
        ...state,
        feedback: {
          ...state.feedback,
          isLoading: action.payload,
        },
      };
    case 'set_submitting_follow_up':
      return {
        ...state,
        feedback: {
          ...state.feedback,
          isSubmittingFollowUp: action.payload,
        },
      };
    case 'start_trainer_loading':
      return {
        ...state,
        session: {
          ...state.session,
          activeTrainer: action.payload,
          trainerLoading: action.payload,
          trainerError: null,
        },
      };
    case 'finish_trainer_loading':
      return {
        ...state,
        session: {
          ...state.session,
          trainerLoading: null,
        },
      };
    case 'set_trainer_error':
      return {
        ...state,
        session: {
          ...state.session,
          trainerError: action.payload,
        },
      };
    case 'set_session_result':
      return {
        ...state,
        input: {
          rawInput: action.payload.rawInput,
          situation: action.payload.situation,
          mainGoal: action.payload.mainGoal,
          selectedMode: state.input.selectedMode,
          intakeAnswers: action.payload.intakeAnswers,
        },
        session: {
          result: action.payload.result,
          resultMeta: action.payload.resultMeta,
          guidanceSession: action.payload.guidanceSession,
          activeTrainer: null,
          trainerLoading: null,
          trainerError: null,
        },
        meta: {
          ...state.meta,
          generationCount: action.payload.generationCount,
          lastGeneratedAt: action.payload.lastGeneratedAt,
        },
      };
    case 'set_trainer_response':
      return {
        ...state,
        session: {
          ...state.session,
          guidanceSession: state.session.guidanceSession
            ? {
              ...state.session.guidanceSession,
              trainerResponse: action.payload,
            }
            : state.session.guidanceSession,
        },
      };
    default:
      return state;
  }
}

export function restoreStoreStateFromPersistedSnapshot(
  restoredState: PersistedGuidanceShellState | null
) {
  if (!restoredState) {
    return null;
  }

  return {
    rawInput: restoredState.rawInput,
    situation: restoredState.situation,
    mainGoal: restoredState.mainGoal,
    selectedMode: restoredState.selectedMode,
    intakeAnswers: restoredState.intakeAnswers,
    result: restoredState.result,
    resultMeta: restoredState.resultMeta,
    guidanceSession: restoredState.guidanceSession,
    activeTrainer: restoredState.activeTrainer,
    generationCount: restoredState.generationCount,
    lastGeneratedAt: restoredState.lastGeneratedAt,
  };
}

export function shouldClearPersistedStateBeforeFreshRun(input: {
  result: AIResponseOutput | null;
  guidanceSession: GuidanceSession | null;
}) {
  return !input.result && !input.guidanceSession;
}

export function buildSessionResultUpdate(input: {
  rawInput: string;
  situation: string;
  mainGoal: string;
  intakeAnswers: Record<string, string>;
  result: AIResponseOutput;
  resultMeta: GuidanceResultMetaState | null;
  guidanceSession: GuidanceSession;
  generationCount: number;
  lastGeneratedAt: string;
}) {
  return input;
}
