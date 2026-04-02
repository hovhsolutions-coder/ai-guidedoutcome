import { adaptTrainerRecommendationInput } from '@/src/lib/recommendations/adapters/from-trainer-input';
import { resolveTrainerRecommendationFromDecisionInput } from '@/src/lib/recommendations/core';
import {
  type TrainerRecommendation,
  type TrainerRecommendationInput,
} from '@/src/lib/recommendations/types';

export type {
  TrainerRecommendation,
  TrainerRecommendationInput,
} from '@/src/lib/recommendations/types';

export function resolveTrainerRecommendations(input: TrainerRecommendationInput): TrainerRecommendation {
  return resolveTrainerRecommendationFromDecisionInput(adaptTrainerRecommendationInput(input));
}
