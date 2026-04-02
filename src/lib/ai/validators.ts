import { AIResponseOutput } from './types';

export function validateAIResponse(raw: any): AIResponseOutput {
  if (!raw || typeof raw !== 'object') {
    return getSafeFallback();
  }

  const summary = typeof raw.summary === 'string' && raw.summary.trim().length > 0
    ? raw.summary.trim()
    : getSafeFallback().summary;
  const nextStep = typeof raw.next_step === 'string' && raw.next_step.trim().length > 0
    ? raw.next_step.trim()
    : getSafeFallback().next_step;
  const suggestedTasks = Array.isArray(raw.suggested_tasks)
    ? raw.suggested_tasks
      .filter((task: unknown): task is string => typeof task === 'string' && task.trim().length > 0)
      .map((task: string) => task.trim())
    : [];

  if (suggestedTasks.length === 0) {
    return {
      summary,
      next_step: nextStep,
      suggested_tasks: getSafeFallback().suggested_tasks,
    };
  }

  return {
    summary,
    next_step: nextStep,
    suggested_tasks: suggestedTasks,
  };
}

function getSafeFallback(): AIResponseOutput {
  return {
    summary: 'The guidance response was incomplete, so a conservative fallback was used to keep momentum intact.',
    next_step: 'Choose the single clearest move that will create visible progress next.',
    suggested_tasks: [
      'Name the one action that would move the dossier forward today',
      'Remove the biggest open question slowing that action down',
      'Capture the result so the following step is easier to choose',
    ],
  };
}
