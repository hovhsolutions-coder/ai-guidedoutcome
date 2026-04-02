/**
 * Execution-Aware Prompt Builder
 * 
 * Builds prompts for the AI that incorporate execution intelligence
 * while maintaining the principle: AI interprets, does not override.
 */

import { type ExecutionContext, formatExecutionContextForAI } from './execution-context';

/**
 * Build a guidance prompt that includes execution context
 * This allows the AI to provide contextual recommendations based on
 * the current state of task execution.
 */
export function buildExecutionAwarePrompt(
  basePrompt: string,
  executionContext?: ExecutionContext
): string {
  if (!executionContext) {
    return basePrompt;
  }

  const executionSection = formatExecutionContextForAI(executionContext);

  return `${basePrompt}

---

${executionSection}

Based on this execution context, provide guidance that:
1. Acknowledges the current dossier health and momentum
2. Addresses the biggest risk or blocker if present
3. Suggests the most impactful next action
4. Considers the key unlocker task if available

Maintain a supportive but focused tone. Be specific about what to do now.`;
}

/**
 * Build a focused "next best action" prompt for execution-time guidance
 * This is used when the user needs immediate direction during task execution.
 */
export function buildNextActionPrompt(executionContext: ExecutionContext): string {
  const { health, priorityTask, keyUnlocker, stalledTasks, blockedTasks, insights } = executionContext;

  let urgencyLabel = '';
  if (health.status === 'blocked' || health.status === 'stalled') {
    urgencyLabel = 'URGENT: ';
  }

  const parts: string[] = [
    `${urgencyLabel}Execution Guidance Request`,
    '',
    `Current Status: ${health.status} (${health.score}/100 health score)`,
    `Active Tasks: ${executionContext.stats.active} (${executionContext.stats.blocked} blocked, ${executionContext.stats.stalled} stalled)`,
  ];

  if (priorityTask) {
    parts.push(`\nPriority Task: ${priorityTask.name}`);
    if (priorityTask.isBlocked && priorityTask.blockingDeps.length > 0) {
      parts.push(`BLOCKED BY: ${priorityTask.blockingDeps.join(', ')}`);
    }
    if (priorityTask.subtaskProgress && priorityTask.subtaskProgress.total > 0) {
      parts.push(`Subtasks: ${priorityTask.subtaskProgress.completed}/${priorityTask.subtaskProgress.total} done`);
    }
  }

  if (keyUnlocker) {
    parts.push(`\nKEY UNLOCKER: Complete "${keyUnlocker.taskName}" to unblock ${keyUnlocker.unlocksCount} other tasks`);
  }

  if (stalledTasks.length > 0) {
    parts.push(`\nStalled Tasks: ${stalledTasks.map((t) => `${t.name} (${t.daysIdle}d idle)`).join(', ')}`);
  }

  if (insights.biggestRisk) {
    parts.push(`\nBiggest Risk: ${insights.biggestRisk}`);
  }

  if (insights.easiestWin) {
    parts.push(`Easiest Win: ${insights.easiestWin}`);
  }

  parts.push('', 'Provide a single, specific next action that will have the most impact right now.');
  parts.push('Be decisive - tell them exactly what to do next and why.');

  return parts.join('\n');
}

/**
 * Build a health check prompt for periodic execution assessment
 * Used for generating executive summaries and progress reports.
 */
export function buildHealthCheckPrompt(executionContext: ExecutionContext): string {
  const { health, stats, insights, activityPattern } = executionContext;

  const parts: string[] = [
    'Dossier Health Assessment',
    '',
    `Health Score: ${health.score}/100 (${health.status})`,
    `Tasks: ${stats.completed}/${stats.total} completed, ${stats.active} active`,
    `Momentum: ${insights.momentumDirection}`,
  ];

  if (activityPattern.lastActivity) {
    const lastActivity = new Date(activityPattern.lastActivity);
    const daysAgo = Math.round((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`Last Activity: ${daysAgo} days ago`);
  }

  if (executionContext.stalledTasks.length > 0) {
    parts.push(`\nStalled (${executionContext.stalledTasks.length}):`);
    executionContext.stalledTasks.forEach((t) => {
      parts.push(`  - ${t.name} (${t.daysIdle} days idle)`);
    });
  }

  if (executionContext.blockedTasks.length > 0) {
    parts.push(`\nBlocked (${executionContext.blockedTasks.length}):`);
    executionContext.blockedTasks.forEach((t) => {
      parts.push(`  - ${t.name} (waiting on: ${t.blockedBy.join(', ')})`);
    });
  }

  parts.push('', 'Provide a brief executive summary:');
  parts.push('1. What is going well');
  parts.push('2. What needs attention');
  parts.push('3. The single most important action to take now');

  return parts.join('\n');
}

/**
 * Build a prompt for dependency resolution guidance
 * Helps users understand and resolve task dependencies.
 */
export function buildDependencyResolutionPrompt(executionContext: ExecutionContext): string {
  const { blockedTasks, keyUnlocker } = executionContext;

  if (blockedTasks.length === 0) {
    return 'All tasks are unblocked. Focus on completing active tasks in priority order.';
  }

  const parts: string[] = [
    'Dependency Resolution Guidance',
    '',
    `You have ${blockedTasks.length} blocked task${blockedTasks.length > 1 ? 's' : ''}:`,
  ];

  blockedTasks.forEach((task, i) => {
    parts.push(`\n${i + 1}. "${task.name}"`);
    parts.push(`   Blocked by: ${task.blockedBy.join(', ')}`);
  });

  if (keyUnlocker) {
    parts.push(`\n🎯 KEY UNLOCKER: "${keyUnlocker.taskName}"`);
    parts.push(`   Completing this will unblock ${keyUnlocker.unlocksCount} task${keyUnlocker.unlocksCount > 1 ? 's' : ''}:`);
    keyUnlocker.unlocks.forEach((taskName) => {
      parts.push(`     - ${taskName}`);
    });
    parts.push(`\nRecommendation: Prioritize "${keyUnlocker.taskName}" to maximize progress.`);
  }

  parts.push('', 'Provide guidance on the best order to resolve these dependencies.');

  return parts.join('\n');
}
