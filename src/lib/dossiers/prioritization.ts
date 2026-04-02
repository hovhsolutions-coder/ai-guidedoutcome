import { type MockDossier } from '@/lib/mockData';

export type DossierFocusBadgeTone = 'focus' | 'active' | 'watch';
export type DossierSignalTone = 'blocker' | 'momentum' | 'steady';

export interface DossierPriorityModel {
  id: string;
  title: string;
  phase: string;
  createdAt: string;
  lastActivity: string;
  focusBadge: {
    label: string;
    tone: DossierFocusBadgeTone;
  };
  currentObjective: string;
  statusLine: string;
  recommendedNextAction: string;
  progress: number;
  progressLine: string;
  blocker: {
    label: string;
    tone: DossierSignalTone;
  };
  priorityScore: number;
  mainGoal?: string;
}

export function getDossierPriorityModel(dossier: MockDossier): DossierPriorityModel {
  const firstTask = dossier.tasks[0];
  const firstTaskName = typeof firstTask === 'string' ? firstTask : firstTask?.name;
  const currentObjective = firstTaskName ?? getFallbackObjective(dossier.phase, dossier.main_goal);
  
  // For Completed phase, show outcome not next action
  const recommendedNextAction = dossier.phase === 'Completed'
    ? `Review what was achieved: ${dossier.main_goal}`
    : firstTaskName
      ? `Move "${firstTaskName}" forward to keep this dossier in motion.`
      : `Create the first concrete action for ${dossier.main_goal.toLowerCase()}.`;

  return {
    id: dossier.id,
    title: dossier.title,
    phase: dossier.phase,
    createdAt: dossier.createdAt,
    lastActivity: dossier.lastActivity,
    focusBadge: getFocusBadge(dossier.phase, dossier.progress),
    currentObjective,
    statusLine: getStatusLine(dossier.phase, dossier.progress, dossier.tasks.length),
    recommendedNextAction,
    progress: dossier.progress,
    progressLine: getProgressBand(dossier.progress),
    blocker: getBlockerIndicator(dossier.progress, dossier.tasks.length),
    priorityScore: getPriorityScore(dossier.phase, dossier.progress, dossier.tasks.length),
    mainGoal: dossier.main_goal,
  };
}

export function prioritizeDossiers(dossiers: MockDossier[]): DossierPriorityModel[] {
  return dossiers
    .map((dossier) => getDossierPriorityModel(dossier))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function getFallbackObjective(phase: string, mainGoal: string): string {
  if (phase === 'Understanding') {
    return `Clarify the path toward ${mainGoal.toLowerCase()}`;
  }

  if (phase === 'Structuring') {
    return `Turn the plan for ${mainGoal.toLowerCase()} into a usable execution path`;
  }

  return `Keep ${mainGoal.toLowerCase()} moving toward a visible result`;
}

function getStatusLine(phase: string, progress: number, taskCount: number): string {
  if (taskCount === 0) {
    return 'This dossier still needs a concrete starting point before momentum can build.';
  }

  if (progress < 30) {
    return `This ${phase.toLowerCase()} dossier is still vulnerable to drift unless one clear action gets prioritized now.`;
  }

  if (progress < 70) {
    return 'This dossier is active and directional. The next move should reinforce focus rather than expand scope.';
  }

  return 'This dossier already has momentum. The priority now is to carry the current thread cleanly toward completion.';
}

function getProgressBand(progress: number): string {
  if (progress < 30) {
    return 'Foundation stage: this dossier needs a firm next move to become real progress.';
  }

  if (progress < 70) {
    return 'Active stage: the system should keep pressure on the current objective, not scatter attention.';
  }

  return 'Momentum stage: this dossier is moving well and should stay focused until the current thread is closed.';
}

function getFocusBadge(
  phase: string,
  progress: number
): { label: string; tone: DossierFocusBadgeTone } {
  if (phase === 'Completed') {
    return { label: 'Completed record', tone: 'active' };
  }

  if ((phase === 'Executing' || phase === 'Action') && progress < 95) {
    return { label: 'Focus now', tone: 'focus' };
  }

  if (progress < 30) {
    return { label: 'Needs direction', tone: 'watch' };
  }

  return { label: 'Active focus', tone: 'active' };
}

function getBlockerIndicator(
  progress: number,
  taskCount: number
): { label: string; tone: DossierSignalTone } {
  if (taskCount === 0) {
    return {
      label: 'No execution layer yet. This dossier needs its first concrete action.',
      tone: 'blocker',
    };
  }

  if (progress >= 70) {
    return {
      label: 'Momentum is visible here. Keep the objective tight and avoid introducing noise.',
      tone: 'momentum',
    };
  }

  return {
    label: 'Progress is present, but this dossier still benefits from a sharper next move.',
    tone: 'steady',
  };
}

function getPriorityScore(phase: string, progress: number, taskCount: number): number {
  const phaseScore = phase === 'Action' ? 40 : phase === 'Structuring' ? 28 : 20;
  const progressScore = progress < 30 ? 28 : progress < 70 ? 34 : progress < 95 ? 24 : 8;
  const taskScore = taskCount === 0 ? 10 : 0;
  return phaseScore + progressScore + taskScore;
}
