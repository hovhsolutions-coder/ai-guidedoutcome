import {
  resolveTrainerRecommendations,
  type TrainerRecommendation,
  type TrainerRecommendationInput,
} from '@/src/lib/trainers/resolve-trainer-recommendations';

export function getTrainerRecommendations(input: TrainerRecommendationInput): TrainerRecommendation {
  return resolveTrainerRecommendations(input);
}
