import { type IntakeData } from '@/src/types/ai';

export interface NormalizedDirectDossierIntake {
  intake: IntakeData;
  guidanceCompatible: {
    raw_input: string;
    situation: string;
    main_goal: string;
    intakeAnswers: Record<string, string>;
  };
}

export function normalizeDirectDossierIntake(input: IntakeData): NormalizedDirectDossierIntake {
  const situation = normalizeRequiredString(input.situation);
  const goal = normalizeRequiredString(input.goal);
  const category = normalizeOptionalString(input.category);
  const timeline = normalizeOptionalString(input.timeline);
  const attentionNow = normalizeOptionalString(input.attentionNow);
  const painPoints = normalizeOptionalString(input.painPoints);
  const biggestFriction = normalizeOptionalString(input.biggestFriction);
  const impactIfUnresolved = normalizeOptionalString(input.impactIfUnresolved);
  const shortTermOutcome = normalizeOptionalString(input.shortTermOutcome);
  const longTermOutcome = normalizeOptionalString(input.longTermOutcome);
  const triedAlready = normalizeOptionalString(input.triedAlready);
  const supportAlreadyUsed = normalizeOptionalString(input.supportAlreadyUsed);
  const urgency = normalizeOptionalString(input.urgency);
  const involved = normalizeOptionalString(input.involved);
  const blocking = normalizeOptionalString(input.blocking);
  const constraints = normalizeOptionalString(input.constraints);
  const resources = normalizeOptionalString(input.resources);
  const emotionalState = normalizeOptionalString(input.emotionalState);
  const supportStyle = normalizeOptionalString(input.supportStyle);
  const coachStyle = normalizeOptionalString(input.coachStyle);
  const firstPriority = normalizeOptionalString(input.firstPriority);
  const nonNegotiable = normalizeOptionalString(input.nonNegotiable);
  const costSignals = Array.isArray(input.costSignals)
    ? input.costSignals
      .map((area) => normalizeOptionalString(area))
      .filter((area): area is string => Boolean(area))
    : [];
  const impactAreas = Array.isArray(input.impactAreas)
    ? input.impactAreas
      .map((area) => normalizeOptionalString(area))
      .filter((area): area is string => Boolean(area))
    : [];

  const intake: IntakeData = {
    situation,
    goal,
    urgency: urgency ?? '',
    involved: involved ?? '',
    blocking: blocking ?? '',
    ...(category ? { category } : {}),
    ...(timeline ? { timeline } : {}),
    ...(attentionNow ? { attentionNow } : {}),
    ...(painPoints ? { painPoints } : {}),
    ...(biggestFriction ? { biggestFriction } : {}),
    ...(costSignals.length > 0 ? { costSignals } : {}),
    ...(impactAreas.length > 0 ? { impactAreas } : {}),
    ...(impactIfUnresolved ? { impactIfUnresolved } : {}),
    ...(shortTermOutcome ? { shortTermOutcome } : {}),
    ...(longTermOutcome ? { longTermOutcome } : {}),
    ...(triedAlready ? { triedAlready } : {}),
    ...(supportAlreadyUsed ? { supportAlreadyUsed } : {}),
    ...(constraints ? { constraints } : {}),
    ...(resources ? { resources } : {}),
    ...(emotionalState ? { emotionalState } : {}),
    ...(supportStyle ? { supportStyle } : {}),
    ...(coachStyle ? { coachStyle } : {}),
    ...(firstPriority ? { firstPriority } : {}),
    ...(nonNegotiable ? { nonNegotiable } : {}),
  };

  return {
    intake,
    guidanceCompatible: {
      raw_input: buildRawInput(intake),
      situation,
      main_goal: goal,
      intakeAnswers: {
        ...(category ? { category } : {}),
        situation,
        main_goal: goal,
        goal,
        ...(timeline ? { timeline } : {}),
        ...(attentionNow ? { attention_now: attentionNow } : {}),
        ...(painPoints ? { pain_points: painPoints } : {}),
        ...(biggestFriction ? { biggest_friction: biggestFriction } : {}),
        ...(costSignals.length > 0 ? { cost_signals: costSignals.join(', ') } : {}),
        ...(impactAreas.length > 0 ? { impact_areas: impactAreas.join(', ') } : {}),
        ...(impactIfUnresolved ? { impact_if_unresolved: impactIfUnresolved } : {}),
        ...(shortTermOutcome ? { short_term_outcome: shortTermOutcome } : {}),
        ...(longTermOutcome ? { long_term_outcome: longTermOutcome } : {}),
        ...(triedAlready ? { tried_already: triedAlready } : {}),
        ...(supportAlreadyUsed ? { support_already_used: supportAlreadyUsed } : {}),
        ...(urgency ? { urgency } : {}),
        ...(involved ? { involved } : {}),
        ...(blocking ? { blocker: blocking, blocking } : {}),
        ...(constraints ? { constraints } : {}),
        ...(resources ? { resources } : {}),
        ...(emotionalState ? { emotional_state: emotionalState } : {}),
        ...(supportStyle ? { support_style: supportStyle } : {}),
        ...(coachStyle ? { coach_style: coachStyle } : {}),
        ...(firstPriority ? { first_priority: firstPriority } : {}),
        ...(nonNegotiable ? { non_negotiable: nonNegotiable } : {}),
      },
    },
  };
}

function buildRawInput(intake: IntakeData): string {
  return [
    `Situation: ${intake.situation}`,
    `Goal: ${intake.shortTermOutcome ?? intake.goal}`,
    `Category: ${intake.category ?? 'Not provided'}`,
    `Timeline: ${intake.timeline ?? 'Not provided'}`,
    `Attention now: ${intake.attentionNow ?? 'Not provided'}`,
    `Urgency: ${intake.urgency ?? 'Not provided'}`,
    `Pain points: ${intake.painPoints ?? 'Not provided'}`,
    `Biggest friction: ${intake.biggestFriction ?? 'Not provided'}`,
    `Cost signals: ${intake.costSignals?.join(', ') ?? 'Not provided'}`,
    `Impact if unresolved: ${intake.impactIfUnresolved ?? 'Not provided'}`,
    `Impact areas: ${intake.impactAreas?.join(', ') ?? 'Not provided'}`,
    `Tried already: ${intake.triedAlready ?? 'Not provided'}`,
    `Support already used: ${intake.supportAlreadyUsed ?? 'Not provided'}`,
    `Involved: ${intake.involved ?? 'Not provided'}`,
    `Blocking: ${intake.blocking ?? 'Not provided'}`,
    `Constraints: ${intake.constraints ?? 'Not provided'}`,
    `Resources: ${intake.resources ?? 'Not provided'}`,
    `Support style: ${intake.supportStyle ?? 'Not provided'}`,
    `Coach style: ${intake.coachStyle ?? 'Not provided'}`,
    `First priority: ${intake.firstPriority ?? 'Not provided'}`,
    `Non-negotiable: ${intake.nonNegotiable ?? 'Not provided'}`,
  ].join('\n');
}

function normalizeRequiredString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}
