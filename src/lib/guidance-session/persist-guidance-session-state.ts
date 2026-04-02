import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AIResponseOutput, type AITrainerId } from '@/src/lib/ai/types';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';

export const GUIDANCE_SESSION_STORAGE_VERSION = 1;
export const GUIDANCE_SESSION_STORAGE_KEY = 'ai-guided-outcome.guidance-session.v1';
export const GUIDANCE_SESSION_STORAGE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

// Supported versions for backward compatibility
const SUPPORTED_VERSIONS = [1];
const MAX_SUPPORTED_VERSION = Math.max(...SUPPORTED_VERSIONS);

export interface PersistedGuidanceShellState {
  version: typeof GUIDANCE_SESSION_STORAGE_VERSION;
  savedAt: number;
  rawInput: string;
  situation: string;
  mainGoal: string;
  selectedMode: 'auto' | GuidanceModeId;
  intakeAnswers: Record<string, string>;
  result: AIResponseOutput | null;
  resultMeta: {
    detectedDomain: GuidancePrimaryDomain;
    activeMode: GuidanceModeId;
    shouldOfferDossier: boolean;
  } | null;
  guidanceSession: GuidanceSession | null;
  activeTrainer: AITrainerId | null;
  generationCount: number;
  lastGeneratedAt: string | null;
}

export type PersistedGuidanceShellStateInput = Omit<
  PersistedGuidanceShellState,
  'version' | 'savedAt'
>;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadPersistedGuidanceShellState(
  storage: StorageLike,
  now = Date.now()
): PersistedGuidanceShellState | null {
  const raw = storage.getItem(GUIDANCE_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = parsePersistedGuidanceShellState(JSON.parse(raw));

    if (!parsed || !isPersistedGuidanceShellStateFresh(parsed, now)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedGuidanceShellState(
  storage: StorageLike,
  state: PersistedGuidanceShellStateInput,
  now = Date.now()
): { success: boolean; quotaExceeded?: boolean } {
  const parsed = parsePersistedGuidanceShellState({
    ...state,
    version: GUIDANCE_SESSION_STORAGE_VERSION,
    savedAt: now,
  });

  if (!parsed) {
    return { success: false };
  }

  try {
    storage.setItem(GUIDANCE_SESSION_STORAGE_KEY, JSON.stringify(parsed));
    return { success: true };
  } catch (error) {
    // Handle localStorage quota exceeded gracefully
    if (isQuotaExceededError(error)) {
      console.log('[guidance:persist:quota_exceeded] clearing old state and retrying');
      try {
        // Clear and retry once
        storage.removeItem(GUIDANCE_SESSION_STORAGE_KEY);
        storage.setItem(GUIDANCE_SESSION_STORAGE_KEY, JSON.stringify(parsed));
        return { success: true };
      } catch {
        return { success: false, quotaExceeded: true };
      }
    }
    return { success: false };
  }
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // QuotaExceededError is thrown when localStorage is full
  return error.name === 'QuotaExceededError' || 
    (typeof error.message === 'string' && error.message.includes('quota'));
}

export function clearPersistedGuidanceShellState(storage: StorageLike): void {
  storage.removeItem(GUIDANCE_SESSION_STORAGE_KEY);
}

export function clearPersistedGuidanceShellStateFromBrowser(): void {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  clearPersistedGuidanceShellState(storage);
}

export function parsePersistedGuidanceShellState(value: unknown): PersistedGuidanceShellState | null {
  if (!isRecord(value)) {
    return null;
  }

  // Handle missing version (treat as v1 for backward compatibility)
  const version = typeof value.version === 'number' ? value.version : 1;

  // Unknown version: reject both too old and too new for safety
  if (!SUPPORTED_VERSIONS.includes(version)) {
    console.log(`[guidance:persist:unsupported_version] v${version}, rejecting`);
    return null;
  }

  // Partial/older shape handling: safe defaults for missing fields
  const savedAt = typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
    ? value.savedAt
    : Date.now();

  const rawInput = typeof value.rawInput === 'string' ? value.rawInput : '';
  const situation = typeof value.situation === 'string' ? value.situation : '';
  const mainGoal = typeof value.mainGoal === 'string' ? value.mainGoal : '';

  // Validate or default selectedMode
  const selectedMode = isSelectedMode(value.selectedMode)
    ? value.selectedMode
    : 'auto';

  // Validate or default intakeAnswers
  const intakeAnswers = isStringRecord(value.intakeAnswers)
    ? value.intakeAnswers
    : {};

  // Validate or null result
  const result = isNullableAIResponseOutput(value.result)
    ? value.result
    : null;

  // Validate or null resultMeta
  const resultMeta = isNullableResultMeta(value.resultMeta)
    ? value.resultMeta
    : null;

  // Validate or null guidanceSession
  const guidanceSession = isNullableGuidanceSession(value.guidanceSession)
    ? value.guidanceSession
    : null;

  // Validate or null activeTrainer
  const activeTrainer = isNullableAITrainerId(value.activeTrainer)
    ? value.activeTrainer
    : null;

  // Validate or default generationCount
  const generationCount = typeof value.generationCount === 'number' && Number.isFinite(value.generationCount)
    ? value.generationCount
    : 0;

  // Validate or null lastGeneratedAt
  const lastGeneratedAt = isNullableString(value.lastGeneratedAt)
    ? value.lastGeneratedAt
    : null;

  return {
    version: GUIDANCE_SESSION_STORAGE_VERSION, // Normalize to current version
    savedAt,
    rawInput,
    situation,
    mainGoal,
    selectedMode,
    intakeAnswers,
    result,
    resultMeta,
    guidanceSession,
    activeTrainer,
    generationCount,
    lastGeneratedAt,
  };
}

export function isPersistedGuidanceShellStateFresh(
  state: PersistedGuidanceShellState,
  now = Date.now()
): boolean {
  return now - state.savedAt <= GUIDANCE_SESSION_STORAGE_MAX_AGE_MS;
}

function isNullableAIResponseOutput(value: unknown): value is AIResponseOutput | null {
  return value === null || (
    isRecord(value)
    && typeof value.summary === 'string'
    && typeof value.next_step === 'string'
    && Array.isArray(value.suggested_tasks)
    && value.suggested_tasks.every((item) => typeof item === 'string')
  );
}

function isNullableResultMeta(
  value: unknown
): value is PersistedGuidanceShellState['resultMeta'] {
  return value === null || (
    isRecord(value)
    && typeof value.detectedDomain === 'string'
    && typeof value.activeMode === 'string'
    && typeof value.shouldOfferDossier === 'boolean'
  );
}

function isNullableGuidanceSession(value: unknown): value is GuidanceSession | null {
  return value === null || (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.initialInput === 'string'
    && typeof value.detectedDomain === 'string'
    && typeof value.activeMode === 'string'
    && isRecord(value.intakeAnswers)
    && typeof value.shouldOfferDossier === 'boolean'
    && typeof value.createdAt === 'string'
  );
}

function isSelectedMode(value: unknown): value is PersistedGuidanceShellState['selectedMode'] {
  return value === 'auto' || typeof value === 'string';
}

function isNullableAITrainerId(value: unknown): value is AITrainerId | null {
  return value === null || typeof value === 'string';
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}
