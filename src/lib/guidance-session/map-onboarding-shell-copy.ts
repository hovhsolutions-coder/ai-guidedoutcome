import { type GuidanceSessionPhase } from '@/src/lib/guidance-session/types';

export interface OnboardingShellCopy {
  headerEyebrow: string;
  introFraming: string;
  introSectionLabel: string;
  nextSectionLabel: string;
  nextSectionDescription: string;
}

export function mapOnboardingShellCopy(input: {
  phase: GuidanceSessionPhase;
  hasFollowUpHistory: boolean;
  showsFollowUp: boolean;
}): OnboardingShellCopy {
  const nextSectionLabel = input.showsFollowUp
    ? 'Clarify next'
    : input.hasFollowUpHistory
      ? 'Refined next step'
      : 'Start with this move';

  if (input.hasFollowUpHistory) {
    switch (input.phase) {
      case 'clarifying':
        return {
          headerEyebrow: 'Refined onboarding read',
          introFraming: 'The direction is getting sharper. One more precise detail will help the system finish resolving the strongest path.',
          introSectionLabel: 'Character direction',
          nextSectionLabel,
          nextSectionDescription: 'The system already understands more than it did on the first pass. Tighten the last point that still matters.',
        };
      case 'refined_direction':
        return {
          headerEyebrow: 'Refined onboarding read',
          introFraming: 'Your answer tightened the direction. The system is now guiding you from a more grounded and personal starting point.',
          introSectionLabel: 'Character direction',
          nextSectionLabel,
          nextSectionDescription: 'Your answer gave the system a cleaner read. This next move reflects the refined direction.',
        };
      case 'execution_ready':
        return {
          headerEyebrow: 'Refined onboarding read',
          introFraming: 'The system has enough signal now to move with confidence. What follows should feel more precise and more earned.',
          introSectionLabel: 'Character direction',
          nextSectionLabel,
          nextSectionDescription: 'The direction is now clear enough to turn refined understanding into concrete motion.',
        };
    }
  }

  switch (input.phase) {
    case 'clarifying':
      return {
        headerEyebrow: 'First onboarding read',
        introFraming: 'The direction is promising, but one clarifying answer will make the next move feel more grounded and more useful.',
        introSectionLabel: 'Character introduction',
        nextSectionLabel,
        nextSectionDescription: 'Before pushing into a harder path, tighten the one missing point that matters most.',
      };
    case 'refined_direction':
      return {
        headerEyebrow: 'First onboarding read',
        introFraming: 'You already have enough shape to move with intent. This introduction keeps the path calm, coherent, and directional.',
        introSectionLabel: 'Character introduction',
        nextSectionLabel,
        nextSectionDescription: 'The first move is already clear enough to carry momentum without adding more noise.',
      };
    case 'execution_ready':
      return {
        headerEyebrow: 'First onboarding read',
        introFraming: 'The path is already clear enough to prioritize motion. The system is reducing friction so you can act cleanly.',
        introSectionLabel: 'Character introduction',
        nextSectionLabel,
        nextSectionDescription: 'The first move is already clear enough to carry momentum without adding more noise.',
      };
  }
}
