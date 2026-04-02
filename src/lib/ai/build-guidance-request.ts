import { type AIRequestInput } from '@/src/lib/ai/types';
import { createGuidanceSession } from '@/src/lib/guidance-session/create-session';
import { buildGuidanceIntentProfile } from '@/src/lib/guidance-session/guidance-decision-envelope';
import {
  type DomainDetectionInput,
  type DomainSecondarySignals,
  type GuidancePrimaryDomain,
  type GuidanceSignalLevel,
} from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';

export interface UniversalGuidanceRequestBody {
  situation?: string;
  main_goal?: string;
  phase?: string;
  tasks?: unknown;
  user_input?: string;
  raw_input?: string;
  triggerType?: AIRequestInput['triggerType'];
  intakeAnswers?: Record<string, unknown>;
  guidanceSessionId?: string;
  detectedDomain?: GuidancePrimaryDomain;
  activeMode?: GuidanceModeId;
  shouldOfferDossier?: boolean;
}

export interface BuiltGuidanceRequest {
  input: AIRequestInput;
  guidanceSessionId: string;
  detectedDomain: GuidancePrimaryDomain;
  activeMode: GuidanceModeId;
  shouldOfferDossier: boolean;
  session: GuidanceSession;
}

export function buildGuidanceRequest(body: UniversalGuidanceRequestBody): BuiltGuidanceRequest {
  const rawInput = normalizeNonEmptyString(body.raw_input) ?? normalizeNonEmptyString(body.user_input);

  if (!rawInput) {
    throw new Error('user_input must be a non-empty string');
  }

  const intakeAnswers = sanitizeIntakeAnswers(body.intakeAnswers);
  const domainDetectionInput = buildIntakeDomainDetectionInput(body, intakeAnswers, rawInput);
  const provisionalDetectedDomain = body.detectedDomain ?? undefined;
  const provisionalActiveMode = body.activeMode ?? undefined;
  const session = createGuidanceSession({
    initialInput: rawInput,
    domainDetectionInput,
    intakeAnswers,
    detectedDomain: provisionalDetectedDomain,
    activeMode: provisionalActiveMode,
    shouldOfferDossier: body.shouldOfferDossier,
    ...(provisionalDetectedDomain && provisionalActiveMode
      ? {
        intentProfile: buildGuidanceIntentProfile({
          initialInput: rawInput,
          intakeAnswers,
          detectedDomain: provisionalDetectedDomain,
          activeMode: provisionalActiveMode,
        }),
      }
      : {}),
  });

  return {
    input: {
      action: 'guidance',
      situation: normalizeNonEmptyString(body.situation) ?? readStringAnswer(intakeAnswers, 'situation') ?? rawInput,
      main_goal: normalizeNonEmptyString(body.main_goal)
        ?? readStringAnswer(intakeAnswers, 'main_goal')
        ?? readStringAnswer(intakeAnswers, 'goal'),
      phase: normalizeNonEmptyString(body.phase) ?? 'Understanding',
      tasks: sanitizeTasks(body.tasks),
      user_input: rawInput,
      triggerType: body.triggerType,
      detectedDomain: session.detectedDomain,
      activeMode: session.activeMode,
      intakeAnswers: session.intakeAnswers,
      guidanceSessionId: normalizeNonEmptyString(body.guidanceSessionId) ?? session.id,
      shouldOfferDossier: session.shouldOfferDossier,
    },
    guidanceSessionId: normalizeNonEmptyString(body.guidanceSessionId) ?? session.id,
    detectedDomain: session.detectedDomain,
    activeMode: session.activeMode,
    shouldOfferDossier: session.shouldOfferDossier,
    session,
  };
}

const HIGH_URGENCY_HINT_TERMS = ['urgent', 'asap', 'immediately', 'today', 'tomorrow', 'right now', 'deadline'] as const;
const MEDIUM_URGENCY_HINT_TERMS = ['soon', 'this week', 'time-sensitive', 'important', 'next step'] as const;
const MULTI_PARTY_HINT_TERMS = [
  'team',
  'manager',
  'partner',
  'client',
  'customer',
  'stakeholder',
  'vendor',
  'colleague',
  'other party',
  'relationship',
] as const;
const EXECUTION_HINT_TERMS = [
  'blocker',
  'blocked',
  'fix',
  'execute',
  'implement',
  'send',
  'ship',
  'complete',
  'draft',
  'approval',
  'handoff',
] as const;
const DOCUMENTATION_HINT_TERMS = [
  'plan',
  'timeline',
  'milestone',
  'sequence',
  'roadmap',
  'track',
  'document',
  'brief',
  'proposal',
  'checklist',
  'resources',
  'constraints',
] as const;
const LOW_INFORMATION_WORD_THRESHOLD = 8;
const STRUCTURED_LOW_INFORMATION_WORD_THRESHOLD = 5;

function buildIntakeDomainDetectionInput(
  body: UniversalGuidanceRequestBody,
  intakeAnswers: Record<string, unknown>,
  rawInput: string
): DomainDetectionInput {
  const normalizedSituation = normalizeNonEmptyString(body.situation);
  const normalizedMainGoal = normalizeNonEmptyString(body.main_goal)
    ?? readStringAnswer(intakeAnswers, 'main_goal')
    ?? readStringAnswer(intakeAnswers, 'goal');
  const normalizedAnswerEntries = Object.entries(intakeAnswers)
    .map(([key, value]) => {
      const normalizedValue = normalizeNonEmptyString(value);
      if (!normalizedValue) {
        return null;
      }

      return `${key.replace(/_/g, ' ')} ${normalizedValue}`;
    })
    .filter((entry): entry is string => Boolean(entry));
  const supportingText = [normalizedSituation, normalizedMainGoal, ...normalizedAnswerEntries]
    .filter((value): value is string => Boolean(value))
    .join(' ');
  const combinedText = [rawInput, supportingText]
    .filter((value): value is string => Boolean(value))
    .join(' ');
  const lowInformation = isLowInformation(rawInput, supportingText);
  const loweredText = combinedText.toLowerCase();

  const hints: Partial<DomainSecondarySignals> = {};
  const urgency = detectSignalLevel(loweredText, HIGH_URGENCY_HINT_TERMS, MEDIUM_URGENCY_HINT_TERMS);
  if (urgency !== 'low') {
    hints.urgency = urgency;
  }

  if (!lowInformation && (hasAnyPhrase(loweredText, MULTI_PARTY_HINT_TERMS) || hasAnyAnswer(intakeAnswers, ['other_party', 'stakes']))) {
    hints.multiParty = true;
  }

  if (!lowInformation && (hasAnyPhrase(loweredText, EXECUTION_HINT_TERMS) || hasAnyAnswer(intakeAnswers, ['blocker', 'attempted', 'impact', 'decision_deadline']))) {
    hints.practicalExecutionNeeded = true;
  }

  if (!lowInformation && (hasAnyPhrase(loweredText, DOCUMENTATION_HINT_TERMS) || hasAnyAnswer(intakeAnswers, ['timeline', 'constraints', 'resources', 'options']))) {
    hints.documentationNeeded = true;
  }

  return {
    text: combinedText,
    hints,
  };
}

function sanitizeIntakeAnswers(intakeAnswers?: Record<string, unknown>): Record<string, unknown> {
  if (!intakeAnswers || typeof intakeAnswers !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(intakeAnswers).filter(([, value]) => value !== undefined)
  );
}

function sanitizeTasks(tasks: unknown): string[] {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .map((task) => (typeof task === 'string' ? normalizeNonEmptyString(task) : null))
    .filter((task): task is string => Boolean(task));
}

function readStringAnswer(
  intakeAnswers: Record<string, unknown>,
  key: string
): string | undefined {
  return normalizeNonEmptyString(intakeAnswers[key]);
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}

function hasAnyAnswer(intakeAnswers: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => normalizeNonEmptyString(intakeAnswers[key]));
}

function hasAnyPhrase(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function detectSignalLevel(
  text: string,
  highTerms: readonly string[],
  mediumTerms: readonly string[]
): GuidanceSignalLevel {
  if (hasAnyPhrase(text, highTerms)) {
    return 'high';
  }

  if (hasAnyPhrase(text, mediumTerms)) {
    return 'medium';
  }

  return 'low';
}

function isLowInformation(rawInput: string, supportingText: string): boolean {
  return wordCount(rawInput) <= LOW_INFORMATION_WORD_THRESHOLD
    && wordCount(supportingText) <= STRUCTURED_LOW_INFORMATION_WORD_THRESHOLD;
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
