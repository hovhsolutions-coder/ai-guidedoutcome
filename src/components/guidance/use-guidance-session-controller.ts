'use client';

import { startTransition, useDeferredValue, useEffect, useReducer, useRef, useMemo, useState, useCallback } from 'react';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AITrainerId } from '@/src/lib/ai/types';
import { detectDomain } from '@/src/lib/ai/domain/detect-domain';
import { type DetectedDomain } from '@/src/lib/ai/domain/types';
import { 
  getAnalytics,
  type DomainDetectionAnalytics,
  PRODUCTION_CONFIG 
} from '@/src/lib/analytics/domain-detection-analytics';
import {
  clearPersistedGuidanceShellState,
  clearPersistedGuidanceShellStateFromBrowser,
  loadPersistedGuidanceShellState,
  savePersistedGuidanceShellState,
} from '@/src/lib/guidance-session/persist-guidance-session-state';
import {
  continueGuidanceSessionFromFollowUp,
  type GuidanceSubmitServiceResult,
  requestGuidanceTrainerResponse,
  submitGuidanceSessionRequest,
} from '@/src/components/guidance/guidance-session-service';
import {
  buildSessionResultUpdate,
  createInitialGuidanceSessionStoreState,
  guidanceSessionStoreReducer,
  restoreStoreStateFromPersistedSnapshot,
  shouldClearPersistedStateBeforeFreshRun,
} from '@/src/components/guidance/guidance-session-store';
import {
  getGuidanceObservabilitySnapshot,
  observeGuidanceActionTriggered,
  observeGuidancePresentationState,
  observeGuidanceSoftSignal,
} from '@/src/components/guidance/guidance-observability';
import { presentGuidanceSession } from '@/src/components/guidance/guidance-session-presenter';

export { restoreStoreStateFromPersistedSnapshot as restoreControllerStateFromPersistedSnapshot } from '@/src/components/guidance/guidance-session-store';
export { shouldClearPersistedStateBeforeFreshRun } from '@/src/components/guidance/guidance-session-store';

export function clearGuidanceSessionAfterSuccessfulDossierConversion() {
  clearPersistedGuidanceShellStateFromBrowser();
}

export function useGuidanceSessionController() {
  const [state, dispatch] = useReducer(
    guidanceSessionStoreReducer,
    undefined,
    createInitialGuidanceSessionStoreState
  );
  
  const analytics = getAnalytics();

  const deferredRawInput = useDeferredValue(state.input.rawInput);
  const presentation = presentGuidanceSession({
    state,
    liveRawInput: deferredRawInput,
  });

  // Real-time domain detection for intake feedback with debouncing for stability
  const [debouncedDomainDetection, setDebouncedDomainDetection] = useState<DetectedDomain | null>(null);
  const [domainDetection, setDomainDetection] = useState<DetectedDomain | null>(null);

  // Debounced detection for stable UX
  const debouncedInput = useMemo(() => {
    const combinedInput = [
      state.input.rawInput,
      state.input.situation,
      state.input.mainGoal
    ].filter(Boolean).join(' ').trim();

    return combinedInput;
  }, [state.input.rawInput, state.input.situation, state.input.mainGoal]);

  // Immediate detection for internal use (but not shown to user)
  const immediateDetection = useMemo(() => {
    if (debouncedInput.length < 20) { // Higher threshold for any detection
      return null;
    }
    return detectDomain(debouncedInput);
  }, [debouncedInput]);

  // Debounced UI update to prevent flickering
  useEffect(() => {
    if (!immediateDetection) {
      setDebouncedDomainDetection(null);
      setDomainDetection(null);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedDomainDetection(immediateDetection);
      // Only show to user if confidence is reasonably high (using production config)
      if (immediateDetection.confidence >= PRODUCTION_CONFIG.confidenceThreshold) {
        setDomainDetection(immediateDetection);
        analytics.domainDetected(analytics.currentSessionId, immediateDetection.primaryDomain, immediateDetection.confidence);
      } else {
        setDomainDetection(null);
      }
    }, PRODUCTION_CONFIG.debounceMs); // Use production config debounce

    return () => clearTimeout(timer);
  }, [immediateDetection, analytics]);

  const actionAttemptsRef = useRef({
    submit: 0,
    follow_up: 0,
    trainer: 0,
    convert: 0,
  });
  const presentationSnapshotKeyRef = useRef<string | null>(null);
  const previousProgressStateRef = useRef(presentation.progressMessage.state);
  const followUpHesitationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const restoredState = restoreStoreStateFromPersistedSnapshot(
      loadPersistedGuidanceShellState(window.localStorage)
    );

    if (restoredState) {
      startTransition(() => {
        dispatch({ type: 'restore', payload: restoredState });
      });
    }

    dispatch({ type: 'mark_restore_complete' });
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined'
      || !state.meta.hasRestoredPersistedState
      || state.feedback.isLoading
      || state.feedback.isSubmittingFollowUp
    ) {
      return;
    }

    const hasPersistableState =
      state.input.rawInput.trim().length > 0
      || state.input.situation.trim().length > 0
      || state.input.mainGoal.trim().length > 0
      || Object.keys(state.input.intakeAnswers).length > 0
      || state.session.result !== null
      || state.session.guidanceSession !== null;

    if (!hasPersistableState) {
      clearPersistedGuidanceShellState(window.localStorage);
      return;
    }

    const result = savePersistedGuidanceShellState(window.localStorage, {
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
    });

    if (!result.success && result.quotaExceeded) {
      console.log('[guidance:persist:observer:quota_exceeded] storage full, session not persisted');
    }
  }, [state]);

  useEffect(() => {
    const snapshot = getGuidanceObservabilitySnapshot(presentation);
    const snapshotKey = JSON.stringify({
      ...snapshot,
      generationCount: state.meta.generationCount,
      errorPresent: Boolean(state.feedback.error),
      trainerErrorPresent: Boolean(state.session.trainerError),
    });

    if (presentationSnapshotKeyRef.current === snapshotKey) {
      return;
    }

    presentationSnapshotKeyRef.current = snapshotKey;
    observeGuidancePresentationState({
      presentation,
      generationCount: state.meta.generationCount,
      errorPresent: Boolean(state.feedback.error),
      trainerErrorPresent: Boolean(state.session.trainerError),
    });
  }, [
    presentation,
    state.meta.generationCount,
    state.feedback.error,
    state.session.trainerError,
  ]);

  useEffect(() => {
    const previousProgressState = previousProgressStateRef.current;
    const nextProgressState = presentation.progressMessage.state;

    if (
      previousProgressState === 'execution_ready'
      && nextProgressState !== 'execution_ready'
      && nextProgressState !== 'dossier_conversion_loading'
    ) {
      observeGuidanceSoftSignal({
        presentation,
        signal: 'abandoned_execution_bridge',
        detail: `left ${previousProgressState} for ${nextProgressState}`,
      });
    }

    previousProgressStateRef.current = nextProgressState;
  }, [presentation]);

  useEffect(() => {
    if (followUpHesitationTimerRef.current) {
      clearTimeout(followUpHesitationTimerRef.current);
      followUpHesitationTimerRef.current = null;
    }

    if (presentation.progressMessage.state !== 'clarifying_ready') {
      return;
    }

    followUpHesitationTimerRef.current = setTimeout(() => {
      observeGuidanceSoftSignal({
        presentation,
        signal: 'follow_up_hesitation_window',
        detail: 'clarifying state remained idle for 15s',
      });
    }, 15000);

    return () => {
      if (followUpHesitationTimerRef.current) {
        clearTimeout(followUpHesitationTimerRef.current);
        followUpHesitationTimerRef.current = null;
      }
    };
  }, [presentation]);

  function applyGuidanceSubmissionResult(responseData: GuidanceSubmitServiceResult) {
    startTransition(() => {
      const generatedAt = formatStatusTime(new Date());
      const nextCount = state.meta.generationCount + 1;

      dispatch({
        type: 'set_session_result',
        payload: buildSessionResultUpdate({
          rawInput: responseData.submission.rawInput,
          situation: responseData.submission.situation,
          mainGoal: responseData.submission.mainGoal,
          intakeAnswers: responseData.submission.intakeAnswers,
          result: responseData.result,
          resultMeta: responseData.hydratedState.resultMeta,
          guidanceSession: responseData.hydratedState.guidanceSession,
          generationCount: nextCount,
          lastGeneratedAt: generatedAt,
        }),
      });
      dispatch({
        type: 'set_generation_status',
        payload: {
          tone: 'success',
          title: nextCount > 1 ? 'Guidance refreshed' : 'Guidance ready',
          description: nextCount > 1
            ? `The result panel was updated again at ${generatedAt}. Your intake stayed in place so you can keep iterating from the same context.`
            : 'The result panel has been updated with a fresh summary, one next step, and supporting tasks.',
        },
      });
    });
  }

  async function runGuidanceSubmission(submission: {
    rawInput: string;
    situation: string;
    mainGoal: string;
    intakeAnswers: Record<string, string>;
  }) {
    if (
      typeof window !== 'undefined'
      && shouldClearPersistedStateBeforeFreshRun({
        result: state.session.result,
        guidanceSession: state.session.guidanceSession,
      })
    ) {
      clearPersistedGuidanceShellStateFromBrowser();
    }

    dispatch({ type: 'set_error', payload: null });
    dispatch({
      type: 'set_generation_status',
      payload: {
        tone: 'neutral',
        title: state.session.result ? 'Refreshing guidance' : 'Generating guidance',
        description: state.session.result
          ? 'Your current input stays in place while we refresh the summary, next step, and supporting tasks.'
          : 'We are reading the situation, resolving the mode, and shaping one clear next move.',
      },
    });

    const responseData = await submitGuidanceSessionRequest({
      rawInput: submission.rawInput,
      situation: submission.situation,
      mainGoal: submission.mainGoal,
      intakeAnswers: submission.intakeAnswers,
      selectedMode: state.input.selectedMode,
    });
    applyGuidanceSubmissionResult(responseData);
  }

  async function submitGuidance() {
    if (state.feedback.isLoading) {
      return;
    }

    const startTime = Date.now();
    analytics.intakeStarted(analytics.currentSessionId, { 
      hasDomainDetection: !!domainDetection,
      detectedDomain: domainDetection?.primaryDomain 
    });

    dispatch({ type: 'set_loading', payload: true });
    actionAttemptsRef.current.submit += 1;
    observeGuidanceActionTriggered({
      presentation,
      action: 'submit',
      attempt: actionAttemptsRef.current.submit,
    });
    if (actionAttemptsRef.current.submit > 1) {
      observeGuidanceSoftSignal({
        presentation,
        signal: 'repeated_action_attempt',
        detail: `action: submit, attempt: ${actionAttemptsRef.current.submit}`,
      });
    }

    try {
      const submission = {
        rawInput: state.input.rawInput,
        situation: state.input.situation,
        mainGoal: state.input.mainGoal,
        intakeAnswers: state.input.intakeAnswers,
        selectedMode: state.input.selectedMode,
      };

      const responseData = await submitGuidanceSessionRequest({
        rawInput: submission.rawInput,
        situation: submission.situation,
        mainGoal: submission.mainGoal,
        intakeAnswers: submission.intakeAnswers,
        selectedMode: state.input.selectedMode,
      });
      applyGuidanceSubmissionResult(responseData);
      analytics.intakeCompleted(analytics.currentSessionId, Date.now() - startTime, { 
        success: true,
        finalDomain: domainDetection?.primaryDomain 
      });
    } catch (error) {
      dispatch({
        type: 'set_error',
        payload: error instanceof Error
          ? error.message
          : 'Guidance could not be generated.',
      });
      analytics.intakeCompleted(analytics.currentSessionId, Date.now() - startTime, { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      dispatch({ type: 'set_loading', payload: false });
    }
  }

  async function submitFollowUp(answer: string) {
    const followUpQuestion = state.session.guidanceSession?.followUpQuestion;

    if (!followUpQuestion) {
      return;
    }

    // Prevent duplicate/overlapping follow-up submissions
    if (state.feedback.isSubmittingFollowUp) {
      console.log('[guidance:submitFollowUp:dedup] already in flight, skipping');
      return;
    }

    actionAttemptsRef.current.follow_up += 1;
    observeGuidanceActionTriggered({
      presentation,
      action: 'follow_up',
      attempt: actionAttemptsRef.current.follow_up,
    });
    if (actionAttemptsRef.current.follow_up > 1) {
      observeGuidanceSoftSignal({
        presentation,
        signal: 'repeated_action_attempt',
        detail: `follow-up attempt ${actionAttemptsRef.current.follow_up}`,
      });
    }

    dispatch({ type: 'set_submitting_follow_up', payload: true });

    try {
      const continuation = await continueGuidanceSessionFromFollowUp({
        rawInput: state.input.rawInput,
        situation: state.input.situation,
        mainGoal: state.input.mainGoal,
        intakeAnswers: state.input.intakeAnswers,
        selectedMode: state.input.selectedMode,
        followUpQuestion,
        answer,
      });
      applyGuidanceSubmissionResult(continuation);
    } catch (submissionError) {
      startTransition(() => {
        dispatch({
          type: 'set_error',
          payload: submissionError instanceof Error ? submissionError.message : 'Guidance request failed.',
        });
        dispatch({ type: 'set_generation_status', payload: null });
      });
    } finally {
      dispatch({ type: 'set_submitting_follow_up', payload: false });
    }
  }

  async function selectTrainer(trainer: AITrainerId) {
    const session = state.session.guidanceSession;

    if (!session || !session.result || state.session.trainerLoading) {
      return;
    }

    actionAttemptsRef.current.trainer += 1;
    observeGuidanceActionTriggered({
      presentation,
      action: 'trainer',
      attempt: actionAttemptsRef.current.trainer,
      detail: trainer,
    });
    if (actionAttemptsRef.current.trainer > 1) {
      observeGuidanceSoftSignal({
        presentation,
        signal: 'repeated_action_attempt',
        detail: `trainer attempt ${actionAttemptsRef.current.trainer}`,
      });
    }

    dispatch({ type: 'start_trainer_loading', payload: trainer });

    try {
      const trainerResponse = await requestGuidanceTrainerResponse({
        session,
        trainer,
      });

      startTransition(() => {
        dispatch({ type: 'set_trainer_response', payload: trainerResponse });
      });
    } catch (trainerRequestError) {
      dispatch({
        type: 'set_trainer_error',
        payload: trainerRequestError instanceof Error
          ? trainerRequestError.message
          : 'Trainer guidance could not be generated.',
      });
    } finally {
      dispatch({ type: 'finish_trainer_loading' });
    }
  }

  function handleSuccessfulDossierConversion() {
    clearGuidanceSessionAfterSuccessfulDossierConversion();
  }

  return {
    input: {
      rawInput: state.input.rawInput,
      setRawInput: (value: string) => dispatch({ type: 'set_raw_input', payload: value }),
      situation: state.input.situation,
      setSituation: (value: string) => dispatch({ type: 'set_situation', payload: value }),
      mainGoal: state.input.mainGoal,
      setMainGoal: (value: string) => dispatch({ type: 'set_main_goal', payload: value }),
      selectedMode: state.input.selectedMode,
      setSelectedMode: (value: GuidanceModeId | 'auto') => dispatch({ type: 'set_selected_mode', payload: value }),
      intakeAnswers: state.input.intakeAnswers,
      setIntakeAnswers: (value: Record<string, string>) => dispatch({ type: 'set_intake_answers', payload: value }),
    },
    feedback: {
      error: state.feedback.error,
      generationStatus: state.feedback.generationStatus,
      isLoading: state.feedback.isLoading,
      isSubmittingFollowUp: state.feedback.isSubmittingFollowUp,
    },
    presentation,
    domainDetection,
    actions: {
      submitGuidance,
      submitFollowUp,
      selectTrainer,
      handleSuccessfulDossierConversion,
    },
  };
}

function formatStatusTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
