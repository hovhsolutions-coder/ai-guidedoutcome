import { AIRequestInput, AITrainerRequestInput } from './types';

export function buildGuidancePrompt(input: AIRequestInput): string {
  const tasks = input.tasks && input.tasks.length > 0
    ? input.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')
    : 'None';
  const taskCount = input.tasks?.length ?? 0;
  const triggerInstruction = getGuidanceTriggerInstruction(input);
  const userIntent = input.user_input?.trim() || 'Provide guidance for this dossier.';
  const universalContext = buildUniversalGuidanceContext(input);
  const crossDossierContext = buildCrossDossierContext(input);

  return `You are a strategic AI guide operating within a dossier system.
Your job is to reduce hesitation, sharpen decisions, and turn the dossier into forward motion.

Return valid JSON in this exact format:
{
  "summary": "Brief diagnosis that matches the situation type: for messy situations name the fog and the thread to pull; for decisions frame the choice and stakes; for blocked situations name the blocker; for execution name the momentum and risk. Keep it concrete and specific.",
  "next_step": "One immediate, concrete next move matched to situation type: clarity-seeking for messy, decisive for decisions, unblocking for stuck, anchoring for planning, protective for execution, momentum-creating for empty. Written as a directive sentence.",
  "suggested_tasks": ["2-3 small, concrete enabling steps that make the next move easier—first step should be the smallest possible action to start momentum, matched to situation type"],
  "situationType": "One of: unclear, decision, blocked, planning, execution, empty—based on the user's situation"
}

Guidance rules:
- Be decisive. Do not give multiple competing next steps.
- The summary must name the real situation explicitly, not describe generic patterns.
- The next_step must describe the single best move to do now, not a vague aspiration.
- next_step must contain one action only.
- next_step must be executable immediately.
- next_step must use a strong action verb such as "define", "choose", "complete", "write", "capture", "remove", or "send".
- Do not use weak verbs like "review", "assess", "consider", or "explore" unless they are converted into a concrete action.
- Do not use optional language such as "could", "might", "may", or "try to".
- Do not use generic lead-ins such as "start by", "begin by", or "you could".
- Prefer actions that create momentum within the current phase.
- If tasks already exist, align with them before inventing new work.
- If an existing task matches the right move, reference that task explicitly in next_step.
- If progress already exists, force continuation of execution instead of more planning.
- suggested_tasks must support or de-risk the next_step, not restate it.
- Every suggested task must be a small, concrete action that enables the next_step.
- Tasks should feel like sequential steps, not high-level planning activities.
- The first task must be the smallest meaningful move to start momentum immediately.
- Each task should produce a tangible result that makes the following task easier.
- Prefer tasks that take 5-15 minutes to complete, not multi-hour activities.
- Avoid generic phrases like "review the context", "continue working", or "assess the situation" unless they are made specific.
- When the user seems stuck, reduce the decision to the smallest meaningful move.
- Keep language product-facing and calm, not consultant jargon.
- Output JSON only.
${crossDossierContext}
Situation type guidance (adapt your response based on the user's context and current phase):

- UNCLEAR/MESSY situations:
  * In Understanding phase: Acknowledge the fog without amplifying anxiety. Name the single most important thread to pull. Next step should be a small clarification action that creates immediate relief.
  * In Structuring phase: The user has some clarity but needs to organize it. Focus on creating one clear anchor point from the chaos. Next step should establish a concrete boundary or scope.
  * In Action phase: Even messy situations need execution when the moment is right. Identify the one thing that can move despite the uncertainty. Next step should be a small, safe experiment that produces tangible data.

- DECISION situations:
  * In Understanding phase: Frame the decision crisply—what's at stake and what matters most. Surface the key tradeoffs without forcing premature closure. Next step should gather one key fact that would shift the choice.
  * In Structuring phase: Force structure onto the decision—define criteria, eliminate weaker options, sequence the choice. Next step should eliminate one option or establish a clear decision framework.
  * In Action phase: Time to decide and commit. Push for concrete choice and immediate next move. Next step should force a specific choice or make one decisive action that commits the path.

- BLOCKED/STUCK situations:
  * In Understanding phase: Name the blocker precisely without judgment. Focus on understanding the root cause, not just symptoms. Next step should gather one key fact about why progress halted.
  * In Structuring phase: Design the unblock—who to ask, what to change, how to remove the dependency. Next step should make one ask or remove one dependency.
  * In Action phase: Execute the unblock immediately. The blocker has been identified and sequenced—now move through it. Next step should be the smallest unblock action that restores momentum.

- PLANNING/STRUCTURING situations:
  * In Understanding phase: Clarify what needs sequencing before building the sequence. Define the gap between what exists and what's needed. Next step should name the most important unclear element.
  * In Structuring phase: Build the operating structure—ownership, sequence, dependencies. Create one clear anchor point that everything else can hang from. Next step should establish priority or resolve one key dependency.
  * In Action phase: Execute the plan without over-planning. Protect progress by completing concrete items. Next step should be one executable action from the existing structure.

- ACTIVE EXECUTION situations:
  * In Understanding phase: Reflect on momentum—what's working and what could derail progress. Name the risk before it becomes a problem. Next step should verify one key assumption about the current path.
  * In Structuring phase: Optimize the execution flow—remove friction, hand off work, clarify ownership. Next step should remove one blocker to smoother execution.
  * In Action phase: Protect and extend momentum. Complete, verify, or hand off concrete items. Next step should protect progress by finishing one critical item.

- EMPTY/STARTING situations:
  * In Understanding phase: Describe the blank canvas positively. Create immediate direction through the smallest possible first action. Next step should be completable in under 15 minutes.
  * In Structuring phase: Build initial structure—define the first milestone, set up tracking, create the container. Next step should establish one clear checkpoint or setup element.
  * In Action phase: Generate early momentum through visible, completable action. Make the first task feel like a win. Next step should be a concrete completion that proves progress is possible.

Scenario guidance:
${triggerInstruction}
${universalContext}

Situation: ${input.situation ?? 'Not provided'}
Main Goal: ${input.main_goal ?? 'Not provided'}
Phase: ${input.phase ?? 'Understanding'}
Existing Task Count: ${taskCount}
Existing Tasks:
${tasks}
User Input: ${userIntent}`;
}

export function buildCreateDossierPrompt(input: AIRequestInput): string {
  const universalContext = buildUniversalGuidanceContext(input);

  return `You are helping create a dossier foundation that will serve as a working system for action.

Your output will become the initial structure of a new dossier. Make it feel intentional, concrete, and ready for real use—not like a placeholder.

Return valid JSON in this exact format:
{
  "summary": "A clear, specific description of the situation that names the core challenge or opportunity in concrete terms. Avoid generic phrasing like 'complex situation' or 'multiple factors.'",
  "next_step": "The single most important concrete action to move this forward right now. Use a strong action verb (define, choose, complete, write, capture, confirm, finalize).",
  "suggested_tasks": ["2-3 small, concrete enabling steps in strategic order—first task should be the smallest action that starts momentum, each task makes the next easier"]
}

Create-dossier rules:
- The summary should read like a strong operator wrote it: specific, grounded, action-oriented.
- For starting/empty situations, frame the summary as a clear mission statement that creates immediate direction.
- next_step must be immediately executable and describe one concrete outcome.
- suggested_tasks must each produce a tangible result, not vague exploration.
- Tasks should be small, concrete steps—not high-level planning activities.
- The first task must be immediately actionable (5-15 minutes) to create early momentum.
- Each task should enable the next task, forming a clear execution sequence.
- Tasks should feel like "do this, then this, then this"—not a flat list of topics to think about.
- **Task sequence matters**: Order tasks so each one unlocks the next. First task should clarify or unblock; subsequent tasks build momentum.
- Avoid: 'review', 'assess', 'explore', 'consider'—unless forced into concrete action.
- Avoid: filler language like 'understand better' or 'gather more information' without stating what decision it enables.
- Prefer: tasks that create clarity through action, not through more analysis.

${universalContext}

Situation: ${input.situation ?? 'Not provided'}
Main Goal: ${input.main_goal ?? 'Not provided'}
User Input: ${input.user_input ?? 'Create an initial dossier foundation.'}`;
}

export function buildPrompt(input: AIRequestInput): string {
  return input.action === 'create_dossier'
    ? buildCreateDossierPrompt(input)
    : buildGuidancePrompt(input);
}

export function buildTrainerPrompt(input: AITrainerRequestInput): string {
  const tasks = input.tasks && input.tasks.length > 0
    ? input.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')
    : 'None';

  return `You are a specialist trainer inside a dossier-based mission-control product.
You are not the main guidance engine. You provide a secondary specialist perspective that sharpens the current mission.

Trainer perspective: ${input.trainer}

Return valid JSON in this exact format:
{
  "focus_label": "Short label for the type of specialist focus",
  "headline": "Short specialist framing",
  "key_insight": "What this trainer sees right now",
  "recommendation": "The main recommendation from this trainer",
  "next_move": "One concrete action from this trainer's perspective",
  "support_points": ["2-3 specific supporting points"],
  "caution": "Optional caution note when the trainer sees a risk worth protecting against",
  "message_draft": "Optional short message draft when the communication trainer can help phrase the move cleanly",
  "confidence_label": "high | medium | guarded"
}

Trainer rules:
- Keep the dossier central and the recommendation serious and concise.
- next_move must be one action only, immediately usable, and specific.
- recommendation should clarify why this perspective matters now.
- support_points must strengthen, challenge, or operationalize the current objective.
- Use caution only when it materially improves judgment, especially for risk.
- Do not behave like a chatbot or persona.
- Strategy trainer: sharpen direction, leverage, framing, tradeoffs, and sequence. Sound like mission steering, not task management.
- Execution trainer: operationalize the current objective into immediate movement, friction reduction, and concrete sequence. Sound like getting work moving now.
- Risk trainer: surface the main watchpoint, exposure, verification step, or protective adjustment without becoming alarmist. Sound like controlled caution.
- Communication trainer: help phrase the current decision, next move, or alignment message clearly and professionally. Anchor to the current objective, current guidance next step, and likely stakeholder context. Preserve position while reducing friction. Sound like strategic communication support inside a live dossier, not generic copywriting or polite writing assistance.
- For the communication trainer, prefer outputs that clarify:
  - who needs to receive the message,
  - what decision, ask, boundary, or alignment point must be communicated,
  - what position must be preserved while communicating.
- For the communication trainer, avoid broad advice like "be clear", "be concise", or "keep the tone professional" unless tied to the actual dossier decision or stakeholder.
- The trainers must feel meaningfully different in angle, not just in wording.
- Use message_draft only for the communication trainer when a short, usable phrasing example would materially help the user communicate the current move, boundary, or positioning clearly.
- Output JSON only.

Situation: ${input.situation ?? 'Not provided'}
Main Goal: ${input.main_goal ?? 'Not provided'}
Phase: ${input.phase ?? 'Understanding'}
Current Objective: ${input.current_objective ?? 'Not provided'}
Current Guidance Next Step: ${input.guidance_next_step ?? 'Not provided'}
Existing Tasks:
${tasks}`;
}

function getGuidanceTriggerInstruction(input: AIRequestInput): string {
  if (input.triggerType === 'auto') {
    if ((input.tasks?.length ?? 0) === 0) {
      return '- This is an automatic read for a dossier without tasks yet. Create a clear first execution foothold.';
    }

    return '- This is an automatic refresh. Re-anchor the user on the single best next move based on the current task list.';
  }

  if (input.triggerType === 'quick_action') {
    return '- The user asked for a quick directional steer. Respond with a sharper decision than they could make alone.';
  }

  return '- The user is actively refining the plan. Use their input to clarify the next decision, risk, or leverage point.';
}

function buildUniversalGuidanceContext(input: AIRequestInput): string {
  const hasUniversalContext = Boolean(
    input.detectedDomain
    || input.activeMode
    || input.guidanceSessionId
    || input.shouldOfferDossier !== undefined
    || hasIntakeAnswers(input.intakeAnswers)
  );

  if (!hasUniversalContext) {
    return '';
  }

  const intakeAnswers = formatIntakeAnswers(input.intakeAnswers);

  return `

Universal guidance context:
- This request may come from a lightweight guidance session above dossiers, not only from a dossier-first workflow.
- Detected domain: ${input.detectedDomain ?? 'Not provided'}
- Active mode: ${input.activeMode ?? 'Not provided'}
- Guidance session id: ${input.guidanceSessionId ?? 'Not provided'}
- Should offer dossier: ${formatBooleanFlag(input.shouldOfferDossier)}
- Intake answers:
${intakeAnswers}

Universal guidance rules:
- Keep the same output contract exactly.
- Use the active mode and detected domain to shape emphasis, not to change the response format.
- If this is an early universal guidance session, do not assume a full dossier already exists.
- Prefer crisp structured guidance that can stand alone before dossier creation.
- If shouldOfferDossier is true, favor guidance that could later convert cleanly into a dossier thread without saying so explicitly unless the user asks.
`;
}

function hasIntakeAnswers(intakeAnswers?: Record<string, unknown>): boolean {
  return Boolean(intakeAnswers && Object.keys(intakeAnswers).length > 0);
}

function formatIntakeAnswers(intakeAnswers?: Record<string, unknown>): string {
  if (!intakeAnswers || Object.keys(intakeAnswers).length === 0) {
    return '- None';
  }

  return Object.entries(intakeAnswers)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `- ${key}: ${formatIntakeValue(value)}`)
    .join('\n');
}

function formatIntakeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim() || 'Not provided';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const normalized = value.map((item) => formatIntakeValue(item)).filter((item) => item.length > 0);
    return normalized.length > 0 ? normalized.join(', ') : 'Not provided';
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return 'Not provided';
}

function buildCrossDossierContext(input: AIRequestInput): string {
  if (!input.completedDossiers || input.completedDossiers.length === 0) {
    return '';
  }

  // Sort by relevance score (descending) for context ordering
  const sortedDossiers = [...input.completedDossiers].sort(
    (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
  );

  const dossierList = sortedDossiers
    .map((d) => {
      const score = d.relevanceScore ?? 0;
      // Show score for high-relevance items, include outcome summary when available
      const scoreHint = score > 50 ? ` [${score}% match]` : '';
      const outcomeHint = d.outcomeSummary ? ` → ${d.outcomeSummary}` : '';
      // Include task patterns if available (operational precedents)
      const taskHint = d.taskPatterns && d.taskPatterns.length > 0
        ? ` | Tasks: ${d.taskPatterns.slice(0, 3).join(', ')}${d.taskPatterns.length > 3 ? '...' : ''}`
        : '';
      return `- ${d.title}: ${d.main_goal}${scoreHint}${outcomeHint}${taskHint}`;
    })
    .join('\n');

  const highRelevanceCount = sortedDossiers.filter((d) => (d.relevanceScore ?? 0) > 50).length;

  return `
Cross-dossier reference context:
The user has ${sortedDossiers.length} completed dossier(s) available as potential precedents:
${dossierList}

${highRelevanceCount > 0 ? `${highRelevanceCount} dossier(s) show strong topical similarity (>50% match).` : 'No dossiers show strong topical similarity to the current work.'}

Precedent usage rules (follow strictly):
- DEFAULT: Do NOT reference completed dossiers unless there is a clear, specific parallel that genuinely illuminates the current situation
- Only reference precedents with >50% match scores AND a clear operational parallel to the current task or decision
- Direct execution advice based on the current dossier context is always primary—precedent is supplementary only
- When you do reference precedent, be specific: name the exact approach, task sequence, or outcome that applies
- Generic references like "similar to your previous work" or "as you did before" are prohibited—always specify what exactly applies
- If no clear parallel exists, ignore the completed dossiers completely and focus solely on the current situation
- Never mention precedent just to show awareness—only when it provides actionable insight the user wouldn't have otherwise
`;
}

function formatBooleanFlag(value: boolean | undefined): string {
  if (value === undefined) {
    return 'Not provided';
  }

  return value ? 'Yes' : 'No';
}
