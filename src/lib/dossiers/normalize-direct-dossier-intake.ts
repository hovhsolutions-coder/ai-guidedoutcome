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
  const urgency = normalizeOptionalString(input.urgency);
  const involved = normalizeOptionalString(input.involved);
  const blocking = normalizeOptionalString(input.blocking);

  const intake: IntakeData = {
    situation,
    goal,
    urgency: urgency ?? '',
    involved: involved ?? '',
    blocking: blocking ?? '',
  };

  return {
    intake,
    guidanceCompatible: {
      raw_input: buildRawInput(situation, goal, urgency, involved, blocking),
      situation,
      main_goal: goal,
      intakeAnswers: {
        situation,
        main_goal: goal,
        goal,
        ...(urgency ? { urgency } : {}),
        ...(involved ? { involved } : {}),
        ...(blocking ? { blocking } : {}),
      },
    },
  };
}

function buildRawInput(
  situation: string,
  goal: string,
  urgency?: string,
  involved?: string,
  blocking?: string
): string {
  return [
    `Situation: ${situation}`,
    `Goal: ${goal}`,
    `Urgency: ${urgency ?? 'Not provided'}`,
    `Involved: ${involved ?? 'Not provided'}`,
    `Blocking: ${blocking ?? 'Not provided'}`,
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
