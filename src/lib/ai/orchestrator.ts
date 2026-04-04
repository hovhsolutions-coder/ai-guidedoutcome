import {
  buildCreateDossierPrompt,
  buildGuidancePrompt,
} from './prompt-builder';
import { getCache, setCache } from './cache';
import { trackActionRequest, trackProviderUsage } from './cost';
import { createAIHash } from './hash';
import { incrementMetric } from './metrics';
import { getAIActionPolicy } from './policy';
import { runAI } from './runner';
import {
  AIAction,
  AIExecutionContext,
  AIExecutionMode,
  AIRequestInput,
  AIResponseOutput,
  AIRunnerResult,
} from './types';
import { validateAIResponse } from './validators';

type ActionConfig = {
  buildPrompt: (input: AIRequestInput) => string;
  validate: (raw: unknown) => AIResponseOutput;
  fallback: (input: AIRequestInput) => AIResponseOutput;
  mapResponse: (data: AIResponseOutput) => AIRunnerResult;
};

const inFlightRequests = new Map<string, Promise<AIRunnerResult>>();
const coalescingRequests = new Map<string, {
  createdAt: number;
  promise: Promise<AIRunnerResult>;
}>();
const COALESCE_WINDOW_MS = 1500;

const actionRegistry: Record<AIAction, ActionConfig> = {
  guidance: {
    buildPrompt: buildGuidancePrompt,
    validate: validateAIResponse,
    fallback: getGuidanceFallbackResponse,
    mapResponse: mapNormalizedResponse,
  },
  create_dossier: {
    buildPrompt: buildCreateDossierPrompt,
    validate: validateAIResponse,
    fallback: getCreateDossierFallbackResponse,
    mapResponse: mapNormalizedResponse,
  },
};

export async function runAIOrchestrator(
  input: AIRequestInput,
  options: { mode?: AIExecutionMode } = {}
): Promise<AIRunnerResult> {
  const context: AIExecutionContext = {
    mode: options.mode ?? 'live',
  };

  if (context.mode === 'local' && !isLocalExecutionModeAllowed()) {
    return {
      success: false,
      error: 'Local guidance mode is only available outside production.',
    };
  }

  incrementMetric('totalRequests', context.mode);
  trackActionRequest(input.action, context.mode);

  const config = actionRegistry[input.action];
  const policy = getAIActionPolicy(input.action);

  if (!config || !policy) {
    return mapNormalizedResponse(getSafeActionFallback());
  }

  if (shouldSkipProviderCall(input)) {
    return config.mapResponse(config.fallback(input));
  }

  let cacheKey: string | null = null;
  const useSharedExecutionState = context.mode === 'live';

  try {
    cacheKey = createAIHash(input, context.mode);
    if (!useSharedExecutionState) {
      throw new Error('skip-shared-execution-state');
    }
    const cached = getCache<AIRunnerResult>(cacheKey);

    if (cached) {
      // Replay protection: repeated identical requests inside the cache window
      // should always reuse the cached result instead of re-invoking the runner.
      incrementMetric('cacheHits', context.mode);
      return cached;
    }

    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      incrementMetric('dedupHits', context.mode);
      return await inFlight;
    }

    if (shouldCoalesceRequest(input, policy.coalescingEligible)) {
      const coalescingEntry = coalescingRequests.get(cacheKey);
      if (coalescingEntry && Date.now() - coalescingEntry.createdAt <= COALESCE_WINDOW_MS) {
        incrementMetric('coalescedRequests', context.mode);
        return await coalescingEntry.promise;
      }
    }
  } catch {
    cacheKey = null;
  }

  const execution = context.mode === 'local'
    ? Promise.resolve(executeLocalOrchestratorFlow(input, config))
    : shouldCoalesceRequest(input, policy.coalescingEligible) && cacheKey
    ? scheduleCoalescedExecution(cacheKey, input, config, policy, context)
    : executeOrchestratorFlowWithTracking(cacheKey, input, config, policy, context);

  try {
    const finalResult = await execution;

    if (cacheKey && finalResult.success && useSharedExecutionState) {
      setCache(cacheKey, finalResult);
    }

    return finalResult;
  } finally {
    if (cacheKey) {
      coalescingRequests.delete(cacheKey);
    }
  }
}

function executeLocalOrchestratorFlow(
  input: AIRequestInput,
  config: ActionConfig
): AIRunnerResult {
  const prompt = config.buildPrompt(input);
  const localResponse = buildLocalDeterministicResponse(input, config.fallback(input), prompt);
  const validated = config.validate(localResponse);

  return config.mapResponse(
    input.action === 'guidance'
      ? refineGuidanceOutput(input, validated)
      : validated
  );
}

async function executeOrchestratorFlow(
  input: AIRequestInput,
  config: ActionConfig,
  policy: ReturnType<typeof getAIActionPolicy>,
  context: AIExecutionContext
): Promise<AIRunnerResult> {
  const prompt = config.buildPrompt(input);
  incrementMetric('providerCalls', context.mode);
  const result = await runAI(prompt, {
    model: policy.model,
    timeoutMs: policy.timeoutMs,
    maxOutputTokens: policy.maxOutputTokens,
    retry: policy.retry,
  });

  if (result.rateLimited) {
    incrementMetric('rateLimitHits', context.mode);
    incrementMetric('failedRequests', context.mode);
    return {
      success: false,
      error: result.error,
      rateLimited: true,
    };
  }

  if (!result.success) {
    incrementMetric('failedRequests', context.mode);
    return {
      success: false,
      error: result.error,
    };
  }

  trackProviderUsage(input.action, prompt, result.rawText ?? '', context.mode);

  const parsed = parseRawResponse(result.rawText);
  const validated = config.validate(parsed);

  return config.mapResponse(
    hasUsableResponse(parsed)
      ? refineGuidanceOutput(input, validated)
      : config.fallback(input)
  );
}

function scheduleCoalescedExecution(
  cacheKey: string,
  input: AIRequestInput,
  config: ActionConfig,
  policy: ReturnType<typeof getAIActionPolicy>,
  context: AIExecutionContext
): Promise<AIRunnerResult> {
  const promise = new Promise<AIRunnerResult>((resolve) => {
    setTimeout(async () => {
      coalescingRequests.delete(cacheKey);
      const result = await executeOrchestratorFlowWithTracking(cacheKey, input, config, policy, context);
      resolve(result);
    }, COALESCE_WINDOW_MS);
  });

  coalescingRequests.set(cacheKey, {
    createdAt: Date.now(),
    promise,
  });

  return promise;
}

async function executeOrchestratorFlowWithTracking(
  cacheKey: string | null,
  input: AIRequestInput,
  config: ActionConfig,
  policy: ReturnType<typeof getAIActionPolicy>,
  context: AIExecutionContext
): Promise<AIRunnerResult> {
  const execution = executeOrchestratorFlow(input, config, policy, context);

  if (cacheKey) {
    inFlightRequests.set(cacheKey, execution);
  }

  try {
    return await execution;
  } finally {
    if (cacheKey) {
      inFlightRequests.delete(cacheKey);
    }
  }
}

function isLocalExecutionModeAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function parseRawResponse(rawText?: string): unknown {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function hasUsableResponse(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') {
    return false;
  }

  const candidate = raw as {
    summary?: unknown;
    next_step?: unknown;
    suggested_tasks?: unknown;
  };

  return (
    typeof candidate.summary === 'string' &&
    typeof candidate.next_step === 'string' &&
    Array.isArray(candidate.suggested_tasks)
  );
}

function mapNormalizedResponse(data: AIResponseOutput): AIRunnerResult {
  return {
    success: true,
    data,
  };
}

function getCreateDossierFallbackResponse(input: AIRequestInput): AIResponseOutput {
  const goal = input.main_goal ?? 'your goal';
  const context = `${input.situation ?? ''} ${input.user_input ?? ''} ${input.main_goal ?? ''}`.toLowerCase();
  const hasDecisionSignal = /decide|decision|choose|choice|option|tradeoff|dilemma|fork/.test(context);
  const hasBlockedSignal = /blocked|blocker|stuck|halt|deadlock|impasse|cant|can't|cannot|unable|prevented/.test(context);
  const hasPlanningSignal = /plan|structure|organize|sequence|priority|framework|roadmap|timeline|launch/.test(context);
  const hasExecutionSignal = /execute|implement|build|ship|deploy|deliver|complete|finish|momentum|progress/.test(context);

  if (hasDecisionSignal) {
    return {
      summary: `A decision on ${goal} is pending. Frame the choice clearly and force momentum toward a confident commit.`,
      next_step: 'Define the decision criteria and the single fact that would make the choice obvious.',
      suggested_tasks: [
        'Write the explicit decision criteria and weights for each option',
        'Choose the strongest option and state why it currently leads',
        'Confirm what choosing this option enables next and the risk if it is wrong',
      ],
    };
  }

  if (hasBlockedSignal) {
    return {
      summary: `Progress is blocked on ${goal}. Name the blocker clearly and choose the first unblock move now.`,
      next_step: 'Write the specific blocker and the exact step to remove it.',
      suggested_tasks: [
        'Write the specific blocker and the exact step to remove it',
        'Define what "unblocked" looks like for the next milestone',
        'Capture the one fact that would change the unblock plan',
      ],
    };
  }

  if (hasPlanningSignal) {
    return {
      summary: `Planning is required for ${goal}. Build a clear sequence and ownership so execution is straightforward.`,
      next_step: 'Define the launch sequence and owners for the first milestone.',
      suggested_tasks: [
        'Define the sequence for the first three milestones with clear owners',
        'Establish the timeline and dependencies for the opening phase',
        'Confirm what each milestone unlocks for the next step',
      ],
    };
  }

  if (hasExecutionSignal) {
    return {
      summary: `Execution is underway for ${goal}. Keep momentum by finishing the highest-impact action instead of reopening planning.`,
      next_step: 'Complete the highest-impact remaining action and show a visible proof of progress.',
      suggested_tasks: [
        'Define the top remaining action to complete in the next hour',
        'Finish the cutover prerequisite and remove any lingering blockers',
        'Confirm what finishing this unlocks next and who owns that follow-on step',
      ],
    };
  }

  return {
    summary: `Starting a focused dossier on ${goal}. The initial structure captures what matters most right now, with clear next steps ready for immediate action.`,
    next_step: 'Write the single most important concrete outcome you need to achieve first.',
    suggested_tasks: [
      'Write the specific blocker and the exact step to remove it',
      'Define what "done" looks like for the first milestone',
      'Capture the key fact that would change your approach',
    ],
  };
}

function getGuidanceFallbackResponse(input: AIRequestInput): AIResponseOutput {
  const goal = input.main_goal ?? 'your goal';
  const phase = input.phase ?? 'Understanding';
  const situation = detectSituationType(input);
  const existingTasks = sanitizeTaskList(input.tasks ?? []);
  const primaryExistingTask = existingTasks[0];
  const hasTaskOverload = existingTasks.length >= 5;

  // Situation-aware fallback: BLOCKED situations
  if (situation === 'blocked') {
    if (phase === 'Action') {
      return {
        summary: hasTaskOverload
          ? `Multiple blockers need resolution. Execute the unblock that restores most momentum for ${goal}.`
          : `Execute the unblock immediately for ${goal}. Move through the blocker without hesitation.`,
        next_step: primaryExistingTask
          ? `Complete the unblock for "${primaryExistingTask}" now.`
          : 'Make the single ask or change that clears the blocker.',
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: hasTaskOverload
          ? `Blockers need sequencing for ${goal}. Design an unblock path that addresses dependencies in order.`
          : `The blocker is identified for ${goal}. Design the sequence to remove it—who to ask, what to change.`,
        next_step: primaryExistingTask
          ? `Design the unblock sequence for "${primaryExistingTask}".`
          : 'Make one ask that removes the critical dependency.',
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }
    // Understanding phase for blocked
    return {
      summary: hasTaskOverload
        ? `Multiple blockers compete for attention on ${goal}. Focus on understanding the root cause of the most critical one.`
        : `Progress has stalled on ${goal}. Precisely name what's blocking forward motion, not just symptoms.`,
      next_step: primaryExistingTask
        ? `Analyze why "${primaryExistingTask}" is stuck and what fact would unstick it.`
        : 'Identify the single root cause preventing any progress.',
      suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
    };
  }

  // Situation-aware fallback: DECISION situations
  if (situation === 'decision') {
    if (phase === 'Action') {
      return {
        summary: hasTaskOverload
          ? `Time to commit on ${goal}. Execute the highest-priority decision and define the next concrete move.`
          : `Make the decision on ${goal} and commit. Then execute the first concrete step down that path.`,
        next_step: primaryExistingTask
          ? `Decide on "${primaryExistingTask}" and commit to the next step.`
          : 'Make the choice and define the immediate next action.',
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: hasTaskOverload
          ? `Too many open decisions on ${goal}. Force structure—eliminate weaker options and establish clear criteria.`
          : `Structure the decision on ${goal} by defining criteria and eliminating weak options.`,
        next_step: primaryExistingTask
          ? `Establish the decision criteria for "${primaryExistingTask}".`
          : 'Eliminate one option decisively.',
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }
    // Understanding phase for decision
    return {
      summary: hasTaskOverload
        ? `Multiple decisions compete for attention on ${goal}. Clarify which choice matters most and what information would shift it.`
        : `A significant choice is pending on ${goal}. Frame what's at stake and what single fact would make the decision obvious.`,
      next_step: primaryExistingTask
        ? `Define what information would resolve "${primaryExistingTask}".`
        : 'Identify the one fact that would make the choice clear.',
      suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
    };
  }

  // Situation-aware fallback: UNCLEAR/MESSY situations
  if (situation === 'unclear') {
    if (phase === 'Action') {
      return {
        summary: hasTaskOverload
          ? `Despite the fog around ${goal}, execute through uncertainty. Pick one task and produce tangible data.`
          : `Even messy situations need execution. Identify the one thing that can move despite uncertainty on ${goal}.`,
        next_step: primaryExistingTask
          ? `Complete "${primaryExistingTask}" now to produce concrete data.`
          : 'Define and complete one small action that produces tangible data.',
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: hasTaskOverload
          ? `Chaos on ${goal} needs structure. Create one clear anchor point from the competing investigations.`
          : `The situation around ${goal} has some clarity but needs organization. Establish one concrete boundary or scope.`,
        next_step: primaryExistingTask
          ? `Define what "${primaryExistingTask}" needs before it can move cleanly.`
          : 'Establish one clear anchor point for sequencing.',
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }
    // Understanding phase for unclear (default)
    return {
      summary: hasTaskOverload
        ? `Too many open investigations compete for attention on ${goal}. Reduce uncertainty through one proof point.`
        : `The situation around ${goal} has fog. Name the single most important thread to pull.`,
      next_step: primaryExistingTask
        ? `Use "${primaryExistingTask}" to reduce the biggest unknown now.`
        : 'Identify the one fact that would create most clarity.',
      suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
    };
  }

  // Legacy phase-only fallbacks for situations without specific handling
  if (existingTasks.length > 0) {
    if (phase === 'Action') {
      return {
        summary: `Execution is underway for ${goal}. Stay narrow: push one task forward instead of expanding the plan.`,
        next_step: `Pick one open task and produce a concrete result on it before adding anything new.`,
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }

    if (phase === 'Structuring') {
      return {
        summary: `Work is in motion for ${goal}. Reduce ambiguity around the most important active task so execution gets easier.`,
        next_step: `Write down who owns "${primaryExistingTask}", what "done" means, and what must happen first.`,
        suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
      };
    }

    return {
      summary: `You have started capturing the work around ${goal}. Choose the most useful open task and use it to reduce uncertainty.`,
      next_step: `Use "${primaryExistingTask}" as the first proof point and gather what it tells you.`,
      suggested_tasks: buildSituationAwareSupportingTasks(primaryExistingTask, phase, situation),
    };
  }

  if (phase === 'Action') {
    return {
      summary: `Execution is now the priority for ${goal}. Choose one visible move that proves progress today.`,
      next_step: 'Decide and complete one action that produces a visible, checkable result today.',
      suggested_tasks: buildSituationAwareSupportingTasks(null, phase, situation),
    };
  }

  if (phase === 'Structuring') {
    return {
      summary: `The work around ${goal} has substance but lacks a clear sequence. The gap is between knowing what matters and knowing what happens first.`,
      next_step: 'Turn the current thinking into a simple priority sequence with clear ownership.',
      suggested_tasks: buildSituationAwareSupportingTasks(null, phase, situation),
    };
  }

  return {
    summary: `The situation around ${goal} needs sharper definition. The main risk is moving forward without a clear anchor point.`,
    next_step: 'Identify the biggest unknown and resolve it with one focused fact-finding move.',
    suggested_tasks: buildSituationAwareSupportingTasks(null, phase, situation),
  };
}

function getSafeActionFallback(): AIResponseOutput {
  return {
    summary: 'The requested AI action is not registered, so a safe fallback response was used.',
    next_step: 'Use a supported AI action and try again.',
    suggested_tasks: [
      'Check the requested action name',
      'Retry with a supported AI workflow',
      'Review the current route-to-action mapping',
    ],
  };
}

function shouldSkipProviderCall(input: AIRequestInput): boolean {
  if (input.action !== 'guidance') {
    return false;
  }

  const hasUserInput = Boolean(input.user_input?.trim());
  const hasSituation = Boolean(input.situation?.trim());
  const hasMainGoal = Boolean(input.main_goal?.trim());
  const hasTasks = Boolean(input.tasks?.some((task: string) => task.trim().length > 0));

  // Conservative guard:
  // only skip guidance calls when the request is effectively empty across
  // all meaningful context fields, so valid initial dossier guidance still runs.
  return !hasUserInput && !hasSituation && !hasMainGoal && !hasTasks;
}

function shouldCoalesceRequest(input: AIRequestInput, coalescingEligible: boolean): boolean {
  return coalescingEligible && input.action === 'guidance' && input.triggerType === 'auto';
}

function detectSituationType(input: AIRequestInput): 'unclear' | 'decision' | 'blocked' | 'planning' | 'execution' | 'empty' {
  const context = `${input.situation ?? ''} ${input.user_input ?? ''} ${input.main_goal ?? ''}`.toLowerCase();
  const hasEmptySignal = /start|begin|init|new|blank|empty|from scratch|ground zero/.test(context);
  const hasNoTasks = (input.tasks?.length ?? 0) === 0;
  const hasUnclearSignal = /unclear|messy|fuzzy|fog|unknown|unsure|uncertainty/.test(context);
  
  // Check for blocked/stuck signals first (highest priority)
  if (/block|stuck|halt|deadlock|impasse|cant|can't|cannot|unable|prevented/.test(context)) {
    return 'blocked';
  }
  
  // Check for decision signals
  if (/decide|decision|choose|choice|option|tradeoff|dilemma|fork/.test(context)) {
    return 'decision';
  }

  if (hasUnclearSignal) {
    return 'unclear';
  }
  
  // Check for planning/structuring signals
  if (/plan|structure|organize|sequence|priority|framework|roadmap|timeline/.test(context)) {
    return 'planning';
  }
  
  // Check for active execution signals
  if (/execute|implement|build|ship|deploy|deliver|complete|finish|momentum|progress/.test(context)) {
    return 'execution';
  }
  
  // Check for empty/starting signals (only if nothing else matched)
  if (hasEmptySignal && hasNoTasks) {
    return 'empty';
  }
  
  // Default to unclear/messy
  return 'unclear';
}

function buildLocalDeterministicResponse(
  input: AIRequestInput,
  fallback: AIResponseOutput,
  prompt: string
): AIResponseOutput {
  if (input.action !== 'guidance') {
    return fallback;
  }

  const phase = input.phase ?? 'Understanding';
  const situation = detectSituationType(input);
  const tasks = sanitizeTaskList(input.tasks ?? []);
  const priorityTask = selectPriorityTask(tasks, input);
  const hasMomentumSignal = hasMomentum(input);
  const hasTaskOverload = tasks.length >= 5;

  // Situation + Phase specific responses
  
  // BLOCKED situations
  if (situation === 'blocked') {
    if (phase === 'Understanding') {
      return {
        summary: hasTaskOverload 
          ? `Multiple blockers are competing for attention. Focus on understanding the root cause of the most critical one before attempting fixes.`
          : `Progress has stalled. The most important move right now is to precisely name what's blocking forward motion, not just symptoms.`,
        next_step: priorityTask 
          ? `Analyze why "${priorityTask}" is stuck and what fact would unstick it.`
          : 'Identify the single root cause preventing any progress.',
        suggested_tasks: [
          'Write the specific blocker and when it first appeared',
          'Define what "unblocked" would look like',
          'Name one person who could remove this dependency',
        ],
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: hasTaskOverload
          ? `The blockers need sequencing. Design an unblock path that addresses dependencies in the right order.`
          : `The blocker has been identified. Now design the specific sequence to remove it—who to ask, what to change, what to bypass.`,
        next_step: priorityTask
          ? `Design the unblock sequence for "${priorityTask}".`
          : 'Make one ask that removes the critical dependency.',
        suggested_tasks: [
          'Write the specific ask to remove the blocker',
          'Define what changes if the blocker clears',
          'Name the backup path if the unblock fails',
        ],
      };
    }
    // Action phase for blocked
    return {
      summary: hasTaskOverload
        ? `Time to execute through the blockers. Pick the one unblock that restores most momentum and move decisively.`
        : `Execute the unblock immediately. The blocker has been analyzed and sequenced—now move through it without hesitation.`,
      next_step: priorityTask
        ? `Execute the unblock for "${priorityTask}" now.`
        : 'Make the single ask or change that clears the blocker.',
      suggested_tasks: [
        'Complete the unblock action in the next 30 minutes',
        'Confirm the path is clear after the unblock',
        'Capture what this unblock enables next',
      ],
    };
  }

  // DECISION situations
  if (situation === 'decision') {
    if (phase === 'Understanding') {
      return {
        summary: hasTaskOverload
          ? `Multiple decisions are competing for attention. Clarify which choice matters most and what information would shift it.`
          : `A significant choice is pending. Frame what's at stake and what single fact would make the decision obvious.`,
        next_step: priorityTask
          ? `Define what information would resolve "${priorityTask}".`
          : 'Identify the one fact that would make the choice clear.',
        suggested_tasks: [
          'Write the decision and its stakes precisely',
          'Define what "decided" looks like for each option',
          'Name the single fact that would shift the choice',
        ],
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: hasTaskOverload
          ? `Too many open decisions. Force structure—eliminate weaker options and establish clear criteria for the remaining ones.`
          : `Structure the decision by defining criteria and eliminating weak options. Make the choice framework explicit.`,
        next_step: priorityTask
          ? `Establish the decision criteria for "${priorityTask}".`
          : 'Eliminate one option decisively.',
        suggested_tasks: [
          'Write the decision criteria explicitly',
          'Remove the weakest option with clear rationale',
          'Define who needs to agree to the final choice',
        ],
      };
    }
    // Action phase for decision
    return {
      summary: hasTaskOverload
        ? `Time to commit. Execute the highest-priority decision and immediately define the next concrete move.`
        : `Make the decision and commit. Then immediately execute the first concrete step down that path.`,
      next_step: priorityTask
        ? `Decide on "${priorityTask}" and commit to the next step.`
        : 'Make the choice and define the immediate next action.',
      suggested_tasks: [
        'Commit to one path definitively',
        'Define the first concrete step down that path',
        'Communicate the decision to stakeholders',
      ],
    };
  }

  // EMPTY/STARTING situations
  if (situation === 'empty') {
    if (phase === 'Understanding') {
      return {
        summary: `A blank canvas with no established direction. The priority is creating immediate momentum through the smallest possible first action.`,
        next_step: 'Define one concrete action completable in under 15 minutes.',
        suggested_tasks: [
          'Write the single most important concrete outcome first',
          'Define what "started" looks like visibly',
          'Name the smallest proof-of-life action',
        ],
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: `Early structure matters. Define the first checkpoint and create a container that makes progress trackable.`,
        next_step: 'Establish the first milestone and how to track it.',
        suggested_tasks: [
          'Define the first concrete checkpoint',
          'Set up the tracking mechanism',
          'Name what would prove progress is real',
        ],
      };
    }
    // Action phase for empty
    return {
      summary: `Generate early momentum through visible, completable action. Make the first task feel like an undeniable win.`,
      next_step: 'Complete one concrete action that proves progress is possible.',
      suggested_tasks: [
        'Finish the first small task completely',
        'Capture the result visibly',
        'Define what the next task enables',
      ],
    };
  }

  // EXECUTION situations
  if (situation === 'execution' || phase === 'Action') {
    return {
      summary: hasTaskOverload
        ? `There is visible motion, but execution clutter is diluting focus. Collapse the queue around one task that protects progress most directly.`
        : `Momentum is available. Execute tightly around the strongest active task instead of reopening planning.`,
      next_step: priorityTask ? `Complete "${priorityTask}" now.` : 'Complete one concrete action now.',
      suggested_tasks: [
        'Write the specific result this task must produce',
        'Name the single blocker preventing completion',
        'Confirm what finishing this unlocks next',
      ],
    };
  }

  // PLANNING/STRUCTURING situations
  if (situation === 'planning' || phase === 'Structuring') {
    return {
      summary: hasTaskOverload
        ? `The plan has too many active branches. Force sequence around one task so the structure becomes easier to execute.`
        : `Build the operating structure—ownership, sequence, dependencies. Create one clear anchor point everything else hangs from.`,
      next_step: priorityTask 
        ? `Establish the sequence and dependencies for "${priorityTask}".`
        : 'Establish the priority sequence and owners for the first milestones.',
      suggested_tasks: [
        'Write the priority level of the main task',
        'Define what must happen before it can start',
        'Name who owns the next step explicitly',
      ],
    };
  }

  // UNCLEAR/MESSY situations with full phase coverage
  if (situation === 'unclear') {
    if (phase === 'Understanding') {
      return {
        summary: hasTaskOverload
          ? `There are too many open investigations competing for attention. Reduce uncertainty through one proof point, not by broadening the search.`
          : `The situation has fog. Name the single most important thread to pull and create immediate relief through one small clarification action.`,
        next_step: priorityTask
          ? `Use "${priorityTask}" to reduce the biggest unknown now.`
          : 'Identify the one fact that would create most clarity.',
        suggested_tasks: buildSituationAwareSupportingTasks(priorityTask, phase, situation),
      };
    }
    if (phase === 'Structuring') {
      return {
        summary: hasTaskOverload
          ? `Chaos needs structure. Create one clear anchor point from the competing investigations.`
          : `The situation has some clarity but needs organization. Establish one concrete boundary or scope.`,
        next_step: priorityTask
          ? `Define what "${priorityTask}" needs before it can move cleanly.`
          : 'Establish one clear anchor point for sequencing.',
        suggested_tasks: buildSituationAwareSupportingTasks(priorityTask, phase, situation),
      };
    }
    // Action phase for unclear/messy
    return {
      summary: hasTaskOverload
        ? `Despite the fog, execute through uncertainty. Pick one task and produce tangible data.`
        : `Even messy situations need execution. Identify the one thing that can move despite uncertainty.`,
      next_step: priorityTask
        ? `Complete "${priorityTask}" now to produce concrete data.`
        : 'Define and complete one small action that produces tangible data.',
      suggested_tasks: buildSituationAwareSupportingTasks(priorityTask, phase, situation),
    };
  }

  // Fallback for any unhandled situation+phase combinations
  return {
    summary: hasTaskOverload
      ? `Many open items need focus. Reduce to one concrete action that creates immediate clarity.`
      : `Focus on one clear next step that reduces uncertainty or creates momentum.`,
    next_step: priorityTask
      ? `Complete "${priorityTask}" now.`
      : 'Define and complete one concrete action now.',
    suggested_tasks: buildSituationAwareSupportingTasks(priorityTask, phase, situation),
  };
}

function refineGuidanceOutput(input: AIRequestInput, output: AIResponseOutput): AIResponseOutput {
  if (input.action !== 'guidance') {
    return output;
  }

  const existingTasks = sanitizeTaskList(input.tasks ?? []);
  const situation = detectSituationType(input);
  const completedMomentum = hasMomentum(input);
  const alignedTask = findAlignedTask(output.next_step, existingTasks);
  const alignmentTarget = (situation === 'blocked' || situation === 'decision' || situation === 'unclear' || situation === 'planning') ? null : alignedTask;
  const normalizedNextStep = enforceNextStepRules(
    input,
    alignNextStepToTask(output.next_step, alignmentTarget),
    alignmentTarget,
    completedMomentum
  );
  const normalizedTasks = sanitizeTaskList(output.suggested_tasks)
    .map((task) => enforceConcreteTask(task))
    .filter((task) => normalizeForCompare(task) !== normalizeForCompare(normalizedNextStep))
    .filter((task) => !isGenericTask(task))
    .slice(0, 3);

  const sequencedTasks = orderTasksStrategically(normalizedTasks);

  const improvedTasks = sequencedTasks.length > 0
    ? sequencedTasks
    : buildFallbackSupportTasks(input, normalizedNextStep, alignmentTarget);

  return {
    summary: normalizeSentence(output.summary),
    next_step: normalizedNextStep,
    suggested_tasks: improvedTasks.map((task) => ensureTaskSupportsNextStep(task, normalizedNextStep, alignmentTarget)),
  };
}

function enforceNextStepRules(
  input: AIRequestInput,
  nextStep: string,
  alignedTask: string | null,
  completedMomentum: boolean
): string {
  const fallback = getGuidanceFallbackResponse(input);
  let candidate = normalizeSentence(nextStep);
  let lower = normalizeForCompare(candidate);

  if (!candidate || isWeakGuidancePhrase(lower) || isGenericTask(candidate)) {
    candidate = fallback.next_step;
    lower = normalizeForCompare(candidate);
  }

  candidate = stripOptionalLanguage(candidate);
  candidate = stripGenericLeadIns(candidate);
  candidate = replaceWeakVerbs(candidate);
  candidate = keepSingleAction(candidate);
  candidate = normalizeSentence(candidate);

  if (completedMomentum && !referencesContinuation(candidate, alignedTask)) {
    candidate = alignedTask
      ? `Complete "${alignedTask}" before creating new planning work.`
      : `Complete the highest-impact open action before planning anything new.`;
  } else if (alignedTask && !referencesTask(candidate, alignedTask)) {
    candidate = alignNextStepToTask(candidate, alignedTask);
  }

  if (isWeakGuidancePhrase(normalizeForCompare(candidate)) || isGenericTask(candidate)) {
    candidate = alignedTask
      ? `Complete "${alignedTask}" now.`
      : fallback.next_step;
  }

  if (!hasStrongActionVerb(candidate)) {
    candidate = alignedTask
      ? `Complete "${alignedTask}" now.`
      : `Complete one concrete action now.`;
  }

  return ensureTerminalPunctuation(candidate);
}

function buildFallbackSupportTasks(input: AIRequestInput, nextStep: string, alignedTask: string | null): string[] {
  const existingTasks = sanitizeTaskList(input.tasks ?? []);
  const matchingTask = alignedTask ?? findAlignedTask(nextStep, existingTasks);
  const phase = input.phase ?? 'Understanding';
  const situation = detectSituationType(input);

  if (matchingTask) {
    return buildSituationAwareSupportingTasks(matchingTask, phase, situation);
  }

  return buildSituationAwareSupportingTasks(null, phase, situation);
}

function buildSupportingTasks(task: string, phase: string): string[] {
  if (phase === 'Action') {
    return [
      `Write the specific result "${task}" must produce to be considered complete`,
      `Name the single blocker preventing "${task}" from moving and how to remove it`,
      `Confirm what completing "${task}" unlocks for the next step`,
    ];
  }

  if (phase === 'Structuring') {
    return [
      `Choose the priority level of "${task}" relative to other open work`,
      `Define the scope: what is in and out of bounds for "${task}"`,
      `Write the specific condition that must be true before "${task}" can start`,
    ];
  }

  return [
    `Write the assumption "${task}" is designed to test or validate`,
    `Define what new information "${task}" should produce`,
    `Confirm how completing "${task}" changes the plan or next steps`,
  ];
}

function buildSituationAwareSupportingTasks(
  task: string | null,
  phase: string,
  situation: 'unclear' | 'decision' | 'blocked' | 'planning' | 'execution' | 'empty'
): string[] {
  const taskRef = task ?? 'the priority task';

  // BLOCKED situations: focus on unblocking
  if (situation === 'blocked') {
    if (phase === 'Action') {
      return [
        `Complete the unblock action for "${taskRef}" in the next 30 minutes`,
        `Confirm the path is clear after the unblock`,
        `Capture what this unblock enables next`,
      ];
    }
    if (phase === 'Structuring') {
      return [
        `Write the specific ask to remove the blocker for "${taskRef}"`,
        `Define what changes if the blocker clears`,
        `Name the backup path if the unblock fails`,
      ];
    }
    // Understanding phase
    return [
      `Write the specific blocker and when it first appeared`,
      `Define what "unblocked" would look like`,
      `Name one person who could remove this dependency`,
    ];
  }

  // DECISION situations: focus on forcing choice
  if (situation === 'decision') {
    if (phase === 'Action') {
      return [
        `Commit to one path definitively`,
        `Define the first concrete step down that path`,
        `Communicate the decision to stakeholders`,
      ];
    }
    if (phase === 'Structuring') {
      return [
        `Write the decision criteria explicitly`,
        `Remove the weakest option with clear rationale`,
        `Define who needs to agree to the final choice`,
      ];
    }
    // Understanding phase
    return [
      `Write the decision and its stakes precisely`,
      `Define what "decided" looks like for each option`,
      `Name the single fact that would shift the choice`,
    ];
  }

  // UNCLEAR/MESSY situations: focus on creating clarity
  if (situation === 'unclear') {
    if (phase === 'Action') {
      return [
        `Define the one thing that can move despite uncertainty`,
        `Write what data "${taskRef}" should produce to reduce fog`,
        `Confirm how this result changes the next decision`,
      ];
    }
    if (phase === 'Structuring') {
      return [
        `Write the priority level of "${taskRef}" relative to the chaos`,
        `Define what "${taskRef}" needs before it can move cleanly`,
        `Name who owns the next step explicitly`,
      ];
    }
    // Understanding phase
    return [
      `Write the specific unknown causing the fog`,
      `Define what new information would reduce uncertainty`,
      `Name the smallest step to get that information`,
    ];
  }

  // EMPTY/STARTING situations: focus on first momentum
  if (situation === 'empty') {
    if (phase === 'Action') {
      return [
        `Finish the first small task completely`,
        `Capture the result visibly`,
        `Define what the next task enables`,
      ];
    }
    if (phase === 'Structuring') {
      return [
        `Define the first concrete checkpoint`,
        `Set up the tracking mechanism`,
        `Name what would prove progress is real`,
      ];
    }
    // Understanding phase
    return [
      `Write the single most important concrete outcome first`,
      `Define what "started" looks like visibly`,
      `Name the smallest proof-of-life action`,
    ];
  }

  // PLANNING situations: focus on structure
  if (situation === 'planning') {
    if (phase === 'Action') {
      return [
        `Complete one executable item from the existing plan`,
        `Confirm the plan still matches reality`,
        `Name what completing this unlocks next`,
      ];
    }
    if (phase === 'Structuring') {
      return [
        `Define the priority level of "${taskRef}"`,
        `Write what must happen before "${taskRef}" can start`,
        `Name who owns the next step explicitly`,
      ];
    }
    // Understanding phase
    return [
      `Define the gap between what exists and what's needed`,
      `Name the most important unclear element`,
      `Write what would make sequencing obvious`,
    ];
  }

  // EXECUTION situations: focus on momentum protection
  if (situation === 'execution') {
    return [
      `Write the specific result "${taskRef}" must produce as concrete data`,
      `Name the single blocker preventing completion`,
      `Confirm what finishing this unlocks next`,
    ];
  }

  // Default: use phase-only logic
  return task ? buildSupportingTasks(task, phase) : [
    'Define the most important next step',
    'Write what "done" looks like',
    'Confirm how this changes the plan',
  ];
}

function sanitizeTaskList(tasks: string[]): string[] {
  const seen = new Set<string>();

  return tasks
    .map((task) => normalizeSentence(task))
    .filter((task) => {
      const normalized = normalizeForCompare(task);
      if (!normalized || seen.has(normalized) || isWeakGuidancePhrase(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

function normalizeSentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.endsWith('.') || trimmed.endsWith('?') || trimmed.endsWith('!')
    ? trimmed
    : trimmed;
}

function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase().replace(/[.!?]+$/g, '');
}

function isWeakGuidancePhrase(value: string): boolean {
  return [
    'review the current context',
    'continue with the clearest next action',
    'choose the next concrete step',
    'summarize the current situation',
    'assess the situation',
    'continue working',
    'start by',
    'begin by',
    'you could',
    'you might',
    'consider',
    'review',
    'assess',
  ].some((phrase) => value.includes(phrase));
}

function findAlignedTask(nextStep: string, tasks: string[]): string | null {
  const normalizedStep = normalizeForCompare(nextStep);
  return tasks.find((task) => {
    const normalizedTask = normalizeForCompare(task);
    return normalizedStep.includes(normalizedTask) || normalizedTask.includes(normalizedStep);
  }) ?? null;
}

function selectPriorityTask(tasks: string[], input: AIRequestInput): string | null {
  if (tasks.length === 0) {
    return null;
  }

  const context = `${input.user_input ?? ''} ${input.situation ?? ''} ${input.main_goal ?? ''}`.toLowerCase();
  const scoredTasks = tasks.map((task) => ({
    task,
    score: scoreTaskAgainstContext(task, context),
  }));

  scoredTasks.sort((left, right) => right.score - left.score);
  return scoredTasks[0]?.task ?? tasks[0];
}

function scoreTaskAgainstContext(task: string, context: string): number {
  const taskWords = task
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length >= 4);

  let score = 0;
  for (const word of taskWords) {
    if (context.includes(word)) {
      score += 1;
    }
  }

  if (/define|write|choose|complete|send|confirm|finalize|capture/.test(task.toLowerCase())) {
    score += 1;
  }

  return score;
}

function alignNextStepToTask(nextStep: string, alignedTask: string | null): string {
  if (!alignedTask) {
    return nextStep;
  }

  if (referencesTask(nextStep, alignedTask)) {
    return nextStep;
  }

  return `Complete "${alignedTask}" now.`;
}

function stripOptionalLanguage(value: string): string {
  return value
    .replace(/\b(you could|you might|you may|could|might|may|try to)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripGenericLeadIns(value: string): string {
  return value
    .replace(/^(start by|begin by)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceWeakVerbs(value: string): string {
  return value
    .replace(/\breview\b/gi, 'define')
    .replace(/\bassess\b/gi, 'define')
    .replace(/\bconsider\b/gi, 'choose')
    .replace(/\bexplore\b/gi, 'capture')
    .trim();
}

function keepSingleAction(value: string): string {
  return value.split(/(?:\s+and\s+|\s+then\s+|;)/i)[0].trim();
}

function hasStrongActionVerb(value: string): boolean {
  return /^(define|choose|complete|write|capture|remove|send|finish|clarify|decide|call|draft|confirm|identify|use|list|check|name|group|translate|finalize|analyze|investigate|establish)\b/i.test(value.trim());
}

function hasMomentum(input: AIRequestInput): boolean {
  const userInput = input.user_input?.toLowerCase() ?? '';
  return userInput.includes('completed')
    || userInput.includes('done')
    || userInput.includes('finished')
    || userInput.includes('momentum');
}

function referencesContinuation(value: string, alignedTask: string | null): boolean {
  const lower = normalizeForCompare(value);
  return lower.startsWith('complete ')
    || lower.startsWith('finish ')
    || lower.startsWith('continue ')
    || (alignedTask !== null && referencesTask(value, alignedTask));
}

function referencesTask(value: string, task: string): boolean {
  return normalizeForCompare(value).includes(normalizeForCompare(task));
}

function ensureTerminalPunctuation(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function enforceConcreteTask(task: string): string {
  let candidate = normalizeSentence(task);
  candidate = stripOptionalLanguage(candidate);
  candidate = stripGenericLeadIns(candidate);
  candidate = replaceWeakVerbs(candidate);

  if (!hasStrongActionVerb(candidate)) {
    candidate = `Define ${candidate.charAt(0).toLowerCase()}${candidate.slice(1)}`;
  }

  return candidate;
}

function ensureTaskSupportsNextStep(task: string, nextStep: string, alignedTask: string | null): string {
  if (/unblock/i.test(nextStep)) {
    return task;
  }

  if (/^analyze\b/i.test(nextStep)) {
    return task;
  }

  if (alignedTask && !referencesTask(task, alignedTask) && referencesTask(nextStep, alignedTask)) {
    return enforceConcreteTask(`Define what support "${alignedTask}" needs next`);
  }

  return task;
}

function orderTasksStrategically(tasks: string[]): string[] {
  // Order tasks by strategic priority: clarification → blockers → execution
  const clarificationPattern = /define|clarify|name|identify|choose|write.*what|write.*how/;
  const blockerPattern = /blocker|dependency|remove|unblock|resolve.*issue|clear/;
  const executionPattern = /complete|finish|send|confirm|finalize|capture|create|build|implement/;

  return tasks.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aIsClarification = clarificationPattern.test(aLower);
    const bIsClarification = clarificationPattern.test(bLower);
    const aIsBlocker = blockerPattern.test(aLower);
    const bIsBlocker = blockerPattern.test(bLower);
    const aIsExecution = executionPattern.test(aLower);
    const bIsExecution = executionPattern.test(bLower);

    // Clarification tasks come first (reduce ambiguity)
    if (aIsClarification && !bIsClarification) return -1;
    if (bIsClarification && !aIsClarification) return 1;

    // Blocker-clearing tasks come second (enable movement)
    if (aIsBlocker && !bIsBlocker && !bIsClarification) return -1;
    if (bIsBlocker && !aIsBlocker && !aIsClarification) return 1;

    // Execution tasks come last (produce tangible results)
    if (aIsExecution && !bIsExecution) return 1;
    if (bIsExecution && !aIsExecution) return -1;

    return 0;
  });
}

function isGenericTask(value: string): boolean {
  const normalized = normalizeForCompare(value);
  return [
    'review the context',
    'assess the situation',
    'consider the options',
    'continue working',
    'choose the next step',
    'summarize the current situation',
  ].some((phrase) => normalized.includes(phrase));
}
