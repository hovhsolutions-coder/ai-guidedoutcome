export type GuidancePrimaryDomain =
  | 'conflict'
  | 'decision'
  | 'planning'
  | 'emotional'
  | 'business_financial'
  | 'problem_solving'
  | 'quick_question';

export type GuidanceSignalLevel = 'low' | 'medium' | 'high';

export type GuidanceSuggestedMode =
  | 'decision'
  | 'problem_solver'
  | 'conflict'
  | 'planning'
  | 'quick_assist';

export interface DomainSecondarySignals {
  urgency: GuidanceSignalLevel;
  stakeLevel: GuidanceSignalLevel;
  multiParty: boolean;
  ongoing: boolean;
  practicalExecutionNeeded: boolean;
  emotionalIntensity: GuidanceSignalLevel;
  documentationNeeded: boolean;
}

export interface DetectedDomain {
  primaryDomain: GuidancePrimaryDomain;
  confidence: number;
  secondarySignals: DomainSecondarySignals;
  suggestedMode: GuidanceSuggestedMode;
  shouldOfferDossier: boolean;
}

export interface DomainDetectionInput {
  text: string;
  hints?: Partial<DomainSecondarySignals>;
}
