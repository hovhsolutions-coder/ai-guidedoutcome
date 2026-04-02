import fixtures from './guidance-quality-fixtures.json';
import { AIRequestInput } from './types';

export type GuidanceQualityScoreKey =
  | 'decisiveness'
  | 'actionability'
  | 'taskAlignment'
  | 'momentumPreservation'
  | 'specificity';

export type GuidanceQualityScenario = {
  id: string;
  title: string;
  phase: 'Understanding' | 'Structuring' | 'Action';
  userState:
    | 'starting_from_zero'
    | 'stuck_mid_process'
    | 'continuing_momentum'
    | 'too_many_tasks';
  dossierState: {
    situation: string;
    main_goal: string;
    phase: AIRequestInput['phase'];
    tasks: string[];
    completedTaskCount: number;
    progressSignal: 'none' | 'planning_only' | 'momentum_visible';
    hesitationMoment: string;
  };
  input: AIRequestInput;
  expected: {
    situationRead: string[];
    nextStep: string[];
    suggestedTasks: string[];
    decisionPrompt: string[];
  };
  rejectIf: string[];
};

export type GuidanceQualityRubric = {
  key: GuidanceQualityScoreKey;
  question: string;
  strong: string;
  weak: string;
};

export const guidanceQualityRubric: GuidanceQualityRubric[] = [
  {
    key: 'decisiveness',
    question: 'Does the output choose one best move instead of several possible directions?',
    strong: 'One clear directive with no hedging or branching.',
    weak: 'Multiple options, soft recommendations, or open-ended framing.',
  },
  {
    key: 'actionability',
    question: 'Can the user execute the next step immediately without extra interpretation?',
    strong: 'Immediate action with a concrete verb and visible outcome.',
    weak: 'Needs translation before acting or depends on undefined setup.',
  },
  {
    key: 'taskAlignment',
    question: 'Does the guidance align to the current task stack when tasks already exist?',
    strong: 'References the best matching open task explicitly or supports it directly.',
    weak: 'Invents unrelated work or ignores the active queue.',
  },
  {
    key: 'momentumPreservation',
    question: 'Does the guidance preserve motion when progress already exists?',
    strong: 'Pushes completion, unblock, or continuation instead of more planning.',
    weak: 'Pulls the user back into analysis after traction already exists.',
  },
  {
    key: 'specificity',
    question: 'Is the language precise enough to be hard to misinterpret?',
    strong: 'Specific object, action, and outcome are all visible.',
    weak: 'Generic verbs, abstract nouns, or placeholder strategy language.',
  },
];

export const guidanceQualityScenarios = fixtures.guidanceQualityScenarios as GuidanceQualityScenario[];

export const strongOutputPatterns = fixtures.strongOutputPatterns as string[];

export const commonFailurePatterns = fixtures.commonFailurePatterns as string[];

export function getGuidanceScenarioPayloads(): AIRequestInput[] {
  return guidanceQualityScenarios.map((scenario) => scenario.input);
}
