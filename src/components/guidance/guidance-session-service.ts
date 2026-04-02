import { detectDomain } from '@/src/lib/ai/domain/detect-domain';
import { resolveGuidanceModeId } from '@/src/lib/ai/modes/resolve-mode';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AIResponseOutput, type AITrainerId } from '@/src/lib/ai/types';
import { hydrateFirstPassGuidanceState } from '@/src/lib/guidance-session/hydrate-first-pass-guidance-state';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import { buildTrainerRequestFromGuidanceSession } from '@/src/lib/trainers/build-trainer-request-from-guidance-session';
import { buildFollowUpGuidanceContext } from '@/src/components/guidance/build-follow-up-guidance-context';

interface GuidanceSubmitInput {
  rawInput: string;
  situation: string;
  mainGoal: string;
  intakeAnswers: Record<string, string>;
  selectedMode: GuidanceModeId | 'auto';
}

interface FollowUpContinuationInput extends GuidanceSubmitInput {
  followUpQuestion: NonNullable<GuidanceSession['followUpQuestion']>;
  answer: string;
}

interface GuidanceSessionServiceDependencies {
  fetchImpl?: typeof fetch;
}

export interface GuidanceSubmitServiceResult {
  submission: {
    rawInput: string;
    situation: string;
    mainGoal: string;
    intakeAnswers: Record<string, string>;
  };
  result: AIResponseOutput;
  hydratedState: ReturnType<typeof hydrateFirstPassGuidanceState>;
}

export async function submitGuidanceSessionRequest(
  input: GuidanceSubmitInput,
  dependencies: GuidanceSessionServiceDependencies = {}
): Promise<GuidanceSubmitServiceResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const sanitizedAnswers = sanitizeIntakeAnswers(input.intakeAnswers);
  const fallbackDetection = detectDomain(input.rawInput);

  const response = await fetchImpl('/api/ai/guidance', {
    method: 'POST',
    headers: buildJsonHeaders(),
    body: JSON.stringify({
      raw_input: input.rawInput,
      situation: input.situation,
      main_goal: input.mainGoal,
      intakeAnswers: sanitizedAnswers,
      triggerType: 'manual',
      ...(input.selectedMode !== 'auto' ? { activeMode: input.selectedMode } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response));
  }

  const responseData = await parseGuidanceResponse(response);
  const hydratedState = hydrateFirstPassGuidanceState({
    rawInput: input.rawInput,
    intakeAnswers: sanitizedAnswers,
    continuation: responseData.continuation,
    result: {
      summary: responseData.summary,
      nextStep: responseData.next_step,
      suggestedTasks: responseData.suggested_tasks,
    },
    fallbackDetectedDomain: fallbackDetection.primaryDomain,
    fallbackActiveMode: input.selectedMode === 'auto'
      ? resolveGuidanceModeId(fallbackDetection)
      : input.selectedMode,
    fallbackShouldOfferDossier: fallbackDetection.shouldOfferDossier,
  });

  return {
    submission: {
      rawInput: input.rawInput,
      situation: input.situation,
      mainGoal: input.mainGoal,
      intakeAnswers: sanitizedAnswers,
    },
    result: responseData,
    hydratedState,
  };
}

export async function continueGuidanceSessionFromFollowUp(
  input: FollowUpContinuationInput,
  dependencies: GuidanceSessionServiceDependencies = {}
): Promise<GuidanceSubmitServiceResult> {
  const nextContext = buildFollowUpGuidanceContext({
    rawInput: input.rawInput,
    intakeAnswers: input.intakeAnswers,
    followUpQuestion: input.followUpQuestion,
    answer: input.answer,
  });

  return submitGuidanceSessionRequest(
    {
      rawInput: nextContext.rawInput,
      situation: input.situation,
      mainGoal: input.mainGoal,
      intakeAnswers: nextContext.intakeAnswers,
      selectedMode: input.selectedMode,
    },
    dependencies
  );
}

export async function requestGuidanceTrainerResponse(
  input: {
    session: GuidanceSession;
    trainer: AITrainerId;
  },
  dependencies: GuidanceSessionServiceDependencies = {}
): Promise<NonNullable<GuidanceSession['trainerResponse']>> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const response = await fetchImpl('/api/ai/trainer', {
    method: 'POST',
    headers: buildJsonHeaders(),
    body: JSON.stringify(buildTrainerRequestFromGuidanceSession(input.session, input.trainer)),
  });

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response));
  }

  return parseTrainerResponse(response);
}

function buildJsonHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(process.env.NODE_ENV !== 'production' ? { 'x-guidance-mode': 'local' } : {}),
  };
}

async function parseGuidanceResponse(response: Response): Promise<AIResponseOutput & {
  continuation?: {
    decision?: GuidanceSession['decision'];
    detectedDomain: GuidanceSession['detectedDomain'];
    activeMode: GuidanceModeId;
    shouldOfferDossier: boolean;
    routeOutcome: NonNullable<GuidanceSession['routeOutcome']>;
    trainerRecommendation: NonNullable<GuidanceSession['trainerRecommendation']>;
    followUpQuestion?: GuidanceSession['followUpQuestion'];
    characterProfile?: GuidanceSession['characterProfile'];
    progressionState?: GuidanceSession['progressionState'];
  };
}> {
  const data = await response.json() as {
    success: boolean;
    error?: string;
    data?: AIResponseOutput & {
      continuation?: {
        decision?: GuidanceSession['decision'];
        detectedDomain: GuidanceSession['detectedDomain'];
        activeMode: GuidanceModeId;
        shouldOfferDossier: boolean;
        routeOutcome: NonNullable<GuidanceSession['routeOutcome']>;
        trainerRecommendation: NonNullable<GuidanceSession['trainerRecommendation']>;
        followUpQuestion?: GuidanceSession['followUpQuestion'];
        characterProfile?: GuidanceSession['characterProfile'];
        progressionState?: GuidanceSession['progressionState'];
      };
    };
  };

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Guidance could not be generated.');
  }

  return data.data;
}

async function parseTrainerResponse(response: Response): Promise<NonNullable<GuidanceSession['trainerResponse']>> {
  const data = await response.json() as {
    success: boolean;
    error?: string;
    data?: GuidanceSession['trainerResponse'];
  };

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Trainer guidance could not be generated.');
  }

  return data.data;
}

async function getResponseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string' && body.error.trim().length > 0) {
      return body.error;
    }
    if (typeof body?.message === 'string' && body.message.trim().length > 0) {
      return body.message;
    }
  } catch {
    // Fall through to the default message.
  }

  return 'Guidance could not be generated right now.';
}

function sanitizeIntakeAnswers(intakeAnswers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(intakeAnswers)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0)
  );
}
