export type CoachId =
  | 'mindset'
  | 'business'
  | 'legal-structure'
  | 'finance'
  | 'health-balance'
  | 'relationship-family'
  | 'career'
  | 'practical-life';

export interface CoachProfile {
  id: CoachId;
  name: string;
  category: string;
  tagline: string;
  firstStep: string;
  helpsWith: string[];
}

const COACH_CATALOG: CoachProfile[] = [
  {
    id: 'mindset',
    name: 'Mindset Coach',
    category: 'Mindset',
    tagline: 'Turns overwhelm into calm, focused movement.',
    firstStep: 'Clarify what is emotionally heavy and define one stabilizing action for today.',
    helpsWith: ['stress', 'overthinking', 'confidence', 'focus', 'motivation'],
  },
  {
    id: 'business',
    name: 'Business Coach',
    category: 'Business',
    tagline: 'Converts business complexity into clear decisions.',
    firstStep: 'Pick the single business result that matters most this week and remove noise around it.',
    helpsWith: ['growth', 'strategy', 'operations', 'clients', 'sales'],
  },
  {
    id: 'legal-structure',
    name: 'Legal & Structure Coach',
    category: 'Legal',
    tagline: 'Brings order to legal, compliance, and structural choices.',
    firstStep: 'Map the exact legal or structural unknown that could block progress next.',
    helpsWith: ['contracts', 'compliance', 'risk', 'policy', 'documentation'],
  },
  {
    id: 'finance',
    name: 'Finance Coach',
    category: 'Finance',
    tagline: 'Creates financial clarity and realistic next moves.',
    firstStep: 'Define the key money number you need to control first, then set one action around it.',
    helpsWith: ['cash flow', 'budget', 'debt', 'pricing', 'runway'],
  },
  {
    id: 'health-balance',
    name: 'Health & Balance Coach',
    category: 'Health',
    tagline: 'Protects your energy while moving life forward.',
    firstStep: 'Choose one routine that protects your energy so this plan stays sustainable.',
    helpsWith: ['burnout', 'sleep', 'stress load', 'energy', 'routine'],
  },
  {
    id: 'relationship-family',
    name: 'Relationship & Family Coach',
    category: 'Relationships',
    tagline: 'Helps you handle people dynamics with clarity and care.',
    firstStep: 'Name the conversation that matters most and prepare one clear, respectful opening.',
    helpsWith: ['communication', 'boundaries', 'family', 'partner', 'conflict'],
  },
  {
    id: 'career',
    name: 'Career Coach',
    category: 'Career',
    tagline: 'Turns career pressure into a practical direction.',
    firstStep: 'Pick the next career move you are testing and define what proof of progress looks like.',
    helpsWith: ['job search', 'promotion', 'role clarity', 'performance', 'transition'],
  },
  {
    id: 'practical-life',
    name: 'Practical Life Coach',
    category: 'Life',
    tagline: 'Creates traction on everyday life and admin pressure.',
    firstStep: 'Select one practical bottleneck to clear first so daily life gets lighter quickly.',
    helpsWith: ['housing', 'paperwork', 'planning', 'logistics', 'organization'],
  },
];

const CATEGORY_TO_COACH: Record<string, CoachId[]> = {
  Legal: ['legal-structure', 'practical-life', 'mindset'],
  Financial: ['finance', 'business', 'mindset'],
  Business: ['business', 'finance', 'mindset'],
  Personal: ['mindset', 'health-balance', 'practical-life'],
  Career: ['career', 'mindset', 'business'],
  Health: ['health-balance', 'mindset', 'practical-life'],
  Relationship: ['relationship-family', 'mindset', 'health-balance'],
  Project: ['business', 'practical-life', 'mindset'],
  Housing: ['practical-life', 'finance', 'legal-structure'],
  Other: ['mindset', 'practical-life', 'business'],
};

const KEYWORD_RULES: Array<{ coachId: CoachId; keywords: string[] }> = [
  { coachId: 'mindset', keywords: ['overwhelm', 'stuck', 'anxious', 'confidence', 'stress', 'motivation'] },
  { coachId: 'business', keywords: ['business', 'client', 'sales', 'offer', 'strategy', 'launch'] },
  { coachId: 'legal-structure', keywords: ['legal', 'contract', 'compliance', 'policy', 'risk', 'terms'] },
  { coachId: 'finance', keywords: ['money', 'budget', 'debt', 'cash', 'revenue', 'expenses'] },
  { coachId: 'health-balance', keywords: ['health', 'sleep', 'burnout', 'energy', 'wellbeing', 'balance'] },
  { coachId: 'relationship-family', keywords: ['relationship', 'family', 'partner', 'conflict', 'communication'] },
  { coachId: 'career', keywords: ['career', 'job', 'interview', 'promotion', 'manager', 'role'] },
  { coachId: 'practical-life', keywords: ['housing', 'rent', 'home', 'admin', 'paperwork', 'schedule'] },
];

const COACH_BY_ID = new Map<CoachId, CoachProfile>(COACH_CATALOG.map((coach) => [coach.id, coach]));

export function getCoachCatalog(): CoachProfile[] {
  return COACH_CATALOG;
}

export function getCoachById(id?: string | null): CoachProfile | null {
  if (!id) {
    return null;
  }
  return COACH_BY_ID.get(id as CoachId) ?? null;
}

export function getSuggestedCoaches(input: {
  category?: string;
  situation?: string;
  goal?: string;
  attentionNow?: string;
  painPoints?: string;
  biggestFriction?: string;
  costSignals?: string[];
  impactIfUnresolved?: string;
  blocking?: string;
  triedAlready?: string;
  supportAlreadyUsed?: string;
  firstPriority?: string;
  nonNegotiable?: string;
  urgency?: string;
  supportStyle?: string;
  coachStyle?: string;
  emotionalState?: string;
}): CoachProfile[] {
  const text = [
    input.situation,
    input.goal,
    input.attentionNow,
    input.painPoints,
    input.biggestFriction,
    input.impactIfUnresolved,
    input.blocking,
    input.triedAlready,
    input.supportAlreadyUsed,
    input.firstPriority,
    input.nonNegotiable,
    input.emotionalState,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
  const score = new Map<CoachId, number>();

  for (const coach of COACH_CATALOG) {
    score.set(coach.id, 0);
  }

  const categoryMatches = input.category ? CATEGORY_TO_COACH[input.category] ?? [] : [];
  categoryMatches.forEach((coachId, index) => {
    score.set(coachId, (score.get(coachId) ?? 0) + (30 - index * 5));
  });

  KEYWORD_RULES.forEach((rule) => {
    const matches = rule.keywords.filter((keyword) => text.includes(keyword)).length;
    if (matches > 0) {
      score.set(rule.coachId, (score.get(rule.coachId) ?? 0) + matches * 8);
    }
  });

  const supportHint = `${input.supportStyle ?? ''} ${input.coachStyle ?? ''}`.toLowerCase();
  applySupportStyleBoost(score, supportHint);
  applyUrgencyBoost(score, input.urgency, text);
  applyCostSignalBoost(score, input.costSignals);
  applyCriticalRiskBoost(score, text);

  return [...COACH_CATALOG].sort((a, b) => {
    const delta = (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0);
    if (delta !== 0) {
      return delta;
    }
    return a.name.localeCompare(b.name);
  });
}

function applySupportStyleBoost(score: Map<CoachId, number>, supportHint: string): void {
  if (!supportHint.trim()) {
    return;
  }

  if (hasAny(supportHint, ['calm', 'empath', 'gentle', 'reflective'])) {
    boost(score, 'mindset', 12);
    boost(score, 'health-balance', 8);
    boost(score, 'relationship-family', 8);
  }

  if (hasAny(supportHint, ['direct', 'decisive', 'accountable', 'firm'])) {
    boost(score, 'business', 12);
    boost(score, 'career', 8);
    boost(score, 'legal-structure', 6);
  }

  if (hasAny(supportHint, ['practical', 'step-by-step', 'concrete', 'hands-on'])) {
    boost(score, 'practical-life', 12);
    boost(score, 'finance', 8);
    boost(score, 'business', 6);
  }

  if (hasAny(supportHint, ['strategic', 'big-picture', 'strategy', 'direction'])) {
    boost(score, 'business', 12);
    boost(score, 'career', 8);
    boost(score, 'legal-structure', 6);
  }
}

function applyUrgencyBoost(score: Map<CoachId, number>, urgency: string | undefined, text: string): void {
  const normalizedUrgency = (urgency ?? '').toLowerCase();
  const highUrgency = normalizedUrgency === 'high' || normalizedUrgency === 'critical';

  if (!highUrgency) {
    return;
  }

  boost(score, 'practical-life', 8);
  boost(score, 'business', 6);

  if (hasAny(text, ['panic', 'overwhelm', 'anxious', 'burnout', 'stress'])) {
    boost(score, 'mindset', 10);
    boost(score, 'health-balance', 8);
  }

  if (hasAny(text, ['cash', 'debt', 'money', 'rent', 'invoice', 'budget'])) {
    boost(score, 'finance', 10);
  }

  if (hasAny(text, ['contract', 'legal', 'compliance', 'dispute', 'policy'])) {
    boost(score, 'legal-structure', 10);
  }
}

function applyCostSignalBoost(score: Map<CoachId, number>, costSignals: string[] | undefined): void {
  if (!Array.isArray(costSignals) || costSignals.length === 0) {
    return;
  }

  const normalized = costSignals.join(' ').toLowerCase();

  if (hasAny(normalized, ['money', 'income', 'cash'])) {
    boost(score, 'finance', 12);
  }
  if (hasAny(normalized, ['trust', 'relationship'])) {
    boost(score, 'relationship-family', 9);
  }
  if (hasAny(normalized, ['stability', 'safety'])) {
    boost(score, 'practical-life', 9);
    boost(score, 'legal-structure', 6);
  }
  if (hasAny(normalized, ['energy', 'health'])) {
    boost(score, 'health-balance', 9);
    boost(score, 'mindset', 6);
  }
  if (hasAny(normalized, ['time', 'focus'])) {
    boost(score, 'practical-life', 9);
    boost(score, 'business', 6);
  }
}

function applyCriticalRiskBoost(score: Map<CoachId, number>, text: string): void {
  if (!text.trim()) {
    return;
  }

  if (hasAny(text, ['lawsuit', 'legal notice', 'deadline', 'penalty', 'compliance risk'])) {
    boost(score, 'legal-structure', 14);
  }

  if (hasAny(text, ['missing payment', 'cash crisis', 'debt spiral', 'rent risk'])) {
    boost(score, 'finance', 14);
  }

  if (hasAny(text, ['burnout', 'panic', 'sleep loss', 'mental load'])) {
    boost(score, 'health-balance', 10);
    boost(score, 'mindset', 10);
  }
}

function boost(score: Map<CoachId, number>, coachId: CoachId, amount: number): void {
  score.set(coachId, (score.get(coachId) ?? 0) + amount);
}

function hasAny(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}
