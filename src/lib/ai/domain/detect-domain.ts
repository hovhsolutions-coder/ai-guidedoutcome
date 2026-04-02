import {
  type DetectedDomain,
  type DomainDetectionInput,
  type DomainSecondarySignals,
  type GuidancePrimaryDomain,
  type GuidanceSignalLevel,
  type GuidanceSuggestedMode,
} from '@/src/lib/ai/domain/types';

const DOMAIN_KEYWORDS: Record<GuidancePrimaryDomain, readonly string[]> = {
  conflict: [
    'conflict',
    'argument',
    'fight',
    'tension',
    'disagreement',
    'dispute',
    'friction',
    'falling out',
    'clash',
    'misunderstanding',
    'relationship issue',
  ],
  decision: [
    'decide',
    'decision',
    'choose',
    'choice',
    'which option',
    'whether',
    'should i',
    'go with',
    'pick',
    'tradeoff',
    'pros and cons',
  ],
  planning: [
    'plan',
    'planning',
    'roadmap',
    'timeline',
    'organize',
    'structure',
    'sequence',
    'schedule',
    'prioritize',
    'milestone',
    'prepare',
  ],
  emotional: [
    'anxious',
    'anxiety',
    'overwhelmed',
    'upset',
    'hurt',
    'sad',
    'stressed',
    'panic',
    'worried',
    'afraid',
    'angry',
    'burned out',
  ],
  business_financial: [
    'budget',
    'revenue',
    'profit',
    'pricing',
    'cost',
    'financial',
    'invoice',
    'cash flow',
    'investment',
    'sales',
    'forecast',
    'roi',
  ],
  problem_solving: [
    'solve',
    'fix',
    'issue',
    'problem',
    'stuck',
    'blocker',
    'debug',
    'figure out',
    'root cause',
    'why is',
    'how do i fix',
  ],
  quick_question: [
    'quick question',
    'what is',
    'how many',
    'when is',
    'where is',
    'who is',
    'can you tell me',
    'simple question',
  ],
};

const HIGH_URGENCY_TERMS = ['urgent', 'asap', 'immediately', 'today', 'deadline', 'tomorrow', 'right now'] as const;
const MEDIUM_URGENCY_TERMS = ['soon', 'this week', 'time-sensitive', 'important', 'next step'] as const;

const HIGH_STAKES_TERMS = [
  'lawsuit',
  'fired',
  'job',
  'career',
  'money',
  'financial',
  'customer',
  'client',
  'investor',
  'legal',
  'compliance',
  'health',
  'family',
] as const;
const MEDIUM_STAKES_TERMS = ['team', 'project', 'manager', 'partner', 'relationship', 'deadline', 'delivery'] as const;

const MULTI_PARTY_TERMS = [
  'we',
  'they',
  'team',
  'manager',
  'partner',
  'customer',
  'client',
  'stakeholder',
  'vendor',
  'family',
  'friend',
  'colleague',
  'account team',
] as const;

const ONGOING_TERMS = [
  'still',
  'ongoing',
  'for weeks',
  'for months',
  'keeps happening',
  'again',
  'repeatedly',
  'every time',
  'continue',
  'continuing',
] as const;

const EXECUTION_TERMS = [
  'do next',
  'next step',
  'execute',
  'action',
  'implement',
  'fix',
  'send',
  'write',
  'draft',
  'complete',
  'plan of action',
] as const;

const HIGH_EMOTION_TERMS = [
  'devastated',
  'furious',
  'panicking',
  'heartbroken',
  'terrified',
  'ashamed',
  'humiliated',
] as const;
const MEDIUM_EMOTION_TERMS = [
  'stressed',
  'upset',
  'angry',
  'worried',
  'frustrated',
  'hurt',
  'nervous',
  'overwhelmed',
] as const;

const DOCUMENTATION_TERMS = [
  'document',
  'write down',
  'record',
  'evidence',
  'paper trail',
  'summary',
  'proposal',
  'brief',
  'plan',
  'dossier',
  'note',
  'track',
] as const;

const QUICK_ASSIST_MAX_WORDS = 18;

export function detectDomain(input: string | DomainDetectionInput): DetectedDomain {
  const normalizedInput = normalizeInput(input);
  const text = normalizedInput.text;
  const loweredText = text.toLowerCase();

  const secondarySignals = mergeSignals(
    {
      urgency: detectUrgency(loweredText),
      stakeLevel: detectStakeLevel(loweredText),
      multiParty: hasAnyPhrase(loweredText, MULTI_PARTY_TERMS),
      ongoing: hasAnyPhrase(loweredText, ONGOING_TERMS),
      practicalExecutionNeeded: hasAnyPhrase(loweredText, EXECUTION_TERMS),
      emotionalIntensity: detectEmotionalIntensity(loweredText),
      documentationNeeded: hasAnyPhrase(loweredText, DOCUMENTATION_TERMS),
    },
    normalizedInput.hints
  );

  const domainScores = scoreDomains(loweredText, secondarySignals);
  const primaryDomain = selectPrimaryDomain(domainScores, loweredText);
  const suggestedMode = resolveSuggestedMode(primaryDomain, secondarySignals);
  const confidence = calculateConfidence(domainScores, primaryDomain, loweredText);

  return {
    primaryDomain,
    confidence,
    secondarySignals,
    suggestedMode,
    shouldOfferDossier: shouldOfferDossier(primaryDomain, secondarySignals, loweredText),
  };
}

function normalizeInput(input: string | DomainDetectionInput): DomainDetectionInput {
  if (typeof input === 'string') {
    return { text: input };
  }

  return {
    text: input.text,
    hints: input.hints,
  };
}

function scoreDomains(
  loweredText: string,
  secondarySignals: DomainSecondarySignals
): Record<GuidancePrimaryDomain, number> {
  const baseScores = {
    conflict: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.conflict),
    decision: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.decision),
    planning: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.planning),
    emotional: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.emotional),
    business_financial: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.business_financial),
    problem_solving: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.problem_solving),
    quick_question: scoreKeywordMatches(loweredText, DOMAIN_KEYWORDS.quick_question),
  };

  if (secondarySignals.multiParty) {
    baseScores.conflict += 1;
  }

  if (secondarySignals.emotionalIntensity === 'high') {
    baseScores.emotional += 3;
    baseScores.conflict += 1;
  } else if (secondarySignals.emotionalIntensity === 'medium') {
    baseScores.emotional += 1;
  }

  if (secondarySignals.practicalExecutionNeeded) {
    baseScores.problem_solving += 2;
    baseScores.planning += 1;
  }

  if (secondarySignals.documentationNeeded) {
    baseScores.planning += 1;
    baseScores.business_financial += 1;
    baseScores.conflict += 1;
  }

  if (secondarySignals.stakeLevel === 'high') {
    baseScores.decision += 2;
    baseScores.business_financial += 2;
    baseScores.conflict += 1;
  }

  if (looksLikeQuickQuestion(loweredText)) {
    baseScores.quick_question += 3;
  }

  return baseScores;
}

function selectPrimaryDomain(
  scores: Record<GuidancePrimaryDomain, number>,
  loweredText: string
): GuidancePrimaryDomain {
  const entries = Object.entries(scores) as Array<[GuidancePrimaryDomain, number]>;
  entries.sort((left, right) => right[1] - left[1]);

  const [topDomain, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? 0;

  if (topScore === 0) {
    return looksLikeQuickQuestion(loweredText) ? 'quick_question' : 'problem_solving';
  }

  if (topDomain === 'emotional' && secondScore >= topScore && secondScore > 0) {
    return entries.find(([domain]) => domain !== 'emotional')?.[0] ?? 'emotional';
  }

  return topDomain;
}

function calculateConfidence(
  scores: Record<GuidancePrimaryDomain, number>,
  primaryDomain: GuidancePrimaryDomain,
  loweredText: string
): number {
  const entries = Object.entries(scores) as Array<[GuidancePrimaryDomain, number]>;
  entries.sort((left, right) => right[1] - left[1]);
  const topScore = scores[primaryDomain];
  const secondScore = entries.find(([domain]) => domain !== primaryDomain)?.[1] ?? 0;

  if (topScore === 0) {
    return looksLikeQuickQuestion(loweredText) ? 0.55 : 0.5;
  }

  if (topScore >= secondScore + 3) {
    return 0.9;
  }

  if (topScore >= secondScore + 1) {
    return 0.75;
  }

  return 0.62;
}

function resolveSuggestedMode(
  primaryDomain: GuidancePrimaryDomain,
  secondarySignals: DomainSecondarySignals
): GuidanceSuggestedMode {
  switch (primaryDomain) {
    case 'conflict':
      return 'conflict';
    case 'decision':
      return 'decision';
    case 'planning':
      return 'planning';
    case 'quick_question':
      return 'quick_assist';
    case 'problem_solving':
      return 'problem_solver';
    case 'emotional':
      return secondarySignals.ongoing || secondarySignals.practicalExecutionNeeded
        ? 'problem_solver'
        : 'quick_assist';
    case 'business_financial':
      if (secondarySignals.urgency === 'high' || secondarySignals.stakeLevel === 'high') {
        return 'decision';
      }

      return secondarySignals.documentationNeeded ? 'planning' : 'problem_solver';
  }
}

function shouldOfferDossier(
  primaryDomain: GuidancePrimaryDomain,
  secondarySignals: DomainSecondarySignals,
  loweredText: string
): boolean {
  if (primaryDomain === 'quick_question') {
    return false;
  }

  if (wordCount(loweredText) <= QUICK_ASSIST_MAX_WORDS && primaryDomain !== 'planning') {
    return false;
  }

  if (secondarySignals.ongoing || secondarySignals.documentationNeeded) {
    return true;
  }

  if (secondarySignals.stakeLevel === 'high' && secondarySignals.practicalExecutionNeeded) {
    return true;
  }

  return primaryDomain === 'planning' || primaryDomain === 'conflict' || primaryDomain === 'business_financial';
}

function detectUrgency(loweredText: string): GuidanceSignalLevel {
  if (hasAnyPhrase(loweredText, HIGH_URGENCY_TERMS)) {
    return 'high';
  }

  if (hasAnyPhrase(loweredText, MEDIUM_URGENCY_TERMS)) {
    return 'medium';
  }

  return 'low';
}

function detectStakeLevel(loweredText: string): GuidanceSignalLevel {
  if (hasAnyPhrase(loweredText, HIGH_STAKES_TERMS)) {
    return 'high';
  }

  if (hasAnyPhrase(loweredText, MEDIUM_STAKES_TERMS)) {
    return 'medium';
  }

  return 'low';
}

function detectEmotionalIntensity(loweredText: string): GuidanceSignalLevel {
  if (hasAnyPhrase(loweredText, HIGH_EMOTION_TERMS)) {
    return 'high';
  }

  if (hasAnyPhrase(loweredText, MEDIUM_EMOTION_TERMS)) {
    return 'medium';
  }

  return 'low';
}

function mergeSignals(
  baseSignals: DomainSecondarySignals,
  hints?: Partial<DomainSecondarySignals>
): DomainSecondarySignals {
  if (!hints) {
    return baseSignals;
  }

  return {
    urgency: hints.urgency ?? baseSignals.urgency,
    stakeLevel: hints.stakeLevel ?? baseSignals.stakeLevel,
    multiParty: hints.multiParty ?? baseSignals.multiParty,
    ongoing: hints.ongoing ?? baseSignals.ongoing,
    practicalExecutionNeeded: hints.practicalExecutionNeeded ?? baseSignals.practicalExecutionNeeded,
    emotionalIntensity: hints.emotionalIntensity ?? baseSignals.emotionalIntensity,
    documentationNeeded: hints.documentationNeeded ?? baseSignals.documentationNeeded,
  };
}

function scoreKeywordMatches(text: string, keywords: readonly string[]): number {
  let score = 0;

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      score += 1;
    }
  }

  return score;
}

function hasAnyPhrase(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function looksLikeQuickQuestion(text: string): boolean {
  return /^(what|when|where|who|which|can|is|are|do|does)\b/.test(text.trim())
    && wordCount(text) <= QUICK_ASSIST_MAX_WORDS;
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
