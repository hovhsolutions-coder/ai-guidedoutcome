import { type CharacterArchetypeDefinition } from '@/src/lib/progression/types';

export const characterArchetypeCatalog: Record<CharacterArchetypeDefinition['id'], CharacterArchetypeDefinition> = {
  strategist: {
    id: 'strategist',
    guidanceStyle: 'strategic, composed, and pattern-aware',
    progressionPath: 'Sharper decisions, stronger prioritization, and broader strategic range.',
    recommendedSkills: ['decision_making', 'communication_meta', 'execution_discipline'],
    intro: {
      title: 'The Strategist',
      introText: 'You grow by seeing the right path early, naming what matters, and moving with disciplined intent.',
      guidanceStyle: 'strategic, composed, and pattern-aware',
      firstFocus: 'Clarify the decision frame before you commit energy in the wrong direction.',
      recommendedStartingSkills: ['decision_making', 'communication_meta'],
    },
  },
  builder: {
    id: 'builder',
    guidanceStyle: 'structured, practical, and systems-oriented',
    progressionPath: 'Clear plans, durable structures, and reliable progress through complexity.',
    recommendedSkills: ['execution_discipline', 'decision_making', 'communication_meta'],
    intro: {
      title: 'The Builder',
      introText: 'You grow by turning vague ambition into working structure that can carry real execution.',
      guidanceStyle: 'structured, practical, and systems-oriented',
      firstFocus: 'Turn loose intent into a plan that can survive real-world execution.',
      recommendedStartingSkills: ['execution_discipline', 'decision_making'],
    },
  },
  negotiator: {
    id: 'negotiator',
    guidanceStyle: 'calm, precise, and relationship-aware',
    progressionPath: 'Stronger boundaries, cleaner positioning, and better outcomes across tension.',
    recommendedSkills: ['conflict_handling', 'communication_meta', 'body_language'],
    intro: {
      title: 'The Negotiator',
      introText: 'You grow by holding clarity under pressure and shaping better outcomes without losing position.',
      guidanceStyle: 'calm, precise, and relationship-aware',
      firstFocus: 'Stabilize tension without losing your boundary, leverage, or clarity.',
      recommendedStartingSkills: ['conflict_handling', 'communication_meta'],
    },
  },
  communicator: {
    id: 'communicator',
    guidanceStyle: 'clear, human, and high-context',
    progressionPath: 'Better alignment, stronger influence, and cleaner delivery across people and stakes.',
    recommendedSkills: ['communication_meta', 'body_language', 'conflict_handling'],
    intro: {
      title: 'The Communicator',
      introText: 'You grow by making meaning land cleanly, especially when timing, trust, or nuance matter.',
      guidanceStyle: 'clear, human, and high-context',
      firstFocus: 'Make the message land with clarity, trust, and the right emotional tone.',
      recommendedStartingSkills: ['communication_meta', 'body_language'],
    },
  },
  executor: {
    id: 'executor',
    guidanceStyle: 'focused, action-oriented, and resilient',
    progressionPath: 'More traction, stronger follow-through, and higher trust through real-world completion.',
    recommendedSkills: ['execution_discipline', 'decision_making', 'communication_meta'],
    intro: {
      title: 'The Executor',
      introText: 'You grow by converting clarity into motion and proving capability through repeated execution.',
      guidanceStyle: 'focused, action-oriented, and resilient',
      firstFocus: 'Remove friction between knowing the move and actually making it happen.',
      recommendedStartingSkills: ['execution_discipline', 'decision_making'],
    },
  },
};
