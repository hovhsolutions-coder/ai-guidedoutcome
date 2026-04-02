import { AIExecutionMode, AIRequestInput } from './types';

export function createAIHash(input: AIRequestInput, mode: AIExecutionMode = 'live'): string {
  const normalized = {
    mode,
    action: input.action,
    situation: input.situation?.trim() ?? '',
    main_goal: input.main_goal?.trim() ?? '',
    phase: input.phase?.trim() ?? '',
    tasks: [...(input.tasks ?? [])].map((task: string) => task.trim()),
    user_input: input.user_input?.trim() ?? '',
  };

  const serialized = JSON.stringify(normalized);
  let hash = 0;

  for (let index = 0; index < serialized.length; index += 1) {
    hash = (hash * 31 + serialized.charCodeAt(index)) >>> 0;
  }

  return `ai:${mode}:${normalized.action}:${hash.toString(16)}`;
}
