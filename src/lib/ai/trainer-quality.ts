import fixtures from './trainer-quality-fixtures.json';
import { AITrainerRequestInput, AITrainerId } from './types';

export type TrainerQualityScenario = {
  id: string;
  group_id: string;
  trainer: AITrainerId;
  title: string;
  input: AITrainerRequestInput;
  expected: {
    angle: string[];
    next_move: string[];
  };
  rejectIf: string[];
};

export const trainerQualityScenarios = fixtures.trainerQualityScenarios as TrainerQualityScenario[];
export const trainerStrongOutputPatterns = fixtures.strongOutputPatterns as string[];
export const trainerCommonFailurePatterns = fixtures.commonFailurePatterns as string[];

export function getTrainerScenarioPayloads(): AITrainerRequestInput[] {
  return trainerQualityScenarios.map((scenario) => scenario.input);
}
