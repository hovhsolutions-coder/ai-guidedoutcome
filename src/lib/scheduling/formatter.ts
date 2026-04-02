/**
 * Human-Readable Schedule Formatter
 * 
 * Converts scheduling recommendations into natural language guidance.
 * "Not just order in data, but language like:"
 * - 'Rond eerst X af; dit maakt 3 taken vrij.'
 * - 'Y is belangrijk, maar blijft geblokkeerd tot Z klaar is.'
 * - 'Deze week is taak A realistischer dan taak B.'
 */

import { type ScheduledTask, type ScheduleRecommendation, type ScheduleRiskType } from './types';

/**
 * Format the complete schedule recommendation as readable guidance
 */
export function formatScheduleRecommendation(recommendation: ScheduleRecommendation): string {
  const parts: string[] = [];

  // Header with health summary
  parts.push(buildHeader(recommendation));

  // Today's focus
  parts.push(buildTodaySection(recommendation));

  // Next 3 tasks with reasoning
  if (recommendation.nextTasks.length > 0) {
    parts.push(buildNextTasksSection(recommendation));
  }

  // Global risks if any
  if (recommendation.globalRisks.length > 0) {
    parts.push(buildRisksSection(recommendation));
  }

  // This week's outlook
  parts.push(buildWeekSection(recommendation));

  return parts.join('\n\n');
}

/**
 * Build header section
 */
function buildHeader(recommendation: ScheduleRecommendation): string {
  const totalTasks = recommendation.nextTasks.length + recommendation.queuedTasks.length + recommendation.blockedTasks.length;
  const unblockedCount = recommendation.nextTasks.length + recommendation.queuedTasks.length;

  if (totalTasks === 0) {
    return '🎉 Alle taken voltooid! Het dossier kan worden afgesloten.';
  }

  let header = `📋 **Planningadvies** — ${unblockedCount} van ${totalTasks} taken kunnen nu worden uitgevoerd`;

  if (recommendation.blockedTasks.length > 0) {
    header += ` (${recommendation.blockedTasks.length} geblokkeerd)`;
  }

  return header;
}

/**
 * Build today's focus section
 */
function buildTodaySection(recommendation: ScheduleRecommendation): string {
  const { todayFocus } = recommendation;

  if (!todayFocus.primaryTask) {
    return `⏳ **Vandaag:** Alle taken zijn momenteel geblokkeerd. Focus op het voltooien van afhankelijkheden om verder te kunnen.`;
  }

  const lines: string[] = [];
  lines.push(`🎯 **Vandaag:** ${todayFocus.primaryTask}`);
  lines.push(`   ${todayFocus.approach}`);
  lines.push(`   _${todayFocus.reasoning}_`);

  if (todayFocus.fallbackTasks.length > 0) {
    lines.push(`   `);
    lines.push(`   Als dat af is: ${todayFocus.fallbackTasks.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Build next tasks section with detailed reasoning
 */
function buildNextTasksSection(recommendation: ScheduleRecommendation): string {
  const lines: string[] = [];
  lines.push('📌 **Aanbevolen volgorde:**');

  recommendation.nextTasks.forEach((scheduledTask, index) => {
    const task = scheduledTask.task;
    const reasoning = scheduledTask.reasoning;
    const risk = scheduledTask.risk;

    const orderEmoji = index === 0 ? '1️⃣' : index === 1 ? '2️⃣' : '3️⃣';

    let taskLine = `${orderEmoji} **${task.name}**`;

    // Add priority badge if high
    if (task.priority === 'high') {
      taskLine += ' [hoog]';
    }

    // Add due date if near
    if (task.dueDate) {
      const daysUntil = getDaysUntil(task.dueDate);
      if (daysUntil < 0) {
        taskLine += ' ⚠️ OVERDUE';
      } else if (daysUntil <= 2) {
        taskLine += ` ⏰ ${daysUntil === 0 ? 'vandaag' : daysUntil === 1 ? 'morgen' : 'overmorgen'}`;
      }
    }

    lines.push(taskLine);
    lines.push(`   ${reasoning.explanation}`);

    // Add unlocker detail
    if (reasoning.unlocks && reasoning.unlocks.length > 0) {
      const unlockCount = reasoning.unlocks.length;
      lines.push(`   🔓 Dit maakt ${unlockCount} taak${unlockCount > 1 ? 'en' : ''} vrij`);
    }

    // Add risk note if present
    if (risk.level !== 'none' && risk.level !== 'low') {
      lines.push(`   ⚠️ ${risk.explanation}`);
    }

    // Add estimate guidance
    if (task.estimate) {
      const estimate = parseEstimate(task.estimate);
      if (estimate <= 15) {
        lines.push(`   💨 Snelle klus (${task.estimate})`);
      } else if (estimate >= 120) {
        lines.push(`   🧠 Focus blok nodig (${task.estimate})`);
      }
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Build risks section
 */
function buildRisksSection(recommendation: ScheduleRecommendation): string {
  const lines: string[] = [];
  lines.push('⚠️ **Aandachtspunten:**');

  recommendation.globalRisks.forEach((risk) => {
    const emoji = risk.severity === 'critical' ? '🚨' : '⚡';
    lines.push(`${emoji} ${risk.message}`);
    lines.push(`   ${risk.suggestion}`);

    if (risk.affectedTasks.length > 0) {
      const taskList = risk.affectedTasks.slice(0, 3).join(', ');
      const more = risk.affectedTasks.length > 3 ? ` (+${risk.affectedTasks.length - 3} meer)` : '';
      lines.push(`   Betreft: ${taskList}${more}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Build this week's outlook
 */
function buildWeekSection(recommendation: ScheduleRecommendation): string {
  const { weekFocus } = recommendation;

  const lines: string[] = [];
  lines.push(`📅 **Deze week** ${getConfidenceEmoji(weekFocus.confidence)}`);

  // Objectives
  if (weekFocus.objectives.length > 0) {
    weekFocus.objectives.forEach((objective) => {
      lines.push(`   🎯 ${objective}`);
    });
  }

  // Target tasks
  if (weekFocus.targetTasks.length > 0) {
    lines.push('');
    lines.push(`   Doel: ${weekFocus.targetTasks.slice(0, 3).join(', ')}${weekFocus.targetTasks.length > 3 ? '...' : ''}`);
  }

  // Watch for
  if (weekFocus.watchFor.length > 0) {
    lines.push('');
    lines.push('   👀 Let op:');
    weekFocus.watchFor.forEach((watch) => {
      lines.push(`      • ${watch}`);
    });
  }

  return lines.join('\n');
}

/**
 * Format a single scheduled task as a concise recommendation line
 */
export function formatTaskRecommendation(scheduledTask: ScheduledTask): string {
  const { task, reasoning, risk } = scheduledTask;

  let line = task.name;

  if (reasoning.primaryFactor === 'key-unlocker' && reasoning.unlocks) {
    line += ` → maakt ${reasoning.unlocks.length} taken vrij`;
  } else if (reasoning.primaryFactor === 'blocked' && reasoning.blockedBy) {
    line += ` (wacht op ${reasoning.blockedBy[0]})`;
  } else if (reasoning.primaryFactor === 'overdue') {
    line += ' [OVERDUE]';
  } else if (reasoning.primaryFactor === 'near-due') {
    line += ' [bijna deadline]';
  }

  if (risk.level === 'high') {
    line += ' ⚠️';
  }

  return line;
}

/**
 * Format schedule for AI prompt inclusion
 * Compact version for passing to AI guidance system
 */
export function formatScheduleForAI(recommendation: ScheduleRecommendation): string {
  const lines: string[] = [
    'SCHEDULE CONTEXT:',
  ];

  // Top 3
  if (recommendation.nextTasks.length > 0) {
    lines.push('Next:');
    recommendation.nextTasks.forEach((t, i) => {
      const riskFlag = t.risk.level === 'high' ? ' [RISK]' : '';
      const unlockFlag = t.reasoning.unlocks ? ` [unlocks ${t.reasoning.unlocks.length}]` : '';
      lines.push(`  ${i + 1}. ${t.task.name}${unlockFlag}${riskFlag}`);
    });
  }

  // Risks
  if (recommendation.globalRisks.length > 0) {
    lines.push('Risks:');
    recommendation.globalRisks.slice(0, 2).forEach((r) => {
      lines.push(`  • ${r.message}`);
    });
  }

  // Focus
  if (recommendation.todayFocus.primaryTask) {
    lines.push(`Focus: ${recommendation.todayFocus.primaryTask}`);
  }

  return lines.join('\n');
}

/**
 * Get emoji for confidence level
 */
function getConfidenceEmoji(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return '✓';
    case 'medium':
      return '~';
    case 'low':
      return '?';
  }
}

/**
 * Calculate days until due date
 */
function getDaysUntil(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Parse time estimate string to minutes
 */
function parseEstimate(estimate: string): number {
  let minutes = 0;

  const hourMatch = estimate.match(/(\d+\.?\d*)\s*h/i);
  if (hourMatch) {
    minutes += parseFloat(hourMatch[1]) * 60;
  }

  const minMatch = estimate.match(/(\d+)\s*m/i);
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10);
  }

  if (!hourMatch && !minMatch) {
    const numMatch = estimate.match(/(\d+)/);
    if (numMatch) {
      minutes += parseInt(numMatch[1], 10);
    }
  }

  return minutes;
}
