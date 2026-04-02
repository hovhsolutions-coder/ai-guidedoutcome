import { getAIActionPolicy } from './policy';
import { buildTrainerPrompt } from './prompt-builder';
import { runAI } from './runner';
import {
  AIExecutionMode,
  AITrainerId,
  AITrainerRequestInput,
  AITrainerResponseOutput,
} from './types';

export async function runTrainerPerspective(
  input: AITrainerRequestInput,
  options: { mode?: AIExecutionMode } = {}
): Promise<{ success: boolean; data?: AITrainerResponseOutput; error?: string; rateLimited?: boolean }> {
  const mode = options.mode ?? 'live';

  if (mode === 'local' && process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: 'Local trainer mode is only available outside production.',
    };
  }

  if (mode === 'local') {
    return {
      success: true,
      data: buildLocalTrainerResponse(input),
    };
  }

  const policy = getAIActionPolicy('guidance');
  const prompt = buildTrainerPrompt(input);
  const result = await runAI(prompt, {
    model: policy.model,
    timeoutMs: policy.timeoutMs,
    maxOutputTokens: 500,
    retry: policy.retry,
  });

  if (result.rateLimited) {
    return {
      success: false,
      error: result.error,
      rateLimited: true,
    };
  }

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const parsed = parseRawTrainerResponse(result.rawText);
  return {
    success: true,
    data: validateTrainerResponse(parsed, input),
  };
}

function parseRawTrainerResponse(rawText?: string): unknown {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function validateTrainerResponse(raw: unknown, input: AITrainerRequestInput): AITrainerResponseOutput {
  const fallback = getTrainerFallback(input);

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const candidate = raw as {
    focus_label?: unknown;
    headline?: unknown;
    key_insight?: unknown;
    recommendation?: unknown;
    next_move?: unknown;
    support_points?: unknown;
    caution?: unknown;
    message_draft?: unknown;
    confidence_label?: unknown;
  };

  const supportPoints = Array.isArray(candidate.support_points)
    ? candidate.support_points
      .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item: string) => item.trim())
      .slice(0, 3)
    : [];

  const response: AITrainerResponseOutput = {
    trainer: input.trainer,
    focus_label: typeof candidate.focus_label === 'string' && candidate.focus_label.trim()
      ? candidate.focus_label.trim()
      : fallback.focus_label,
    headline: typeof candidate.headline === 'string' && candidate.headline.trim()
      ? candidate.headline.trim()
      : fallback.headline,
    key_insight: typeof candidate.key_insight === 'string' && candidate.key_insight.trim()
      ? candidate.key_insight.trim()
      : fallback.key_insight,
    recommendation: typeof candidate.recommendation === 'string' && candidate.recommendation.trim()
      ? candidate.recommendation.trim()
      : fallback.recommendation,
    next_move: typeof candidate.next_move === 'string' && candidate.next_move.trim()
      ? candidate.next_move.trim()
      : fallback.next_move,
    support_points: supportPoints.length > 0 ? supportPoints : fallback.support_points,
    caution: typeof candidate.caution === 'string' && candidate.caution.trim()
      ? candidate.caution.trim()
      : fallback.caution,
    message_draft: typeof candidate.message_draft === 'string' && candidate.message_draft.trim()
      ? candidate.message_draft.trim()
      : fallback.message_draft,
    confidence_label: candidate.confidence_label === 'high' || candidate.confidence_label === 'medium' || candidate.confidence_label === 'guarded'
      ? candidate.confidence_label
      : fallback.confidence_label,
  };

  return refineTrainerResponse(response, input);
}

function buildLocalTrainerResponse(input: AITrainerRequestInput): AITrainerResponseOutput {
  const fallback = getTrainerFallback(input);
  const priorityTask = input.tasks?.find(Boolean);
  const objective = input.current_objective ?? input.guidance_next_step ?? priorityTask ?? 'the current objective';

  switch (input.trainer) {
    case 'strategy':
      return {
        trainer: 'strategy',
        focus_label: 'Direction',
        headline: 'Sharpen direction',
        key_insight: `The mission is clearer when everything keeps serving "${objective}" instead of branching into parallel priorities.`,
        recommendation: 'Narrow the dossier around the strongest leverage point and remove any branch that does not materially improve the mission.',
        next_move: priorityTask
          ? `Choose whether "${priorityTask}" is the strongest leverage point for the dossier right now.`
          : fallback.next_move,
        support_points: priorityTask
          ? [
            `Define what outcome "${priorityTask}" should unlock next`,
            'Choose the tradeoff that matters more than keeping every option open',
            'Remove the least important branch that is diluting focus',
          ]
          : fallback.support_points,
        confidence_label: 'medium',
      };
    case 'execution':
      return {
        trainer: 'execution',
        focus_label: 'Execution',
        headline: 'Operationalize the move',
        key_insight: `Execution improves when the current objective is translated into one immediate move with a visible outcome.`,
        recommendation: 'Convert the mission into one immediate execution gain before revisiting strategy or adding more planning.',
        next_move: priorityTask
          ? `Complete the next meaningful part of "${priorityTask}" now.`
          : fallback.next_move,
        support_points: priorityTask
          ? [
            `Define what done looks like for "${priorityTask}"`,
            `Remove the smallest blocker slowing "${priorityTask}" down`,
            `Capture the result of "${priorityTask}" before choosing the following move`,
          ]
          : fallback.support_points,
        confidence_label: 'high',
      };
    case 'risk':
      return {
        trainer: 'risk',
        focus_label: 'Risk',
        headline: 'Protect the mission',
        key_insight: `The main risk is not lack of effort, but letting the dossier move forward without checking the most important blocker or downside first.`,
        recommendation: 'Protect the current objective by checking the highest-impact downside before widening scope or accelerating execution.',
        next_move: priorityTask
          ? `Confirm the main blocker around "${priorityTask}" before you widen execution.`
          : fallback.next_move,
        support_points: priorityTask
          ? [
            `Name the most likely failure point around "${priorityTask}"`,
            `Verify the one assumption that could invalidate the current move`,
            'Adjust the plan only enough to reduce exposure without freezing momentum',
          ]
          : fallback.support_points,
        caution: priorityTask
          ? `Do not let "${priorityTask}" advance without checking the most meaningful blocker first.`
          : fallback.caution,
        confidence_label: 'guarded',
      };
    case 'communication':
      return refineTrainerResponse({
        trainer: 'communication',
        focus_label: 'Communication',
        headline: 'Shape the message',
        key_insight: `The mission will move more cleanly if the message around "${objective}" is framed for the right stakeholder, with the right boundary, and without language that weakens the position.`,
        recommendation: 'Use communication to align the stakeholder on the current move while protecting the decision boundary that the dossier cannot afford to blur.',
        next_move: priorityTask
          ? `Draft the stakeholder-facing message that aligns others around "${priorityTask}" without weakening the current position.`
          : fallback.next_move,
        support_points: priorityTask
          ? [
            `State the decision, ask, or update behind "${priorityTask}" in one sentence`,
            'Name the boundary you need to preserve before softening the tone',
            'Remove wording that creates ambiguity, overcommitment, or unnecessary friction',
          ]
          : fallback.support_points,
        message_draft: priorityTask
          ? `Here is the current focus: "${priorityTask}". I want to align on this next move clearly while keeping the boundary around commitments and scope intact.`
          : fallback.message_draft,
        confidence_label: 'medium',
      }, input);
  }
}

function getTrainerFallback(input: AITrainerRequestInput): AITrainerResponseOutput {
  const objective = input.current_objective ?? input.guidance_next_step ?? 'the current objective';
  const byTrainer: Record<AITrainerId, Omit<AITrainerResponseOutput, 'trainer'>> = {
    strategy: {
      focus_label: 'Direction',
      headline: 'Sharpen direction',
      key_insight: `This dossier needs a stronger directional choice around ${objective}.`,
      recommendation: 'Reduce competing paths and keep the mission anchored to the highest-leverage move.',
      next_move: `Choose the highest-leverage move that keeps ${objective} advancing.`,
      support_points: [
        'Reduce competing priorities around the objective',
        'Define the decision that matters most next',
        'Choose the tradeoff that matters more than preserving every option',
      ],
      confidence_label: 'medium',
    },
    execution: {
      focus_label: 'Execution',
      headline: 'Operationalize the move',
      key_insight: `The mission now depends on turning ${objective} into immediate movement.`,
      recommendation: 'Push one visible execution gain before reopening the plan.',
      next_move: `Complete the next meaningful step that advances ${objective}.`,
      support_points: [
        'Define what done should look like next',
        'Remove the smallest blocker to execution',
        'Capture progress before selecting the following move',
      ],
      confidence_label: 'high',
    },
    risk: {
      focus_label: 'Risk',
      headline: 'Protect the mission',
      key_insight: `The main downside is allowing ${objective} to move forward without reducing the most important risk first.`,
      recommendation: 'Keep momentum, but put the highest-risk check ahead of unnecessary acceleration.',
      next_move: `Confirm the main risk around ${objective} before expanding scope.`,
      support_points: [
        'Name the key downside that could slow the mission',
        'Verify the assumption most likely to break the plan',
        'Protect momentum without creating unnecessary drag',
      ],
      caution: `Do not expand work around ${objective} until the main risk is clearly contained.`,
      confidence_label: 'guarded',
    },
    communication: {
      focus_label: 'Communication',
      headline: 'Shape the message',
      key_insight: `This dossier needs sharper phrasing around ${objective} so the next move lands with the right stakeholder without weakening the current position.`,
      recommendation: 'Reduce communication friction by stating the move clearly, preserving the boundary that matters, and aligning the audience around the current mission.',
      next_move: `Draft the message that advances ${objective} while protecting the key boundary or commitment line.`,
      support_points: [
        'State the decision, ask, or alignment point directly',
        'Name the boundary or position that must not get diluted',
        'Remove wording that weakens the position or creates confusion',
      ],
      message_draft: `Current focus: ${objective}. I want to align on the next move clearly while keeping the relevant boundary and expectations intact.`,
      confidence_label: 'medium',
    },
  };

  return refineTrainerResponse({
    trainer: input.trainer,
    ...byTrainer[input.trainer],
  }, input);
}

function refineTrainerResponse(
  response: AITrainerResponseOutput,
  input: AITrainerRequestInput
): AITrainerResponseOutput {
  if (input.trainer !== 'communication') {
    return response;
  }

  const audience = inferStakeholderContext(input);
  const boundary = inferPositionBoundary(input);
  const objective = getPrimaryCommunicationObjective(input);
  const communicationTask = getCommunicationTask(input);
  const messageTarget = communicationTask ?? objective;

  const refined: AITrainerResponseOutput = {
    ...response,
    focus_label: response.focus_label.trim() || 'Communication',
    headline: response.headline.trim() || 'Shape the message',
  };

  if (isGenericCommunicationInsight(refined.key_insight)) {
    refined.key_insight = `The communication move needs to help ${audience} understand "${messageTarget}" clearly while preserving ${boundary}.`;
  }

  if (isGenericCommunicationRecommendation(refined.recommendation)) {
    refined.recommendation = `Use communication to align ${audience} on the current move, reduce friction around the decision, and protect ${boundary}.`;
  }

  if (isGenericCommunicationNextMove(refined.next_move)) {
    refined.next_move = `Draft the ${audience} message that explains "${messageTarget}" while preserving ${boundary}.`;
  }

  refined.support_points = refineCommunicationSupportPoints(refined.support_points, audience, boundary, messageTarget);

  if (!refined.message_draft || isGenericCommunicationDraft(refined.message_draft)) {
    refined.message_draft = buildCommunicationDraft(audience, boundary, messageTarget, objective);
  }

  return refined;
}

function refineCommunicationSupportPoints(
  supportPoints: string[],
  audience: string,
  boundary: string,
  messageTarget: string
): string[] {
  const candidatePoints = supportPoints.filter((point) => point.trim().length > 0);

  if (candidatePoints.length >= 3 && candidatePoints.some((point) => /stakeholder|boundary|commit/i.test(point))) {
    return candidatePoints.slice(0, 3);
  }

  return [
    `Name what ${audience} needs to understand about "${messageTarget}" in one sentence`,
    `State the boundary around ${boundary} without sounding defensive or vague`,
    'Remove wording that creates ambiguity, overcommitment, or unnecessary friction',
  ];
}

function buildCommunicationDraft(
  audience: string,
  boundary: string,
  messageTarget: string,
  objective: string
): string {
  return `I want to align ${audience} on "${messageTarget}" clearly. The next move is ${objective}, and I want to communicate it while protecting ${formatBoundaryForSentence(boundary)}.`;
}

function getPrimaryCommunicationObjective(input: AITrainerRequestInput): string {
  return input.current_objective
    ?? input.guidance_next_step
    ?? getCommunicationTask(input)
    ?? input.main_goal
    ?? 'the current move';
}

function getCommunicationTask(input: AITrainerRequestInput): string | undefined {
  return input.tasks?.find((task) => /(response|message|reply|update|explanation|align|stakeholder|customer|announcement|send)/i.test(task));
}

function inferStakeholderContext(input: AITrainerRequestInput): string {
  const combined = [
    input.situation,
    input.main_goal,
    input.current_objective,
    input.guidance_next_step,
    ...(input.tasks ?? []),
  ].join(' ');

  if (/(customer|client|account)/i.test(combined)) {
    return 'the customer';
  }

  if (/(stakeholder|leadership|executive|board|investor)/i.test(combined)) {
    return 'the relevant stakeholder';
  }

  if (/(team|internal|owner|owners|account team)/i.test(combined)) {
    return 'the internal team';
  }

  if (/(partner|vendor)/i.test(combined)) {
    return 'the partner';
  }

  return 'the right stakeholder';
}

function inferPositionBoundary(input: AITrainerRequestInput): string {
  const combined = [
    input.current_objective,
    input.guidance_next_step,
    input.main_goal,
    input.situation,
  ].filter(Boolean).join(' ');
  const withoutMatch = combined.match(/without ([^.]+)/i);

  if (withoutMatch?.[1]) {
    return normalizeBoundary(withoutMatch[1].trim());
  }

  if (/(trust|position|commitment|commitments|scope|roadmap|expectation|expectations)/i.test(combined)) {
    const matched = combined.match(/(trust|position|commitments?|scope|roadmap|expectations?)/i);
    if (matched?.[1]) {
      return matched[1].toLowerCase();
    }
  }

  return 'the current decision boundary';
}

function normalizeBoundary(value: string): string {
  return value
    .replace(/^(creating|making|adding|overpromising)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatBoundaryForSentence(boundary: string): string {
  if (/^(trust|scope|position|roadmap|expectations?)$/i.test(boundary)) {
    return `the boundary around ${boundary}`;
  }

  if (/^(new commitments?|commitments?)$/i.test(boundary)) {
    return 'the boundary around new commitments';
  }

  if (/^the /i.test(boundary)) {
    return boundary;
  }

  return boundary;
}

function isGenericCommunicationInsight(value: string): boolean {
  return /right level|right tone|unnecessary ambiguity|clearer phrasing/i.test(value);
}

function isGenericCommunicationRecommendation(value: string): boolean {
  return /reduce friction|direct, professional|aligned to the current mission|broaden the scope|soften the decision/i.test(value);
}

function isGenericCommunicationNextMove(value: string): boolean {
  return /write the (shortest|clearest) (clear )?message|align others around/i.test(value);
}

function isGenericCommunicationDraft(value: string): boolean {
  return /current focus|align on this next move|keep momentum|avoid unnecessary drift/i.test(value);
}
